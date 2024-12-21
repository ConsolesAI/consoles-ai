## What is it?

Consoles gives AI applications access to infrastructure and enhanced capabilities through clean, intuitive APIs.

## Available APIs

### Extract
Transform any content into structured data with AI.

#### Installation
```bash
npm install consoles-ai
```

#### Quick Start
```typescript
import { Console } from 'consoles-ai';
import { z } from 'zod';

const consoles = new Console('your-api-key');

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

#### Examples

##### Document Analysis
```typescript
const financials = await consoles.extract({
  type: 'url',
  content: 'https://s22.q4cdn.com/959853165/files/doc_financials/2023/ar/NVDA-2023-Annual-Report.pdf',
  schemaDescription: "Extract financial metrics including revenue, net income, and GPU revenue (all in millions USD)'"
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

##### Media Processing
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
```

```typescript
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
  prompt: 'Based on the video provided, Generate detailed chapter markers with timestamps and summaries'
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

##### Using Natural Language Schema
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

### Browser
Managed browser automation at scale.

### Computer
On-demand compute resources for AI workloads.

## Documentation

Visit our [documentation](https://docs.consoles.ai) for more information:

- [API Reference](https://docs.consoles.ai/reference) - Complete API documentation including supported file types and formats
- [Tutorials](https://docs.consoles.ai/tutorials) - Step-by-step guides to get started
- [How-to Guides](https://docs.consoles.ai/how-to) - Practical guides for common tasks
- [Explanation](https://docs.consoles.ai/explanation) - Concepts and technical details

## Links

[Docs](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [support@consoles.ai](mailto:support@consoles.ai)
