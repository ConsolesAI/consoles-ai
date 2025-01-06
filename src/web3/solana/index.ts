import { Connection, Keypair } from "@solana/web3.js";
import { PumpFunProvider } from './pumpfun';
import { TokenPrice, TransferParams, SwapParams, CreateTokenParams, PriceBuilder, SolanaConfig } from './types';
import { TransactionResult, WalletInfo, BaseChainSDK } from '../types';

// Internal adapter implementation
class SolanaAdapter implements BaseChainSDK {
  private connection: Connection;
  private readonly apiKey?: string;
  private _keypair?: Keypair;
  private pumpFunProvider?: PumpFunProvider;

  constructor(apiKey?: string, config?: SolanaConfig) {
    this.apiKey = apiKey;
    // Default to public RPC if no API key
    this.connection = new Connection(config?.rpcEndpoint || 'https://api.mainnet-beta.solana.com');
  }

  // Configure RPC endpoint
  setRpcEndpoint(endpoint: string) {
    this.connection = new Connection(endpoint);
    return this;
  }

  // Get current connection
  getConnection(): Connection {
    return this.connection;
  }

  // Helper to check if premium features are available
  private requireApiKey(feature: string): void {
    if (!this.apiKey) {
      throw new Error(`API key required for premium feature: ${feature}. Get one at https://consoles.ai`);
    }
  }

  // Basic features - no API key needed
  async connect(wallet: Keypair): Promise<WalletInfo> {
    this._keypair = wallet;
    return {
      address: wallet.publicKey.toString(),
      publicKey: wallet.publicKey.toString()
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

  // Premium features - require API key
  price(address: string): PriceBuilder {
    this.requireApiKey('Price aggregation');
    return {
      jupiter: this.getJupiterPrice(address),
      raydium: this.getRaydiumPrice(address),
      pumpfun: this.getPumpFunPrice(address),
      async then(resolve: (prices: TokenPrice[]) => void) {
        const [jupPrice, rayPrice, pumpPrice] = await Promise.all([
          this.jupiter,
          this.raydium,
          this.pumpfun
        ]);
        resolve([
          { exchange: 'jupiter', price: jupPrice },
          { exchange: 'raydium', price: rayPrice },
          { exchange: 'pumpfun', price: pumpPrice }
        ]);
      }
    };
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