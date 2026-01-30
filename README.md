# Gamplo SDK

A TypeScript SDK for integrating with Gamplo's API. Works in both browser and Node.js environments.

## Installation

```bash
npm install gamplo-sdk
# or
yarn add gamplo-sdk
# or
bun add gamplo-sdk
```

## Quick Start

### Browser Environment

```typescript
import Gamplo from 'gamplo-sdk';

// Initialize the SDK, token is automagically detected from the URL
const gamplo = Gamplo.init();

// Or with explicit options
const gamplo = Gamplo.init({
  token: 'your_gamplo_token',
  config: {
    apiUrl: 'https://gamplo.com',
    timeout: 10000
  }
});

// Get current player info
const player = await gamplo.getPlayer();
console.log('Welcome,', player?.displayName);
```

### Node.js Environment

```typescript
import Gamplo from 'gamplo-sdk';

// For server-side usage
const gamplo = new Gamplo({
  token: 'gamplo_token_from_client',
  config: {
    apiUrl: 'https://gamplo.com'
  }
});

// Exchange token for session
const { sessionId, player } = await gamplo.authenticate('gamplo_token');

// Get player info
const playerInfo = await gamplo.getPlayer();
console.log('Welcome,', playerInfo?.displayName);
```