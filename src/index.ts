import { extract, ExtractError } from './extract/index';
import type { ExtractInput, ExtractResponse } from './extract/types';

import MCP from './mcp';
import { ConsolesSDK } from './types';


export class Consoles implements ConsolesSDK {
  private _apiKey?: string;

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
   * @param description - Optional description of the MCP instance
   * @returns MCP instance
   */
  mcp(name: string, version: string, description?: string) {
    return new MCP({ name, version, description });
  }
}

export default Consoles;

// Re-export types
export type { ExtractInput, ExtractResponse } from './extract/types';
export { ExtractError } from './extract/index';
export { MCP };
