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

### Web3 
Blockchain integration for Solana with wallet management, price feeds, and DEX interactions.

#### Features
- 🔍 Read-only operations (prices, portfolios, trust scores)
- 💳 Wallet management (create, connect, save/load)
- 💸 Token operations (send, swap)
- 📊 Portfolio tracking
- 🔒 Trust score analysis

#### Basic Example
```typescript
import { Consoles } from 'consoles-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize SDK with your API key
const consoles = new Consoles(process.env.CONSOLES_API_KEY);
// Initialize Solana (defaults to mainnet)
// to use custom RPC, pass in a custom RPC: consoles.web3.solana({ rpc: 'https://rpc.example.com'} )

const solana = consoles.web3.solana()

// Get token info
const USDC = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const prices = await solana.getPrice(USDC);
console.log('USDC Price:', prices);

const trustScore = await solana.getTrustScore(USDC);
console.log('Trust Score:', trustScore.score.toFixed(2));

// Check any wallet's portfolio
const whaleAddress = "DYtKhdXCSxX8SfdmhPSGmZwTLC9Ld1jxvPHNuRoTL6Vr";
const portfolio = await solana.portfolio(whaleAddress);
const totals = await portfolio.total();
console.log(`Portfolio Value: $${totals.usd}`);
console.log('Holdings:', portfolio.tokens.map(t => 
  `${t.symbol}: ${t.amount} ($${t.value})`
));

// Create and connect wallet
const { wallet } = await solana.createWallet();
await solana.connect(wallet);
console.log('Wallet:', wallet.publicKey);

// Send tokens with custom priority fee and compute units
const tx = await solana.send({
  to: whaleAddress,
  amount: '0.0000001', 
  token: 'SOL',
  config: {
    priorityFee: 100_000, // Priority fee in microlamports (0.0001 SOL)
    computeUnits: 200_000 // Maximum compute units for transaction
  }
});

console.log('Transaction:', tx.id);

// Swap tokens
const swap = await solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' },
  config: { slippage: '1' }
});
console.log('Swap:', swap.id);

// Wait for confirmation
let status = await solana.status(tx.id);
while (status !== 'confirmed') {
  await new Promise(r => setTimeout(r, 1000));
  status = await solana.status(tx.id);
}
console.log('Confirmed!');
```

#### Portfolio Examples
```typescript
// Check portfolio with different price sources
const portfolio = await solana.portfolio(address);

// Get basic USD value
const totals = await portfolio.total();
console.log(`Portfolio Value: $${totals.usd}`);
console.log(`Value in SOL: ${totals.sol} SOL`);

// Get value in USDC from Jupiter
const jupiterValue = await portfolio.total(COMMON_TOKENS.USDC, 'jupiter');
console.log(`Value in USDC (Jupiter): ${jupiterValue.token} USDC`);

// Get value in BONK from Raydium
const raydiumValue = await portfolio.total('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'raydium');
console.log(`Value in BONK (Raydium): ${raydiumValue.token} BONK`);

// Get best price across all DEXs
const bestPrice = await portfolio.total('YOUR_TOKEN_ADDRESS', 'all');
console.log(`Best value in Token: ${bestPrice.token}`);

// List all holdings with their values
console.log('Holdings:', portfolio.tokens.map(token => 
  `${token.amount} ${token.symbol} ($${token.value})`
));
```

#### Transaction Examples
```typescript
// Send exact amounts
const tx = await solana.send({
  to: friendAddress,
  amount: '1.5',        // Send exactly 1.5 USDC
  token: 'USDC'
});

// Send with USD value
const tx2 = await solana.send({
  to: friendAddress,
  amount: '$100',       // Send $100 worth of SOL
  token: 'SOL'
});

// Swap tokens
const swap = await solana.swap({
  from: { token: 'SOL', amount: '0.1' },   // Swap from 0.1 SOL
  to: { token: 'USDC' },                   // Get USDC
  config: { slippage: '1' }                // 1% slippage allowed
});

// Wait for confirmation
await tx.confirm();
```

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