import { Keypair } from "@solana/web3.js";
import { TransactionResult as BaseTransactionResult } from '../types';

// Re-export TransactionResult
export { BaseTransactionResult as TransactionResult };

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
 * Solana transaction with confirmation methods
 */
export interface Transaction {
  /** Transaction signature (hash) */
  signature: string;
  /** Wait for basic confirmation */
  confirm(options?: TransactionOptions): Promise<void>;
  /** Wait for specific confirmation level */
  wait(level: ConfirmationLevel, options?: TransactionOptions): Promise<void>;
  /** Get current transaction status */
  status(): Promise<ConfirmationLevel>;
}

/**
 * Options for creating a vanity wallet address
 */
export interface WalletOptions {
  /**
   * Pattern for matching Solana addresses (base58 characters only)
   * Examples:
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

/** Supported token symbols (extensible) */
export type TokenSymbol = 'SOL' | 'USDC' | 'BTC' | 'ETH' | string;

/** Supported DEX platforms */
export type DEX = 'jupiter' | 'raydium' | 'pumpfun';

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

/**
 * Parameters for token transfer operation
 */
export interface TransferParams {
  /** Token to transfer (symbol or mint address) */
  token: TokenSymbol;
  /** Recipient address */
  to: string;
  /** Amount to transfer */
  amount: string | number;
  /** Source wallet (optional, uses connected wallet if not specified) */
  from?: Keypair;
  /** Optional transaction-specific settings */
  priorityFee?: number;
  computeUnits?: number;
  maxRetries?: number;
}

/**
 * Parameters for token swap operation
 */
export interface SwapParams {
  /** Source token information */
  from: { 
    token: TokenSymbol; 
    amount: string | number;
  };
  /** Target token information */
  to: { 
    token: TokenSymbol;
  };
  /** Maximum slippage percentage */
  slippage?: string;
  /** Optional transaction-specific settings */
  priorityFee?: number;
  computeUnits?: number;
  maxRetries?: number;
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