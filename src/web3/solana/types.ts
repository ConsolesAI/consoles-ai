import { Keypair } from "@solana/web3.js";
import { TransactionResult as BaseTransactionResult, BaseTokenPrice, BasePriceBuilder } from '../types';

// Re-export TransactionResult
export { BaseTransactionResult as TransactionResult };

export type TokenSymbol = 'SOL' | 'USDC' | 'BTC' | 'ETH' | string;
export type DEX = 'jupiter' | 'raydium' | 'pumpfun';

export interface SolanaConfig {
  rpcEndpoint?: string;
}

export interface TokenPrice extends BaseTokenPrice {
  exchange: string;
}

export interface PriceBuilder extends BasePriceBuilder {
  jupiter: Promise<number>;
  raydium: Promise<number>;
  pumpfun: Promise<number>;
  then(resolve: (prices: TokenPrice[]) => void): Promise<void>;
}

export interface TransferParams {
  token: TokenSymbol;
  to: string;
  amount: string | number;
  from?: Keypair;
}

export interface SwapParams {
  from: { 
    token: TokenSymbol; 
    amount: string | number;
  };
  to: { 
    token: TokenSymbol;
  };
  dex?: DEX;
  slippage?: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image_description: string;
}

export interface CreateTokenParams {
  metadata: TokenMetadata;
  buyAmount?: string | number;
} 