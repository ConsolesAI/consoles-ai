import { Keypair } from "@solana/web3.js";
import { TransactionResult, WalletInfo, BaseTokenPrice, BasePriceBuilder, BaseChainSDK } from '../types';

export type TokenSymbol = 'SOL' | 'USDC' | 'BTC' | 'ETH' | string;
export type DEX = 'jupiter' | 'raydium' | 'pumpfun';

// Solana-specific price types
export interface TokenPrice extends BaseTokenPrice {
  exchange: string;
}

export interface PriceBuilder extends BasePriceBuilder {
  jupiter: Promise<number>;
  raydium: Promise<number>;
  pumpfun: Promise<number>;
  then(resolve: (prices: TokenPrice[]) => void): Promise<void>;
}

// Solana-specific transaction types
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
  dex?: DEX;  // Optional - defaults to jupiter if not specified
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

// Solana SDK interface
export interface SolanaSDK extends BaseChainSDK {
  price(address: string): PriceBuilder;
  connect(wallet: Keypair): Promise<WalletInfo>;
  transfer(params: TransferParams): Promise<TransactionResult>;
  swap(params: SwapParams): Promise<TransactionResult>;
  createToken(params: CreateTokenParams): Promise<TransactionResult>;
} 