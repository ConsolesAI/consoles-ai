import { Connection, Keypair, PublicKey, ParsedAccountData, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { TransactionResult } from '../types';
import { TokenSymbol, COMMON_TOKENS, TokenPrice } from './types';
import BigNumber from 'bignumber.js';

// Compute unit program ID
const COMPUTE_BUDGET_ID = new PublicKey('ComputeBudget111111111111111111111111111111');

export interface SendConfig {
  // Required: Basic transfer info
  to: string;
  amount: string | number;
  from?: Keypair;
  token?: TokenSymbol;

  // Optional: Transaction config
  config?: {
    // Contract interaction
    programId?: string;     // Contract to interact with (if different from 'to')
    data?: Buffer;         // Contract instruction data (e.g. "stake", "unstake")
    
    // Transaction settings
    slippage?: string;     // Slippage tolerance (e.g. "1" for 1%)
    priorityFee?: number;  // Priority fee (in micro-lamports)
    computeUnits?: number; // Compute unit limit
    skipPreflight?: boolean;
    rpc?: string;
  }
}

export class TokenManager {
  constructor(
    private getConnection: (rpcOverride?: string) => Connection,
    private createTransactionResult: (signature: string, rpcOverride?: string) => TransactionResult,
    private getPrice: (address: string) => Promise<TokenPrice>
  ) {}

  /**
   * Send tokens/SOL to any address with optional settings
   * 
   * @example
   * ```typescript
   * // Simple transfer
   * await send({ 
   *   to: "address", 
   *   amount: "1" 
   * });
   * 
   * // Contract interaction (e.g. staking)
   * await send({
   *   to: "contract",
   *   amount: "1",
   *   token: "USDC",
   *   config: {
   *     data: Buffer.from("..."),  // encoded "stake" function
   *     slippage: "1"  // 1% slippage protection
   *   }
   * });
   * 
   * // High priority transaction
   * await send({
   *   to: "address",
   *   amount: "1",
   *   config: {
   *     priorityFee: 100000
   *   }
   * });
   * ```
   */
  async send(params: SendConfig): Promise<TransactionResult> {
    const connection = this.getConnection(params.config?.rpc);
    
    const {
      token = 'SOL',
      to,
      amount,
      from,
      config = {}
    } = params;

    // Handle USD amounts
    let tokenAmount = amount.toString();
    if (tokenAmount.startsWith('$')) {
      const usdAmount = parseFloat(tokenAmount.slice(1));
      const tokenAddress = token === 'SOL' ? 'SOL' : 
        (token in COMMON_TOKENS ? COMMON_TOKENS[token as keyof typeof COMMON_TOKENS] : token);
      const price = await this.getPrice(tokenAddress);
      if (!price.jupiter) throw new Error('Could not get token price');
      tokenAmount = (usdAmount / price.jupiter).toString();
    }

    const {
      programId,
      data,
      slippage,
      priorityFee,
      computeUnits,
      skipPreflight = false
    } = config;

    if (!from) throw new Error('Sender wallet not provided');
    
    try {
      let signature: string;
      const toPubkey = new PublicKey(to);
      const programPubkey = programId ? new PublicKey(programId) : toPubkey;
      const tx = new Transaction();

      // Add compute unit instructions if specified
      if (computeUnits) {
        const computeUnitBuffer = Buffer.alloc(4);
        computeUnitBuffer.writeUInt32LE(computeUnits);

        tx.add(
          new TransactionInstruction({
            keys: [],
            programId: COMPUTE_BUDGET_ID,
            data: Buffer.concat([
              Buffer.from([0x02]), // Set compute unit limit instruction
              computeUnitBuffer
            ])
          })
        );
      }

      if (priorityFee) {
        const priorityFeeBuffer = Buffer.alloc(8);
        priorityFeeBuffer.writeBigUInt64LE(BigInt(priorityFee));

        tx.add(
          new TransactionInstruction({
            keys: [],
            programId: COMPUTE_BUDGET_ID,
            data: Buffer.concat([
              Buffer.from([0x03]), // Set compute unit price instruction
              priorityFeeBuffer
            ])
          })
        );
      }

      if (token === 'SOL') {
        // Handle native SOL transfer
        tx.add(
          SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey,
            lamports: new BigNumber(tokenAmount)
              .times(LAMPORTS_PER_SOL)
              .integerValue()
              .toNumber()
          })
        );

        // Add optional instruction data for contract interactions
        if (data) {
          tx.add(
            new TransactionInstruction({
              keys: [
                { pubkey: from.publicKey, isSigner: true, isWritable: true },
                { pubkey: toPubkey, isSigner: false, isWritable: true }
              ],
              programId: programPubkey,
              data
            })
          );
        }

        signature = await connection.sendTransaction(
          tx,
          [from],
          { 
            skipPreflight,
            maxRetries: 3
          }
        );
      } else {
        // Handle SPL token transfer
        const mint = COMMON_TOKENS[token as keyof typeof COMMON_TOKENS] || token;
        const mintPubkey = new PublicKey(mint);
        
        // Get token decimals
        const tokenInfo = await connection.getParsedAccountInfo(mintPubkey);
        const decimals = (tokenInfo.value?.data as ParsedAccountData)?.parsed?.info?.decimals || 0;
        
        // Get/create token accounts
        const sourceATA = await getOrCreateAssociatedTokenAccount(
          connection,
          from,
          mintPubkey,
          from.publicKey
        );
        
        const destATA = await getOrCreateAssociatedTokenAccount(
          connection,
          from,
          mintPubkey,
          toPubkey
        );

        // Calculate amount with slippage if provided
        let transferAmount = new BigNumber(tokenAmount)
          .times(new BigNumber(10).pow(decimals));

        if (slippage) {
          const slippageMultiplier = new BigNumber(1).minus(
            new BigNumber(slippage).div(100)
          );
          transferAmount = transferAmount.times(slippageMultiplier);
        }

        // Create transfer instruction
        tx.add(
          createTransferInstruction(
            sourceATA.address,
            destATA.address,
            from.publicKey,
            transferAmount.integerValue().toNumber()
          )
        );

        // Add optional instruction data for contract interactions
        if (data) {
          tx.add(
            new TransactionInstruction({
              keys: [
                { pubkey: from.publicKey, isSigner: true, isWritable: true },
                { pubkey: toPubkey, isSigner: false, isWritable: true },
                { pubkey: sourceATA.address, isSigner: false, isWritable: true },
                { pubkey: destATA.address, isSigner: false, isWritable: true }
              ],
              programId: programPubkey,
              data
            })
          );
        }

        signature = await connection.sendTransaction(
          tx,
          [from],
          { 
            skipPreflight,
            maxRetries: 3
          }
        );
      }

      return this.createTransactionResult(signature, params.config?.rpc);

    } catch (e) {
      console.error('Token operation failed:', e);
      throw new Error('Token operation failed: ' + (e as Error).message);
    }
  }
} 