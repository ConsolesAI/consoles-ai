import { Connection, Keypair } from "@solana/web3.js";
import { PumpFunProvider } from './pumpfun';
import { 
  TokenPrice, TransferParams, SwapParams, CreateTokenParams, 
  SolanaConfig, SolanaVanityWalletOptions,
  SOLANA_BASE58_CHARS, SOLANA_NETWORKS, SolanaNetwork,
  LAMPORTS_PER_SOL
} from './types';
import { TransactionResult, WalletInfo, BaseChainSDK } from '../types';
import bs58 from 'bs58';

// Internal adapter implementation
class SolanaAdapter implements BaseChainSDK {
  private connection: Connection;
  private readonly apiKey?: string;
  private _keypair?: Keypair;
  private pumpFunProvider?: PumpFunProvider;
  private network: SolanaNetwork;

  constructor(apiKey?: string, config?: SolanaConfig) {
    this.apiKey = apiKey;
    this.network = config?.network || 'mainnet-beta';
    const rpc = config?.rpc || SOLANA_NETWORKS[this.network.toUpperCase() as keyof typeof SOLANA_NETWORKS];
    this.connection = new Connection(rpc);
  }

  // Get current connection
  getConnection(): Connection {
    return this.connection;
  }

  // Get current network
  getNetwork(): SolanaNetwork {
    return this.network;
  }

  // Basic features - no API key needed
  createWallet(): Keypair {
    return Keypair.generate();
  }

  createVanityWallet(options: SolanaVanityWalletOptions = {}): Keypair {
    const { prefix, suffix, contains, caseSensitive = false, maxAttempts = 100000 } = options;
    
    // Validate all patterns are base58
    const patterns = [prefix, suffix, contains].filter(Boolean);
    if (patterns.length === 0) {
      throw new Error('Must specify at least one pattern (prefix, suffix, or contains)');
    }

    const invalidChars = patterns.join('').split('').filter(c => !SOLANA_BASE58_CHARS.includes(c));
    if (invalidChars.length > 0) {
      throw new Error(`Invalid characters for Solana address: ${invalidChars.join('')}. Only base58 allowed: ${SOLANA_BASE58_CHARS}`);
    }

    // Warn about length
    const totalLength = patterns.join('').length;
    if (totalLength > 4) {
      console.warn(`Warning: Total pattern length of ${totalLength} may take a very long time. Consider using 4 or fewer characters total.`);
    }

    // Prepare patterns for matching
    const prepPattern = (p?: string) => caseSensitive ? p : p?.toUpperCase();
    const matchPrefix = prepPattern(prefix);
    const matchSuffix = prepPattern(suffix);
    const matchContains = prepPattern(contains);

    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const wallet = this.createWallet();
      const address = wallet.publicKey.toString();
      const checkAddress = caseSensitive ? address : address.toUpperCase();

      // Check all patterns match
      const prefixOk = !matchPrefix || checkAddress.startsWith(matchPrefix);
      const suffixOk = !matchSuffix || checkAddress.endsWith(matchSuffix);
      const containsOk = !matchContains || checkAddress.includes(matchContains);

      if (prefixOk && suffixOk && containsOk) {
        console.log(`Found matching Solana address after ${attempts} attempts!`);
        return wallet;
      }
    }

    throw new Error(`Could not find matching Solana address after ${maxAttempts} attempts. Try fewer/shorter patterns or increase maxAttempts.`);
  }

  getPrivateKey(wallet: Keypair): string {
    return bs58.encode(wallet.secretKey);
  }

  loadWallet(privateKey: string): Keypair {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  }

  async connect(wallet: Keypair): Promise<WalletInfo> {
    this._keypair = wallet;
    return {
      address: wallet.publicKey.toString(),
      publicKey: wallet.publicKey.toString(),
      network: this.network
    };
  }

  // Basic price fetch - no API key needed
  async getJupiterPrice(address: string): Promise<number> {
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${address}`);
      const data = await response.json();
      return data.data[address]?.price || 0;
    } catch (e) {
      console.error('Jupiter price fetch failed:', e);
      return 0;
    }
  }

  // Helper to check if premium features are available
  private requireApiKey(feature: string): void {
    if (!this.apiKey) {
      throw new Error(`API key required for premium feature: ${feature}. Get one at https://consoles.ai`);
    }
  }

  // Premium features - require API key
  async price(address: string): Promise<TokenPrice[]> {
    this.requireApiKey('Price aggregation');
    const [jupPrice, rayPrice, pumpPrice] = await Promise.all([
      this.getJupiterPrice(address),
      this.getRaydiumPrice(address),
      this.getPumpFunPrice(address)
    ]);
    return [
      { exchange: 'jupiter', price: jupPrice },
      { exchange: 'raydium', price: rayPrice },
      { exchange: 'pumpfun', price: pumpPrice }
    ];
  }

  // Premium price fetches - require API key
  private async getRaydiumPrice(address: string): Promise<number> {
    this.requireApiKey('Raydium price feed');
    try {
      const response = await fetch(`https://api-v3.raydium.io/price`);
      const data = await response.json();
      return data.data?.[address] || 0;
    } catch (e) {
      console.error('Raydium price fetch failed:', e);
      return 0;
    }
  }

  private async getPumpFunPrice(address: string): Promise<number> {
    this.requireApiKey('PumpFun integration');
    if (!this.pumpFunProvider) {
      console.error('PumpFun provider not initialized');
      return 0;
    }
    try {
      const info = await this.pumpFunProvider.getTokenInfo(address, 20);
      return info.price.usd;
    } catch (e) {
      console.error('PumpFun price fetch failed:', e);
      return 0;
    }
  }

  // Basic transfer - no API key needed
  async transfer({ token, to, amount, from }: TransferParams): Promise<TransactionResult> {
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement basic transfer using this.connection
    console.log('Transfer:', { token, to, amount, from: from?.publicKey.toString() });
    return { success: true, signature: 'mock-signature' };
  }

  // Premium features - require API key
  async swap({ from, to, dex, slippage }: SwapParams): Promise<TransactionResult> {
    this.requireApiKey('DEX aggregation');
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement swap using this.connection and dex APIs
    console.log('Swap:', { from, to, dex, slippage });
    return { success: true, signature: 'mock-signature' };
  }

  async createToken({ metadata, buyAmount }: CreateTokenParams): Promise<TransactionResult> {
    this.requireApiKey('Token creation');
    if (!this._keypair) throw new Error('Wallet not connected');
    // TODO: Implement token creation using this.connection
    console.log('Create token:', { metadata, buyAmount });
    return { success: true, signature: 'mock-signature' };
  }
}

export default SolanaAdapter; 