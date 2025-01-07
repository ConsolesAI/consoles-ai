import { Web3SDK } from './web3';
import { extract } from './extract/index';
import type { ExtractInput, ExtractResponse } from './extract/types';
import { Browser } from './browser';
import { VM } from './vm';
import { Sandbox } from './sandbox';
import { ConsolesSDK } from './types';

/**
 * Main entry point for the Consoles SDK.
 * Provides access to various services including Web3, Extract, Browser, VM, and Sandbox.
 * 
 * @example
 * ```typescript
 * // Initialize with API key
 * const consoles = new Consoles('your-api-key');
 * 
 * // Web3 operations (Solana)
 * const solana = consoles.web3.solana('mainnet-beta');
 * const { wallet } = await solana.createWallet();
 * 
 * // Extract structured data
 * const data = await consoles.extract({
 *   type: 'url',
 *   content: 'https://example.com',
 *   schema: { type: 'object', properties: { title: { type: 'string' } } }
 * });
 * 
 * // Browser automation
 * const browser = consoles.browser('profile1');
 * await browser.launch();
 * 
 * // VM operations
 * const vm = consoles.vm;
 * 
 * // Sandbox environment
 * const sandbox = consoles.sandbox;
 * ```
 */
export class Consoles implements ConsolesSDK {
  private _apiKey?: string;
  private _web3?: Web3SDK;
  private _vm?: VM;
  private _sandbox?: Sandbox;

  /**
   * Create a new Consoles SDK instance
   * @param apiKey - Optional API key for authenticated services
   */
  constructor(apiKey?: string) {
    this._apiKey = apiKey;
  }

  /**
   * Update the API key for all services
   * @param apiKey - New API key to use
   */
  setApiKey(apiKey: string) {
    this._apiKey = apiKey;
    // Reset instances so they'll be recreated with new API key
    this._web3 = undefined;
    this._vm = undefined;
    this._sandbox = undefined;
  }

  /**
   * Access Web3 functionality for blockchain operations.
   * Currently supports Solana with plans for more chains.
   * 
   * @example
   * ```typescript
   * // Initialize Solana connection
   * const solana = consoles.web3.solana('mainnet-beta');
   * 
   * // Create and connect wallet
   * const { wallet } = await solana.createWallet();
   * await solana.connect(wallet);
   * 
   * // Transfer SOL
   * const tx = await solana.transfer({
   *   token: 'SOL',
   *   to: recipientAddress,
   *   amount: '0.1'
   * });
   * await tx.confirm();
   * ```
   * 
   * @returns {Web3SDK} Web3 SDK instance for blockchain operations
   */
  get web3() {
    if (!this._web3) {
      this._web3 = new Web3SDK({ apiKey: this._apiKey });
    }
    return this._web3;
  }

  /**
   * Extract structured data from various content types (URLs, files, or text).
   * 
   * @param options - Extraction options or content string
   * @returns Promise<ExtractResponse> - The extracted structured data
   * 
   * @example
   * ```typescript
   * const result = await consoles.extract({
   *   type: 'url',
   *   content: 'https://example.com/article',
   *   schema: {
   *     type: 'object',
   *     properties: {
   *       title: { type: 'string' },
   *       content: { type: 'string' }
   *     }
   *   }
   * });
   * ```
   * 
   * @throws {Error} When API key is not provided
   * @see {@link https://consoles.ai/docs/extract} Documentation
   */
  async extract(options: ExtractInput): Promise<ExtractResponse> {
    if (!this._apiKey) {
      throw new Error('API key required for Extract service. Get one at https://consoles.ai');
    }
    return extract(this._apiKey, options);
  }

  /**
   * Create a browser automation session.
   * @param profile - Profile name for session persistence
   * @returns Browser instance for automation
   * @throws {Error} When API key is not provided
   */
  browser(profile: string) {
    if (!this._apiKey) {
      throw new Error('API key required for Browser service. Get one at https://consoles.ai');
    }
    return new Browser(profile, { apiKey: this._apiKey });
  }

  /**
   * Access VM functionality for cloud compute operations.
   * @throws {Error} When API key is not provided
   */
  get vm() {
    if (!this._vm) {
      if (!this._apiKey) {
        throw new Error('API key required for VM service. Get one at https://consoles.ai');
      }
      this._vm = new VM({ apiKey: this._apiKey });
    }
    return this._vm;
  }

  /**
   * Access Sandbox functionality for isolated environments.
   * @throws {Error} When API key is not provided
   */
  get sandbox() {
    if (!this._sandbox) {
      if (!this._apiKey) {
        throw new Error('API key required for Sandbox service. Get one at https://consoles.ai');
      }
      this._sandbox = new Sandbox({ apiKey: this._apiKey });
    }
    return this._sandbox;
  }
}

export default Consoles;

// Re-export types
export type { ExtractInput, ExtractResponse } from './extract/types';
