# sdk-triggerx

SDK for interacting with the TriggerX backend and smart contracts.

## Features
- Easy API integration
- Smart contract interaction
- TypeScript support

## Installation
```bash
npm install sdk-triggerx
```

## Usage
```typescript
import { TriggerXClient } from 'sdk-triggerx';

const client = new TriggerXClient({ apiKey: 'YOUR_API_KEY' });
// Use client methods...
```

## Project Structure
```
src/
  index.ts           # Entry point
  client.ts          # API Client (Axios wrapper)
  config.ts          # Config management
  types.ts           # Shared interfaces/types
  api/               # API modules
  contracts/         # Contract logic & ABIs
  utils/             # Utilities (errors, etc.)
test/                # Tests
scripts/             # Utility scripts
``` 