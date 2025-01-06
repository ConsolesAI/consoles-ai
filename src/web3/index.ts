import { Keypair } from "@solana/web3.js";
import SolanaAdapter from './solana';
import bs58 from 'bs58';

// Simple interface for what we need from Consoles
interface ConsolesInstance {
  apiKey?: string; // Make API key optional
}

export class Web3SDK {
  private _solana?: SolanaAdapter;
  private consoles: ConsolesInstance;

  constructor(consoles?: ConsolesInstance) {
    this.consoles = consoles || {}; // Allow empty constructor
  }

  get solana(): SolanaAdapter {
    if (!this._solana) {
      this._solana = new SolanaAdapter(this.consoles.apiKey);
    }
    return this._solana;
  }

  // Configure RPC endpoint
  setRpcEndpoint(endpoint: string) {
    if (!this._solana) {
      this._solana = new SolanaAdapter(this.consoles.apiKey);
    }
    this._solana.setRpcEndpoint(endpoint);
    return this._solana;
  }

  // Free features - no API key needed
  createWallet() {
    return Keypair.generate();
  }

  getPrivateKey(wallet: Keypair) {
    return bs58.encode(wallet.secretKey);
  }

  loadWallet(privateKey: string) {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  }

  /* Helper to check if premium features are available
  private requireApiKey(feature: string): void {
    if (!this.consoles.apiKey) {
      throw new Error(`API key required for premium feature: ${feature}. Get one at https://consoles.ai`);
    }
  }
  */
}

// Export all types
export * from './types';
export * from './solana/types';

// Export utils
export { Keypair };