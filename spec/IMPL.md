# The Rōnin's Pact — Implementation Plan

> **Version**: 1.0
> **Target**: Serverless quest system with dynamic NFT on Starknet
> **Integration**: Cartridge Controller + Static Frontend

---

## Code References

### Key Repositories

**Cartridge Controller (Cairo Contracts)**
- GitHub: https://github.com/cartridge-gg/controller-cairo
- Key files:
  - Signer list interface: [src/signer_storage/interface.cairo](https://github.com/cartridge-gg/controller-cairo/blob/main/src/signer_storage/interface.cairo)
  - Signer list implementation: [src/signer_storage/signer_list.cairo](https://github.com/cartridge-gg/controller-cairo/blob/main/src/signer_storage/signer_list.cairo)
  - Account interface: [src/account/interface.cairo](https://github.com/cartridge-gg/controller-cairo/blob/main/src/account/interface.cairo)
  - Signers documentation: [docs/signers_and_signatures.md](https://github.com/cartridge-gg/controller-cairo/blob/main/docs/signers_and_signatures.md)

**Cartridge Controller (TypeScript/Frontend)**
- GitHub: https://github.com/cartridge-gg/controller
- Docs: https://docs.cartridge.gg/controller/getting-started
- Key packages:
  - `@cartridge/connector` - Wallet connector for Starknet React
  - `@cartridge/controller` - Controller SDK
  - `@cartridge/ui` - UI components and utilities (includes GraphQL client)

**OpenZeppelin Cairo Contracts**
- GitHub: https://github.com/OpenZeppelin/cairo-contracts
- Docs: https://docs.openzeppelin.com/contracts-cairo/
- Key files:
  - ERC721 Component: [src/token/erc721/](https://github.com/OpenZeppelin/cairo-contracts/tree/main/src/token/erc721)
  - Ownable Component: [src/access/ownable/](https://github.com/OpenZeppelin/cairo-contracts/tree/main/src/access/ownable)

**Dojo Engine**
- GitHub: https://github.com/dojoengine/dojo
- Docs: https://book.dojoengine.org/
- Relevant for:
  - Understanding Dojo game patterns
  - Local testing with Katana (Dojo's local node)
  - Quiz questions about Dojo 1.7

**Starknet.js**
- GitHub: https://github.com/starknet-io/starknet.js
- Docs: https://starknetjs.com/
- Core library for Starknet interactions

---

## 1. Technology Stack

### Smart Contracts
- **Language**: Cairo 2.x (latest stable)
- **Framework**: Scarb for contract management
- **Standards**: OpenZeppelin Cairo Contracts for ERC721 base
- **Testing**: Starknet Foundry (snforge) for contract tests

### Frontend
- **Framework**: Vite + React (single-page application)
- **Wallet Integration**:
  - `@cartridge/connector` - Controller wallet connector
  - `@cartridge/controller` - Controller SDK
  - `@cartridge/ui` - Cartridge UI components and utilities
  - `@starknet-react/core` - React hooks for Starknet
  - `@starknet-react/chains` - Chain configurations
  - `starknet.js` - Core Starknet interactions
- **UI Library**: Tailwind CSS + Cartridge UI components
- **State Management**: React hooks + Starknet React context
- **Build**: Static site generation for serverless deployment

### Infrastructure
- **Hosting**: Vercel, Netlify, or GitHub Pages (fully static)
- **RPC**: Cartridge RPC endpoints (https://api.cartridge.gg/x/starknet/{mainnet,sepolia}

---

## 2. Smart Contract Architecture

### 2.1 Contract Overview

The system requires **two main contracts**:

#### A. `RoninPact.cairo` (Dynamic ERC721 NFT)
**Purpose**: The participation NFT that evolves as users complete trials

**Key Features**:
- ERC721 compliant using OpenZeppelin components
- **One mint per wallet** enforcement
- Dynamic metadata/artwork based on completion state
- **Four visual states**: Base (0/3), +Waza (1/3), +Chi (2/3), +Shin (3/3)
- Token URI updates automatically based on trial completion

**State Storage**:
```cairo
// Per-wallet completion tracking
struct TrialProgress {
    waza_complete: bool,    // Trial 1: Technique
    chi_complete: bool,     // Trial 2: Wisdom
    shin_complete: bool,    // Trial 3: Spirit
}

// Maps: wallet_address -> TrialProgress
// Maps: wallet_address -> token_id
// Maps: token_id -> wallet_address (standard ERC721 ownership)
```

**Core Functions**:
- `mint()` - Mints one Pact NFT per wallet (enforces 1-per-wallet rule)
- `complete_waza(proof: WazaProof)` - Marks Waza trial complete
- `complete_chi(quiz_answers: Array<felt252>)` - Validates and marks Chi complete
- `complete_shin(signer_guid: felt252)` - Marks Shin complete
- `get_progress(wallet: ContractAddress)` - Returns TrialProgress struct
- `token_uri(token_id: u256)` - Returns dynamic metadata based on progress
- `get_visual_state(token_id: u256)` - Returns state: 0-3 slashes lit

**Access Control**:
- Ownable pattern for admin functions (updating allowlists, quiz content)
- Public trial completion functions (with validation)

#### B. `QuestManager.cairo` (Trial Logic & Validation)
**Purpose**: Handles business logic for trial verification

**Key Components**:

**Trial 1 - Waza (Technique)**:
```cairo
// Storage: Array of allowlisted ERC721 contract addresses
@storage
struct Storage {
    allowlisted_collections: LegacyMap<u32, ContractAddress>,
    allowlist_length: u32,
    // ... other fields
}

// Function to check ownership
fn verify_waza_ownership(
    wallet: ContractAddress,
    collection: ContractAddress
) -> bool {
    // Call ERC721::balance_of on the target collection
    // Return true if balance > 0
}

// Admin function to update allowlist
fn set_allowlist(collections: Array<ContractAddress>) {
    // Only owner
}
```

**Trial 2 - Chi (Wisdom)**:
```cairo
// Storage: Quiz configuration (10 questions total, 3 shown per user)
struct QuizConfig {
    questions: LegacyMap<u32, ByteArray>,  // Question text (10 questions)
    answers: LegacyMap<u32, felt252>,       // Correct answer hashes
    num_questions: u32,                     // Total = 10
}

// Pseudo-random question selection based on wallet address
fn select_questions(wallet: ContractAddress) -> Array<u32> {
    // Derive 3 question indices from wallet address
    // Example: hash(wallet) % 10 for first question
    //          hash(wallet + 1) % 10 for second (ensuring no duplicates)
    //          hash(wallet + 2) % 10 for third (ensuring no duplicates)
    // Returns array of 3 question indices
}

// Validation function
fn verify_chi_answers(
    wallet: ContractAddress,
    submitted_answers: Array<felt252>
) -> bool {
    let question_indices = select_questions(wallet);
    // Verify submitted answers match correct answers for selected questions
    // Return true if all 3 correct
}

// Admin function to set quiz (all 10 questions)
fn set_quiz(questions: Array<ByteArray>, answer_hashes: Array<felt252>) {
    // Only owner
    assert(questions.len() == 10, 'Must provide 10 questions');
}
```

**Trial 3 - Shin (Spirit)**:
```cairo
// Interface for calling Controller account's signer verification
#[starknet::interface]
trait ISignerList<TContractState> {
    fn is_signer_in_list(self: @TContractState, signer_guid: felt252) -> bool;
}

// Validation function
fn complete_shin(
    signer_guid: felt252
) {
    let caller = get_caller_address();

    // 1. Call the Controller account's is_signer_in_list method
    let controller_dispatcher = ISignerListDispatcher { contract_address: caller };
    let is_valid_signer = controller_dispatcher.is_signer_in_list(signer_guid);

    // 2. Verify the signer GUID is registered on the caller's account
    assert(is_valid_signer, 'Signer not registered');

    // 3. Mark Shin trial complete
    mark_shin_complete(caller);

    // 4. Emit event recording which signer was used
    self.emit(ShinComplete {
        wallet: caller,
        signer_guid,
        timestamp: get_block_timestamp()
    });
}

// Event
#[derive(Drop, starknet::Event)]
struct ShinComplete {
    wallet: ContractAddress,
    signer_guid: felt252,        // The GUID of the signer used
    timestamp: u64,
}
```

**How it works**:
1. **Signer GUIDs**: Each signer on a Controller account has a unique GUID (hash of signer data)
2. **Frontend queries** available signers via GraphQL API
3. **User selects** a signer (Discord, Passkey, etc.)
4. **Contract verifies** the GUID is registered by calling `is_signer_in_list` on the caller's account
5. **No signatures needed** - just verification that the signer exists on the account

### 2.2 Contract Architecture Decision

**Option A: Monolithic Contract** (Recommended for v1)
- Combine `RoninPact` and `QuestManager` into a single contract
- **Pros**: Simpler deployment, atomic state updates, lower gas for cross-contract calls
- **Cons**: Larger contract, less modular

**Option B: Modular Contracts**
- Separate NFT contract and Quest logic
- `RoninPact` calls `QuestManager` for validations
- **Pros**: More modular, easier to upgrade quest logic
- **Cons**: More complex, additional deployment overhead

**Recommendation**: Start with **Option B** (modular) to make it easier to reference ERC721 in the future.

### 2.3 Dynamic NFT Metadata Strategy

**Challenge**: NFT metadata must update automatically when trials are completed.

**Solution**: On-chain metadata generation
```cairo
fn token_uri(token_id: u256) -> ByteArray {
    let owner = owner_of(token_id);
    let progress = get_progress(owner);
    let slashes = count_completed(progress);

    // Generate JSON metadata on-chain
    let metadata = format_metadata(token_id, progress, slashes);

    // Option 1: Return base64-encoded data URI
    // Option 2: Return IPFS URI with state parameter
    return metadata;
}
```

**Metadata Hosting Options**:

1. **Fully On-Chain** (Most Decentralized):
   - Store SVG image data in contract
   - Generate metadata JSON on-chain
   - Return as `data:application/json;base64,...`
   - **Pros**: Fully immutable, no external dependencies
   - **Cons**: Higher deployment cost, limited artwork complexity

2. **IPFS with State Parameter** (Balanced):
   - Host 4 artwork variants on IPFS
   - Return metadata pointing to IPFS with state param
   - Example: `ipfs://QmXXX/metadata?state=2`
   - **Pros**: Richer artwork, lower contract cost
   - **Cons**: Requires IPFS gateway to interpret state

3. **Dynamic API** (Not Recommended):
   - Would require server, violates serverless requirement

**Recommendation**: Use **Option 1 (On-chain)** with simple SVGs. SVG artwork is en route and will be embedded directly in the contract for full decentralization.

---

## 3. Frontend Architecture

### 3.1 Application Structure

```
src/
├── app/                   # Next.js app router (if using Next.js)
│   ├── layout.tsx
│   ├── page.tsx           # Main quest dashboard
│   └── globals.css
├── components/
│   ├── ConnectWallet.tsx   # Controller connection UI
│   ├── QuestDashboard.tsx  # Main dashboard component
│   ├── NFTPreview.tsx      # Live NFT artwork display
│   ├── TrialCard.tsx       # Reusable trial card component
│   ├── WazaTrial.tsx       # Trial 1 UI
│   ├── ChiTrial.tsx        # Trial 2 UI
│   ├── ShinTrial.tsx       # Trial 3 UI
│   └── ShareButton.tsx     # Twitter/X share button
├── lib/
│   ├── contracts/          # Contract ABIs and addresses
│   ├── starknet.ts         # Starknet provider config
│   ├── controller.ts       # Controller connector setup
│   └── constants.ts        # App constants (contract addresses, etc.)
├── hooks/
│   ├── useTrialProgress.ts # Hook to fetch user progress
│   ├── useWazaClaim.ts     # Hook for Waza trial interactions
│   ├── useChiQuiz.ts       # Hook for Chi trial interactions
│   └── useShinTrial.ts     # Hook for Shin trial interactions
└── types/
    └── index.ts            # TypeScript type definitions
```

### 3.2 Cartridge Controller Integration

**Setup** (`lib/controller.ts`):
```typescript
import { ControllerConnector } from "@cartridge/connector";
import { SessionPolicies } from "@cartridge/controller";

// Define session policies for gasless transactions
const RONIN_PACT_ADDRESS = "0x..."; // Contract address

const policies: SessionPolicies = {
  contracts: {
    [RONIN_PACT_ADDRESS]: {
      methods: [
        { name: "mint", entrypoint: "mint" },
        { name: "complete_waza", entrypoint: "complete_waza" },
        { name: "complete_chi", entrypoint: "complete_chi" },
        { name: "complete_shin", entrypoint: "complete_shin" },
      ],
    },
  },
};

export const controllerConnector = new ControllerConnector({
  policies,
  rpc: "https://api.cartridge.gg/x/starknet/mainnet", // Or Sepolia
});
```

**Provider Setup** (`app/layout.tsx` or `_app.tsx`):
```typescript
import { StarknetConfig, jsonRpcProvider } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { controllerConnector } from "@/lib/controller";

function provider(chain) {
  return jsonRpcProvider({
    rpc: () => ({ nodeUrl: "YOUR_RPC_URL" }),
  });
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StarknetConfig
          autoConnect
          chains={[mainnet, sepolia]}
          provider={provider}
          connectors={[controllerConnector]}
        >
          {children}
        </StarknetConfig>
      </body>
    </html>
  );
}
```

**Connection Component** (`components/ConnectWallet.tsx`):
```typescript
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";

export function ConnectWallet() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const controller = connectors[0] as ControllerConnector;

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={() => connect({ connector: controller })}>
      Connect with Controller
    </button>
  );
}
```

### 3.3 Trial Components

#### Trial 1 - Waza (Technique)

**Component**: `WazaTrial.tsx`

**Features**:
- Display allowlisted game collection buttons
- "Try All" button to check all collections at once
- Loading states during verification
- Success/error messaging

**Flow**:
1. User clicks "Claim via [Game]" or "Try All"
2. Frontend calls `verify_waza_ownership` for each collection
3. If ownership found, call `complete_waza` on contract
4. Show success message and update progress

**Hook**: `useWazaClaim.ts`
```typescript
export function useWazaClaim() {
  const { account } = useAccount();
  const contract = useContract({ address: RONIN_PACT_ADDRESS, abi: ABI });

  async function tryCollection(collectionAddress: string) {
    // 1. Check ownership via ERC721 balance_of call
    // 2. If owned, call complete_waza with proof
    // 3. Return result
  }

  async function tryAll(collections: string[]) {
    // Try each collection in sequence
    // Return first success or all failures
  }

  return { tryCollection, tryAll, isLoading, error };
}
```

#### Trial 2 - Chi (Wisdom)

**Component**: `ChiTrial.tsx`

**Features**:
- Display quiz questions inline
- Radio buttons or dropdown for answers
- Real-time validation feedback (optional)
- Submit button
- Allow retakes (configurable)

**Flow**:
1. Fetch quiz questions from contract or static config
2. User answers questions in UI
3. On submit, hash answers and call `complete_chi`
4. Contract validates answers on-chain
5. Show success/failure and update progress

**Hook**: `useChiQuiz.ts`
```typescript
export function useChiQuiz() {
  const { account } = useAccount();
  const contract = useContract({ address: RONIN_PACT_ADDRESS, abi: ABI });

  async function submitQuiz(answers: string[]) {
    // 1. Hash answers (if needed)
    // 2. Call complete_chi with answer array
    // 3. Handle success/error
  }

  return { submitQuiz, isLoading, error };
}
```

**Configuration**:
- Store quiz questions in `lib/quizData.ts` or fetch from contract
- Answers are hashed client-side before submission (or validated on-chain)

#### Trial 3 - Shin (Spirit)

**Component**: `ShinTrial.tsx`

**Features**:
- Signer selection UI (via Controller GraphQL API)
- Display available signers with their types (Discord, Passkey, etc.)
- "Complete Trial" button
- Show success confirmation

**Flow**:
1. Frontend queries Controller GraphQL API to get user's registered signers
2. Display signer options to user
3. User selects a signer (Passkey, Discord, external wallet)
4. User clicks "Complete Trial"
5. Frontend calls `complete_shin(signer_guid)` on contract
6. Contract verifies signer is registered on the user's Controller account
7. Show success and update progress

**Hook**: `useShinTrial.ts`
```typescript
import { useAccount } from "@starknet-react/core";
import { useContract } from "@starknet-react/core";
import { cartridgeClient } from "@cartridge/ui/utils/api/cartridge";

// Type definitions from Controller codebase
type CredentialType = "WebauthnCredentials" | "Eip191Credentials";

interface Signer {
  guid: string;  // The signer GUID (felt252 hash)
  metadata: {
    __typename: CredentialType;
    eip191?: Array<{ provider: string }>;
  };
  isRevoked: boolean;
}

export function useShinTrial() {
  const { account, address } = useAccount();
  const contract = useContract({ address: RONIN_PACT_ADDRESS, abi: ABI });

  // Query signers via GraphQL API
  async function getSigners(): Promise<Array<{
    guid: string;
    type: string;  // "discord", "webauthn", "google", "metamask", etc.
    isRevoked: boolean;
  }>> {
    if (!address) return [];

    // Fetch signers from Controller's GraphQL API
    const query = `
      query GetControllerSigners($address: String!) {
        controller(address: $address) {
          signers {
            guid
            metadata {
              __typename
              ... on Eip191Credentials {
                eip191 {
                  provider
                }
              }
            }
            isRevoked
          }
        }
      }
    `;

    const response = await cartridgeClient.request(query, { address });
    const signers = response?.controller?.signers || [];

    // Map to simplified signer info with GUIDs
    return signers
      .map((signer: Signer) => ({
        guid: signer.guid,
        type: credentialToAuthType(signer.metadata),
        isRevoked: signer.isRevoked,
      }))
      .filter((s) => !s.isRevoked);
  }

  // Helper function to determine signer type for display
  function credentialToAuthType(metadata: Signer['metadata']): string {
    switch (metadata.__typename) {
      case "Eip191Credentials":
        return metadata.eip191?.[0]?.provider || "eip191";
      case "WebauthnCredentials":
        return "webauthn";
      default:
        return "unknown";
    }
  }

  // Complete the Shin trial with selected signer
  async function completeTrial(signerGuid: string) {
    if (!account) throw new Error("No account connected");

    // Call complete_shin with just the signer GUID
    // Contract will verify it's registered on the caller's account
    const tx = await account.execute({
      contractAddress: RONIN_PACT_ADDRESS,
      entrypoint: "complete_shin",
      calldata: [signerGuid],  // Just the GUID, no signatures needed!
    });

    await account.waitForTransaction(tx.transaction_hash);
    return tx;
  }

  return { completeTrial, getSigners, isLoading, error };
}
```

**Signer Detection Implementation**:

Based on the Cartridge Controller source code:

1. **Discord Signers**:
   - Type: `Eip191Credentials`
   - Provider: `eip191[0].provider === "discord"`

2. **Passkey Signers**:
   - Type: `WebauthnCredentials`
   - Uses platform or roaming authenticators (Face ID, fingerprint, Yubikey)

3. **Other Signers**:
   - Google: `Eip191Credentials` with `provider === "google"`
   - MetaMask/External: `Eip191Credentials` with respective provider

**Implementation Flow**:
1. Query Controller's GraphQL API to fetch all signers and their GUIDs for the connected account
2. Filter out revoked signers
3. Map signer metadata to user-friendly types ("discord", "webauthn", etc.)
4. Display signer selection UI in the frontend
5. User selects a signer
6. Call `complete_shin(signer_guid)` with the selected signer's GUID
7. Contract calls `is_signer_in_list` on the caller's Controller account to verify
8. If valid, trial is marked complete and event is emitted

### 3.4 Quest Dashboard

**Component**: `QuestDashboard.tsx`

**Layout**:
```
+------------------------------------------+
| [Connect Wallet Button]     [@username]  |
+------------------------------------------+
|                                          |
|     [NFT Preview - Live Render]          |
|     Shows current state: 0-3 slashes     |
|                                          |
+------------------------------------------+
| Progress: [●●○] 2/3 Trials Complete      |
+------------------------------------------+
|                                          |
| [Trial 1: Waza - COMPLETED ✓]           |
| "The Way of Technique"                   |
|                                          |
+------------------------------------------+
|                                          |
| [Trial 2: Chi - IN PROGRESS]            |
| "The Way of Wisdom"                      |
| [Take Quiz Button]                       |
|                                          |
+------------------------------------------+
|                                          |
| [Trial 3: Shin - LOCKED 🔒]             |
| "The Way of Spirit"                      |
| Unlocks after completing Trials 1 & 2    |
|                                          |
+------------------------------------------+
| [Share on X Button]                      |
+------------------------------------------+
```

**Features**:
- Real-time progress fetching on wallet connection
- Auto-refresh on transaction confirmation
- State-based UI (Locked, In Progress, Completed)
- Responsive design for mobile

**State Management**:
```typescript
interface TrialState {
  waza: "locked" | "available" | "in_progress" | "completed";
  chi: "locked" | "available" | "in_progress" | "completed";
  shin: "locked" | "available" | "in_progress" | "completed";
}

function useQuestState() {
  const { address } = useAccount();
  const [state, setState] = useState<TrialState>({
    waza: "available",
    chi: "locked",
    shin: "locked",
  });

  useEffect(() => {
    if (address) {
      fetchProgress(address).then((progress) => {
        // Update state based on progress
        // Example logic:
        // - Waza: always available if not complete
        // - Chi: available after Waza OR immediately (per spec)
        // - Shin: available after Chi OR immediately (per spec)
        updateState(progress);
      });
    }
  }, [address]);

  return state;
}
```

**Note**: Spec states trials can be completed independently, but UI can show sequential unlocking for UX clarity. Need to clarify if trials are gated or all available from start.

### 3.5 NFT Preview Component

**Component**: `NFTPreview.tsx`

**Features**:
- Fetches current token URI from contract
- Renders artwork based on progress state
- Shows visual progression (0-3 slashes lit)
- Animates transitions between states

**Implementation Options**:

1. **Fetch from Contract**:
   - Call `token_uri(token_id)` to get metadata
   - Parse and display artwork

2. **Compute Locally**:
   - Fetch progress state
   - Render artwork client-side based on state
   - Faster, no extra RPC calls

**Recommendation**: Compute locally for better UX, but validate against contract data.

### 3.6 Share on X Feature

**Component**: `ShareButton.tsx`

```typescript
export function ShareButton({ progress }) {
  const numComplete = countCompleted(progress);

  const shareText = encodeURIComponent(
    `I've completed ${numComplete}/3 trials in The Rōnin's Pact! ⚔️\n\n` +
    `Join the game jam and forge your own pact.\n\n` +
    `#RoninsPact #DojoEngine #Starknet`
  );

  const shareUrl = encodeURIComponent("https://ronin-pact.xyz"); // Update with actual URL

  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;

  return (
    <a
      href={twitterUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="share-button"
    >
      Share on X
    </a>
  );
}
```

---

## 4. Implementation Phases

### Phase 1: Frontend Foundation

**Tasks**:
1. Set up frontend project
   - Initialize Next.js/Vite project
   - Install dependencies (Cartridge, Starknet React, UI library)

2. Configure Cartridge Controller integration
   - Create connector with session policies
   - Set up StarknetConfig provider

3. Build core components
   - ConnectWallet component
   - QuestDashboard layout
   - TrialCard reusable component

4. Implement state management
   - Progress fetching hook
   - Real-time updates on tx confirmation

5. Add error handling and loading states
   - User-friendly error messages
   - Loading spinners and skeletons

**Deliverables**:
- Working frontend shell with Controller connection
- Dashboard displaying mock data
- Component library documented

### Phase 2: Smart Contract Development

**Tasks**:
1. Set up Cairo development environment
   - Install Scarb, Starknet Foundry
   - Create project structure

2. Implement base ERC721 with OpenZeppelin
   - Import and configure ERC721Component
   - Add mint function with 1-per-wallet enforcement

3. Implement trial completion logic
   - Waza: ownership verification
   - Chi: quiz validation with pseudo-random question selection
   - Shin: signer registration verification via is_signer_in_list

4. Implement dynamic metadata generation
   - `token_uri` function
   - On-chain or IPFS-based metadata

5. Write comprehensive tests
   - Unit tests for each trial
   - Integration tests for full flow
   - Edge cases (double mint, replay attacks, etc.)
   - Test pseudo-random quiz selection logic

6. Local development and testing
   - Test with Starknet Devnet or Katana (Dojo's local node)
   - Validate all trial flows locally
   - Test with actual SVG artwork when available

**Deliverables**:
- `RoninPact.cairo` (monolithic contract)
- Contract ABIs for frontend
- Test coverage report (>90% target)
- Local deployment scripts
- Deployment checklist for mainnet

**Blockers/Risks**:
- **OpenZeppelin version**: Ensure compatibility with latest Cairo 2.x
- **Gas optimization**: Dynamic metadata generation with SVGs may be expensive
- **SVG artwork delivery**: Need final artwork for testing and deployment

### Phase 3: Trial Implementation

**Tasks**:
1. **Waza Trial**:
   - UI for game collection buttons
   - "Try All" functionality
   - Ownership checking via contract calls
   - Transaction submission

2. **Chi Trial**:
   - Quiz UI with questions
   - Answer submission
   - Success/failure feedback

3. **Shin Trial**:
   - Query available signers via GraphQL
   - Signer selection interface
   - Call complete_shin with selected signer GUID
   - Contract verifies signer is registered on caller's account

4. NFT Preview component
   - Fetch and display token metadata
   - Visual state rendering

5. Share button implementation

**Deliverables**:
- Fully functional trial components
- End-to-end user flows working on testnet
- Error handling for all edge cases

### Phase 4: Polish & Testing

**Tasks**:
1. UI/UX refinement
   - Responsive design for mobile
   - Accessibility improvements (keyboard nav, ARIA labels)
   - Animations and transitions

2. Comprehensive testing
   - E2E tests with Playwright or Cypress
   - Manual testing of all flows
   - Cross-browser testing

3. Documentation
   - User guide / FAQ
   - Developer README
   - Deployment guide

4. Performance optimization
   - RPC call batching
   - Loading state improvements
   - Image optimization

**Deliverables**:
- Production-ready application
- Test suite with high coverage
- Documentation

### Phase 5: Deployment & Launch

**Tasks**:
1. Mainnet contract deployment
   - Final security review of contract code
   - Deploy contracts to Starknet mainnet
   - Initialize with production data (allowlist, quiz questions, SVG artwork)
   - Verify contracts on Voyager/Starkscan

2. Frontend deployment
   - Build static site with production contract addresses
   - Deploy to Vercel/Netlify/GitHub Pages
   - Configure custom domain (if applicable)
   - Set up HTTPS and CDN

3. Post-deployment validation
   - Test all trial flows on mainnet
   - Verify NFT minting and metadata display
   - Check signer detection and vow submission
   - Validate quiz randomization

4. Launch preparation
   - Prepare announcement materials
   - Social media assets
   - User documentation / FAQ
   - Community Discord/Telegram announcements

5. Monitoring setup
   - Set up analytics (Plausible, Simple Analytics for privacy-friendly tracking)
   - Error monitoring (Sentry or similar)
   - Transaction monitoring dashboard
   - Alert system for critical failures

**Deliverables**:
- Live application on mainnet
- Public contract addresses and block explorer links
- Launch announcement and promotional materials
- Monitoring dashboards active

---

## 5. Configuration & Content Needs

### 5.1 Contract Configuration

**Allowlist for Waza Trial**:
```cairo
// Example allowlisted collections (TO BE FILLED)
const ALLOWLIST: [ContractAddress; 3] = [
    0x..., // Pistols at 10 Blocks NFT
    0x..., // Loot Survivor Season Pass
    0x..., // Blob Arena Round NFT
];
```

**Quiz for Chi Trial**:
```cairo
// Example quiz (TO BE FILLED)
struct Question {
    text: "What is the primary benefit of Dojo's ECS architecture?",
    correct_answer_hash: hash("composability"),
}

// Questions:
// 1. What is the primary benefit of Dojo's ECS architecture?
//    - A) Speed  B) Composability  C) Security  D) Simplicity
// 2. In Dojo 1.7, what is the purpose of the World contract?
//    - A) Store models  B) Registry and access control  C) NFT minting  D) RPC endpoint
// 3. What does the #[dojo::model] macro do in Cairo?
//    - A) Creates UI  B) Defines storage structure  C) Deploys contracts  D) Tests code
```

**Vow Template for Shin Trial** (optional suggestion):
```
I, [username], vow to:
- Build an engaging onchain game during the jam
- Support the Dojo community
- Uphold the spirit of open-source gaming
```

### 5.2 NFT Artwork

**Requirements**:
- 4 visual states showing progressive "forging" of the pact
- State 0: Base artwork, no slashes lit
- State 1: First slash (Waza) lit/highlighted
- State 2: Second slash (Chi) lit
- State 3: Third slash (Shin) lit - "Fully Forged Pact"

**Format Options**:
- **SVG**: For on-chain storage (recommended if artwork is simple)
- **PNG/WebP**: For IPFS hosting (if artwork is more complex)

**Dimensions**: 512x512 or 1024x1024 recommended for NFT standards

**Metadata Example**:
```json
{
  "name": "The Rōnin's Pact #123",
  "description": "A dynamic NFT representing completion of pre-jam trials for [Game Jam Name].",
  "image": "ipfs://QmXXX/state-2.png",
  "attributes": [
    {"trait_type": "Waza (Technique)", "value": "Complete"},
    {"trait_type": "Chi (Wisdom)", "value": "Complete"},
    {"trait_type": "Shin (Spirit)", "value": "Incomplete"},
    {"trait_type": "Progress", "value": "2/3"},
    {"trait_type": "State", "value": "Forging"}
  ]
}
```

---

## 6. Open Questions & Clarifications

### 6.1 Technical Clarifications

1. **Trial Gating**:
   - All trials should be available at the start, users can complete in any order

2. **Quiz Retry Logic**:
   - Users can attempt the trial as many times as they want

3. **Vow Privacy**:
   - N/A

4. **NFT Transferability**:
   - NFTs are regular ERC721s (transferable by default)

### 6.2 Content & Design

1. **Game Allowlist**: Which specific game contracts to allowlist? (e.g., Pistols, Loot Survivor, Blob Arena contract addresses)
2. **Quiz Questions**: Final quiz content (10 questions) ready? Need to draft?
3. **Domain Name**: Is `ronin-pact.xyz` (or similar) registered?

### 6.3 Deployment & Operations

1. **Timeline**: Hard deadline for game jam? When should this be live?
2. **Budget**: Any constraints on deployment costs or RPC usage?
3. **Admin Access**: Who will have admin access to update allowlists/quiz?

### 6.4 RESOLVED Clarifications

✅ **Frontend Framework**: Vite + React (single-page application)
✅ **NFT Artwork**: Simple SVGs en route for on-chain storage
✅ **Target Network**: Deploy directly to mainnet after local development
✅ **Quiz Format**: 10 questions total, 3 shown pseudo-randomly per user based on wallet address
✅ **Signer Verification**: Simplified to just check if signer GUID is registered on Controller account via `is_signer_in_list` - no message signing needed
✅ **Signer Detection**: Via Cartridge GraphQL API - query signers and their GUIDs, filter by type (Discord = `Eip191Credentials` with `provider === "discord"`, Passkeys = `WebauthnCredentials`)

---

## 7. Potential Enhancements (Post-v1)

These are explicitly **out of scope for v1** but could be considered for future iterations:

1. **Twitter/X Verification**: Track and verify share posts for bonus rewards
2. **Discord Role Assignment**: Integrate with Discord bot for automatic role grants
3. **Leaderboard**: Track completion times or other metrics
4. **NFT Rarity Tiers**: Different visual themes based on completion speed
5. **Additional Trials**: Expand beyond 3 trials for extended engagement
6. **Multiplayer Challenges**: Cooperative or competitive trials
7. **On-chain Indexing**: Use an indexer for faster data fetching (Apibara, Arkham)
8. **Mobile App**: Native mobile experience with Controller SDK
9. **Soulbound Tokens**: Make NFTs non-transferable (SBT standard)
10. **Quest Analytics**: Track trial completion rates and user behavior

---

## 8. Risk Assessment

### High Priority Risks

1. **Dynamic Metadata Complexity**:
   - **Risk**: On-chain metadata generation with SVGs may be expensive or hit size limits
   - **Mitigation**: Test early with actual SVG artwork; optimize SVG size; consider compression techniques

2. **Gas Costs**:
   - **Risk**: Users may need to pay gas for trial completions
   - **Mitigation**: Use Controller session policies for gasless transactions; budget for paymaster

3. **Contract Upgradeability**:
   - **Risk**: Need to update allowlists or quiz post-deployment
   - **Mitigation**: Include admin functions with access control; consider proxy pattern for future upgrades

4. **Pseudo-Random Quiz Selection**:
   - **Risk**: Simple hash-based selection may not be truly random, users might game it
   - **Mitigation**: Use deterministic selection based on wallet address (acceptable for v1); enhance with VRF in v2 if needed

### Medium Priority Risks

5. **RPC Rate Limits**:
   - **Risk**: Public RPC endpoints may rate-limit requests
   - **Mitigation**: Implement request caching; consider paid RPC provider

6. **IPFS Gateway Reliability**:
   - **Risk**: IPFS gateways can be slow or unavailable
   - **Mitigation**: Use multiple fallback gateways (Pinata, Infura, Cloudflare)

7. **Browser Compatibility**:
   - **Risk**: Controller/WebAuthn may not work on all browsers
   - **Mitigation**: Test on major browsers; provide clear compatibility messaging

### Low Priority Risks

8. **NFT Metadata Standards**:
   - **Risk**: OpenSea or other platforms may not properly render dynamic metadata
   - **Mitigation**: Follow ERC721 metadata standards closely; test on platforms early

---

## 9. Success Metrics

**Technical Metrics**:
- [ ] All trials functional with <2% error rate
- [ ] Contract tests with >90% coverage
- [ ] Page load time <3 seconds
- [ ] Transaction confirmation time <30 seconds

**User Experience Metrics**:
- [ ] Wallet connection success rate >95%
- [ ] Trial completion rate (target: 70% of users complete all 3)
- [ ] User-reported bugs <5 critical issues in first week

**Engagement Metrics**:
- [ ] X unique wallets mint Rōnin's Pact NFTs (target based on community size)
- [ ] Y% of minters complete all trials (target: 50%)
- [ ] Z social shares (target: X * 0.3)

---

## 10. Timeline Summary

| Phase | Duration | Key Milestones |
|-------|----------|----------------|
| **Phase 1**: Contracts | Week 1-2 | Local testing complete, ABIs ready |
| **Phase 2**: Frontend Foundation | Week 2-3 | Controller integration, dashboard shell |
| **Phase 3**: Trial Implementation | Week 3-4 | All trials functional locally |
| **Phase 4**: Polish & Testing | Week 4-5 | Production-ready, tests complete |
| **Phase 5**: Deployment | Week 5-6 | Mainnet launch |

**Total Estimated Timeline**: 5-6 weeks

**Critical Path**:
- SVG artwork delivery (by Week 3 for contract integration)
- Quiz content finalized (by Week 2)
- Contract local testing complete (end of Week 2)
- Mainnet deployment (Week 5)

---

## 11. Next Steps

1. **Immediate Actions**:
   - [ ] Answer open questions in Section 6
   - [ ] Finalize frontend framework choice
   - [ ] Set up development repositories (contracts + frontend)
   - [ ] Contact Cartridge team re: signer GUID access

2. **Week 1 Priorities**:
   - [ ] Initialize Cairo contract project with Scarb
   - [ ] Draft quiz questions and answers
   - [ ] Compile allowlist of game contracts
   - [ ] Begin contract development

3. **Communication**:
   - [ ] Schedule check-ins for progress updates
   - [ ] Set up shared documentation (Notion, GitHub wiki, etc.)
   - [ ] Create Discord/Telegram channel for development coordination

---

## 12. Resources & References

### Documentation
- [Cartridge Controller Docs](https://docs.cartridge.gg/controller/getting-started)
- [Starknet React Docs](https://www.starknet-react.com/docs/getting-started)
- [OpenZeppelin Cairo Contracts](https://docs.openzeppelin.com/contracts-cairo/)
- [Dojo Book](https://book.dojoengine.org/)
- [Starknet Documentation](https://docs.starknet.io/)

### Tools
- [Scarb](https://docs.swmansion.com/scarb/) - Cairo package manager
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/) - Testing framework
- [Voyager](https://voyager.online/) - Starknet block explorer
- [Starkscan](https://starkscan.co/) - Alternative explorer

### Community
- [Cartridge Discord](https://discord.gg/cartridge)
- [Dojo Discord](https://discord.gg/dojoengine)
- [Starknet Discord](https://discord.gg/starknet)

---

**End of Implementation Plan v1.0**

*This document is a living plan and will be updated as implementation progresses and questions are resolved.*
