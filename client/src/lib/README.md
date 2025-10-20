# Client Library Configuration

This directory contains the simplified configuration for the Ronin's Pact client application, optimized for local development with Katana.

## File Structure

### Core Configuration Files

#### `config.ts` - Main Configuration Hub
Consolidated file containing:
- **Manifest Loading**: Dojo manifest integration via `createDojoConfig`
- **Contract Addresses**: Extracted from manifest (World, Ronin Pact NFT, Quest Manager)
- **Katana Configuration**: Local development settings (RPC, Torii, Relay URLs)
- **Chain Definition**: Katana chain object for Starknet React
- **Dojo SDK Initialization**: `initDojoSdk()` function for single-time setup
- **App Constants**: Trial metadata, allowlisted collections, sharing config

**Key Exports:**
- `dojoConfig` - Dojo configuration object
- `katana` - Katana chain definition
- `KATANA_*` - Connection URLs and chain ID
- `WORLD_ADDRESS`, `RONIN_PACT_ADDRESS`, `QUEST_MANAGER_ADDRESS` - Contract addresses
- `initDojoSdk()` - SDK initialization function
- `ALLOWLISTED_COLLECTIONS`, `TRIALS`, `SHARE_*` - Application constants

#### `starknet.ts` - Wallet & Chain Configuration
Handles Starknet provider and connector setup:
- **Controller Connector**: Cartridge Controller with session policies for gasless transactions
- **Provider**: JSON RPC provider pointing to local Katana
- **Chain Exports**: Chains array and default chain ID for StarknetConfig

**Key Exports:**
- `controller` - ControllerConnector instance
- `provider` - JSON RPC provider
- `chains` - Array containing only Katana chain
- `defaultChainId` - Katana chain ID

### Hooks

#### `useDojo.ts` - Dojo SDK Access Hook
Thin wrapper providing access to:
- Dojo SDK client (contract actions)
- Connected Starknet account
- Full SDK instance

## What Was Simplified

### Consolidated Files (REMOVED)
The following files were merged into `config.ts` and `starknet.ts`:

1. **`dojo.ts`** → Merged into `config.ts`
   - Removed: Multi-environment switching logic
   - Removed: Environment detection functions
   - Kept: SDK initialization (hardcoded for local)

2. **`dojoConfig.ts`** → Merged into `config.ts`
   - Simple manifest wrapper, now part of main config

3. **`constants.ts`** → Merged into `config.ts`
   - Contract addresses from manifest
   - App constants (trials, collections, sharing)
   - Removed: Dynamic environment config loading

4. **`chains.ts`** → Merged into `config.ts`
   - Katana chain definition inlined

5. **`controller.ts`** → Merged into `starknet.ts`
   - Controller connector setup
   - Removed: Dynamic environment configuration

### Complexity Removed

1. **Environment Switching**
   - No more `VITE_ENVIRONMENT` checks
   - No more Sepolia/Mainnet configurations
   - Hardcoded to local Katana (localhost:5050)

2. **Configuration Indirection**
   - Removed `getEnvironment()` and `getEnvironmentConfig()` functions
   - Direct constant exports instead of function calls
   - No more environment variable fallbacks

3. **File Fragmentation**
   - From 6 configuration files down to 2
   - Related concerns grouped together
   - Single import source for most config needs

## Usage Examples

### Initialize Dojo SDK (in provider)
```typescript
import { initDojoSdk, dojoConfig } from '@/lib/config';

const sdk = await initDojoSdk();
```

### Access Contract Addresses
```typescript
import { RONIN_PACT_ADDRESS, WORLD_ADDRESS } from '@/lib/config';
```

### Setup Starknet Provider
```typescript
import { controller, provider, chains, defaultChainId } from '@/lib/starknet';

<StarknetConfig
  connectors={[controller]}
  provider={provider}
  chains={chains}
  defaultChainId={defaultChainId}
>
  {children}
</StarknetConfig>
```

### Access App Constants
```typescript
import { TRIALS, ALLOWLISTED_COLLECTIONS } from '@/lib/config';
```

## Local Development

All configuration is hardcoded for local Katana:
- **RPC**: `http://localhost:5050`
- **Torii**: `http://localhost:8080`
- **Relay**: `/ip4/127.0.0.1/tcp/9090`
- **Chain ID**: `0x4b4154414e41` ("KATANA" in hex)

## Future Considerations

When adding multi-environment support back:
1. Consider using a single environment variable to switch between config objects
2. Keep the simplified structure (2 files max)
3. Add environment configs as const objects, not functions
4. Document why each environment is needed
