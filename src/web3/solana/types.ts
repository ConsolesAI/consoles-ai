import { Keypair } from "@solana/web3.js";
import { TransactionResult, WalletInfo, BaseTokenPrice, BasePriceBuilder, BaseChainSDK } from '../types';

// Define types first, then export them in the barrel
type TokenSymbol = 'SOL' | 'USDC' | 'BTC' | 'ETH' | string;
type DEX = 'jupiter' | 'raydium' | 'pumpfun';

// Solana-specific price types
interface TokenPrice extends BaseTokenPrice {
  exchange: string;
}

interface PriceBuilder extends BasePriceBuilder {
  jupiter: Promise<number>;
  raydium: Promise<number>;
  pumpfun: Promise<number>;
  then(resolve: (prices: TokenPrice[]) => void): Promise<void>;
}

interface TransferParams {
  token: TokenSymbol;
  to: string;
  amount: string | number;
  from?: Keypair;
}

interface SwapParams {
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

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image_description: string;
}

interface CreateTokenParams {
  metadata: TokenMetadata;
  buyAmount?: string | number;
}

interface SolanaSDK extends BaseChainSDK {
  price(address: string): PriceBuilder;
  connect(wallet: Keypair): Promise<WalletInfo>;
  transfer(params: TransferParams): Promise<TransactionResult>;
  swap(params: SwapParams): Promise<TransactionResult>;
  createToken(params: CreateTokenParams): Promise<TransactionResult>;
}

// Single export point for all types
export type {
  TokenSymbol,
  DEX,
  TokenPrice,
  PriceBuilder,
  TransferParams,
  SwapParams,
  TokenMetadata,
  CreateTokenParams,
  SolanaSDK
}; 