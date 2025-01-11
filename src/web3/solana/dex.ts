import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TokenPrice, SwapParams, COMMON_TOKENS } from './types';
import { TransactionResult } from '../types';
import { PumpFunProvider } from './pumpfun';

export class DexManager {
  private jupiterBaseUrl = 'https://api.jup.ag/price/v2';
  private jupiterQuoteUrl = 'https://quote-api.jup.ag/v6';
  private raydiumBaseUrl = 'https://api.raydium.io/v2';
  private _pumpFun?: PumpFunProvider;

  constructor(
    private connection: Connection,
    private createTransactionResult: (signature: string) => TransactionResult
  ) {}

  /**
   * Get token price from one or all supported DEXs.
   */
  async getPrice(address: string, dex?: 'jupiter' | 'raydium', showExtraInfo?: boolean): Promise<TokenPrice> {
    const prices: TokenPrice = {};
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Jupiter price (fastest/most reliable)
        const jupiterUrl = `${this.jupiterBaseUrl}?ids=${address}${showExtraInfo ? '&showExtraInfo=true' : ''}`;
        const jupiterRes = await fetch(jupiterUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!jupiterRes.ok) {
          throw new Error(`Jupiter API returned ${jupiterRes.status}`);
        }

        const jupiterData = await jupiterRes.json();
        prices.jupiter = Number(jupiterData.data[address]?.price || 0);

        // TODO: Re-enable Raydium once Jupiter is working
        return prices;
      } catch (e) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Price fetch failed after retries:', e);
          return prices;  // Return whatever prices we got
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    return prices;
  }

  /**
   * Swap tokens using the best available route
   */
  async swap({ from, to, config = {}, wallet }: SwapParams & { wallet: Keypair }): Promise<TransactionResult> {
    // Convert token symbols to addresses if needed
    const inputMint = COMMON_TOKENS[from.token as keyof typeof COMMON_TOKENS] || from.token;
    const outputMint = COMMON_TOKENS[to.token as keyof typeof COMMON_TOKENS] || to.token;

    try {
      // If no specific exchange requested, try to find best route
      let exchange = 'jupiter';  // Default to Jupiter as it aggregates other DEXs

      // Check if token is on PumpFun
      const isPumpFun = await this.pumpFun(wallet).isTokenOnPumpFun(outputMint);
      if (isPumpFun) {
        exchange = 'pumpfun';
      }

      let signature: string;

      if (exchange === 'pumpfun') {
        // Use PumpFun for the swap
        const tx = await this.pumpFun(wallet).buyToken(
          wallet,
          new PublicKey(outputMint),
          parseFloat(from.amount.toString()),
          undefined,
          config.slippage || '1'
        );
        signature = tx.id;

      } else if (exchange === 'jupiter') {
        // Jupiter swap implementation
        const slippageBps = Math.floor(parseFloat(config.slippage || '1') * 100);
        
        // Get best route from Jupiter
        const quoteUrl = `${this.jupiterQuoteUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${from.amount}&slippageBps=${slippageBps}`;
        
        const quoteRes = await fetch(quoteUrl);
        const quoteData = await quoteRes.json();
        
        if (!quoteData.data) {
          throw new Error(`No swap route found for ${from.token} -> ${to.token}`);
        }

        // Get transaction data
        const { swapTransaction } = await fetch(`${this.jupiterQuoteUrl}/swap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteResponse: quoteData,
            userPublicKey: wallet.publicKey.toString(),
            wrapUnwrapSOL: true
          })
        }).then(res => res.json());

        // Sign and send transaction
        signature = await this.connection.sendTransaction(
          swapTransaction, 
          [wallet],
          { 
            skipPreflight: config.skipPreflight || false, 
            maxRetries: 3 
          }
        );

      } else if (exchange === 'raydium') {
        // Get Raydium pool info
        const poolInfoUrl = `${this.raydiumBaseUrl}/main/pairs`;
        const poolRes = await fetch(poolInfoUrl);
        const pools = await poolRes.json();
        
        // Find the pool for our token pair
        const pool = pools.data.find((p: any) => 
          (p.baseMint === inputMint && p.quoteMint === outputMint) ||
          (p.baseMint === outputMint && p.quoteMint === inputMint)
        );

        if (!pool) {
          throw new Error(`No Raydium pool found for ${from.token} -> ${to.token}`);
        }

        // Get swap route
        const routeUrl = `${this.raydiumBaseUrl}/route?inputMint=${inputMint}&outputMint=${outputMint}&amount=${from.amount}&slippage=${config.slippage || '1'}`;
        const routeRes = await fetch(routeUrl);
        const routeData = await routeRes.json();

        if (!routeData.success) {
          throw new Error(`No Raydium route found for ${from.token} -> ${to.token}`);
        }

        signature = await this.connection.sendTransaction(
          routeData.txData, 
          [wallet],
          { 
            skipPreflight: config.skipPreflight || false, 
            maxRetries: 3 
          }
        );
      } else {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }

      return this.createTransactionResult(signature);

    } catch (e) {
      console.error('Swap failed:', e);
      throw new Error('Swap failed: ' + (e as Error).message);
    }
  }

  private pumpFun(wallet: Keypair): PumpFunProvider {
    if (!this._pumpFun) {
      this._pumpFun = new PumpFunProvider(
        this.connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: async (tx) => {
            if (tx instanceof Transaction) {
              tx.partialSign(wallet);
            }
            return tx;
          },
          signAllTransactions: async (txs) => {
            return txs.map(tx => {
              if (tx instanceof Transaction) {
                tx.partialSign(wallet);
              }
              return tx;
            });
          },
          payer: wallet
        }
      );
    }
    return this._pumpFun;
  }
} 