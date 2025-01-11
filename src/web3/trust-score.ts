import { Connection, PublicKey } from "@solana/web3.js";
import { TrustScoreProvider, TrustScoreResult, TrustScoreFactors, Blockchain } from './types';

/**
 * Trust score implementation for token evaluation.
 * Provides real-time risk assessment and scoring for tokens.
 * 
 * @example
 * ```typescript
 * const trustScore = await solana.trustScore.calculateScore(tokenAddress);
 * console.log('Score:', trustScore.score);
 * console.log('Risk Level:', trustScore.riskLevel);
 * if (trustScore.warnings) {
 *   console.log('Warnings:', trustScore.warnings);
 * }
 * ```
 */
export class TokenTrustScore implements TrustScoreProvider {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Calculate comprehensive trust score for a token
     * @param tokenAddress Token address to evaluate
     * @param chain Blockchain network (currently supports 'solana')
     */
    async calculateScore(tokenAddress: string, chain: Blockchain): Promise<TrustScoreResult> {
        if (chain !== 'solana') {
            throw new Error('Only Solana chain is currently supported');
        }

        // Get all metrics in parallel for better performance
        const [
            liquidityScore,
            volumeScore,
            ageScore,
            holderScore,
            priceData
        ] = await Promise.all([
            this.calculateLiquidityScore(tokenAddress),
            this.calculateVolumeScore(tokenAddress),
            this.calculateAgeScore(tokenAddress),
            this.calculateHolderScore(tokenAddress),
            this.getPriceData(tokenAddress)
        ]);

        // Core scoring factors
        const factors: TrustScoreFactors = {
            liquidityScore,
            volumeScore,
            ageScore,
            holderScore
        };

        // Risk detection
        const warnings: string[] = [];
        
        // Liquidity risks
        if (liquidityScore < 30) {
            warnings.push('Low liquidity - high slippage risk');
        }

        // Age risks
        if (ageScore < 20) {
            warnings.push('New token - exercise caution');
        }

        // Volume risks
        if (volumeScore < 30) {
            warnings.push('Low trading volume - limited market activity');
        }

        // Holder concentration risks
        if (holderScore < 40) {
            warnings.push('High holder concentration - potential manipulation risk');
        }

        // Price movement risks
        if (priceData.priceChange24h < -50) {
            warnings.push('Significant price decline in last 24h');
        }

        // Suspicious volume patterns
        if (priceData.volume24h > priceData.liquidity * 10) {
            warnings.push('Unusual trading volume relative to liquidity');
        }

        // Calculate weighted score
        // We weight liquidity and holder distribution higher as they're key risk factors
        const score = (
            (liquidityScore * 1.5) + 
            (volumeScore * 0.8) + 
            (ageScore * 0.7) + 
            (holderScore * 2)
        ) / 5;

        return {
            score: Math.min(100, Math.max(0, score)), // Ensure 0-100 range
            factors,
            riskLevel: this.calculateRiskLevel(score),
            timestamp: Date.now(),
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    private async calculateLiquidityScore(tokenAddress: string): Promise<number> {
        const { liquidity } = await this.getPriceData(tokenAddress);
        
        // Exponential scoring for liquidity
        const score = Math.log10(Math.max(1, liquidity)) * 20;
        return Math.min(100, Math.max(0, score));
    }

    private async calculateVolumeScore(tokenAddress: string): Promise<number> {
        const { volume24h, liquidity } = await this.getPriceData(tokenAddress);
        
        // Score based on volume relative to liquidity
        const volumeRatio = volume24h / Math.max(1, liquidity);
        if (volumeRatio > 2) return 40; // Too high volume is suspicious
        
        const score = volumeRatio * 50;
        return Math.min(100, Math.max(0, score));
    }

    private async calculateAgeScore(tokenAddress: string): Promise<number> {
        try {
            const pubKey = new PublicKey(tokenAddress);
            const accountInfo = await this.connection.getAccountInfo(pubKey);
            if (!accountInfo?.rentEpoch) return 0;
            
            const now = Date.now() / 1000;
            const ageInDays = (now - accountInfo.rentEpoch) / (24 * 60 * 60);
            
            // Logarithmic scoring for age
            const score = Math.log10(Math.max(1, ageInDays)) * 33;
            return Math.min(100, Math.max(0, score));
        } catch {
            return 0;
        }
    }

    private async calculateHolderScore(tokenAddress: string): Promise<number> {
        try {
            const pubKey = new PublicKey(tokenAddress);
            const largestAccounts = await this.connection.getTokenLargestAccounts(pubKey);
            if (!largestAccounts?.value?.length) return 0;

            const totalSupply = largestAccounts.value.reduce((sum, acc) => sum + Number(acc.amount), 0);
            const topHolderAmount = Number(largestAccounts.value[0].amount);
            const topHolderPercentage = (topHolderAmount / totalSupply) * 100;

            // Inverse scoring - lower concentration is better
            const score = 100 - topHolderPercentage;
            return Math.max(0, score);
        } catch {
            return 0;
        }
    }

    private calculateRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
        if (score >= 80) return 'LOW';
        if (score >= 60) return 'MEDIUM';
        if (score >= 40) return 'HIGH';
        return 'EXTREME';
    }

    private async getPriceData(tokenAddress: string) {
        try {
            // Get detailed price information from Jupiter including:
            // - Recent trade history
            // - Buy/sell quotes
            // - Market depth
            // - Price confidence level
            const jupiterUrl = `https://api.jup.ag/price/v2?ids=${tokenAddress}&showExtraInfo=true`;
            const jupRes = await fetch(jupiterUrl);
            const jupData = await jupRes.json();
            const tokenData = jupData.data?.[tokenAddress];
            
            // Try Raydium as backup
            const raydiumUrl = 'https://api.raydium.io/v2/main/price';
            const rayRes = await fetch(raydiumUrl);
            const rayData = await rayRes.json();

            // Get price change from buy/sell quotes if available
            const extraInfo = tokenData?.extraInfo;
            const priceChange24h = extraInfo?.quotedPrice ? 
                ((extraInfo.quotedPrice.buyPrice || 0) - (extraInfo.quotedPrice.sellPrice || 0)) / 
                (extraInfo.quotedPrice.sellPrice || 1) * 100 : 0;

            // Calculate volume from depth info
            const depth = extraInfo?.depth;
            const volume24h = depth ? 
                ((depth.buyPriceImpactRatio?.depth?.[100] || 0) + 
                (depth.sellPriceImpactRatio?.depth?.[100] || 0)) * 100 : 0;

            // Calculate liquidity from depth info
            const liquidity = depth ? 
                Math.max(
                    1000 / (depth.buyPriceImpactRatio?.depth?.[1000] || 1),
                    1000 / (depth.sellPriceImpactRatio?.depth?.[1000] || 1)
                ) : 0;

            return {
                price: tokenData?.price || rayData?.[tokenAddress] || 0,
                priceChange24h,
                volume24h,
                liquidity,
                confidenceLevel: extraInfo?.confidenceLevel || 'low'
            };
        } catch (e) {
            console.error('Price fetch failed:', e);
            return { 
                price: 0, 
                priceChange24h: 0,
                volume24h: 0, 
                liquidity: 0,
                confidenceLevel: 'low'
            };
        }
    }
} 