import { Keypair } from "@solana/web3.js";
import SolanaAdapter from './solana';
import { SolanaConfig } from './solana/types';

interface Web3SDKConfig {
  apiKey?: string;
}

/**
 * Web3SDK provides a unified interface for interacting with various blockchain networks.
 * Currently supports Solana blockchain operations with plans for future chain integrations.
 * 
 * @example
 * ```typescript
 * // Initialize SDK
 * const sdk = new Web3SDK({
 *   apiKey: 'your-api-key'  // Optional - for future authenticated endpoints
 * });
 * 
 * // Connect to Solana
 * const solana = sdk.solana({
 *   network: 'mainnet-beta'  // or custom RPC URL
 * });
 * 
 * // Create and connect wallet
 * const wallet = await solana.createWallet();
 * await solana.connect(wallet.wallet);
 * ```
 */
export class Web3SDK {
  private _solana?: SolanaAdapter;
  /** @todo This API key will be used for future authenticated endpoints */
  // @ts-ignore - Will be used in future endpoints
  private readonly apiKey?: string;

  /**
   * Creates a new instance of the Web3SDK.
   * @param {Web3SDKConfig} config - Optional configuration for the SDK
   * @param {string} [config.apiKey] - API key for authenticated endpoints (future use)
   */
  constructor(config?: Web3SDKConfig) {
    this.apiKey = config?.apiKey;
  }

  /**
   * Initializes or returns an existing Solana adapter instance.
   * Use this to interact with the Solana blockchain.
   * 
   * @param {SolanaConfig} config - Optional Solana-specific configuration
   * @returns {SolanaAdapter} A Solana adapter instance
   * 
   * @example
   * ```typescript
   * // Connect to mainnet
   * const solana = sdk.solana('mainnet-beta');
   * 
   * // Connect to custom RPC
   * const solana = sdk.solana('https://my-rpc.com');
   * 
   * // Connect with full config
   * const solana = sdk.solana({
   *   network: 'mainnet-beta',
   *   commitment: 'confirmed',
   *   priorityFee: 5000
   * });
   * ```
   */
  solana(config?: SolanaConfig | string): SolanaAdapter {
    if (!this._solana) {
      if (typeof config === 'string' && config.startsWith('http')) {
        // If it's a URL string, use it as custom RPC
        this._solana = new SolanaAdapter({ network: 'mainnet-beta', rpc: config });
      } else {
        // Otherwise use the config or default to mainnet
        this._solana = new SolanaAdapter(config || 'mainnet-beta');
      }
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