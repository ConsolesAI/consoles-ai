import { Keypair } from "@solana/web3.js";
import { TransactionResult as BaseTransactionResult, BaseTokenPrice } from '../types';

// Re-export TransactionResult
export { BaseTransactionResult as TransactionResult };

// Solana Networks
export type SolanaNetwork = 'mainnet-beta' | 'testnet' | 'devnet';
export const SOLANA_NETWORKS = {
  MAINNET: 'https://api.mainnet-beta.solana.com',
  TESTNET: 'https://api.testnet.solana.com',
  DEVNET: 'https://api.devnet.solana.com'
} as const;

// Address & Key Constants
export const SOLANA_BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const SOLANA_ADDRESS_LENGTH = 44;  // Base58 encoded public key length
export const SOLANA_PUBKEY_LENGTH = 32;   // Raw bytes
export const SOLANA_PRIVKEY_LENGTH = 64;  // Raw bytes

// Token Constants
export const SOLANA_DECIMALS = 9;
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Common Program IDs
export const SOLANA_PROGRAMS = {
  SYSTEM: '11111111111111111111111111111111',
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
} as const;

// Configuration
export type SolanaConfig = {
  rpc?: string;
  network?: SolanaNetwork;
} | SolanaNetwork | string;

// Transaction Types
export type ConfirmationLevel = 'processed' | 'confirmed' | 'finalized';

export interface TransactionOptions {
  timeout?: number;
  maxRetries?: number;
}

export interface Transaction {
  signature: string;
  confirm(options?: TransactionOptions): Promise<void>;
  wait(level: ConfirmationLevel, options?: TransactionOptions): Promise<void>;
  status(): Promise<ConfirmationLevel>;
}

// Wallet Creation
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

export interface WalletResult {
  wallet: Keypair;
  attempts: number;
}

/**
 * Input for createWallet
 * string shorthand is equivalent to { pattern: string }
 */
export type CreateWalletInput = string | WalletOptions;

// Token Types
export type TokenSymbol = 'SOL' | 'USDC' | 'BTC' | 'ETH' | string;
export type DEX = 'jupiter' | 'raydium' | 'pumpfun';

export interface TokenPrice {
  jupiter?: number;
  raydium?: number;
  [key: string]: number | undefined;  // Allow other DEXs
}

// Transaction Types
export interface TransferParams {
  token: TokenSymbol;
  to: string;
  amount: string | number;
  from?: Keypair;
  // Transaction-specific options
  priorityFee?: number;
  computeUnits?: number;
  maxRetries?: number;
}

export interface SwapParams {
  from: { 
    token: TokenSymbol; 
    amount: string | number;
  };
  to: { 
    token: TokenSymbol;
  };
  slippage?: string;
  // Transaction-specific options
  priorityFee?: number;
  computeUnits?: number;
  maxRetries?: number;
}

// Token Creation
export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image_description: string;
}

export interface CreateTokenParams {
  metadata: TokenMetadata;
  buyAmount?: string | number;
} 