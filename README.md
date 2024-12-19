# Consoles

The headless infrastructure layer for AI applications.

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
```

## Examples

### Financial Reports
```typescript
import { Console } from 'consoles-ai';
import { z } from 'zod';

const consoles = new Console('key');

const financials = await consoles.extract({
  type: 'url',
  content: 'https://s22.q4cdn.com/959853165/files/doc_financials/2023/ar/NVDA-2023-Annual-Report.pdf',
  schema: z.object({
    revenue: z.number(),
    netIncome: z.number(),
    gpuRevenue: z.number(),
    operatingExpenses: z.number()
  }),
  prompt: 'Extract the key financial metrics from FY2023'
});
```

### Media Processing
```typescript
const podcast = await consoles.extract({
  type: 'file',
  content: {
    data: audioBuffer.toString('base64'),
    mimeType: 'audio/mp3'
  },
  schema: z.object({
    topics: z.array(z.string()),
    keyMoments: z.array(z.object({
      timestamp: z.string(),
      summary: z.string()
    }))
  })
});
```

## Coming Soon

- Managed browsers at scale
- On-demand compute
- Storage & persistence
- Built-in payments

## Documentation

Visit our [documentation](https://docs.consoles.ai) for:
- Full API reference
- Input types (URL, File, Text)
- Schema validation (Zod & JSON Schema)
- Usage & monitoring
- Advanced examples

## Links

[Docs](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles-ai) • [support@consoles.ai](mailto:support@consoles.ai)
