import { Connection, Keypair, ConnectionConfig, PublicKey, Transaction } from "@solana/web3.js";
import { 
  TokenPrice, SwapParams, CreateTokenParams, 
  SolanaConfig, CreateWalletInput, WalletResult,
  SOLANA_NETWORKS, SolanaNetwork,
  TokenSymbol
} from './types';
import { TransactionResult, WalletInfo, BaseChainSDK, Portfolio, PortfolioOptions, TrustScoreResult, Blockchain, ChainPortfolioValue } from '../types';
import { TokenTrustScore } from '../trust-score';
import { PortfolioManager } from './portfolio';
import { DexManager } from './dex';
import { TransactionManager } from './transaction';
import { WalletManager } from './wallet';
import { TokenManager, SendConfig } from './token';

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
 * Factory for creating and caching manager instances
 */
class ManagerFactory {
  private managers: Map<string, any> = new Map();
  
  constructor(
    private connection: Connection,
    private getConnection: (rpc?: string) => Connection,
    private getPrice: (address: string) => Promise<TokenPrice>
  ) {}

  /**
   * Get or create a manager instance
   */
  get<T>(key: string, factory: () => T): T {
    if (!this.managers.has(key)) {
      this.managers.set(key, factory());
    }
    return this.managers.get(key);
  }

  /**
   * Create all manager instances with proper dependency injection
   */
  createManagers() {
    // Create managers in dependency order
    const transaction = this.get('transaction', () => 
      new TransactionManager(this.getConnection)
    );

    const wallet = this.get('wallet', () => 
      new WalletManager()
    );

    const token = this.get('token', () => 
      new TokenManager(
        this.getConnection,
        transaction.createTransactionResult.bind(transaction),
        this.getPrice
      )
    );

    const dex = this.get('dex', () => 
      new DexManager(
        this.connection,
        transaction.createTransactionResult.bind(transaction)
      )
    );

    return {
      transaction,
      wallet,
      token,
      dex,
      portfolio: (getPrice: (address: string) => Promise<TokenPrice>) =>
        this.get('portfolio', () => 
          new PortfolioManager(this.connection, getPrice)
        )
    };
  }
}

/**
 * Solana blockchain adapter implementing the universal chain SDK interface
 */
class SolanaAdapter implements BaseChainSDK {
  private connection: Connection;
  private _keypair?: Keypair;
  private network: SolanaNetwork;
  private managers: ReturnType<ManagerFactory['createManagers']>;
  private _trustScore?: TokenTrustScore;

  constructor(config: SolanaConfig = DEFAULT_CONFIG) {
    // Parse config
    const finalConfig = this.parseConfig(config);

    // Set network and connection
    this.network = finalConfig.network;
    this.connection = this.createConnection(finalConfig);

    // Initialize manager factory
    const factory = new ManagerFactory(
      this.connection,
      (rpc?: string) => this.getConnectionForTransaction(rpc),
      this.getPrice.bind(this)
    );

    // Create managers with dependencies
    this.managers = factory.createManagers();
  }

  private parseConfig(config: SolanaConfig): InternalConfig {
    let finalConfig: InternalConfig = { ...DEFAULT_CONFIG };
    
    if (typeof config === 'string') {
      const networks = ['mainnet-beta', 'testnet', 'devnet'];
      if (networks.includes(config.toLowerCase())) {
        finalConfig.network = config as SolanaNetwork;
      } else {
        finalConfig.rpc = config;
      }
    } else if (typeof config === 'object') {
      finalConfig = {
        ...finalConfig,
        ...config as Partial<InternalConfig>
      };
    }

    return finalConfig;
  }

  private createConnection(config: InternalConfig): Connection {
    const networkKey = config.network === 'mainnet-beta' ? 'MAINNET' : config.network.toUpperCase();
    const rpcUrl = config.rpc || SOLANA_NETWORKS[networkKey as keyof typeof SOLANA_NETWORKS];
    
    const connectionConfig: ConnectionConfig = {
      commitment: config.commitment,
      confirmTransactionInitialTimeout: config.confirmTransactionInitialTimeout
    };
    return new Connection(rpcUrl, connectionConfig);
  }

  private getConnectionForTransaction(rpcOverride?: string): Connection {
    if (!rpcOverride) return this.connection;
    
    const connectionConfig: ConnectionConfig = {
      commitment: DEFAULT_CONFIG.commitment,
      confirmTransactionInitialTimeout: DEFAULT_CONFIG.confirmTransactionInitialTimeout
    };
    return new Connection(rpcOverride, connectionConfig);
  }

  getConnection(): Connection {
    return this.connection;
  }

  getNetwork(): SolanaNetwork {
    return this.network;
  }

  private getAddressString(input: string | PublicKey | Keypair): string {
    if (typeof input === 'string') return input;
    if (input instanceof PublicKey) return input.toString();
    return input.publicKey.toString();
  }

  // Wallet Management
  async createWallet(input?: CreateWalletInput): Promise<WalletResult> {
    return this.managers.wallet.createWallet(input);
  }

  getPrivateKey(wallet: Keypair): string {
    return this.managers.wallet.getPrivateKey(wallet);
  }

  /**
   * Connect a wallet to use for transactions
   * @param input Private key (string) or Keypair
   */
  async connect(input: string | Keypair): Promise<WalletInfo> {
    const wallet = typeof input === 'string' 
      ? this.managers.wallet.loadWallet(input)
      : input;

    this._keypair = wallet;
    const address = this.getAddressString(wallet);
    return {
      address,
      publicKey: address,  // Keep for backwards compatibility
      network: this.network
    };
  }

  // Token Operations
  async getPrice(address: string, dex?: 'jupiter' | 'raydium'): Promise<TokenPrice> {
    return this.managers.dex.getPrice(address, dex);
  }

  async send(params: SendConfig): Promise<TransactionResult> {
    // Allow sending from different wallet without connecting
    const senderWallet = params.from || this._keypair;
    if (!senderWallet) throw new Error('No wallet provided - either connect one or pass in params.from');

    return this.managers.token.send({ 
      ...params, 
      from: senderWallet
    });
  }

  async swap(params: SwapParams): Promise<TransactionResult> {
    // Allow swapping from different wallet without connecting
    const senderWallet = params.wallet || this._keypair;
    if (!senderWallet) throw new Error('No wallet provided - either connect one or pass in params.wallet');
    
    return this.managers.dex.swap({
      ...params,
      wallet: senderWallet
    });
  }

  async createToken({ metadata, buyAmount }: CreateTokenParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement token creation
    console.log('Create token:', { metadata, buyAmount });
    const signature = 'mock-signature';
    return this.managers.transaction.createTransactionResult(signature);
  }

  // Trust Score
  get trustScore(): TokenTrustScore {
    if (!this._trustScore) {
      this._trustScore = new TokenTrustScore(this.connection);
    }
    return this._trustScore;
  }

  async getTrustScore(tokenAddress: string): Promise<TrustScoreResult> {
    return this.trustScore.calculateScore(tokenAddress, 'solana');
  }

  // Portfolio Management
  portfolio(address?: string | Keypair, options: PortfolioOptions = {}) {
    // Get address from input or connected wallet
    const walletAddress = address 
      ? this.getAddressString(address)
      : this._keypair ? this.getAddressString(this._keypair) : undefined;

    if (!walletAddress) {
      throw new Error('No wallet connected or address provided');
    }

    const manager = this.managers.portfolio(this.getPrice.bind(this));
    return manager.getPortfolioForAddress(walletAddress, options);
  }

  async value(address?: string | Keypair) {
    // Get address from input or connected wallet
    const walletAddress = address 
      ? this.getAddressString(address)
      : this._keypair ? this.getAddressString(this._keypair) : undefined;

    if (!walletAddress) {
      throw new Error('No wallet connected or address provided');
    }

    const manager = this.managers.portfolio(this.getPrice.bind(this));
    const totals = await manager.getPortfolioValueForAddress(walletAddress);
    
    // Return chain-specific response
    return {
      usd: totals.usd,
      sol: totals.sol
    };
  }

  // Deprecated methods for backward compatibility
  async getPortfolio(options: PortfolioOptions = {}): Promise<Portfolio> {
    if (!this._keypair) throw new Error('Wallet not connected');
    return this.portfolio(this._keypair, options);
  }

  async getPortfolioValue(): Promise<ChainPortfolioValue> {
    if (!this._keypair) throw new Error('Wallet not connected');
    return this.value(this._keypair);
  }

  /**
   * Check status of any transaction
   */
  async status(txid: string): Promise<'processed' | 'confirmed' | 'finalized'> {
    const status = await this.connection.getSignatureStatus(txid);
    return status?.value?.confirmationStatus || 'processed';
  }

  /**
   * Send tokens to an address
   */
}

export default SolanaAdapter; 