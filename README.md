## What is it?

Consoles gives AI applications access to infrastructure and enhanced capabilities through clean, intuitive APIs.

## Available APIs

### Extract
Transform any content into structured data with AI.

#### Installation
```bash
npm install consoles-ai
```

## Quick Start

```typescript
import { Consoles } from 'consoles-ai';

// Initialize without API key for free features
const consoles = new Consoles();

// Create a Solana wallet (free)
const wallet = consoles.web3.createWallet();
console.log('Wallet address:', wallet.publicKey.toString());

// Get Jupiter DEX price (free)
const price = await consoles.web3.solana.getJupiterPrice('token-address');
console.log('Price:', price);

// Add API key for premium features
consoles.setApiKey('your-api-key');

// Use premium features like Extract
const data = await consoles.extract({
  type: 'text',
  content: 'Your content here',
  prompt: 'Extract key information'
});
```

## Available APIs

### Web3 SDK
Blockchain integration with both free and premium features.

#### Free Features (No API Key Required)
```typescript
const consoles = new Consoles();
const web3 = consoles.web3;

// Wallet operations
const wallet = web3.createWallet();
const privateKey = web3.getPrivateKey(wallet);
const loadedWallet = web3.loadWallet(privateKey);

// Basic price checking
const jupiterPrice = await web3.solana.getJupiterPrice('token-address');

// Custom RPC
web3.setRpcEndpoint('your-rpc-url');
```

#### Premium Features (API Key Required)
```typescript
const consoles = new Consoles('your-api-key');
const web3 = consoles.web3;

// Aggregated price feeds
const prices = await web3.solana.price('token-address');
// Returns prices from Jupiter, Raydium, PumpFun

// Create and trade tokens
const tokenResult = await web3.solana.createToken({
  metadata: {
    name: "My Token",
    symbol: "MYTKN",
    description: "Description"
  },
  buyAmount: 0.1
});

// DEX trading with best price routing
const swapResult = await web3.solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' },
  dex: 'jupiter',
  slippage: '100' // 1% slippage
});
```

### Extract (Premium)
Transform any content into structured data with AI. Requires API key.

#### Basic Usage
```typescript
import { Consoles } from 'consoles-ai';
import { z } from 'zod';

const consoles = new Consoles('your-api-key');

// Using Zod schema with descriptions
const productSchema = z.object({
  name: z.string().describe('Product name'),
  price: z.number().describe('Price in USD'),
  description: z.string().describe('Product description'),
  inStock: z.boolean().optional().describe('Current availability status')
});

const data = await consoles.extract({
  type: 'text',
  content: `
    New iPhone 15 Pro
    Price: $999
    Experience the most powerful iPhone ever.
    Currently in stock.
  `,
  schema: productSchema
});

// Response:
// {
//   status: 'success',
//   result: {
//     name: "iPhone 15 Pro",
//     price: 999,
//     description: "Experience the most powerful iPhone ever",
//     inStock: true
//   },
//   usage: {
//     input_tokens: 28,
//     output_tokens: 12,
//     total_tokens: 40,
//     input_cost: "0.0003",
//     output_cost: "0.0001",
//     total_cost: "0.0004"
//   }
// }
```

#### Document Analysis
```typescript
const financials = await consoles.extract({
  type: 'url',
  content: 'https://s22.q4cdn.com/959853165/files/doc_financials/2023/ar/NVDA-2023-Annual-Report.pdf',
  schemaDescription: "Extract financial metrics including revenue, net income, and GPU revenue (all in millions USD)",
  prompt: 'Extract the key financial metrics from FY2023'
});

// Response
{
  status: 'success',
  result: {
    revenue: 26974,
    netIncome: 4368,
    gpuRevenue: 22035
  },
  usage: {
    input_tokens: 4537,
    output_tokens: 21,
    total_tokens: 4558,
    input_cost: "0.0045",
    output_cost: "0.0013",
    total_cost: "0.0058"
  }
}
```

#### Media Processing
```typescript
// Extract podcast insights with streaming
const podcastSchema = z.object({
  topics: z.array(z.string()).describe('Main topics discussed in the podcast'),
  keyMoments: z.array(
    z.object({
      timestamp: z.string().describe('Timestamp in HH:MM:SS format'),
      summary: z.string().describe('Brief summary of the key moment')
    })
  )
});

const stream = await consoles.extract({
  type: 'file',
  content: new Blob([audioBuffer], { type: 'audio/mp3' }),
  schema: podcastSchema,
  stream: true
});

// Process stream chunks
for await (const chunk of stream) {
  console.log('Received chunk:', chunk);
}

// Generate YouTube chapters
const chapterSchema = z.array(
  z.object({
    timestamp: z.string().describe('Chapter start time in HH:MM:SS format'),
    title: z.string().describe('Short, descriptive chapter title'),
    summary: z.string().describe('Detailed description of chapter content')
  })
);

const chapters = await consoles.extract({
  type: 'url',
  content: 'https://youtube.com/watch?v=example',
  schema: chapterSchema,
  prompt: 'Generate detailed chapter markers with timestamps and summaries'
});

// Response
{
  status: 'success',
  result: [
    {
      timestamp: "00:00:00",
      title: "Introduction",
      summary: "Overview of topics and speaker introduction"
    },
    {
      timestamp: "00:02:15",
      title: "Core Concepts",
      summary: "Explanation of fundamental principles and key terminology"
    },
    {
      timestamp: "00:15:30",
      title: "Real World Applications",
      summary: "Practical examples and use cases in production environments"
    }
  ],
  usage: {
    input_tokens: 3245,
    output_tokens: 156,
    total_tokens: 3401,
    input_cost: "0.0032",
    output_cost: "0.0011",
    total_cost: "0.0043"
  }
}
```

#### Using Natural Language Schema
```typescript
// Extract with schema description
const data = await consoles.extract({
  type: 'file',
  content: {
    data: pdfBuffer.toString('base64'),
    mimeType: 'application/pdf'
  },
  schemaDescription: 'Extract company metrics including revenue, profit margins, and year-over-year growth. Revenue should be a number, margins should be percentages, and growth should be a number representing the percentage change.',
  prompt: 'Focus on the most recent fiscal year'
});

// Response
{
  status: 'success',
  result: {
    revenue: 26974000000,
    profitMargin: 28.5,
    yearOverYearGrowth: 32.7
  },
  usage: {
    input_tokens: 3245,
    output_tokens: 156,
    total_tokens: 3401,
    input_cost: "0.0032",
    output_cost: "0.0011",
    total_cost: "0.0043"
  }
}
```

### Browser (Premium)
Managed browser automation at scale.

```typescript
const consoles = new Consoles('your-api-key');

const browser = consoles.browser('default');
const session = await browser.launch();
await session.goto('https://example.com');
const screenshot = await session.screenshot();
```

### VM (Premium)
On-demand compute resources for AI workloads.

```typescript
const consoles = new Consoles('your-api-key');

const vm = consoles.vm;
// VM operations require API key
```

### Sandbox (Premium)
Secure environment for running untrusted code.

```typescript
const consoles = new Consoles('your-api-key');

const sandbox = consoles.sandbox;
// Sandbox operations require API key
```

## Documentation

Visit our [documentation](https://docs.consoles.ai) for more information:

- [API Reference](https://docs.consoles.ai/reference) - Complete API documentation including supported file types and formats
- [Tutorials](https://docs.consoles.ai/tutorials) - Step-by-step guides
- [Free vs Premium Features](https://docs.consoles.ai/features) - Detailed feature comparison
- [Getting an API Key](https://consoles.ai/signup) - Sign up for premium features
- [How-to Guides](https://docs.consoles.ai/how-to) - Practical guides for common tasks
- [Explanation](https://docs.consoles.ai/explanation) - Concepts and technical details

## Links

[Docs](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [support@consoles.ai](mailto:support@consoles.ai)
