# Consoles

Simple solutions for powerful features. Built for developers and AI agents.

## Installation
```bash
npm install consoles-ai
```

## Quick Start
```typescript
import { Consoles } from 'consoles-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize SDK with your API key
const consoles = new Consoles(process.env.CONSOLES_API_KEY);
```

## Available Products

### Extract
Transform any content into structured data with AI. Supports text, PDFs, audio, video, and more.

```typescript
import { Consoles } from 'consoles-ai';
import { z } from 'zod';

// Initialize SDK with your API key
const consoles = new Consoles('your-api-key');

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
    Experience the most powerful iPhone ever with revolutionary A17 Pro chip.
    Currently available in all stores.
  `,
  schema: productSchema
});

// Example 2: Process PDF from file
const fileSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string()
  })),
  totalPages: z.number()
});

const fileResult = await consoles.extract({
  type: 'file',
  content: {
    data: 'base64EncodedFileContent',
    mimeType: 'application/pdf'
  },
  schema: fileSchema,
  prompt: 'Extract the main sections and content'
});

// Example 3: Simple string extraction (shorthand)
const summary = await consoles.extract(
  'Extract key points from this text...'
);
```

### Web3 
Blockchain integration for Solana with wallet management, price feeds, and DEX interactions.

```typescript
import { Consoles } from 'consoles-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize SDK with your API key
const consoles = new Consoles(process.env.CONSOLES_API_KEY);

// Initialize Solana (defaults to mainnet)
const solana = consoles.web3.solana();

// Or use custom RPC/network
const custom = consoles.web3.solana({
  rpc: 'https://my-rpc.com',
  network: 'devnet'
});

// Create regular wallet
const { wallet } = await solana.createWallet();

// Create vanity wallet (simple)
const { wallet: vanityWallet } = await solana.createWallet('CAFE');

// Create vanity wallet (with options)
const { wallet: customVanity } = await solana.createWallet({
  pattern: 'CAFE*XYZ',  // Start with CAFE, end with XYZ
  timeout: 60000,       // 60 seconds (default: 30s)
  strict: false         // Return best match if timeout
});

// Save/load wallets
const privateKey = solana.getPrivateKey(wallet);
const loadedWallet = solana.loadWallet(privateKey);
await solana.connect(loadedWallet);

// Get token prices
const USDC = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const prices = await solana.getPrice(USDC);
console.log('All prices:', prices);

// Transfer SOL with different confirmation levels
const tx = await solana.transfer({
  token: 'SOL',
  to: vanityWallet.publicKey.toString(),
  amount: '0.1',
  priorityFee: 50_000  // Optional: higher priority
});

// Wait for confirmation (most common)
await tx.confirm();

// Or wait for finality (critical transactions)
await tx.wait('finalized');

// Swap tokens with slippage protection
const swapTx = await solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' },
  slippage: '1'  // 1% slippage
});

// Wait with timeout
await swapTx.confirm({ timeout: 60000 });  // 1 minute timeout
```
## Coming Soon
### Browsers
Launch and control Chrome or Firefox browsers in the cloud.

### Compute
Execute code and run containers programmatically

### Storage
Fast, affordable storage distributed across the globe

### Tools Platform
Deploy tools/functions that scale automatically


## Links

[Documentation](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [Support](mailto:support@consoles.ai)
