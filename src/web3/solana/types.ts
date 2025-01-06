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
export interface SolanaConfig {
  rpc?: string;
  network?: SolanaNetwork;
}

// Vanity Wallet Options
export interface SolanaVanityWalletOptions {
  // Pattern options (must be valid base58)
  prefix?: string;     // Must start with these characters
  suffix?: string;     // Must end with these characters
  contains?: string;   // Must contain these characters
  // Basic options
  caseSensitive?: boolean;
  maxAttempts?: number;
}

// Token Types
export type TokenSymbol = 'SOL' | 'USDC' | 'BTC' | 'ETH' | string;
export type DEX = 'jupiter' | 'raydium' | 'pumpfun';

export interface TokenPrice extends BaseTokenPrice {
  exchange: string;
}

// Transaction Types
export interface TransferParams {
  token: TokenSymbol;
  to: string;
  amount: string | number;
  from?: Keypair;
}

export interface SwapParams {
  from: { 
    token: TokenSymbol; 
    amount: string | number;
  };
  to: { 
    token: TokenSymbol;
  };
  dex?: DEX;
  slippage?: string;
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