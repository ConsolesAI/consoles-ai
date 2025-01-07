import { Keypair } from "@solana/web3.js";
import SolanaAdapter from './solana';
import { SolanaConfig } from './solana/types';

interface Web3SDKConfig {
  apiKey?: string;
}

export class Web3SDK {
  private _solana?: SolanaAdapter;
  /** @todo This API key will be used for future authenticated endpoints */
  // @ts-ignore - Will be used in future endpoints
  private readonly apiKey?: string;

  constructor(config?: Web3SDKConfig) {
    this.apiKey = config?.apiKey;
  }

  solana(config?: SolanaConfig): SolanaAdapter {
    if (!this._solana) {
      this._solana = new SolanaAdapter(config);
    }
    return this._solana;
  }

  // Future endpoint methods will use this.apiKey for authentication
}

// Export all types and implementations
export * from './types';
export * from './solana/types';

// Export utils
export { Keypair };