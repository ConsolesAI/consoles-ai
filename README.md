# Consoles

Consoles gives AI applications access to infrastructure and enhanced capabilities through clean, intuitive APIs.

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

// Example 3: Process uploaded file (e.g., from form input)
const audioSchema = z.object({
  transcript: z.string(),
  speakers: z.array(z.string()),
  duration: z.number()
});

// Using File/Blob from form upload
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const base64Content = await fileToBase64(file);

const audioResult = await consoles.extract({
  type: 'file',
  content: {
    data: base64Content,
    mimeType: file.type // e.g., 'audio/mp3'
  },
  schema: audioSchema
});

// Example 4: Simple string extraction (shorthand)
const simpleResult = await consoles.extract(
  'Extract key information from this text: The weather today is sunny with a high of 75°F'
);

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
  });
}
```

### Web3 SDK (Available Now)
Blockchain integration for Solana with wallet management, price feeds, and DEX interactions.

```typescript
// Initialize Solana with default mainnet RPC
const solana = consoles.web3.solana();

// Or use custom network/RPC
const devnet = consoles.web3.solana({
  network: 'devnet'  // Uses default devnet RPC
});

const custom = consoles.web3.solana({
  rpc: 'https://your-custom-rpc.com'
});

// Basic wallet operations
const wallet = solana.createWallet();
const privateKey = solana.getPrivateKey(wallet);
const loadedWallet = solana.loadWallet(privateKey);

// Create vanity wallet
const vanityWallet = solana.createVanityWallet({
  prefix: 'CAFE',     // Must start with
  suffix: 'END',      // Must end with
  contains: 'COOL',   // Must contain somewhere
  caseSensitive: true // Match exact case
});

// Check token prices across DEXs
const prices = await solana.price('token-address');
console.log('Jupiter price:', await prices.jupiter);
console.log('All prices:', await prices); // Returns prices from multiple DEXs

// Swap tokens
const swapResult = await solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' },
  dex: 'jupiter',
  slippage: '100' // 1% slippage
});

// Create and launch tokens
const tokenResult = await solana.createToken({
  metadata: {
    name: 'My Token',
    symbol: 'MYTKN',
    description: 'My awesome token',
    image_description: 'A cool logo'
  },
  buyAmount: '1' // Initial buy in SOL
});
```

### Browser Infrastructure (Coming Soon)
Launch and control Chrome or Firefox browsers in the cloud. Perfect for:
- Web scraping and data collection
- Automated testing and monitoring
- AI agents that interact with web interfaces

### Compute (Coming Soon)
Execute code, run containers, and manage remote systems programmatically:
- Run LLM generated code in secure sandboxes
- Deploy Docker containers
- Control remote machines with real-time WebSocket access
- Access high-performance GPUs for ML/AI workloads

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
