# The Rōnin's Pact - Frontend Client

A serverless quest system built with Vite + React + TypeScript, integrating with Cartridge Controller for wallet management and Starknet for onchain interactions.

## Overview

The Rōnin's Pact is a dynamic NFT quest system where users complete three thematic trials:
- **Waza (Technique)**: Prove game ownership in Dojo-powered worlds
- **Chi (Wisdom)**: Demonstrate knowledge of Dojo 1.7
- **Shin (Spirit)**: Commit your spirit through signer verification

As trials are completed, a user's NFT evolves, lighting up one slash per trial completion (0/3 → 3/3 "Fully Forged Pact").

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Wallet Integration**: Cartridge Controller
- **Blockchain**: Starknet (Sepolia testnet / Mainnet)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Starknet React

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ConnectWallet.tsx        # Wallet connection UI
│   │   ├── QuestDashboard.tsx       # Main quest dashboard
│   │   ├── TrialCard.tsx            # Reusable trial card
│   │   ├── NFTPreview.tsx           # Live NFT visualization
│   │   ├── ShareButton.tsx          # Social sharing
│   │   ├── WazaTrial.tsx            # Trial 1: Technique
│   │   ├── ChiTrial.tsx             # Trial 2: Wisdom
│   │   ├── ShinTrial.tsx            # Trial 3: Spirit
│   │   └── providers/
│   │       └── StarknetProvider.tsx # Starknet + Cartridge setup
│   ├── hooks/
│   │   ├── useTrialProgress.ts      # Fetch trial progress
│   │   ├── useWazaClaim.ts          # Waza trial logic
│   │   ├── useChiQuiz.ts            # Chi trial logic
│   │   └── useShinTrial.ts          # Shin trial logic
│   ├── lib/
│   │   ├── controller.ts            # Controller connector setup
│   │   ├── starknet.ts              # Starknet provider config
│   │   ├── constants.ts             # App constants
│   │   └── contracts/
│   │       ├── RoninPact.abi.json   # Main contract ABI
│   │       └── ERC721.abi.json      # ERC721 interface
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # App entry point
│   └── index.css                    # Global styles + Tailwind
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Git

**Install pnpm** (if not already installed):
```bash
npm install -g pnpm
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Installation

1. **Install dependencies:**
   ```bash
   cd client
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` to set:
   - `VITE_RONIN_PACT_ADDRESS`: Contract address after deployment
   - `VITE_RPC_URL`: Starknet RPC endpoint (default: Cartridge Sepolia)
   - `VITE_USE_MOCK_CONTRACTS`: Set to `true` for mock mode, `false` for production

3. **Run development server:**
   ```bash
   pnpm dev
   ```

   Open https://localhost:5173

   **Note:** HTTPS is automatically configured via `vite-plugin-mkcert`. The first time you run the dev server, the plugin will generate trusted SSL certificates. If you see a browser security warning, it means the mkcert CA isn't trusted - run `brew install mkcert && mkcert -install` (macOS) to trust it.

### Build for Production

```bash
pnpm build
```

Outputs to `dist/` directory, ready for static hosting (Vercel, Netlify, GitHub Pages).

## Key Features

### 1. Wallet Connection (ConnectWallet.tsx)
- Integrates with Cartridge Controller
- Shows connection status and wallet address
- Dropdown menu with Profile, Settings, Disconnect options
- Responsive design with loading states

### 2. Quest Dashboard (QuestDashboard.tsx)
- Displays overall progress (X/3 trials)
- Live NFT preview showing visual progression
- Three trial cards with status badges
- Social sharing button
- Responsive grid layout

### 3. Trial Components

#### Waza Trial (WazaTrial.tsx)
- Lists allowlisted game collections
- "Try All" button to check all collections
- Verifies ERC721 ownership onchain
- Completes trial when ownership proven

#### Chi Trial (ChiTrial.tsx)
- 3-question quiz about Dojo 1.7
- Multiple choice interface
- Onchain answer validation
- Allows unlimited retakes

#### Shin Trial (ShinTrial.tsx)
- Fetches user's signers from Controller
- Displays signer types (Discord, Passkey, etc.)
- Completes trial by verifying signer registration
- No signatures required (just GUID verification)

### 4. NFT Preview (NFTPreview.tsx)
- Visual representation with 3 "slashes"
- Slashes light up as trials complete
- Animated transitions
- Glowing effect when fully complete

### 5. Social Sharing (ShareButton.tsx)
- Pre-filled Twitter/X compose window
- Dynamic message based on progress
- Includes hashtags and share URL

## Custom Hooks

All hooks support both mock mode (for testing) and production mode (for real contract interactions). Mock mode is controlled via the `VITE_USE_MOCK_CONTRACTS` environment variable.

### useTrialProgress
Fetches and tracks trial completion status from the RoninPact contract. Automatically watches for real-time updates when connected to a live contract.

**Location:** `src/hooks/useTrialProgress.ts`

```typescript
const { progress, isLoading, error, refetch } = useTrialProgress();
// progress: { waza_complete: bool, chi_complete: bool, shin_complete: bool }
```

**Implementation:**
- Uses `useReadContract` from `@starknet-react/core` to call `get_progress(address)` on the RoninPact contract
- In mock mode: Returns in-memory state from `mockContracts.ts`
- In production: Parses contract response as a tuple of `(bool, bool, bool)`
- Watch mode enabled for real-time progress updates

### useWazaClaim
Handles Waza trial (game ownership verification). Checks ERC721 ownership and submits proof to complete the trial.

**Location:** `src/hooks/useWazaClaim.ts`

```typescript
const { tryCollection, tryAll, isLoading, error, success } = useWazaClaim();
await tryCollection('0x123...'); // Try specific collection
await tryAll(); // Try all allowlisted collections
```

**Implementation:**
- `tryCollection(collectionAddress)`:
  1. Checks ERC721 ownership by calling `balance_of(address)` on the collection contract
  2. If balance > 0, calls `complete_waza(collection_address)` on RoninPact contract
  3. Waits for transaction confirmation
- `tryAll()`: Iterates through `ALLOWLISTED_COLLECTIONS`, stopping at first successful match
- In mock mode: Simulates ownership checks with 50% success rate (always succeeds for "pistols")
- Error handling includes specific messages for "no ownership" and "already completed" states

### useChiQuiz
Handles Chi trial (quiz submission and validation).

**Location:** `src/hooks/useChiQuiz.ts`

```typescript
const { submitQuiz, isLoading, error, success } = useChiQuiz();
await submitQuiz(['answer1', 'answer2', 'answer3']);
```

**Implementation:**
- `submitQuiz(answers)`: Sends array of answer strings to `complete_chi(answers)` entrypoint
- Answers are passed as felt252-compatible string array in calldata
- Contract validates answers onchain and completes trial if correct
- In mock mode: Always accepts answers as correct
- Error parsing detects "incorrect answers" and "already completed" states
- Allows unlimited retakes (contract handles retry logic)

### useShinTrial
Handles Shin trial (signer verification via Cartridge Controller). Fetches user's registered signers and submits selected signer GUID for verification.

**Location:** `src/hooks/useShinTrial.ts`

```typescript
const {
  availableSigners,     // Array of SignerInfo objects
  selectedSigner,       // Currently selected signer
  vowText,              // Optional vow text (UI-only)
  setVowText,           // Update vow text
  selectSigner,         // Select a signer
  completeVow,          // Submit trial completion
  isLoading,
  error,
  success
} = useShinTrial();

// Auto-fetches signers on mount when address is available
await completeVow(); // Complete with selected signer
```

**Implementation:**
- Auto-fetches signers via Cartridge GraphQL API (`https://api.cartridge.gg/query`)
- GraphQL query: `controller(address).signers` returns signer metadata including:
  - `guid`: Signer identifier (felt252)
  - `metadata.__typename`: Credential type (`WebauthnCredentials` or `Eip191Credentials`)
  - Provider info for Eip191 (Discord, Google, etc.)
  - `isRevoked`: Whether signer is active
- Filters out revoked signers
- `completeVow()`: Calls `complete_shin(signer_guid)` on contract
- **No signatures required**: Contract verifies GUID is registered on caller's account
- In mock mode: Returns mock signers (webauthn, discord, google)

### useTrialCompletion
Utility hook to trigger callbacks when trials complete successfully.

**Location:** `src/hooks/useTrialCompletion.ts`

```typescript
useTrialCompletion(success, onComplete);
// Calls onComplete() when success changes to true
```

## Configuration

### Contract Addresses

Update in `.env`:
```env
VITE_RONIN_PACT_ADDRESS=0x...
```

### Allowlisted Collections

Edit `src/lib/constants.ts`:
```typescript
export const ALLOWLISTED_COLLECTIONS: AllowlistedCollection[] = [
  {
    address: '0x...', // Contract address
    name: 'pistols',
    displayName: 'Pistols at 10 Blocks',
  },
  // Add more...
];
```

### Quiz Questions

Edit `src/components/ChiTrial.tsx`:
```typescript
const questions: QuizQuestion[] = [
  {
    id: 1,
    text: 'Your question here?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
  },
  // Add more...
];
```

### Session Policies

Edit `src/lib/controller.ts` to add contract methods for gasless transactions:
```typescript
const policies: SessionPolicies = {
  contracts: {
    [RONIN_PACT_ADDRESS]: {
      methods: [
        { name: "mint", entrypoint: "mint", description: "Mint NFT" },
        // Add more...
      ],
    },
  },
};
```

## Styling

Uses Tailwind CSS with custom ronin color scheme:
- `ronin-primary`: #E63946 (red highlights)
- `ronin-secondary`: #F1FAEE (light text)
- `ronin-accent`: #A8DADC (blue accents)
- `ronin-dark`: #1D3557 (dark background)
- `ronin-light`: #457B9D (light blue)

Modify in `tailwind.config.js`.

## Testing

The frontend is designed to work with:
1. **Local Development**: Connect to Katana (Dojo local node) or Starknet Devnet
2. **Testnet**: Sepolia testnet for pre-launch testing
3. **Mainnet**: Production deployment

### Testing Checklist

**Mock Mode Testing:**
- [ ] Enable mock mode: `VITE_USE_MOCK_CONTRACTS=true`
- [ ] Wallet connection/disconnection
- [ ] Each trial completion flow
- [ ] NFT preview updates correctly
- [ ] Error handling (no ownership, wrong answers, etc.)
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Share button opens Twitter with correct message
- [ ] Mock console logs appear with `[MOCK]` prefix

**Production Mode Testing:**
- [ ] Deploy contracts to testnet
- [ ] Disable mock mode: `VITE_USE_MOCK_CONTRACTS=false`
- [ ] Update contract addresses in `.env`
- [ ] Test all trial flows with real transactions
- [ ] Verify gas estimation and transaction fees
- [ ] Check contract event emission and indexing
- [ ] Test error cases (insufficient gas, incorrect answers, etc.)

## Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Build command: `pnpm build`
4. Install command: `pnpm install`

### Netlify
1. Connect GitHub repo to Netlify
2. Build command: `pnpm build`
3. Install command: `pnpm install`
4. Publish directory: `dist`
5. Set environment variables

### GitHub Pages
1. Build: `pnpm build`
2. Deploy `dist/` folder to `gh-pages` branch

## Dependencies

### Core
- `react` & `react-dom`: UI framework
- `vite`: Build tool
- `typescript`: Type safety

### Starknet & Wallet
- `@cartridge/connector`: Controller connector
- `@cartridge/controller`: Controller SDK
- `@cartridge/ui`: Cartridge UI utilities
- `@starknet-react/core`: Starknet React hooks
- `@starknet-react/chains`: Chain configurations
- `starknet`: Starknet.js library

### Styling
- `tailwindcss`: Utility-first CSS
- `autoprefixer` & `postcss`: CSS processing

## Architecture Decisions

### Why pnpm?
- Faster installations with efficient disk space usage
- Strict dependency resolution prevents phantom dependencies
- Monorepo support for potential future expansion
- Better performance than npm/yarn

### Why Vite?
- Fast HMR for development
- Optimized production builds
- Native ESM support
- Simple configuration

### Why Cartridge Controller?
- Seamless wallet UX for gamers
- Session keys for gasless transactions
- Built-in profile and settings UI
- Multi-signer support (Discord, Passkey, etc.)

### Why Serverless?
- No backend to maintain
- Lower operational costs
- Better decentralization
- Simpler deployment

## Mock Contract Implementation

The client includes a comprehensive mock system for testing and development without requiring deployed smart contracts. This allows full-stack frontend development before contracts are deployed.

### Overview

Mock contracts are implemented in `src/lib/mockContracts.ts` and provide simulated versions of all contract interactions. The system is designed to be a drop-in replacement for real contract calls, maintaining identical interfaces and return types.

**Location:** `src/lib/mockContracts.ts`

### Enabling Mock Mode

Set the environment variable in your `.env` file:

```env
VITE_USE_MOCK_CONTRACTS=true
```

All hooks automatically detect mock mode via `isMockEnabled()` and switch between real and mock implementations.

### Mock Architecture

**In-Memory State:**
```typescript
// Global mock state persists across function calls
let mockState = {
  wazaComplete: false,
  chiComplete: false,
  shinComplete: false,
  mintedNFT: false,
};
```

**Network Simulation:**
- All mock functions include artificial delays (400-1500ms) to simulate network latency
- Delays help test loading states and race conditions
- Transaction hashes are generated as `0xmock_{trial}_tx_{timestamp}`

### Mock Functions

#### mockGetTrialProgress(address)
Returns current trial completion state for a user.

```typescript
// Returns TrialProgress matching contract's (bool, bool, bool) tuple
await mockGetTrialProgress('0x123...');
// → { waza_complete: false, chi_complete: false, shin_complete: false }
```

#### mockCompleteWaza(address, collectionAddress)
Simulates Waza trial completion with conditional success logic.

```typescript
await mockCompleteWaza('0x123...', '0xpistols...');
// → { transaction_hash: '0xmock_waza_tx_...', success: true }
```

**Behavior:**
- Collections containing "pistols" in address: Always succeed
- Other collections: 50% random success rate
- Updates `mockState.wazaComplete` on success

#### mockCheckERC721Ownership(collectionAddress, ownerAddress)
Simulates ERC721 balance check.

```typescript
await mockCheckERC721Ownership('0xpistols...', '0x123...');
// → true (if collection contains "pistols") or 70% random chance
```

**Behavior:**
- Pistols collection: Always returns `true`
- Other collections: 30% chance of ownership

#### mockCompleteChi(answers)
Simulates quiz submission and always accepts answers.

```typescript
await mockCompleteChi(['answer1', 'answer2', 'answer3']);
// → { transaction_hash: '0xmock_chi_tx_...', success: true }
```

**Behavior:**
- Accepts any answers as correct (no validation)
- Updates `mockState.chiComplete` to `true`
- Allows testing quiz UI without answer constraints

#### mockCompleteShin(signerGuid)
Simulates signer verification and trial completion.

```typescript
await mockCompleteShin('0xmock_signer_webauthn_...');
// → { transaction_hash: '0xmock_shin_tx_...' }
```

**Behavior:**
- Accepts any signer GUID
- Updates `mockState.shinComplete` to `true`

#### mockGetSigners(address)
Returns mock signer credentials for testing multi-auth flows.

```typescript
await mockGetSigners('0x123...');
// → [
//   { guid: '0xmock_signer_webauthn_...', type: 'webauthn', isRevoked: false },
//   { guid: '0xmock_signer_discord_...', type: 'discord', isRevoked: false },
//   { guid: '0xmock_signer_google_...', type: 'google', isRevoked: false }
// ]
```

**Behavior:**
- Returns 3 mock signers: WebAuthn, Discord, Google
- GUIDs include timestamp for uniqueness
- All signers are active (not revoked)

#### mockMintNFT(address)
Simulates NFT minting transaction.

```typescript
await mockMintNFT('0x123...');
// → { transaction_hash: '0xmock_mint_tx_...' }
```

#### mockWaitForTransaction(txHash)
Simulates waiting for transaction confirmation (1.5s delay).

```typescript
await mockWaitForTransaction('0xmock_waza_tx_...');
// → void (after 1500ms)
```

### Utility Functions

#### resetMockState()
Resets all trial completion state to initial values.

```typescript
resetMockState();
// Clears all progress, useful for testing fresh user flows
```

#### getMockState()
Returns current mock state for debugging.

```typescript
const state = getMockState();
console.log(state);
// → { wazaComplete: true, chiComplete: false, ... }
```

### Integration with Hooks

Each hook checks `isMockEnabled()` and branches accordingly:

```typescript
const useMock = isMockEnabled();

if (useMock) {
  // Use mock functions from mockContracts.ts
  await mockCompleteWaza(address, collectionAddress);
} else {
  // Use real contract via starknet-react
  await account.execute({
    contractAddress: RONIN_PACT_ADDRESS,
    entrypoint: 'complete_waza',
    calldata: [collectionAddress],
  });
}
```

### Migration to Production

When transitioning from mocks to real contracts:

1. **Deploy contracts** to Sepolia/Mainnet
2. **Update `.env`**:
   ```env
   VITE_RONIN_PACT_ADDRESS=0x... # Deployed contract address
   VITE_USE_MOCK_CONTRACTS=false # Disable mocks
   ```
3. **No code changes required** - hooks automatically switch to production mode
4. **Test thoroughly** - Real contract calls may have different error cases and gas requirements

### Mock Console Logging

All mock functions log to console with `[MOCK]` prefix for visibility:

```
[MOCK] Fetching trial progress for: 0x123...
[MOCK] ✅ Waza trial completed!
[MOCK] ❌ No ownership found for this collection
```

This helps differentiate mock vs. production behavior during development.

### Limitations

- **No gas estimation**: Mocks don't account for transaction costs
- **Simplified validation**: Real contracts may have stricter requirements
- **No reverts**: Mocks generally succeed; real contracts may revert with specific error messages
- **No events**: Mock calls don't emit blockchain events
- **State isolation**: Mock state is browser-session only (not persisted)

## Troubleshooting

### "WebAuthn is not supported on sites with TLS certificate errors"
- This error occurs when HTTPS certificates aren't properly trusted
- Install and trust mkcert: `brew install mkcert && mkcert -install` (macOS)
- Restart your browser completely (Cmd+Q, not just close the tab)
- Clear localhost cache in browser settings if the issue persists

### "Controller not ready" error
- Ensure Cartridge keychain URL is accessible
- Check browser console for connection errors
- Try clearing cache and reconnecting

### Transaction failures
- Verify contract address is correct
- Check wallet has sufficient funds
- Ensure RPC endpoint is responsive
- Review contract error messages in console

### Signer detection not working
- Confirm GraphQL API is accessible
- Check wallet has registered signers
- Verify API URL in `.env`

## Future Enhancements

- [ ] Add analytics (Plausible/Simple Analytics)
- [ ] Implement error monitoring (Sentry)
- [ ] Add E2E tests (Playwright)
- [ ] Create storybook for components
- [ ] Add animation polish
- [ ] Implement dark/light mode toggle
- [ ] Add multilingual support

## Contributing

This is part of the Rōnin's Pact project. See main repository README for contribution guidelines.

## References

- [Cartridge Controller Docs](https://docs.cartridge.gg/controller/getting-started)
- [Starknet React Docs](https://www.starknet-react.com/)
- [Dojo Book](https://book.dojoengine.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## License

See main repository for license information.
