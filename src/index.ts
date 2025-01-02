import { Web3SDK } from './web3';
import { VM } from "./vm";
import { Browser } from "./browser";
import { Sandbox } from "./sandbox";
import { Extract, ExtractOptions, ExtractResponse } from "./extract";
import { Storage } from "./storage";
import { Storage as IStorage } from "./storage/types";

export class Consoles {
  readonly storage: IStorage;
  readonly web3: Web3SDK;
  readonly extract: Extract & {
    (options: Exclude<ExtractOptions, { type: 'generate_schema' }> | string): Promise<ExtractResponse | ReadableStream>
  };
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.storage = new Storage(apiKey);
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
export * from './storage/types';

// Default export
export default Consoles;
