import { extract, ExtractError } from './extract/index';
import type { ExtractInput, ExtractResponse } from './extract/types';
import { Browser } from './browser';
import { VM } from './vm';
import { Sandbox } from './sandbox';
import { MCP } from './mcp';
import { ConsolesSDK } from './types';

/**
 * Main entry point for the Consoles SDK.
 * Provides access to various services including Extract, Browser, VM, and Sandbox.
 * 
 * @example
 * ```typescript
 * // Initialize with API key
 * const consoles = new Consoles('your-api-key');
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
    this._vm = undefined;
    this._sandbox = undefined;
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
   * @throws {ExtractError} When extraction fails with specific error details
   * @throws {Error} When API key is not provided
   * @see {@link https://consoles.ai/docs/extract} Documentation
   */
  async extract(options: ExtractInput): Promise<ExtractResponse> {
    if (!this._apiKey) {
      throw new Error('API key required for Extract service. Get one at https://consoles.ai');
    }
    
    try {
      return await extract(this._apiKey, options);
    } catch (error) {
      // Rethrow ExtractError instances directly
      if (error instanceof ExtractError) {
        throw error;
      }
      
      // Convert other errors to a generic error
      throw new Error(error instanceof Error ? error.message : 'Unknown error during extraction');
    }
  }

  /**
   * Create a new MCP instance.
   * @param name - Name of the MCP instance 
   * @param version - Version of the MCP instance
   * @returns MCP instance
   * @throws {Error} When API key is not provided
   */
  mcp(name: string, version: string) {
    return new MCP({ name, version});
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
export { ExtractError } from './extract/index';
