## What is it?

Consoles gives AI applications access to infrastructure and enhanced capabilities through clean, intuitive APIs.

## Installation
```bash
npm install consoles-ai
```

## Quick Start
```typescript
import { Console } from 'consoles-ai';
import { z } from 'zod';

const consoles = new Console('key');

// Using Zod schema
const productSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
  inStock: z.boolean().optional()
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
//     total_cost: "0.0004"
//   }
// }
```

## Examples

### Document Analysis
```typescript
// Using JSON Schema
const financials = await consoles.extract({
  type: 'url',
  content: 'https://s22.q4cdn.com/959853165/files/doc_financials/2023/ar/NVDA-2023-Annual-Report.pdf',
  schema: {
    type: 'object',
    properties: {
      revenue: { type: 'number' },
      netIncome: { type: 'number' },
      gpuRevenue: { type: 'number' }
    },
    required: ['revenue', 'netIncome']
  },
  prompt: 'Extract the key financial metrics from FY2023'
});
```

### Media Processing
```typescript
const podcastSchema = z.object({
  topics: z.array(z.string()),
  keyMoments: z.array(z.object({
    timestamp: z.string(),
    summary: z.string()
  }))
});

const podcast = await consoles.extract({
  type: 'file',
  content: {
    data: audioBuffer.toString('base64'),
    mimeType: 'audio/mp3'
  },
  schema: podcastSchema
});
```

## Coming Soon

- browsers
- computers
- more

## Documentation

Visit our [documentation](https://docs.consoles.ai) for more information.

## Links

[Docs](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [support@consoles.ai](mailto:support@consoles.ai)
