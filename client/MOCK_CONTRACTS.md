# Mock Contract System

This document explains how to use the mock contract system for frontend development and testing.

## Overview

The mock contract system allows you to test all frontend flows without deploying contracts or connecting to a blockchain. It simulates contract interactions with realistic delays and state management.

## Enabling Mock Mode

### Option 1: Environment Variable (Recommended)

Add to your `.env` file:

```env
VITE_USE_MOCK_CONTRACTS=true
```

Then restart the dev server:

```bash
pnpm dev
```

### Option 2: Toggle in Code

The mock system checks `import.meta.env.VITE_USE_MOCK_CONTRACTS === 'true'` to determine if mocking is enabled.

## What Gets Mocked

All contract interactions are mocked when enabled:

### ✅ Trial Progress (`useTrialProgress`)
- **Mock Function**: `mockGetTrialProgress(address)`
- **Behavior**: Returns current mock state of all three trials
- **Delay**: 500ms

### ✅ Waza Trial (`useWazaClaim`)
- **Mock Functions**:
  - `mockCheckERC721Ownership(collectionAddress, ownerAddress)` - 400ms delay
  - `mockCompleteWaza(collectionAddress)` - 800ms delay
- **Behavior**:
  - Collections with "pistols" in the address always succeed
  - Other collections have 50% success rate
  - Successful completion updates mock state

### ✅ Chi Trial (`useChiQuiz`)
- **Mock Function**: `mockCompleteChi(answers)`
- **Behavior**:
  - Accepts any 3 answers as correct
  - Updates mock state on success
- **Delay**: 1000ms

### ✅ Shin Trial (`useShinTrial`)
- **Mock Functions**:
  - `mockGetSigners(address)` - 600ms delay
  - `mockCompleteShin(signerGuid)` - 800ms delay
- **Behavior**:
  - Returns 3 mock signers (webauthn, discord, google)
  - Any signer GUID completes the trial
  - Updates mock state on success

### ✅ Transaction Waiting
- **Mock Function**: `mockWaitForTransaction(txHash)`
- **Behavior**: Simulates transaction confirmation
- **Delay**: 1500ms

## Mock State Management

The mock system maintains in-memory state:

```typescript
{
  wazaComplete: boolean,
  chiComplete: boolean,
  shinComplete: boolean,
  mintedNFT: boolean
}
```

### Viewing Mock State

Open browser console and run:

```javascript
// Check if mocking is enabled
console.log(isMockEnabled())

// View current state
console.log(getMockState())
```

### Resetting Mock State

To reset all trials to incomplete:

```javascript
resetMockState()
```

Or simply refresh the page - mock state is not persisted.

## Console Logging

All mock operations log to the console with `[MOCK]` prefix:

```
[MOCK] Fetching trial progress for: 0x123...
[MOCK] Attempting Waza trial with collection: 0xpistols...
[MOCK] ✅ Waza trial completed!
[MOCK] Submitting Chi quiz answers: ["answer1", "answer2", "answer3"]
[MOCK] ✅ Chi trial completed!
[MOCK] Completing Shin trial with signer GUID: 0xmock_signer_webauthn_...
[MOCK] ✅ Shin trial completed!
```

## Testing Flows

With mock contracts enabled, you can test:

### 1. **Complete Journey** (Happy Path)
   1. Connect wallet
   2. View all 3 trials in "incomplete" state
   3. Complete Waza trial (try "pistols" collection or click "Try All")
   4. Complete Chi trial (answer 3 questions)
   5. Complete Shin trial (select any signer)
   6. See NFT preview update from 0/3 → 3/3
   7. Share button shows completion message

### 2. **Partial Completion**
   - Complete only 1 or 2 trials
   - Verify NFT shows correct number of lit slashes
   - Verify completed trials show checkmark/completed state

### 3. **Error Handling**
   - For Waza: Some collections will fail (no ownership)
   - Verify error messages display correctly

### 4. **Loading States**
   - All operations show loading spinners
   - Verify UI doesn't freeze during operations

## Switching to Real Contracts

When ready to use real contracts:

1. **Update `.env`**:
   ```env
   VITE_USE_MOCK_CONTRACTS=false
   VITE_RONIN_PACT_ADDRESS=0x... # Your deployed contract
   ```

2. **Restart dev server**:
   ```bash
   pnpm dev
   ```

3. **Deploy contracts** and ensure addresses are correct in `.env`

## Implementation Details

### Architecture

The mock system is implemented as a service layer (`src/lib/mockContracts.ts`) with:

- **Separation of concerns**: Mock logic is completely separate from hooks
- **Easy toggling**: Single environment variable controls mock mode
- **Realistic simulation**: Network delays and state management
- **Drop-in replacement**: Same function signatures as real contracts

### Hook Integration Pattern

Each hook follows this pattern:

```typescript
import { isMockEnabled, mockFunction } from '@/lib/mockContracts';

export function useHook() {
  const useMock = isMockEnabled();

  // Real contract setup (disabled when mocking)
  const { contract } = useContract({
    enabled: !useMock && !!address
  });

  // Function implementation
  const doSomething = async () => {
    if (useMock) {
      // Call mock implementation
      return await mockFunction();
    }

    // Call real contract
    return await contract.call();
  };
}
```

This ensures:
- ✅ Zero runtime overhead when mocks are disabled
- ✅ Clean separation between mock and real implementations
- ✅ Easy to maintain and debug

## Troubleshooting

### Mock mode not working?

1. **Check environment variable**:
   ```bash
   echo $VITE_USE_MOCK_CONTRACTS
   ```

2. **Restart dev server** after changing `.env`

3. **Check browser console** for `[MOCK]` logs

4. **Verify in code**:
   ```javascript
   import.meta.env.VITE_USE_MOCK_CONTRACTS === 'true'
   ```

### State not updating?

- Mock state is in-memory only
- Refresh page to reset
- Call `resetMockState()` from console

### Real contracts not working after disabling mocks?

- Ensure `VITE_USE_MOCK_CONTRACTS=false` in `.env`
- Verify contract addresses are correct
- Check wallet is connected to correct network

## Future Enhancements

Potential improvements to the mock system:

- [ ] Persist mock state to localStorage
- [ ] Add mock state UI panel for debugging
- [ ] Configurable success/failure rates
- [ ] Mock different error scenarios
- [ ] Record and replay mock interactions
- [ ] Export mock state for test fixtures

## Questions?

See the main README for general development information.
