import { Web3SDK } from './web3';
import { VM } from "./vm";
import { Browser } from "./browser";
import { Sandbox } from "./sandbox";
import { Extract, ExtractOptions, ExtractResponse } from "./extract";

export class Consoles {
  web3: Web3SDK;
  private readonly apiKey: string;
  private readonly extractInstance: Extract;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.web3 = new Web3SDK(apiKey);
    this.extractInstance = new Extract(apiKey);
  }

  async extract(options: Exclude<ExtractOptions, { type: 'generate_schema' }> | string): Promise<ExtractResponse | ReadableStream> {
    if (typeof options === 'string') {
      return this.extractInstance.extract({
        type: 'text',
        content: options
      });
    }
    return this.extractInstance.extract(options);
  }

  browser(profile: string): Browser {
    return new Browser(profile, this.apiKey);
  }

  VM(): VM {
    return new VM(this.apiKey);
  }

  sandbox(): Sandbox {
    return new Sandbox(this.apiKey);
  }
}

// Export types
export type {
  ExtractOptions,
  ExtractResponse
};
export * from './web3/types';

// Default export
export default Consoles;
