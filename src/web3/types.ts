/** Supported blockchain networks */
export type Blockchain = 'solana' | 'ethereum';

/**
 * Result of a blockchain transaction with confirmation methods.
 * Provides a unified interface for tracking transaction status across chains.
 * 
 * @example
 * ```typescript
 * const tx = await sdk.transfer({ ... });
 * 
 * // Wait for basic confirmation
 * await tx.confirm();
 * 
 * // Wait for specific confirmation level
 * await tx.wait('finalized');
 * 
 * // Check current status
 * const status = await tx.status();
 * ```
 */
export interface TransactionResult {
    /** Unique transaction signature/hash */
    signature: string;

    /** 
     * Wait for basic confirmation (chain-specific level)
     * @param options - Optional confirmation settings
     * @param {number} [options.timeout] - Max time to wait in milliseconds
     * @param {number} [options.maxRetries] - Max retry attempts
     */
    confirm(options?: { timeout?: number; maxRetries?: number }): Promise<void>;

    /**
     * Wait for specific confirmation level
     * @param level - Desired confirmation level
     * @param options - Optional confirmation settings
     * @param {number} [options.timeout] - Max time to wait in milliseconds
     * @param {number} [options.maxRetries] - Max retry attempts
     */
    wait(level: 'processed' | 'confirmed' | 'finalized', options?: { timeout?: number; maxRetries?: number }): Promise<void>;

    /**
     * Get current transaction status
     * @returns Current confirmation level
     */
    status(): Promise<'processed' | 'confirmed' | 'finalized'>;
}

// Minimal runtime export needed for ESM imports
export const TransactionResult = {};

/**
 * Connected wallet information
 */
export interface WalletInfo {
    /** Wallet's public address */
    address: string;
    /** Public key in chain-specific format */
    publicKey: string;
    /** Connected network name */
    network: string;
}

/**
 * Base token price information
 */
export interface BaseTokenPrice {
    /** Current token price in USD */
    price: number;
    /** Total market capitalization (optional) */
    marketCap?: number;
    /** Total liquidity in pools (optional) */
    liquidity?: number;
    /** 24-hour trading volume (optional) */
    volume24h?: number;
}

/**
 * Interface for building price queries
 * Allows for chaining operations before fetching prices
 */
export interface BasePriceBuilder {
    then(resolve: (prices: any[]) => void): Promise<void>;
}

/**
 * Base interface that all chain-specific SDKs must implement
 */
export interface BaseChainSDK {
    /**
     * Connect a wallet for transactions
     * @param wallet - Chain-specific wallet type
     * @returns Connected wallet information
     */
    connect(wallet: any): Promise<WalletInfo>;

    /**
     * Get token price from specified or all DEXs
     * @param address - Token address/identifier
     * @param dex - Optional specific DEX to query
     */
    getPrice(address: string, dex?: string): Promise<any>;
} 