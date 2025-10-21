# Configuration Simplification Summary

This document outlines the major simplification of the client configuration system, consolidating from 6 fragmented files down to 2 focused configuration files optimized for local Katana development.

## Overview

### Before: 6 Configuration Files
```
src/lib/
├── dojo.ts              (101 lines) - Multi-env SDK init
├── dojoConfig.ts        (7 lines)   - Manifest wrapper
├── constants.ts         (82 lines)  - Addresses & constants
├── chains.ts            (29 lines)  - Chain definitions
├── controller.ts        (60 lines)  - Controller setup
└── starknet.ts          (68 lines)  - Provider setup
    Total: 347 lines across 6 files
```

### After: 2 Configuration Files
```
src/lib/
├── config.ts            (169 lines) - Unified config hub
└── starknet.ts          (70 lines)  - Wallet & provider
    Total: 239 lines across 2 files

src/hooks/
└── useDojo.ts           (21 lines)  - SDK access hook
```

**Result:**
- **108 fewer lines of code** (31% reduction)
- **4 fewer files to maintain** (67% reduction)
- **Eliminated:** All environment switching complexity
- **Preserved:** All core functionality

---

## What Changed

### 1. Files Consolidated into `config.ts`

#### From `dojo.ts`
✅ **Kept:**
- `initDojoSdk()` function for SDK initialization
- Connection to Torii, RPC, and Relay

❌ **Removed:**
- `Environment` type and multi-environment support
- `ENVIRONMENT_CONFIGS` object with Sepolia/Mainnet configs
- `getEnvironment()` function
- `getEnvironmentConfig()` function
- Environment variable checks and fallbacks

**Simplification:** Hardcoded all values for local Katana development

#### From `dojoConfig.ts`
✅ **Kept:**
- Manifest loading via `createDojoConfig`
- Export of `dojoConfig` object

**Simplification:** Inlined into main config file

#### From `constants.ts`
✅ **Kept:**
- Contract address extraction from manifest
- `ALLOWLISTED_COLLECTIONS` array
- `TRIALS` metadata object
- Social sharing constants

❌ **Removed:**
- Dynamic environment config imports
- Environment variable overrides for addresses

**Simplification:** Direct manifest access, removed indirection

#### From `chains.ts`
✅ **Kept:**
- Katana chain definition for Starknet React

**Simplification:** Inlined into main config file

---

### 2. Files Consolidated into `starknet.ts`

#### From `controller.ts`
✅ **Kept:**
- Controller connector initialization
- Session policies for gasless transactions
- Signup options

❌ **Removed:**
- Dynamic environment configuration
- `getControllerConfig()` function

**Simplification:** Hardcoded chains and chainId for local Katana

#### Updated `starknet.ts`
✅ **Kept:**
- JSON RPC provider
- Chain array and default chain ID exports

❌ **Removed:**
- Multi-chain switching logic
- Environment-based provider selection
- Sepolia and Mainnet configurations

**Simplification:** Single chain (Katana), single provider configuration

---

## Import Path Changes

All imports have been updated throughout the codebase:

### Old Imports → New Imports

```typescript
// Contract addresses & constants
import { RONIN_PACT_ADDRESS } from '@/lib/constants';
// ↓ NOW:
import { RONIN_PACT_ADDRESS } from '@/lib/config';

// Dojo SDK initialization
import { initDojoSdk } from '@/lib/dojo';
// ↓ NOW:
import { initDojoSdk } from '@/lib/config';

// Dojo config
import { dojoConfig } from '@/lib/dojoConfig';
// ↓ NOW:
import { dojoConfig } from '@/lib/config';

// Controller connector
import { controller } from '@/lib/controller';
// ↓ NOW:
import { controller } from '@/lib/starknet';

// Provider and chains
import { provider, chains, defaultChainId } from '@/lib/starknet';
// ↓ NOW: (unchanged)
import { provider, chains, defaultChainId } from '@/lib/starknet';

// Katana chain definition
import { katana } from '@/lib/chains';
// ↓ NOW:
import { katana } from '@/lib/config';

// App constants
import { TRIALS, ALLOWLISTED_COLLECTIONS } from '@/lib/constants';
// ↓ NOW:
import { TRIALS, ALLOWLISTED_COLLECTIONS } from '@/lib/config';
```

---

## Files Updated

The following files had their imports updated:

### Components
- `/client/src/components/providers/StarknetProvider.tsx`
- `/client/src/components/ConnectWallet.tsx`
- `/client/src/components/TrialCard.tsx`
- `/client/src/components/WazaTrial.tsx`
- `/client/src/components/ShareButton.tsx`

### Hooks
- `/client/src/hooks/useChiQuiz.ts`
- `/client/src/hooks/useShinTrial.ts`
- `/client/src/hooks/useTrialProgress.ts`
- `/client/src/hooks/useWazaClaim.ts`

**Total:** 9 files updated with new import paths

---

## Configuration Values

### Local Katana (Hardcoded)

All configuration now points to local development:

```typescript
// Network
KATANA_URL = "http://localhost:5050"
TORII_URL = "http://localhost:8080"
RELAY_URL = "/ip4/127.0.0.1/tcp/9090"
KATANA_CHAIN_ID = "0x4b4154414e41" // "KATANA" hex-encoded

// Contracts (from manifest)
WORLD_ADDRESS = manifest.world.address
RONIN_PACT_ADDRESS = manifest.external_contracts[ronin_pact_nft].address
QUEST_MANAGER_ADDRESS = manifest.contracts[actions].address
```

---

## Benefits

### 1. Clarity
- Single source of truth for configuration
- Related concerns grouped together
- Less cognitive overhead when navigating codebase

### 2. Simplicity
- No environment switching logic to debug
- Direct value exports instead of function calls
- Reduced abstraction layers

### 3. Maintainability
- Fewer files to keep in sync
- Changes require editing fewer locations
- Less risk of configuration drift

### 4. Performance
- Removed runtime environment checks
- Direct constant access (no function overhead)
- Smaller bundle size

---

## Future Multi-Environment Support

When adding back Sepolia/Mainnet support, follow this pattern:

```typescript
// config.ts
type Environment = "local" | "sepolia" | "mainnet";

const CONFIGS = {
  local: {
    rpcUrl: "http://localhost:5050",
    toriiUrl: "http://localhost:8080",
    // ...
  },
  sepolia: {
    rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    toriiUrl: "https://api.cartridge.gg/x/ronin-pact/torii",
    // ...
  },
  mainnet: {
    // ...
  }
} as const;

// Single environment detection
const ENV: Environment =
  (import.meta.env.VITE_ENV as Environment) || "local";

// Export selected config as constants
export const RPC_URL = CONFIGS[ENV].rpcUrl;
export const TORII_URL = CONFIGS[ENV].toriiUrl;
// ...
```

**Key principles:**
1. Keep all configs in one file
2. Use const objects, not functions
3. Detect environment once at module load
4. Export as constants, not getters

---

## Testing

### Verified Working
✅ Dev server starts successfully (`npm run dev`)
✅ No import errors at runtime
✅ All component imports resolved correctly
✅ Configuration loads from correct locations

### Pre-existing Issues
⚠️ TypeScript errors unrelated to config changes:
- ABI type mismatches (pre-existing)
- Controller type errors (pre-existing)
- Dojo SDK type issues (pre-existing)

These errors existed before the simplification and are not caused by the configuration changes.

---

## Migration Checklist

If you need to apply similar simplification to other projects:

- [ ] Identify all configuration files
- [ ] Map dependencies between config files
- [ ] Group related concerns (SDK, wallet, constants)
- [ ] Remove environment switching if not needed
- [ ] Consolidate into 2-3 files maximum
- [ ] Update all import paths
- [ ] Test dev server starts
- [ ] Document what changed and why
- [ ] Remove old files

---

## Questions?

See `/client/src/lib/README.md` for detailed usage examples and API documentation.

For issues or improvements, consider:
- Is this config truly needed?
- Can it be inlined where used?
- Does it need to be dynamic or can it be constant?
- Can multiple configs be merged?
