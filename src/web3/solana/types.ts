import { Keypair } from "@solana/web3.js";
import { TransactionResult, BaseTransactionConfig, BaseTransferParams } from '../types';

// Re-export TransactionResult for backward compatibility
export { TransactionResult };

/** Supported Solana network types */
export type SolanaNetwork = 'mainnet-beta' | 'testnet' | 'devnet';

/** Default RPC endpoints for Solana networks */
export const SOLANA_NETWORKS = {
  MAINNET: 'https://api.mainnet-beta.solana.com',
  TESTNET: 'https://api.testnet.solana.com',
  DEVNET: 'https://api.devnet.solana.com'
} as const;

/** Constants for Solana address generation and validation */
export const SOLANA_BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Characters not allowed in Solana addresses (for user reference) */
export const INVALID_ADDRESS_CHARS = '0OIl';

/** Helper type for valid Base58 characters in vanity patterns */
export type ValidVanityChar = 
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' 
  | 'L' | 'M' | 'N' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' 
  | 'W' | 'X' | 'Y' | 'Z'
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' 
  | 'k' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' 
  | 'v' | 'w' | 'x' | 'y' | 'z';

/** Length of a base58-encoded Solana public key */
export const SOLANA_ADDRESS_LENGTH = 44;
/** Length of a raw Solana public key in bytes */
export const SOLANA_PUBKEY_LENGTH = 32;
/** Length of a raw Solana private key in bytes */
export const SOLANA_PRIVKEY_LENGTH = 64;

/** Solana token-related constants */
export const SOLANA_DECIMALS = 9;
/** Number of lamports in 1 SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/** Common Solana program IDs */
export const SOLANA_PROGRAMS = {
  /** System program for basic operations */
  SYSTEM: '11111111111111111111111111111111',
  /** Token program for SPL tokens */
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  /** Memo program for transaction notes */
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
} as const;

/**
 * Configuration options for Solana connection
 * Supports network name, RPC URL, or detailed config object
 * 
 * @example
 * ```typescript
 * // Using network name
 * const config: SolanaConfig = 'mainnet-beta';
 * 
 * // Using custom RPC
 * const config: SolanaConfig = 'https://my-rpc.com';
 * 
 * // Using detailed config
 * const config: SolanaConfig = {
 *   network: 'mainnet-beta',
 *   rpc: 'https://my-rpc.com'
 * };
 * ```
 */
export type SolanaConfig = {
  /** Optional custom RPC endpoint */
  rpc?: string;
  /** Network to connect to */
  network?: SolanaNetwork;
} | SolanaNetwork | string;

/** Transaction confirmation levels in order of finality */
export type ConfirmationLevel = 'processed' | 'confirmed' | 'finalized';

/**
 * Options for transaction confirmation
 */
export interface TransactionOptions {
  /** Maximum time to wait for confirmation */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Options for creating a vanity wallet address
 * 
 * @example
 * ```typescript
 * // Valid patterns:
 * const options: WalletOptions = {
 *   pattern: 'CAKE',     // Must start with CAKE
 *   pattern: '*DEAD',    // Must end with DEAD
 *   pattern: 'ABC*XYZ'   // Must start with ABC and end with XYZ
 * };
 * 
 * // Note: Only these characters are allowed: ${SOLANA_BASE58_CHARS}
 * // These characters are NOT allowed: ${INVALID_ADDRESS_CHARS}
 * ```
 */
export interface WalletOptions {
  /**
   * Pattern for matching Solana addresses (base58 characters only)
   * Only characters in SOLANA_BASE58_CHARS are allowed
   * Cannot use: 0 (zero), O (capital o), I (capital i), l (lowercase L)
   * 
   * Pattern formats:
   * - "CAFE"     -> Must start with CAFE
   * - "*DEAD"    -> Must end with DEAD
   * - "CAFE*XYZ" -> Must start with CAFE and end with XYZ
   */
  pattern: string;
  /**
   * Maximum time (in ms) to spend generating a vanity address
   * After timeout, returns best attempt or throws if no match
   * Default: 30000 (30 seconds)
   */
  timeout?: number;
  /**
   * Whether to throw if no match is found within timeout
   * If false, returns closest match found so far
   * Default: true
   */
  strict?: boolean;
}

/**
 * Result of wallet creation operation
 */
export interface WalletResult {
  /** Generated wallet keypair */
  wallet: Keypair;
  /** Number of attempts taken to generate the wallet */
  attempts: number;
}

/**
 * Input for createWallet function
 * String shorthand is equivalent to { pattern: string }
 * 
 * @example
 * ```typescript
 * // Simple pattern
 * const input: CreateWalletInput = 'CAFE';
 * 
 * // Full options
 * const input: CreateWalletInput = {
 *   pattern: 'CAFE*XYZ',
 *   timeout: 60000,
 *   strict: false
 * };
 * ```
 */
export type CreateWalletInput = string | WalletOptions;

/** Common token addresses for convenience */
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
} as const;

/** Supported token symbols (extensible) */
export type TokenSymbol = keyof typeof COMMON_TOKENS | string;

/** Supported exchange platforms */
export type Exchange = 'jupiter' | 'raydium' | 'pumpfun';

/**
 * Token price information from different DEXs
 */
export interface TokenPrice {
  /** Price from Jupiter DEX */
  jupiter?: number;
  /** Price from Raydium DEX */
  raydium?: number;
  /** Prices from other DEXs */
  [key: string]: number | undefined;
}

/** Solana-specific transaction configuration options */
export interface TransactionConfig extends BaseTransactionConfig {
  /** Priority fee (in microlamports) */
  priorityFee?: number;
  /** Compute unit limit */
  computeUnits?: number;
}

/** Parameters for Solana token transfers */
export interface TransferParams extends BaseTransferParams {
  /** Token to transfer (symbol or mint address) */
  token: TokenSymbol;
  /** Source wallet (optional, uses connected wallet if not specified) */
  from?: Keypair;
  /** Optional transaction-specific settings */
  config?: TransactionConfig;
}

export interface SwapConfig {
  /** Slippage tolerance (e.g. "1" for 1%) */
  slippage?: string;
  /** Priority fee (in micro-lamports) */
  priorityFee?: number;
  /** Compute unit limit */
  computeUnits?: number;
  /** Skip preflight checks */
  skipPreflight?: boolean;
  /** Optional RPC override */
  rpc?: string;
}

export interface SwapParams {
  /** Token to swap from */
  from: { 
    token: TokenSymbol | string;
    amount: string;
  };
  /** Token to swap to */
  to: {
    token: TokenSymbol | string;
    amount?: string;
  };
  /** Optional sender wallet (if different from connected) */
  wallet?: Keypair;
  /** Optional transaction config */
  config?: SwapConfig;
}

/**
 * Token information for swap operations
 */
export interface SwapTokenInfo {
  /** Token symbol (e.g. 'SOL', 'USDC') or mint address */
  token: TokenSymbol;
  /** Amount to swap (in token's native units) */
  amount: string | number;
}

/**
 * Metadata for token creation
 */
export interface TokenMetadata {
  /** Token name */
  name: string;
  /** Token symbol (ticker) */
  symbol: string;
  /** Token description */
  description: string;
  /** Description of token image/logo */
  image_description: string;
}

/**
 * Parameters for creating a new token
 */
export interface CreateTokenParams {
  /** Token metadata */
  metadata: TokenMetadata;
  /** Optional initial liquidity amount */
  buyAmount?: string | number;
} 