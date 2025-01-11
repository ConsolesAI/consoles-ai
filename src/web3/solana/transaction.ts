import { Connection } from "@solana/web3.js";
import { TransactionResult } from '../types';

export class TransactionManager {
  constructor(private getConnection: (rpcOverride?: string) => Connection) {}

  /**
   * Create a transaction result object with confirmation methods
   */
  createTransactionResult(signature: string, rpcOverride?: string): TransactionResult {
    const connection = this.getConnection(rpcOverride);
    
    return {
      id: signature,
      async confirm() {
        // Check initial status
        const initialStatus = await connection.getSignatureStatus(signature);
        if (initialStatus?.value?.confirmationStatus === 'confirmed' || 
            initialStatus?.value?.confirmationStatus === 'finalized') {
          return;
        }

        // Gentle polling with increasing intervals
        const intervals = [1000, 2000, 3000]; // 1s, 2s, 3s
        for (const interval of intervals) {
          await new Promise(r => setTimeout(r, interval));
          const status = await connection.getSignatureStatus(signature);
          if (status?.value?.confirmationStatus === 'confirmed' || 
              status?.value?.confirmationStatus === 'finalized') {
            return;
          }
        }
        
        // If still not confirmed, wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
      },
      async wait(level) {
        // Check initial status
        const initialStatus = await connection.getSignatureStatus(signature);
        if (initialStatus?.value?.confirmationStatus === level ||
            (level !== 'finalized' && initialStatus?.value?.confirmationStatus === 'finalized')) {
          return;
        }

        // Gentle polling with increasing intervals
        const intervals = [1000, 2000, 3000]; // 1s, 2s, 3s
        for (const interval of intervals) {
          await new Promise(r => setTimeout(r, interval));
          const status = await connection.getSignatureStatus(signature);
          if (status?.value?.confirmationStatus === level ||
              (level !== 'finalized' && status?.value?.confirmationStatus === 'finalized')) {
            return;
          }
        }
        
        // If still not at desired level, wait for confirmation
        await connection.confirmTransaction(signature, level);
      },
      async status() {
        const status = await connection.getSignatureStatus(signature);
        return status?.value?.confirmationStatus || 'processed';
      }
    };
  }
} 