# Consoles

Consoles gives AI applications access to infrastructure and enhanced capabilities through clean, intuitive APIs.

## Installation
```bash
npm install consoles-ai
```

## Quick Start

```typescript
import { Consoles } from 'consoles-ai';

// Initialize SDK
const consoles = new Consoles();

// Web3 SDK Example
const wallet = consoles.web3.createWallet();
console.log('Wallet address:', wallet.publicKey.toString());

// Extract API Example (Beta)
const data = await consoles.extract({
  type: 'text',
  content: 'Your content here',
  prompt: 'Extract key information'
});
```

## Available APIs

### Web3 SDK
Blockchain integration for Solana with wallet management, price feeds, and DEX interactions.

```typescript
const consoles = new Consoles();
const web3 = consoles.web3;

// Wallet operations
const wallet = web3.createWallet();
const privateKey = web3.getPrivateKey(wallet);
const loadedWallet = web3.loadWallet(privateKey);

// Price checking with Jupiter
const jupiterPrice = await web3.solana.getJupiterPrice('token-address');

// Custom RPC endpoint
web3.setRpcEndpoint('your-rpc-url');

// DEX operations
const swapResult = await web3.solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' },
  dex: 'jupiter',
  slippage: '100' // 1% slippage
});
```

### Extract API (Beta)
Transform any content into structured data with AI.

```typescript
import { Consoles } from 'consoles-ai';
import { z } from 'zod';

const consoles = new Consoles();

// Using Zod schema
const productSchema = z.object({
  name: z.string().describe('Product name'),
  price: z.number().describe('Price in USD'),
  description: z.string().describe('Product description')
});

const data = await consoles.extract({
  type: 'text',
  content: `
    New iPhone 15 Pro
    Price: $999
    Experience the most powerful iPhone ever.
  `,
  schema: productSchema
});
```

## Coming Soon
- Browser Automation
- Compute Resources
- Storage Solutions
- And more!

## Links

[Docs](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [support@consoles.ai](mailto:support@consoles.ai)
