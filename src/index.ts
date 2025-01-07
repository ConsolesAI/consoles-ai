import { Web3SDK } from './web3';
import { extract } from './extract/index';
import type { ExtractInput, ExtractResponse } from './extract/types';
import { Browser } from './browser';
import { VM } from './vm';
import { Sandbox } from './sandbox';
import { ConsolesSDK } from './types';

export class Consoles implements ConsolesSDK {
  private _apiKey?: string;
  private _web3?: Web3SDK;
  private _vm?: VM;
  private _sandbox?: Sandbox;

  constructor(apiKey?: string) {
    this._apiKey = apiKey;
  }

  // Allow setting API key after initialization
  setApiKey(apiKey: string) {
    this._apiKey = apiKey;
    // Reset instances so they'll be recreated with new API key
    this._web3 = undefined;
    this._vm = undefined;
    this._sandbox = undefined;
  }

  // Getters for each product - they handle their own API key requirements
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

  browser(profile: string) {
    if (!this._apiKey) {
      throw new Error('API key required for Browser service. Get one at https://consoles.ai');
    }
    return new Browser(profile, { apiKey: this._apiKey });
  }

  get vm() {
    if (!this._vm) {
      if (!this._apiKey) {
        throw new Error('API key required for VM service. Get one at https://consoles.ai');
      }
      this._vm = new VM({ apiKey: this._apiKey });
    }
    return this._vm;
  }

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
