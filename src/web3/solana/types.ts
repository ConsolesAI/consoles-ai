import { Keypair } from "@solana/web3.js";
import { TransactionResult, WalletInfo, BaseTokenPrice, BasePriceBuilder, BaseChainSDK } from '../types';

// Export all types explicitly
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
  dex?: DEX;
  slippage?: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image_description: string;
}

// Make sure this interface is properly exported
export interface CreateTokenParams {
  metadata: TokenMetadata;
  buyAmount?: string | number;
}

export interface SolanaSDK extends BaseChainSDK {
  price(address: string): PriceBuilder;
  connect(wallet: Keypair): Promise<WalletInfo>;
  transfer(params: TransferParams): Promise<TransactionResult>;
  swap(params: SwapParams): Promise<TransactionResult>;
  createToken(params: CreateTokenParams): Promise<TransactionResult>;
}

// Add a barrel export at the bottom to ensure all types are available
export type {
  TokenPrice,
  PriceBuilder,
  TransferParams,
  SwapParams,
  TokenMetadata,
  CreateTokenParams,
  SolanaSDK
}; 