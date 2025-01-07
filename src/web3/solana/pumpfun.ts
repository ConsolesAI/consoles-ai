import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { CreateTokenMetadata, PriorityFee, PumpFunSDK } from "pumpdotfun-sdk";
import { TransactionResult } from '../types';

// PumpFun Program ID
const PUMPFUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const PUMPFUN_BONDING_CURVE_SEED = "bonding_curve";

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image_description: string;
}

export interface PumpFunTokenInfo {
  price: {
    sol: number;
    usd: number;
  };
  marketCap: {
    sol: number;
    usd: number;
  };
  liquidity: {
    token: number;
    sol: number;
  };
  totalSupply: number;
}

export class PumpFunProvider {
  private sdk: PumpFunSDK;
  private connection: Connection;

  constructor(connection: Connection, wallet: Wallet) {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "finalized",
    });
    this.sdk = new PumpFunSDK(provider);
    this.connection = connection;
  }

  // Get token info from bonding curve
  async getTokenInfo(mintAddress: string, solPriceUSD: number): Promise<PumpFunTokenInfo> {
    const mint = new PublicKey(mintAddress);
    
    // Find bonding curve PDA
    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(PUMPFUN_BONDING_CURVE_SEED), mint.toBuffer()],
      PUMPFUN_PROGRAM_ID
    );

    // Get account data
    const tokenAccount = await this.connection.getAccountInfo(bondingCurvePDA);
    if (!tokenAccount) {
      throw new Error(`Token not found on PumpFun: ${mintAddress}`);
    }

    // Parse bonding curve data
    const bondingCurve = {
      virtualTokenReserves: BigInt('0x' + tokenAccount.data.slice(8, 16).toString('hex')),
      virtualSolReserves: BigInt('0x' + tokenAccount.data.slice(16, 24).toString('hex')),
      realTokenReserves: BigInt('0x' + tokenAccount.data.slice(24, 32).toString('hex')),
      realSolReserves: BigInt('0x' + tokenAccount.data.slice(32, 40).toString('hex')),
      tokenTotalSupply: BigInt('0x' + tokenAccount.data.slice(40, 48).toString('hex'))
    };

    // Calculate prices and market cap
    const tokenPriceInSol = Number(bondingCurve.virtualSolReserves) / Number(bondingCurve.virtualTokenReserves);
    const tokenPriceUSD = tokenPriceInSol * solPriceUSD;
    const marketCapUSD = (Number(bondingCurve.realTokenReserves) * tokenPriceUSD);

    return {
      price: {
        sol: tokenPriceInSol,
        usd: tokenPriceUSD
      },
      marketCap: {
        sol: Number(bondingCurve.realSolReserves),
        usd: marketCapUSD
      },
      liquidity: {
        token: Number(bondingCurve.realTokenReserves),
        sol: Number(bondingCurve.realSolReserves)
      },
      totalSupply: Number(bondingCurve.tokenTotalSupply)
    };
  }

  // Check if token exists on PumpFun
  async isTokenOnPumpFun(mintAddress: string): Promise<boolean> {
    try {
      const mint = new PublicKey(mintAddress);
      const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(PUMPFUN_BONDING_CURVE_SEED), mint.toBuffer()],
        PUMPFUN_PROGRAM_ID
      );
      const account = await this.connection.getAccountInfo(bondingCurvePDA);
      return account !== null;
    } catch {
      return false;
    }
  }

  async createAndBuyToken(
    deployer: Keypair,
    tokenMetadata: TokenMetadata,
    buyAmountSol: number,
    priorityFee: PriorityFee = {
      unitLimit: 100_000_000,
      unitPrice: 100_000,
    },
    slippage: string = "2000"
  ): Promise<TransactionResult> {
    try {
      const mint = Keypair.generate();
      console.log(`Generated mint address: ${mint.publicKey.toBase58()}`);

      // Convert SOL to lamports (1 SOL = 1_000_000_000 lamports)
      const lamports = Math.floor(buyAmountSol * 1_000_000_000);

      // Convert metadata to CreateTokenMetadata format
      const fullTokenMetadata: CreateTokenMetadata = {
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        description: tokenMetadata.description,
        file: new Blob([tokenMetadata.image_description], { type: "image/png" }),
      };

      const createResults = await this.sdk.createAndBuy(
        deployer,
        mint,
        fullTokenMetadata,
        BigInt(lamports),
        BigInt(slippage),
        priorityFee,
        "finalized"
      );

      const signature = mint.publicKey.toBase58();
      const connection = this.connection;

      if (createResults.success) {
        console.log("Success:", `https://pump.fun/${signature}`);
        const ata = getAssociatedTokenAddressSync(
          mint.publicKey,
          deployer.publicKey,
          false
        );
        const balance = await connection.getTokenAccountBalance(ata, "processed");
        const amount = balance.value.uiAmount;
        if (amount === null) {
          console.log(`${deployer.publicKey.toBase58()}:`, "No Account Found");
        } else {
          console.log(`${deployer.publicKey.toBase58()}:`, amount);
        }
      } else {
        console.log("Create and Buy failed");
      }

      return {
        signature,
        async confirm() {
          await connection.confirmTransaction(signature, 'confirmed');
        },
        async wait(level) {
          await connection.confirmTransaction(signature, level);
        },
        async status() {
          const status = await connection.getSignatureStatus(signature);
          return status?.value?.confirmationStatus || 'processed';
        }
      };
    } catch (error) {
      console.error("Error in createAndBuyToken:", error);
      const signature = '';
      const connection = this.connection;
      return {
        signature,
        async confirm() {
          await connection.confirmTransaction(signature, 'confirmed');
        },
        async wait(level) {
          await connection.confirmTransaction(signature, level);
        },
        async status() {
          const status = await connection.getSignatureStatus(signature);
          return status?.value?.confirmationStatus || 'processed';
        }
      };
    }
  }

  async buyToken(
    buyer: Keypair,
    mint: PublicKey,
    amountSol: number,
    priorityFee: PriorityFee = {
      unitLimit: 100_000_000,
      unitPrice: 100_000,
    },
    slippage: string = "2000"
  ): Promise<TransactionResult> {
    try {
      const lamports = Math.floor(amountSol * 1_000_000_000);
      const buyResults = await this.sdk.buy(
        buyer,
        mint,
        BigInt(lamports),
        BigInt(slippage),
        priorityFee
      );

      const signature = buyResults.signature || '';
      const connection = this.connection;

      if (buyResults.success) {
        console.log("Success:", `https://pump.fun/${mint.toBase58()}`);
        const ata = getAssociatedTokenAddressSync(mint, buyer.publicKey, false);
        const balance = await connection.getTokenAccountBalance(ata, "processed");
        const amount = balance.value.uiAmount;
        if (amount === null) {
          console.log(`${buyer.publicKey.toBase58()}:`, "No Account Found");
        } else {
          console.log(`${buyer.publicKey.toBase58()}:`, amount);
        }
      }

      return {
        signature,
        async confirm() {
          await connection.confirmTransaction(signature, 'confirmed');
        },
        async wait(level) {
          await connection.confirmTransaction(signature, level);
        },
        async status() {
          const status = await connection.getSignatureStatus(signature);
          return status?.value?.confirmationStatus || 'processed';
        }
      };
    } catch (error) {
      console.error("Error in buyToken:", error);
      const signature = '';
      const connection = this.connection;
      return {
        signature,
        async confirm() {
          await connection.confirmTransaction(signature, 'confirmed');
        },
        async wait(level) {
          await connection.confirmTransaction(signature, level);
        },
        async status() {
          const status = await connection.getSignatureStatus(signature);
          return status?.value?.confirmationStatus || 'processed';
        }
      };
    }
  }

  async sellToken(
    seller: Keypair,
    mint: PublicKey,
    amount: number,
    priorityFee: PriorityFee = {
      unitLimit: 100_000_000,
      unitPrice: 100_000,
    },
    slippage: string = "2000"
  ): Promise<TransactionResult> {
    try {
      const sellResults = await this.sdk.sell(
        seller,
        mint,
        BigInt(amount),
        BigInt(slippage),
        priorityFee
      );

      const signature = sellResults.signature || '';
      const connection = this.connection;

      if (sellResults.success) {
        console.log("Success:", `https://pump.fun/${mint.toBase58()}`);
        const ata = getAssociatedTokenAddressSync(mint, seller.publicKey, false);
        const balance = await connection.getTokenAccountBalance(ata, "processed");
        const amount = balance.value.uiAmount;
        if (amount === null) {
          console.log(`${seller.publicKey.toBase58()}:`, "No Account Found");
        } else {
          console.log(`${seller.publicKey.toBase58()}:`, amount);
        }
      }

      return {
        signature,
        async confirm() {
          await connection.confirmTransaction(signature, 'confirmed');
        },
        async wait(level) {
          await connection.confirmTransaction(signature, level);
        },
        async status() {
          const status = await connection.getSignatureStatus(signature);
          return status?.value?.confirmationStatus || 'processed';
        }
      };
    } catch (error) {
      console.error("Error in sellToken:", error);
      const signature = '';
      const connection = this.connection;
      return {
        signature,
        async confirm() {
          await connection.confirmTransaction(signature, 'confirmed');
        },
        async wait(level) {
          await connection.confirmTransaction(signature, level);
        },
        async status() {
          const status = await connection.getSignatureStatus(signature);
          return status?.value?.confirmationStatus || 'processed';
        }
      };
    }
  }
} 