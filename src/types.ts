// Import extract types first
import type { ExtractInput, ExtractResponse, ExtractUsage } from './extract/types';

// Re-export Web3 types
export * from './web3/types';

// Re-export Extract types
export type { ExtractInput, ExtractResponse, ExtractUsage };

/** Main Consoles SDK interface */
export interface ConsolesSDK {
  extract(options: ExtractInput): Promise<ExtractResponse>;
}

// VM types
export interface VMOptions {
  cpu?: number;
  memory?: number;
  gpu?: string | {
    type: string;
    count?: number;
  };
  image?: string;
  apt?: string[];
  pip?: string[];
  mounts?: string[];
}

// Browser types
export interface BrowserOptions {
  headless?: boolean;
  proxy?: string;
  userAgent?: string;
}

// Sandbox types
export interface SandboxOptions {
  cpu?: number;
  memory?: number;
  gpu?: string | {
    type: string;
    count?: number;
  };
  language?: string;
  apt?: string[];
  pip?: string[];
  npm?: string[];
}

