// Base types shared across chains
export type Blockchain = 'solana' | 'ethereum';

export interface TransactionResult {
  signature: string;
  success: boolean;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  network: string;
}

// Base interfaces that chains will extend
export interface BaseTokenPrice {
  price: number;
  marketCap?: number;
  liquidity?: number;
  volume24h?: number;
}

export interface BasePriceBuilder {
  then(resolve: (prices: any[]) => void): Promise<void>;
}

export interface BaseChainSDK {
  connect(wallet: any): Promise<WalletInfo>;
  price(address: string): BasePriceBuilder;
} 