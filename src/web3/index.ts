import { Keypair } from "@solana/web3.js";
import SolanaAdapter from './solana';
import bs58 from 'bs58';
import { SolanaConfig } from './solana/types';

// Simple interface for what we need from Consoles
interface ConsolesInstance {
  apiKey?: string;
}

export class Web3SDK {
  private _solana?: SolanaAdapter;
  private consoles: ConsolesInstance;

  constructor(consoles?: ConsolesInstance) {
    this.consoles = consoles || {};
  }

  solana(config?: SolanaConfig): SolanaAdapter {
    if (!this._solana) {
      this._solana = new SolanaAdapter(this.consoles.apiKey, config);
    }
    return this._solana;
  }
}

// Export all types
export * from './types';
export * from './solana/types';

// Export utils
export { Keypair };