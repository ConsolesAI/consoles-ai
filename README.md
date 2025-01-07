# Consoles

Simple solutions for powerful features. Built for developers and AI agents.

## Installation
```bash
npm install consoles-ai
```

## Quick Start
```typescript
import { Consoles } from 'consoles-ai';

// Initialize SDK with your API key
const consoles = new Consoles('your-api-key');
```

## Available Products

### Extract API (Available Now)
Transform any content into structured data with AI. Supports text, PDFs, audio, video, and more.

```typescript
import { z } from 'zod';

// Example 1: Simple text extraction with Zod schema
const productSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
  inStock: z.boolean().optional(),
});

const textResult = await consoles.extract({
  type: 'text',
  content: `
    New iPhone 15 Pro
    Price: $999
    Experience the most powerful iPhone ever.
    Currently available in all stores.
  `,
  schema: productSchema
});

// Example 2: Process PDF from URL
const pdfSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string()
  })),
  totalPages: z.number()
});

const pdfResult = await consoles.extract({
  type: 'file',
  content: {
    url: 'https://example.com/document.pdf',
    mimeType: 'application/pdf'
  },
  schema: pdfSchema,
  prompt: 'Extract the main sections and content'
});

// Example 3: Simple string extraction (shorthand)
const summary = await consoles.extract(
  'Extract key points from this text...'
);
```

### Web3 SDK (Available Now)
Blockchain integration for Solana with wallet management, price feeds, and DEX interactions.

```typescript
// Initialize with default mainnet RPC
const solana = consoles.web3.solana();

// Use official devnet
const devnet = consoles.web3.solana('devnet');

// Use custom RPC
const custom = consoles.web3.solana({
  rpc: 'https://your-rpc.com',
  network: 'devnet'
});

// Create and manage wallets
const { wallet } = await solana.createWallet();

// Create vanity wallet (simple)
const vanity = await solana.createWallet('CAFE');  // Must start with CAFE

// Create vanity wallet (with options)
const custom = await solana.createWallet({
  pattern: '*DEAD',   // Must end with DEAD
  timeout: 60000,     // 60 seconds (default: 30s)
  strict: false       // Return best match if timeout (default: true)
});

// Pattern matching options
await solana.createWallet('CAFE');     // Must start with CAFE
await solana.createWallet('*DEAD');    // Must end with DEAD
await solana.createWallet('CAFE*XYZ'); // Start with CAFE, end with XYZ

// Save/load wallets
const privateKey = solana.getPrivateKey(wallet);
const loadedWallet = solana.loadWallet(privateKey);
await solana.connect(loadedWallet);

// Get token prices from multiple DEXs
const USDC = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const prices = await solana.getPrice(USDC);
console.log('Jupiter price:', prices.jupiter);
console.log('Raydium price:', prices.raydium);

// Transfer SOL with different confirmation levels
const tx = await solana.transfer({
  to: 'address',
  amount: '0.1',  // SOL
  priorityFee: 50_000  // Optional: higher priority
});

// Quick confirmation (most common)
await tx.confirm();

// Wait for finality (critical transactions)
await tx.wait('finalized');

// Check status anytime
const status = await tx.status();  // 'processed' | 'confirmed' | 'finalized'

// Swap tokens with slippage protection
const swapTx = await solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' },
  slippage: '1'  // 1% slippage
});

// Wait with timeout
await swapTx.confirm({ timeout: 60000 });  // 1 minute timeout
```

### Browser Infrastructure (Coming Soon)
Launch and control Chrome or Firefox browsers in the cloud. Perfect for:
- Web scraping and data collection
- Automated testing and monitoring
- AI agents that interact with web interfaces

### Compute (Coming Soon)
Execute code and run containers programmatically:
- Run LLM generated code in secure sandboxes
- Deploy Docker containers
- Access high-performance GPUs for ML/AI workloads
- Control remote machines with real-time access

### Storage (Coming Soon)
Fast, versioned storage optimized for large files and datasets:
- Store and version ML models
- Manage training datasets
- Cache AI computation results
- Built-in CDN and access controls

### Tools Platform (Coming Soon)
Deploy and manage custom functions that run on our edge network:
- Create custom functions for LLMs
- Build AI agent tools and actions
- Deploy serverless API endpoints

## Links

[Documentation](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [Support](mailto:support@consoles.ai)
