## What is it?

Consoles gives AI applications access to infrastructure and enhanced capabilities through clean, intuitive APIs.

## Installation
```bash
npm install consoles-ai
```

## Quick Start
```typescript
import { Console } from 'consoles-ai';
const consoles = new Console('key');

const data = await consoles.extract({
  type: 'text',
  content: 'The iPhone 15 Pro costs $999',
  schema: { type: 'object', properties: { price: { type: 'number' } } }
});

// Response:
// {
//   status: 'success',
//   result: { price: 999 },
//   usage: {
//     input_tokens: 9,
//     output_tokens: 4,
//     total_tokens: 13,
//     input_cost: "0.0001",
//     output_cost: "0.0001",
//     total_cost: "0.0002"
//   }
// }
```

## Examples

### Financial Reports
```typescript
import { Console } from 'consoles-ai';
import { z } from 'zod';

// Define your schema
const financialMetrics = z.object({
  revenue: z.number(),
  netIncome: z.number(),
  gpuRevenue: z.number(),
  operatingExpenses: z.number()
});

const consoles = new Console('key');

const financials = await consoles.extract({
  type: 'url',
  content: 'https://s22.q4cdn.com/959853165/files/doc_financials/2023/ar/NVDA-2023-Annual-Report.pdf',
  schema: financialMetrics,
  prompt: 'Extract the key financial metrics from FY2023'
});

// Response:
// {
//   status: 'success',
//   result: {
//     revenue: 26974,
//     netIncome: 4368,
//     gpuRevenue: 22035,
//     operatingExpenses: 7047
//   },
//   usage: {
//     input_tokens: 4537,
//     output_tokens: 21,
//     total_tokens: 4558,
//     input_cost: "0.0057",
//     output_cost: "0.0001",
//     total_cost: "0.0058"
//   }
// }
```

### Media Processing
```typescript
// Define podcast schema
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

// Response:
// {
//   status: 'success',
//   result: {
//     topics: [
//       "AI Safety",
//       "Neural Networks",
//       "Future of Computing"
//     ],
//     keyMoments: [
//       {
//         timestamp: "00:05:30",
//         summary: "Discussion on transformer architecture"
//       },
//       {
//         timestamp: "00:15:45",
//         summary: "Debate about AI regulation"
//       }
//     ]
//   },
//   usage: {
//     input_tokens: 8842,
//     output_tokens: 89,
//     total_tokens: 8931,
//     input_cost: "0.0111",
//     output_cost: "0.0004",
//     total_cost: "0.0115"
//   }
// }
```

## Coming Soon

- browsers
- computers
- more

## Documentation

Visit our [documentation](https://docs.consoles.ai) for more information.

## Links

[Docs](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [support@consoles.ai](mailto:support@consoles.ai)
