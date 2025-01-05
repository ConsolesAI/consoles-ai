import { Web3SDK } from './web3';
import { VM } from "./vm";
import { Browser } from "./browser";
import { Sandbox } from "./sandbox";
import { Extract, ExtractOptions, ExtractResponse } from "./extract";

export class Consoles {
  
  readonly web3: Web3SDK;
  readonly extract: Extract & {
    (options: Exclude<ExtractOptions, { type: 'generate_schema' }> | string): Promise<ExtractResponse | ReadableStream>
  };
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.web3 = new Web3SDK(apiKey);
    
    const extractInstance = new Extract(apiKey);
    const extractCallable = Object.assign(
      (options: Exclude<ExtractOptions, { type: 'generate_schema' }> | string) => 
        extractInstance.call(options),
      extractInstance
        );
    
    this.extract = extractCallable as any;
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
