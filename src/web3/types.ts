import { PublicKey } from "@solana/web3.js";

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
    /** Unique transaction ID/hash */
    id: string;

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

/**
 * Trust score factors for token evaluation
 */
export interface TrustScoreFactors {
    /** Liquidity depth across DEXs (0-100) */
    liquidityScore: number;
    /** Trading volume consistency (0-100) */
    volumeScore: number;
    /** Age of token contract (0-100) */
    ageScore: number;
    /** Holder distribution score (0-100) */
    holderScore: number;
    /** Code audit status (0-100) */
    auditScore?: number;
    /** Social metrics score (0-100) */
    socialScore?: number;
}

/**
 * Comprehensive trust score result
 */
export interface TrustScoreResult {
    /** Overall trust score (0-100) */
    score: number;
    /** Detailed scoring factors */
    factors: TrustScoreFactors;
    /** Risk level assessment */
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    /** Timestamp of evaluation */
    timestamp: number;
    /** Optional warning messages */
    warnings?: string[];
}

/**
 * Trust score provider interface
 */
export interface TrustScoreProvider {
    /**
     * Calculate trust score for a token
     * @param tokenAddress - Address of token to evaluate
     * @param chain - Blockchain network
     */
    calculateScore(tokenAddress: string, chain: Blockchain): Promise<TrustScoreResult>;
}

/**
 * Token performance metrics
 */
export interface TokenPerformance {
    tokenAddress: string;
    symbol: string;
    priceChange24h: number;
    volumeChange24h: number;
    trade_24h_change: number;
    liquidity: number;
    liquidityChange24h: number;
    holderChange24h: number;
    rugPull: boolean;
    isScam: boolean;
    marketCapChange24h: number;
    sustainedGrowth: boolean;
    rapidDump: boolean;
    suspiciousVolume: boolean;
    validationTrust: number;
    balance: number;
    initialMarketCap: number;
    lastUpdated: Date;
}

/**
 * Recommender metrics for trust scoring
 */
export interface RecommenderMetrics {
    recommenderId: string;
    trustScore: number;
    totalRecommendations: number;
    successfulRecs: number;
    avgTokenPerformance: number;
    riskScore: number;
    consistencyScore: number;
    virtualConfidence: number;
    lastActiveDate: Date;
    trustDecay: number;
    lastUpdated: Date;
}

/**
 * Token recommendation data
 */
export interface TokenRecommendation {
    id: string;
    recommenderId: string;
    tokenAddress: string;
    timestamp: Date;
    initialMarketCap: number;
    initialLiquidity: number;
    initialPrice: number;
}

/**
 * Trade performance data
 */
export interface TradePerformance {
    token_address: string;
    recommender_id: string;
    buy_price: number;
    sell_price: number;
    buy_timeStamp: string;
    sell_timeStamp: string;
    buy_amount: number;
    sell_amount: number;
    buy_sol: number;
    received_sol: number;
    buy_value_usd: number;
    sell_value_usd: number;
    profit_usd: number;
    profit_percent: number;
    buy_market_cap: number;
    sell_market_cap: number;
    market_cap_change: number;
    buy_liquidity: number;
    sell_liquidity: number;
    liquidity_change: number;
    last_updated: string;
    rapidDump: boolean;
}

/**
 * Token security data
 */
export interface TokenSecurityData {
    ownerBalance: number;
    creatorBalance: number;
    ownerPercentage: number;
    creatorPercentage: number;
    top10HolderBalance: number;
    top10HolderPercent: number;
}

/**
 * Token recommendation summary
 */
export interface TokenRecommendationSummary {
    tokenAddress: string;
    averageTrustScore: number;
    averageRiskScore: number;
    averageConsistencyScore: number;
    recommenders: Array<{
        recommenderId: string;
        trustScore: number;
        riskScore: number;
        consistencyScore: number;
        recommenderMetrics: RecommenderMetrics;
    }>;
}

/**
 * Portfolio token information
 */
export interface PortfolioToken {
    // Token info
    address: string;
    symbol: string;
    name: string;

    // Balance info
    /** Raw balance in smallest unit (e.g. lamports) as decimal string */
    rawBalance: string;
    /** Token decimals */
    decimals: number;
    /** Human readable amount as decimal string */
    amount: string;

    // Value info
    /** Current price in USD as decimal string */
    price: string;
    /** Total value in USD as decimal string */
    value: string;
}

/**
 * Chain-specific total response
 */
export type ChainTotal = {
    /** Total value in USD as decimal string */
    usd: string;
    /** Optional value in requested token */
    token?: string;
} & {
    /** Chain-specific native token values */
    [key: string]: string | undefined;  // Allow chain-specific tokens (sol, eth) and optional token
};

/**
 * DEX source for price/value calculations
 */
export type DexSource = 'jupiter' | 'raydium' | 'pumpfun' | 'all';

/**
 * Complete portfolio information
 */
export interface Portfolio {
    /** 
     * Get total portfolio value in specified token.
     * Returns decimal strings to preserve precision (avoid float rounding errors).
     * Use BigNumber for calculations with these values.
     * Can fetch prices from DEX if token not in portfolio.
     * 
     * @example
     * ```typescript
     * // Get basic portfolio value
     * const totals = await portfolio.total();
     * 
     * // Get value in specific token
     * const inUsdc = await portfolio.total('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
     * 
     * // Get value from specific DEX
     * const fromJupiter = await portfolio.total('EPjFWdd5...', 'jupiter');
     * const fromPumpFun = await portfolio.total('8hHCk1x...', 'pumpfun');
     * ```
     */
    total(token?: string, source?: DexSource): Promise<ChainTotal>;
    /** List of tokens held */
    tokens: PortfolioToken[];
    /** Portfolio snapshot timestamp */
    timestamp: number;
}

/**
 * Chain-specific portfolio value response
 */
export type ChainPortfolioValue = {
    /** Total value in USD as decimal string */
    usd: string;
} & {
    /** Chain-specific native token values */
    [key: string]: string;  // Allow chain-specific native token key (e.g. 'sol', 'eth')
};

/**
 * Portfolio configuration options
 */
export interface PortfolioConfig {
    /** Include zero balances */
    includeZeroBalances?: boolean;
    /** Minimum USD value to include */
    minValueUsd?: string;
    /** Sort options */
    sort?: {
        /** Field to sort by */
        by: 'value' | 'quantity' | 'price' | 'symbol';
        /** Sort direction */
        order?: 'asc' | 'desc';
    };
}

/**
 * Portfolio query options
 */
export interface PortfolioOptions {
    /** Address to get portfolio for (optional if wallet connected) */
    address?: string | PublicKey;
    /** Portfolio configuration */
    config?: PortfolioConfig;
}

/**
 * Base transaction configuration options
 */
export interface BaseTransactionConfig {
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Skip preflight checks */
    skipPreflight?: boolean;
    /** Optional RPC endpoint override */
    rpc?: string;
}

/**
 * Base parameters for token transfers
 */
export interface BaseTransferParams {
    /** Recipient address */
    to: string;
    /** Amount to transfer */
    amount: string | number;
    /** Optional transaction-specific settings */
    config?: BaseTransactionConfig;
} 