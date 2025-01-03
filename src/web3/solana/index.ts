import { 
  Connection, 
  PublicKey, 
  VersionedTransaction, 
  TransactionMessage,
  Keypair,
  TransactionInstruction
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import BigNumber from "bignumber.js";
import { PumpFunProvider } from './pumpfun';
import { 
  TokenPrice,
  TransferParams,
  SwapParams,
  CreateTokenParams,
  SolanaSDK as ISolanaSDK,
  PriceBuilder as IPriceBuilder
} from './types';
import { TransactionResult, WalletInfo } from '../types';

const VERIFIED_ADDRESSES = {
  WSOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
} as const;

class PriceBuilder implements IPriceBuilder {
  private address: string;
  private sdk: SolanaSDK;

  constructor(address: string, sdk: SolanaSDK) {
    this.address = address;
    this.sdk = sdk;
  }

  async then(resolve: (prices: TokenPrice[]) => void) {
    const [jupPrice, rayPrice, pumpPrice] = await Promise.all([
      this.jupiter,
      this.raydium,
      this.pumpfun
    ]);

    resolve([
      { exchange: 'jupiter', price: jupPrice },
      { exchange: 'raydium', price: rayPrice },
      { exchange: 'pumpfun', price: pumpPrice }
    ]);
  }

  get jupiter(): Promise<number> {
    return this.getJupiterPrice();
  }

  get raydium(): Promise<number> {
    return this.getRaydiumPrice();
  }

  get pumpfun(): Promise<number> {
    return this.getPumpFunPrice();
  }

  private async getJupiterPrice(): Promise<number> {
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${this.address}`);
      const data = await response.json();
      return data.data[this.address]?.price || 0;
    } catch (e) {
      console.error('Jupiter price fetch failed:', e);
      return 0;
    }
  }

  private async getRaydiumPrice(): Promise<number> {
    try {
      const response = await fetch(`${this.sdk.RAYDIUM_API_BASE}${this.sdk.RAYDIUM_PRICE_ENDPOINT}`);
      const data = await response.json();
      return data.data?.[this.address] || 0;
    } catch (e) {
      console.error('Raydium price fetch failed:', e);
      return 0;
    }
  }

  private async getPumpFunPrice(): Promise<number> {
    try {
      const pumpFun = new PumpFunProvider(this.sdk.connection, this.sdk.keypair as any);
      const info = await pumpFun.getTokenInfo(this.address, 20);
      return info.price.usd;
    } catch (e) {
      console.error('PumpFun price fetch failed:', e);
      return 0;
    }
  }
}

export class SolanaSDK implements ISolanaSDK {
  private _connection: Connection;
  private readonly apiKey: string;
  private _keypair?: Keypair;
  private pumpFunProvider?: PumpFunProvider;
  
  readonly RAYDIUM_API_BASE = 'https://api-v3.raydium.io';
  readonly RAYDIUM_PRICE_ENDPOINT = '/mint/price';
  readonly JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';

  constructor(apiKey: string, rpc: string = 'https://api.mainnet-beta.solana.com') {
    this._connection = new Connection(rpc, {
      commitment: 'confirmed',
      httpHeaders: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    this.apiKey = apiKey;
  }

  get connection() {
    return this._connection;
  }

  get keypair() {
    return this._keypair;
  }

  price(address: string): PriceBuilder {
    return new PriceBuilder(address, this);
  }

  async connect(wallet: Keypair): Promise<WalletInfo> {
    this._keypair = wallet;
    this.pumpFunProvider = new PumpFunProvider(this._connection, wallet as any);
    return {
      address: wallet.publicKey.toString(),
      publicKey: wallet.publicKey.toString()
    };
  }

  async transfer(params: TransferParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    
    try {
      const from = params.from || this._keypair;
      const toPublicKey = new PublicKey(params.to);
      const amount = typeof params.amount === 'string' ? 
        new BigNumber(params.amount).times(1e9).toNumber() : 
        params.amount * 1e9;

      if (params.token === 'SOL') {
        // Transfer native SOL
        const amountBuffer = Buffer.alloc(8);
        amountBuffer.writeBigUInt64LE(BigInt(amount));

        const transaction = new VersionedTransaction(
          new TransactionMessage({
            payerKey: from.publicKey,
            recentBlockhash: (await this._connection.getLatestBlockhash()).blockhash,
            instructions: [{
              programId: new PublicKey('11111111111111111111111111111111'),
              keys: [
                { pubkey: from.publicKey, isSigner: true, isWritable: true },
                { pubkey: toPublicKey, isSigner: false, isWritable: true }
              ],
              data: Buffer.concat([Buffer.from([2]), amountBuffer])
            }]
          }).compileToV0Message()
        );

        transaction.sign([from]);
        const signature = await this._connection.sendTransaction(transaction);
        
        return {
          success: true,
          signature
        };
      } else {
        // Transfer SPL token
        const mint = new PublicKey(params.token);
        const fromATA = getAssociatedTokenAddressSync(mint, from.publicKey);
        const toATA = getAssociatedTokenAddressSync(mint, toPublicKey);

        const instructions: TransactionInstruction[] = [];

        // Create destination ATA if it doesn't exist
        try {
          await this._connection.getAccountInfo(toATA);
        } catch {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              from.publicKey,
              toATA,
              toPublicKey,
              mint
            )
          );
        }

        // Add transfer instruction
        instructions.push(
          createTransferInstruction(
            fromATA,
            toATA,
            from.publicKey,
            BigInt(amount)
          )
        );

        const transaction = new VersionedTransaction(
          new TransactionMessage({
            payerKey: from.publicKey,
            recentBlockhash: (await this._connection.getLatestBlockhash()).blockhash,
            instructions
          }).compileToV0Message()
        );

        transaction.sign([from]);
        const signature = await this._connection.sendTransaction(transaction);
        
        return {
          success: true,
          signature
        };
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      return {
        success: false,
        signature: ''
      };
    }
  }

  async swap(params: SwapParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    if (!this.pumpFunProvider) throw new Error('PumpFun provider not initialized');

    const dex = params.dex || 'jupiter';  // Default to Jupiter
    const slippage = params.slippage || '100';  // Default to 1%

    try {
      switch (dex) {
        case 'jupiter':
          return await this.jupiterSwap(params);
        
        case 'raydium':
          return await this.raydiumSwap(params);
        
        case 'pumpfun':
          // For PumpFun, we use buy/sell depending on direction
          if (params.from.token === 'SOL') {
            return await this.pumpFunProvider.buyToken(
              this._keypair,
              new PublicKey(params.to.token),
              Number(params.from.amount),
              {
                unitLimit: 100_000_000,
                unitPrice: 100_000,
              },
              slippage
            );
          } else {
            return await this.pumpFunProvider.sellToken(
              this._keypair,
              new PublicKey(params.from.token),
              Number(params.from.amount),
              {
                unitLimit: 100_000_000,
                unitPrice: 100_000,
              },
              slippage
            );
          }
        
        default:
          throw new Error(`Unsupported DEX: ${dex}`);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      return {
        success: false,
        signature: ''
      };
    }
  }

  private async jupiterSwap(params: SwapParams): Promise<TransactionResult> {
    try {
      // Get quote from Jupiter
      const quoteResponse = await fetch(`${this.JUPITER_API_BASE}/quote`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMint: params.from.token === 'SOL' ? VERIFIED_ADDRESSES.WSOL : params.from.token,
          outputMint: params.to.token === 'SOL' ? VERIFIED_ADDRESSES.WSOL : params.to.token,
          amount: new BigNumber(params.from.amount).times(1e9).toString(),
          slippageBps: params.slippage || '100'
        })
      });

      const quote = await quoteResponse.json();

      // Get swap transaction
      const swapResponse = await fetch(`${this.JUPITER_API_BASE}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: this._keypair!.publicKey.toString(),
          wrapUnwrapSOL: true
        })
      });

      const { swapTransaction } = await swapResponse.json();

      // Sign and send transaction
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapTransaction, 'base64')
      );
      
      transaction.sign([this._keypair!]);
      const signature = await this._connection.sendTransaction(transaction);

      return {
        success: true,
        signature
      };
    } catch (error) {
      console.error('Jupiter swap failed:', error);
      return {
        success: false,
        signature: ''
      };
    }
  }

  private async raydiumSwap(params: SwapParams): Promise<TransactionResult> {
    const response = await fetch(`${this.RAYDIUM_API_BASE}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(params)
    });
    
    return await response.json();
  }

  async createToken(params: CreateTokenParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    if (!this.pumpFunProvider) throw new Error('PumpFun provider not initialized');

    return await this.pumpFunProvider.createAndBuyToken(
      this._keypair,
      params.metadata,
      Number(params.buyAmount || 0.5),
      {
        unitLimit: 100_000_000,
        unitPrice: 100_000,
      }
    );
  }
} 