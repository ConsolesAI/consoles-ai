import { Keypair } from "@solana/web3.js";
import { CreateWalletInput, WalletOptions, WalletResult, SOLANA_BASE58_CHARS } from './types';
import bs58 from 'bs58';

export class WalletManager {
  /**
   * Creates a new Solana wallet with optional vanity address pattern.
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
} 