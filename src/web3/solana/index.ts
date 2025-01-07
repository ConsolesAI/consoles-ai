import { Connection, Keypair, ConnectionConfig } from "@solana/web3.js";
import { 
  TokenPrice, TransferParams, SwapParams, CreateTokenParams, 
  SolanaConfig, WalletOptions, CreateWalletInput, WalletResult,
  SOLANA_BASE58_CHARS, SOLANA_NETWORKS, SolanaNetwork
} from './types';
import { TransactionResult, WalletInfo, BaseChainSDK } from '../types';
import bs58 from 'bs58';

/** Internal configuration used by the adapter */
interface InternalConfig {
  network: SolanaNetwork;
  rpc?: string;
  commitment: 'confirmed';
  priorityFee: number;
  computeUnits: number;
  skipPreflight: boolean;
  maxRetries: number;
  confirmTransactionInitialTimeout: number;
  preflightCommitment: 'processed';
}

const DEFAULT_CONFIG: InternalConfig = {
  network: 'mainnet-beta',
  commitment: 'confirmed',
  priorityFee: 0,
  computeUnits: 200_000,
  skipPreflight: false,
  maxRetries: 3,
  confirmTransactionInitialTimeout: 120_000,
  preflightCommitment: 'processed'
};

/**
 * Implementation of the Solana blockchain adapter.
 * Handles wallet management, transactions, and token operations.
 * See type definitions for detailed API documentation.
 */
class SolanaAdapter implements BaseChainSDK {
  private connection: Connection;
  private _keypair?: Keypair;
  private network: SolanaNetwork;
  private jupiterBaseUrl = 'https://price.jup.ag/v4';

  constructor(config: SolanaConfig = DEFAULT_CONFIG) {
    // Parse config
    let finalConfig: InternalConfig = { ...DEFAULT_CONFIG };
    
    if (typeof config === 'string') {
      // Handle network name or RPC URL
      const networks = ['mainnet-beta', 'testnet', 'devnet'];
      if (networks.includes(config.toLowerCase())) {
        // It's a network name
        finalConfig.network = config as SolanaNetwork;
      } else {
        // It's an RPC URL
        finalConfig.rpc = config;
      }
    } else if (typeof config === 'object') {
      // Merge with defaults
      finalConfig = {
        ...finalConfig,
        ...config as Partial<InternalConfig>
      };
    }

    // Set network and connection
    this.network = finalConfig.network;
    const rpcUrl = finalConfig.rpc || SOLANA_NETWORKS[this.network.toUpperCase() as keyof typeof SOLANA_NETWORKS];
    
    // Initialize connection with all config options
    const connectionConfig: ConnectionConfig = {
      commitment: finalConfig.commitment,
      confirmTransactionInitialTimeout: finalConfig.confirmTransactionInitialTimeout
    };
    this.connection = new Connection(rpcUrl, connectionConfig);
  }

  /** Get the current Solana connection instance */
  getConnection(): Connection {
    return this.connection;
  }

  /** Get the current network name */
  getNetwork(): SolanaNetwork {
    return this.network;
  }

  /**
   * Creates a new Solana wallet with optional vanity address pattern.
   * See {@link CreateWalletInput} for input options.
   * 
   * @example
   * ```typescript
   * // Create regular wallet
   * const { wallet } = await solana.createWallet();
   * 
   * // Create vanity wallet
   * const { wallet: vanity } = await solana.createWallet('CAFE');
   * ```
   */
  async createWallet(input?: CreateWalletInput): Promise<WalletResult> {
    // Simple wallet - no pattern
    if (!input) {
      return {
        wallet: Keypair.generate(),
        attempts: 1
      };
    }

    // Normalize input to WalletOptions
    const options: WalletOptions = typeof input === 'string' 
      ? { pattern: input }
      : input;
    
    const { 
      pattern,
      timeout = 30000,  // 30 seconds default
      strict = true 
    } = options;
    
    // Parse pattern parts
    const [prefix, suffix] = pattern.split('*');
    
    // Validate all parts are base58
    const parts = [prefix, suffix].filter(Boolean);
    const invalidChars = parts.join('').split('').filter(c => !SOLANA_BASE58_CHARS.includes(c));
    if (invalidChars.length > 0) {
      throw new Error(`Invalid characters for Solana address: ${invalidChars.join('')}. Only base58 allowed: ${SOLANA_BASE58_CHARS}`);
    }

    // Warn about length
    const totalLength = parts.join('').length;
    if (totalLength > 4) {
      console.warn(`Warning: Pattern length of ${totalLength} characters may take a while. Consider using 4 or fewer characters.`);
    }

    let attempts = 0;
    let bestMatch: { wallet: Keypair; score: number } | null = null;
    const startTime = Date.now();

    while (true) {
      attempts++;
      const wallet = Keypair.generate();
      const address = wallet.publicKey.toString();

      // Check pattern matches
      const prefixOk = !prefix || address.startsWith(prefix);
      const suffixOk = !suffix || address.endsWith(suffix);

      // Perfect match
      if (prefixOk && suffixOk) {
        if (attempts > 1) {
          console.log(`Found matching address after ${attempts.toLocaleString()} attempts!`);
        }
        return { wallet, attempts };
      }

      // Track best partial match
      const score = (prefixOk ? prefix?.length || 0 : 0) + (suffixOk ? suffix?.length || 0 : 0);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { wallet, score };
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        if (strict) {
          throw new Error(`Timeout after ${attempts.toLocaleString()} attempts (${timeout}ms). Try a shorter pattern or increase timeout.`);
        }
        if (bestMatch) {
          console.log(`Timeout reached. Returning best match (score: ${bestMatch.score}/${totalLength}) after ${attempts.toLocaleString()} attempts.`);
          return { wallet: bestMatch.wallet, attempts };
        }
        throw new Error('No matches found within timeout.');
      }

      // Simple backoff if taking too long
      if (attempts % 100000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /** Get the base58-encoded private key from a wallet */
  getPrivateKey(wallet: Keypair): string {
    return bs58.encode(wallet.secretKey);
  }

  /** Load a wallet from a base58-encoded private key */
  loadWallet(privateKey: string): Keypair {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  }

  /** Connect a wallet to use for transactions */
  async connect(wallet: Keypair): Promise<WalletInfo> {
    this._keypair = wallet;
    return {
      address: wallet.publicKey.toString(),
      publicKey: wallet.publicKey.toString(),
      network: this.network
    };
  }

  /**
   * Get token price from one or all supported DEXs.
   * See {@link TokenPrice} for return type details.
   * 
   * @example
   * ```typescript
   * const prices = await solana.getPrice(tokenAddress);
   * console.log('Jupiter price:', prices.jupiter);
   * ```
   */
  async getPrice(address: string, dex?: 'jupiter' | 'raydium'): Promise<TokenPrice> {
    const prices: TokenPrice = {};

    try {
      // Jupiter price (fastest/most reliable)
      const jupiterUrl = `${this.jupiterBaseUrl}/price?ids=${address}`;
      const jupiterRes = await fetch(jupiterUrl);
      const jupiterData = await jupiterRes.json();
      prices.jupiter = Number(jupiterData.data[address]?.price || 0);

      // Only get Raydium if specifically requested or no DEX specified
      if (!dex || dex === 'raydium') {
        const raydiumRes = await fetch('https://api-v3.raydium.io/price');
        const raydiumData = await raydiumRes.json();
        prices.raydium = Number(raydiumData.data?.[address] || 0);
      }

      return prices;
    } catch (e) {
      console.error('Price fetch failed:', e);
      return prices;  // Return whatever prices we got
    }
  }

  /**
   * Transfer tokens between wallets.
   * See {@link TransferParams} for parameter details.
   * 
   * @example
   * ```typescript
   * const tx = await solana.transfer({
   *   token: 'SOL',
   *   to: recipientAddress,
   *   amount: '0.1'
   * });
   * await tx.confirm();
   * ```
   */
  async transfer({ token = 'SOL', to, amount, from }: TransferParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement basic transfer using this.connection
    console.log('Transfer:', { token, to, amount, from: from?.publicKey.toString() });
    
    const signature = 'mock-signature';
    const connection = this.connection;
    
    return {
      signature,
      async confirm() {
        await connection.confirmTransaction(signature, 'confirmed');
      },
      async wait(level) {
        await connection.confirmTransaction(signature, level);
      },
      async status() {
        const status = await connection.getSignatureStatus(signature);
        return status?.value?.confirmationStatus || 'processed';
      }
    };
  }

  /**
   * Swap tokens using the best available DEX route.
   * See {@link SwapParams} for parameter details.
   * 
   * @example
   * ```typescript
   * const tx = await solana.swap({
   *   from: { token: 'SOL', amount: '0.1' },
   *   to: { token: 'USDC' }
   * });
   * await tx.confirm();
   * ```
   */
  async swap({ from, to, slippage }: SwapParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement swap using this.connection and dex APIs
    console.log('Swap:', { from, to, slippage });
    
    const signature = 'mock-signature';
    const connection = this.connection;
    
    return {
      signature,
      async confirm() {
        await connection.confirmTransaction(signature, 'confirmed');
      },
      async wait(level) {
        await connection.confirmTransaction(signature, level);
      },
      async status() {
        const status = await connection.getSignatureStatus(signature);
        return status?.value?.confirmationStatus || 'processed';
      }
    };
  }

  /**
   * Create a new token with optional metadata.
   * See {@link CreateTokenParams} for parameter details.
   * 
   * @example
   * ```typescript
   * const tx = await solana.createToken({
   *   metadata: {
   *     name: 'My Token',
   *     symbol: 'MTK',
   *     description: 'My custom token'
   *   }
   * });
   * await tx.confirm();
   * ```
   */
  async createToken({ metadata, buyAmount }: CreateTokenParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement token creation using this.connection
    console.log('Create token:', { metadata, buyAmount });
    
    const signature = 'mock-signature';
    const connection = this.connection;
    
    return {
      signature,
      async confirm() {
        await connection.confirmTransaction(signature, 'confirmed');
      },
      async wait(level) {
        await connection.confirmTransaction(signature, level);
      },
      async status() {
        const status = await connection.getSignatureStatus(signature);
        return status?.value?.confirmationStatus || 'processed';
      }
    };
  }
}

export default SolanaAdapter; 