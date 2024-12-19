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

