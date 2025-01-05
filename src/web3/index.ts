import { SolanaSDK } from './solana';
import { Blockchain } from './types';
import { Keypair } from "@solana/web3.js";
import bs58 from 'bs58';

export class Web3SDK {
  solana: SolanaSDK;

  constructor(apiKey: string) {
    this.solana = new SolanaSDK(apiKey);
  }

  getSDK(chain: Blockchain) {
    switch (chain) {
      case 'solana':
        return this.solana;
      default:
        throw new Error(`Unsupported blockchain: ${chain}`);
    }
  }

  // Create new wallet
  createWallet() {
    return Keypair.generate();
  }

  // Get private key (works in any Solana wallet)
  getPrivateKey(wallet: Keypair) {
    return bs58.encode(wallet.secretKey);
  }

  // Load wallet from private key
  loadWallet(privateKey: string) {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  }
}

// Only export base types from web3/types
export * from './types';
// Export Solana-specific types and utils
export type {
  TokenSymbol,
  DEX,
  TokenPrice,
  PriceBuilder,
  TransferParams,
  SwapParams,
  TokenMetadata,
  CreateTokenParams,
  SolanaSDK
} from './solana/types';

// Export Solana utils
export { Keypair };