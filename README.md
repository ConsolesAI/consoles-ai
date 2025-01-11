# Consoles

Simple solutions for powerful features. Built for developers and AI agents.

## Installation
```bash
npm install consoles-ai
```

## Quick Start
```typescript
import { Consoles } from 'consoles-ai';

// Initialize with defaults (mainnet)
const consoles = new Consoles(process.env.CONSOLES_API_KEY);
const solana = consoles.web3.solana();

// Or customize your RPC
const custom = consoles.web3.solana({
  rpc: 'https://your-rpc.com',
  network: 'devnet'
});

// Get any token's price - that's it!
const prices = await solana.getPrice('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
console.log('USDC Price:', prices);

// Check portfolio value in USD, SOL, or any token
const portfolio = await solana.portfolio(address);
const totals = await portfolio.total();
console.log(`In USD: $${totals.usd}`);
console.log(`In SOL: ${totals.sol} SOL`);
console.log(`In BONK: ${(await portfolio.total('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')).token}`);

// Send tokens - simple as that
const tx = await solana.send({
  to: receiver,
  amount: '1.5',        // amount in USDC
  token: 'USDC'
});

// Or send USD amount directly
const tx2 = await solana.send({
  to: receiver,
  amount: '$50',        // amount in USD
  token: 'SOL'         // will convert to SOL automatically
});

// Swap tokens with 1-line
const swap = await solana.swap({
  from: { token: 'SOL', amount: '0.1' },
  to: { token: 'USDC' }
});
```

## Features
- 🚀 Simple, intuitive API that just works
- 🔍 Read-only operations (prices, portfolios)
- 💸 Token operations (send, swap)
- ⚡️ Custom RPC support
- 🌐 Multi-DEX price sources

## Links
[Documentation](https://docs.consoles.ai) • [Discord](https://discord.gg/consoles) • [Support](mailto:support@consoles.ai)
