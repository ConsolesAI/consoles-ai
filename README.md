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
      revenue: { type: 'number', description: 'Total revenue in millions USD' },
      netIncome: { type: 'number', description: 'Net income in millions USD' },
      gpuRevenue: { type: 'number', description: 'Revenue from GPU segment' }
    },
    required: ['revenue', 'netIncome']
  },
  prompt: 'Extract the key financial metrics from FY2023'
});

// Response:
// {
//   status: 'success',
//   result: {
//     revenue: 26974,
//     netIncome: 4368,
//     gpuRevenue: 22035
//   },
//   usage: {
//     input_tokens: 4537,
//     output_tokens: 21,
//     total_tokens: 4558,
//     total_cost: "0.0058"
//   }
// }
```

### Media Processing
```typescript
// Extract podcast insights
const podcastSchema = z.object({
  topics: z.array(z.string()).describe('Main topics discussed in the podcast'),
  keyMoments: z.array(
    z.object({
      timestamp: z.string().describe('Timestamp in HH:MM:SS format'),
      summary: z.string().describe('Brief summary of the key moment')
    })
  )
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
//     total_cost: "0.0115"
//   }
// }

// Generate YouTube chapters
const chapterSchema = z.array(
  z.object({
    timestamp: z.string().describe('Chapter start time in HH:MM:SS format'),
    title: z.string().describe('Short, descriptive chapter title'),
    summary: z.string().describe('Detailed description of chapter content')
  })
)

const chapters = await consoles.extract({
  type: 'url',
  content: 'https://youtube.com/watch?v=example',
  schema: chapterSchema,
  prompt: 'Based on the video provided, Generate detailed chapter markers with timestamps and summaries'
});

// Response:
// {
//   status: 'success',
//   result: [
//     {
//       timestamp: "00:00:00",
//       title: "Introduction",
//       summary: "Overview of topics and speaker introduction"
//     },
//     {
//       timestamp: "00:02:15",
//       title: "Core Concepts",
//       summary: "Explanation of fundamental principles and key terminology"
//     },
//     {
//       timestamp: "00:15:30",
//       title: "Real World Applications",
//       summary: "Practical examples and use cases in production environments"
//     }
//   ],
//   usage: {
//     input_tokens: 3245,
//     output_tokens: 156,
//     total_tokens: 3401,
//     total_cost: "0.0043"
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
