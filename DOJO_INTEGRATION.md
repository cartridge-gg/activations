# Dojo SDK Integration - Phase 1 Complete

## Summary

Phase 1 of the Dojo SDK integration is complete. The application now has proper Dojo SDK initialization with support for local development (localhost:5050), Sepolia testnet, and mainnet.

## What Was Implemented

### 1. Dependencies Installed
- `@dojoengine/sdk` (v1.8.2)
- `@dojoengine/core` (v1.8.1)
- `@dojoengine/torii-client` (v1.8.1)

### 2. New Files Created

#### `/client/src/lib/dojoConfig.ts`
- Imports and wraps the manifest file
- Creates a Dojo config using `createDojoConfig()`

#### `/client/src/lib/dojo.ts`
- Multi-environment SDK initialization
- Supports `local`, `sepolia`, and `mainnet` environments
- Configures Torii URL, Relay URL, RPC URL, and Chain ID per environment
- Exports `initDojoSdk()` for initializing the SDK (call only once)

#### `/client/src/hooks/useDojo.ts`
- Custom React hook for accessing the Dojo SDK
- Returns `setup` (client with contract actions), `account`, and `sdk`

#### Environment Files
- `.env.example` - Template with all configuration options
- `.env.local` - Local development configuration (localhost:5050)
- `.env.sepolia` - Sepolia testnet configuration

### 3. Files Modified

#### `/client/src/components/providers/StarknetProvider.tsx`
- Initializes Dojo SDK on mount
- Wraps app with `DojoSdkProvider`
- Passes `setupWorld` from generated TypeScript bindings
- Includes loading and error states

#### `/client/src/lib/constants.ts`
- Now imports contract addresses from manifest
- Uses environment-aware configuration
- Exports `WORLD_ADDRESS`, `RONIN_PACT_ADDRESS`, `QUEST_MANAGER_ADDRESS`
- Exports `RPC_URL`, `CHAIN_ID`, `TORII_URL` from environment config

## Environment Configuration

### Local Development (localhost:5050)
```bash
# Use .env.local
VITE_ENVIRONMENT=local
```

This configures:
- Torii: `http://localhost:8080`
- RPC: `http://localhost:5050`
- Chain ID: `KATANA`
- Relay: `/ip4/127.0.0.1/tcp/9090`

### Sepolia Testnet
```bash
# Use .env.sepolia
VITE_ENVIRONMENT=sepolia
VITE_TORII_URL_SEPOLIA=https://api.cartridge.gg/x/ronin-pact/torii
```

This configures:
- Torii: Custom or `https://api.cartridge.gg/x/ronin-pact/torii`
- RPC: `https://api.cartridge.gg/x/starknet/sepolia`
- Chain ID: `SN_SEPOLIA`

### Mainnet
```bash
# Use .env.mainnet (or custom .env)
VITE_ENVIRONMENT=mainnet
VITE_TORII_URL_MAINNET=<your-torii-url>
```

## How to Use

### Switching Environments

**Option 1: Use specific .env file**
```bash
# For local development
cp .env.local .env

# For sepolia testnet
cp .env.sepolia .env
```

**Option 2: Set environment in your .env**
```bash
VITE_ENVIRONMENT=local   # or sepolia, or mainnet
```

### Accessing Dojo in Components

```typescript
import { useDojo } from '@/hooks/useDojo';

function MyComponent() {
  const { setup, account } = useDojo();
  
  // Call contract actions through setup
  await setup.actions.completeWaza(account, tokenId);
}
```

## Next Steps: Phase 2

Phase 2 will involve refactoring the existing hooks to use the Dojo SDK:

1. **useTrialProgress** - Replace `useReadContract` with `useModel` from Dojo SDK
2. **useWazaClaim** - Replace direct `account.execute()` with `setup.actions.completeWaza`
3. **useChiQuiz** - Replace direct contract calls with `setup.actions.completeChi`
4. **useShinTrial** - Replace direct contract calls with `setup.actions.completeShin`

This will:
- Eliminate manual contract call construction
- Enable automatic state synchronization via Torii
- Provide type-safe contract interactions
- Remove the need for the mock system

## Testing

To test the current integration:

```bash
# Start local Katana (in contracts directory)
cd contracts
katana --dev

# Start Torii indexer (in contracts directory)
torii --world 0x5d7df3f6e6e44c78b7bd7716f942745aefd2f1aad006aaf8bd03c64ada96d0

# Start client (in client directory)
cd client
cp .env.local .env
pnpm dev
```

The application should now initialize the Dojo SDK on startup and display "Initializing Dojo..." briefly before loading.

## Notes

- The Dojo SDK is initialized **once** on application mount
- Contract addresses are automatically loaded from `manifest_dev.json`
- Environment variables can override manifest values if needed
- The `setupWorld` function from generated TypeScript bindings is passed to the provider
- All Torii/RPC/Relay URLs are environment-aware
