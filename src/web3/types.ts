// Base types shared across chains
export type Blockchain = 'solana' | 'ethereum';

// Add a runtime export to ensure file generation
export const SUPPORTED_BLOCKCHAINS = ['solana', 'ethereum'] as const;

// Export interfaces as namespace objects to ensure they exist at runtime
export const TransactionResult = {
  __type: {} as {
    signature: string;
    confirm(options?: { timeout?: number; maxRetries?: number }): Promise<void>;
    wait(level: 'processed' | 'confirmed' | 'finalized', options?: { timeout?: number; maxRetries?: number }): Promise<void>;
    status(): Promise<'processed' | 'confirmed' | 'finalized'>;
  }
};
export type TransactionResult = typeof TransactionResult.__type;

export const WalletInfo = {
  __type: {} as {
    address: string;
    publicKey: string;
    network: string;
  }
};
export type WalletInfo = typeof WalletInfo.__type;

export const BaseTokenPrice = {
  __type: {} as {
    price: number;
    marketCap?: number;
    liquidity?: number;
    volume24h?: number;
  }
};
export type BaseTokenPrice = typeof BaseTokenPrice.__type;

export const BasePriceBuilder = {
  __type: {} as {
    then(resolve: (prices: any[]) => void): Promise<void>;
  }
};
export type BasePriceBuilder = typeof BasePriceBuilder.__type;

export const BaseChainSDK = {
  __type: {} as {
    connect(wallet: any): Promise<WalletInfo>;
    getPrice(address: string, dex?: string): Promise<any>;
  }
};
export type BaseChainSDK = typeof BaseChainSDK.__type; 