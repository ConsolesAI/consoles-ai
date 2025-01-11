import { Connection, Keypair, PublicKey, ParsedAccountData, LAMPORTS_PER_SOL, Transaction, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { Portfolio, PortfolioOptions, PortfolioToken, ChainPortfolioValue, DexSource } from '../types';
import BigNumber from 'bignumber.js';
import { TokenPrice, COMMON_TOKENS } from './types';
import { PumpFunProvider } from './pumpfun';

const SOLANA_DECIMALS = 9;  // Number of decimals for SOL token

/**
 * Solana-specific portfolio management
 * Handles SPL token accounts and native SOL balances
 */
export class PortfolioManager {
  private _pumpFun?: PumpFunProvider;

  constructor(
    private connection: Connection,
    private getPrice: (address: string) => Promise<TokenPrice>
  ) {}

  private get pumpFun() {
    if (!this._pumpFun) {
      // Create a real keypair for read-only operations
      const readOnlyKeypair = Keypair.generate();
      console.log('PumpFun keypair:', readOnlyKeypair.publicKey.toString());  // Debug log
      
      const wallet = {
        publicKey: readOnlyKeypair.publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => tx,
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => txs,
        payer: readOnlyKeypair
      };
      
      this._pumpFun = new PumpFunProvider(
        this.connection,
        wallet
      );
      console.log('PumpFun provider initialized');  // Debug log
    }
    return this._pumpFun;
  }

  async getTokenMetadata(mint: PublicKey) {
    try {
      // Check if it's a PumpFun token first
      try {
        const pumpInfo = await this.pumpFun.getTokenInfo(mint.toString(), 0);
        if (pumpInfo) {
          return { symbol: 'PUMP', name: 'PumpFun Token' };  // We could get actual metadata but need solPrice
        }
      } catch {} // Not a PumpFun token

      // Get regular SPL token metadata
      const tokenInfo = await this.connection.getParsedAccountInfo(mint);
      const parsedTokenInfo = tokenInfo.value?.data as ParsedAccountData;
      return {
        symbol: parsedTokenInfo?.parsed?.info?.symbol || 'Unknown',
        name: parsedTokenInfo?.parsed?.info?.name || 'Unknown Token',
        decimals: parsedTokenInfo?.parsed?.info?.decimals || 0
      };
    } catch (e) {
      console.error('Error getting token metadata:', e);
      return { symbol: 'Unknown', name: 'Unknown Token', decimals: 0 };
    }
  }

  /**
   * Get portfolio for any address (read-only)
   * @param address Wallet address or PublicKey
   * @param options Portfolio options
   */
  async getPortfolioForAddress(address: string | PublicKey, options: PortfolioOptions = {}): Promise<Portfolio> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const tokens: PortfolioToken[] = [];
    const config = options.config || {};

    try {
      // Get native SOL balance
      const solBalance = await this.connection.getBalance(pubkey);
      const solPrice = (await this.getPrice(COMMON_TOKENS.SOL)).jupiter || 0;
      
      if (solBalance > 0) {
        const amount = new BigNumber(solBalance).div(LAMPORTS_PER_SOL).toString();
        const value = new BigNumber(amount).times(solPrice).toString();
        
        tokens.push({
          address: COMMON_TOKENS.SOL,
          symbol: 'SOL',
          name: 'Solana',  // Just use Solana as the name
          rawBalance: solBalance.toString(),
          decimals: SOLANA_DECIMALS,
          amount,
          price: solPrice.toString(),
          value
        });
      }

      // Get all token accounts
      const accounts = await this.connection.getTokenAccountsByOwner(
        pubkey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Get token data in parallel
      const tokenPromises = accounts.value.map(async ({ account }) => {
        try {
          const parsedData = AccountLayout.decode(account.data);
          const mint = new PublicKey(parsedData.mint);
          
          // Skip if zero balance
          if (parsedData.amount === BigInt(0) && !config.includeZeroBalances) {
            return null;
          }

          // Get token metadata
          const { symbol, name, decimals } = await this.getTokenMetadata(mint);
          
          // Special case for wrapped SOL
          const isWrappedSol = mint.toString() === COMMON_TOKENS.SOL;
          const displaySymbol = isWrappedSol ? 'wSOL' : symbol;
          const displayName = isWrappedSol ? 'Wrapped Solana' : name;
          
          // Get price
          const price = await this.getPrice(mint.toString());
          const priceUsd = price.jupiter?.toString() || '0';
          
          // Calculate values
          const rawBalance = parsedData.amount.toString();
          const amount = new BigNumber(rawBalance)
            .div(new BigNumber(10).pow(decimals))
            .toString();
          
          const value = new BigNumber(amount)
            .times(priceUsd)
            .toString();

          // Skip if below minimum value
          if (config.minValueUsd && new BigNumber(value).isLessThan(config.minValueUsd)) {
            return null;
          }

          return {
            address: mint.toString(),
            symbol: displaySymbol,
            name: displayName,
            rawBalance,
            decimals,
            amount,
            price: priceUsd,
            value
          };
        } catch (e) {
          console.error('Error processing token:', e);
          return null;
        }
      });

      // Wait for all token data and filter out nulls
      const tokenResults = await Promise.all(tokenPromises);
      tokens.push(...tokenResults.filter(Boolean) as PortfolioToken[]);

      // Sort if requested
      if (config.sort) {
        tokens.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          switch (config.sort!.by) {
            case 'value':
              aValue = new BigNumber(a.value).toNumber();
              bValue = new BigNumber(b.value).toNumber();
              break;
            case 'quantity':
              aValue = new BigNumber(a.amount).toNumber();
              bValue = new BigNumber(b.amount).toNumber();
              break;
            case 'price':
              aValue = new BigNumber(a.price).toNumber();
              bValue = new BigNumber(b.price).toNumber();
              break;
            case 'symbol':
              aValue = a.symbol.toLowerCase();
              bValue = b.symbol.toLowerCase();
              break;
            default:
              return 0;
          }

          const order = config.sort!.order === 'asc' ? 1 : -1;
          if (aValue < bValue) return -1 * order;
          if (aValue > bValue) return 1 * order;
          return 0;
        });
      }

      // Calculate totals
      const totalUsd = tokens.reduce(
        (sum, token) => sum.plus(new BigNumber(token.value)),
        new BigNumber(0)
      );

      // Create total calculator function
      const calculateTotal = async (token?: string, source: DexSource = 'all') => {
        // Base response with USD and SOL values
        const response = {
          usd: totalUsd.toString(),
          sol: solPrice > 0 ? totalUsd.div(solPrice).toString() : '0'
        };

        // If specific token requested, calculate that value
        if (token) {
          try {
            let price = 0;

            if (source === 'all') {
              // Get prices from all sources in parallel
              const [pumpFunPrice, jupiterPrice, raydiumPrice] = await Promise.all([
                this.pumpFun.isTokenOnPumpFun(token)
                  .then(async exists => {
                    if (!exists) {
                      console.log('Token not on PumpFun:', token);
                      return 0;
                    }
                    const info = await this.pumpFun.getTokenInfo(token, solPrice);
                    console.log('PumpFun info:', info);
                    return info?.price?.usd || 0;
                  })
                  .catch(err => {
                    console.log('PumpFun error:', err);
                    return 0;
                  }),
                this.getPrice(token)
                  .then(prices => prices.jupiter || 0)
                  .catch(() => 0),
                this.getPrice(token)
                  .then(prices => prices.raydium || 0)
                  .catch(() => 0)
              ]);
              // Use the first non-zero price we find
              price = pumpFunPrice || jupiterPrice || raydiumPrice;
            } else if (source === 'pumpfun') {
              // Get price from PumpFun only
              const pumpFunInfo = await this.pumpFun.getTokenInfo(token, solPrice);
              price = pumpFunInfo?.price?.usd || 0;
            } else {
              // Get price from specified DEX
              const dexPrices = await this.getPrice(token);
              price = dexPrices[source] || 0;
            }
            
            return {
              ...response,
              token: price > 0 ? totalUsd.div(price).toString() : '0'
            };

          } catch {} // Ignore all price fetch errors
          
          // Return 0 if no price found
          return { ...response, token: '0' };
        }

        return response;
      };

      const result: Portfolio = {
        total: calculateTotal,
        tokens,
        timestamp: Date.now()
      };

      return result;

    } catch (e) {
      console.error('Portfolio fetch failed:', e);
      throw new Error('Failed to fetch portfolio: ' + (e as Error).message);
    }
  }

  /**
   * Get portfolio value for any address (read-only)
   * @param address Wallet address or PublicKey
   */
  async getPortfolioValueForAddress(address: string | PublicKey): Promise<ChainPortfolioValue> {
    const portfolio = await this.getPortfolioForAddress(address);
    const totals = await portfolio.total();
    
    // For Solana adapter, we know .sol will always be available
    // but TypeScript doesn't know that, so we need to handle the undefined case
    if (!totals.sol) {
      throw new Error('Failed to get SOL value');
    }
    
    return {
      usd: totals.usd,
      sol: totals.sol
    };
  }

  /**
   * Get portfolio for connected wallet (requires Keypair)
   * @deprecated Use getPortfolioForAddress instead
   */
  async getPortfolio(keypair: Keypair, options: PortfolioOptions = {}): Promise<Portfolio> {
    return this.getPortfolioForAddress(keypair.publicKey, options);
  }

  /**
   * Get portfolio value for connected wallet (requires Keypair)
   * @deprecated Use getPortfolioValueForAddress instead
   */
  async getPortfolioValue(keypair: Keypair): Promise<ChainPortfolioValue> {
    return this.getPortfolioValueForAddress(keypair.publicKey);
  }
} 