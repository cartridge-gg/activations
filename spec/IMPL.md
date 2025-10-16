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
- **Framework**: Vite + React 18 + TypeScript (single-page application)
- **Package Manager**: pnpm (for faster installs and strict dependency resolution)
- **Wallet Integration**:
  - `@cartridge/connector` - Controller wallet connector
  - `@cartridge/controller` - Controller SDK
  - `@cartridge/ui` - Cartridge UI utilities
  - `@starknet-react/core` - React hooks for Starknet
  - `@starknet-react/chains` - Chain configurations
  - `starknet` (v6.x) - Core Starknet interactions
- **UI Library**: Tailwind CSS (custom ronin color scheme)
- **State Management**: React hooks + Starknet React context
- **Build**: Static site generation for serverless deployment
- **Dev Tools**:
  - `vite-plugin-mkcert` - HTTPS support for local development (required for WebAuthn)
  - Mock contract system for frontend testing without deployed contracts

### Infrastructure
- **Hosting**: Vercel, Netlify, or GitHub Pages (fully static)
- **RPC**: Cartridge RPC endpoints (https://api.cartridge.gg/x/starknet/{mainnet,sepolia}

---

## 2. Smart Contract Architecture

### 2.1 Contract Overview

The system uses a **modular architecture** with two main components:

#### A. `RoninPact.cairo` (Dynamic ERC721 NFT)
**Location**: `contracts/src/tokens/pact.cairo`

**Purpose**: The participation NFT that evolves as users complete trials

**Key Features**:
- ERC721 compliant using OpenZeppelin components
- Dynamic on-chain SVG generation based on completion state
- **Four visual states**: Base (0/3), +Waza (1/3), +Chi (2/3), +Shin (3/3)
- Bit-flag storage for efficient trial progress tracking
- Minter-based access control for trial completion

**State Storage**:
```cairo
// Bit flags for efficient storage (3 bits = 3 trials)
const WAZA_BIT: u8 = 0x04;  // 0b100
const CHI_BIT: u8 = 0x02;   // 0b010
const SHIN_BIT: u8 = 0x01;  // 0b001

#[storage]
struct Storage {
    #[substorage(v0)]
    erc721: ERC721Component::Storage,
    #[substorage(v0)]
    src5: SRC5Component::Storage,
    owner: ContractAddress,
    minter: ContractAddress,           // Address authorized to mark trials complete
    token_count: u256,                 // Sequential token IDs
    token_progress: Map<u256, u8>,     // Token ID -> bit flags
}

// Public struct for reading progress
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct TrialProgress {
    pub waza_complete: bool,
    pub chi_complete: bool,
    pub shin_complete: bool,
}
```

**Core Functions**:
- `mint()` - Mints a Pact NFT to the caller (no 1-per-wallet enforcement at contract level)
- `complete_waza(token_id: u256)` - Marks Waza trial complete (minter-only)
- `complete_chi(token_id: u256)` - Marks Chi trial complete (minter-only)
- `complete_shin(token_id: u256)` - Marks Shin trial complete (minter-only)
- `get_progress(token_id: u256)` - Returns TrialProgress struct
- `token_uri(token_id: u256)` - Returns data URI with inline SVG
- `set_minter(minter: ContractAddress)` - Sets authorized minter address (owner-only)

**Access Control**:
- Owner: Can set minter address
- Minter: Can mark trials complete (typically the Dojo actions contract)
- Anyone: Can mint NFTs and read progress

**Events**:
```cairo
#[derive(Drop, starknet::Event)]
struct WazaCompleted { token_id: u256 }

#[derive(Drop, starknet::Event)]
struct ChiCompleted { token_id: u256 }

#[derive(Drop, starknet::Event)]
struct ShinCompleted { token_id: u256 }
```

#### B. `actions.cairo` (Dojo Contract - Trial Logic & Validation)
**Location**: `contracts/src/systems/actions.cairo`

**Purpose**: Validates trial completion requirements and calls NFT contract

**Architecture**: Dojo contract with models for configuration storage

**Dojo Models** (`contracts/src/models.cairo`):
```cairo
// All models use game_id: u32 = 0 as singleton key

#[dojo::model]
pub struct RoninOwner {
    #[key] pub game_id: u32,
    pub owner: ContractAddress,
}

#[dojo::model]
pub struct RoninPact {
    #[key] pub game_id: u32,
    pub pact: ContractAddress,        // NFT contract address
}

#[dojo::model]
pub struct RoninController {
    #[key] pub game_id: u32,
    pub controller: ContractAddress,  // Global Controller for verification
}

#[dojo::model]
pub struct RoninGames {
    #[key] pub game_id: u32,
    pub games: Array<ContractAddress>,  // Allowlisted game collections
}

#[dojo::model]
pub struct RoninAnswers {
    #[key] pub game_id: u32,
    pub answers: Array<felt252>,      // Quiz answer hashes
}
```

**Trial Logic**:

**Trial 1 - Waza (Technique)**:
```cairo
fn complete_waza(ref self: ContractState, token_id: u256) {
    let caller = get_caller_address();
    let world = self.world_default();

    let games_config: RoninGames = world.read_model(0);
    let pact_config: RoninPact = world.read_model(0);

    // Check balance across all allowlisted game collections
    let mut balance: u256 = 0;
    for game in games_config.games {
        let erc721 = IERC721Dispatcher { contract_address: game };
        balance += erc721.balance_of(caller);
    };

    assert(balance >= 1, 'No tokens owned!');

    // Mark trial complete in NFT contract
    let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
    nft.complete_waza(token_id);
}
```

**Trial 2 - Chi (Wisdom)**:
```cairo
fn complete_chi(
    ref self: ContractState,
    token_id: u256,
    questions: Array<u32>,     // Question indices selected by player
    answers: Array<felt252>    // Player's answer hashes
) {
    let world = self.world_default();
    let answers_config: RoninAnswers = world.read_model(0);
    let pact_config: RoninPact = world.read_model(0);

    // Verify answer count matches question count
    assert(questions.len() == answers.len(), 'Question/answer mismatch');

    // Check correctness
    let mut correct: u256 = 0;
    for i in 0..questions.len() {
        let question_idx = *questions.at(i);
        let answer_hash = *answers.at(i);
        let expected_hash = *answers_config.answers.at(question_idx);

        if answer_hash == expected_hash {
            correct += 1;
        }
    };

    assert(correct >= 3, 'Incorrect answers!');

    // Mark trial complete in NFT contract
    let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
    nft.complete_chi(token_id);
}
```

**Note**: The current implementation does NOT use pseudo-random question selection. The frontend selects questions and submits them along with answers. The contract validates that at least 3 answers are correct.

**Trial 3 - Shin (Spirit)**:
```cairo
use ronin_quest::controller::eip191::{Signer, SignerTrait};
use ronin_quest::controller::interface::{
    IMultipleOwnersDispatcher,
    IMultipleOwnersDispatcherTrait
};

fn complete_shin(ref self: ContractState, token_id: u256, signer: Signer) {
    let world = self.world_default();
    let pact_config: RoninPact = world.read_model(0);
    let controller_config: RoninController = world.read_model(0);

    // Convert signer to its GUID (globally unique identifier)
    let signer_guid = signer.into_guid();

    // Create dispatcher to the global Controller contract
    let controller = IMultipleOwnersDispatcher {
        contract_address: controller_config.controller
    };

    // Verify the signer GUID is registered in the Controller
    let is_owner = controller.is_owner(signer_guid);
    assert(is_owner, 'Signer not registered');

    // Mark trial complete in NFT contract
    let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
    nft.complete_shin(token_id);
}
```

**Admin Functions**:
- `set_owner(owner: ContractAddress)` - Transfer ownership
- `set_pact(pact: ContractAddress)` - Set NFT contract address
- `set_controller(controller: ContractAddress)` - Set global Controller address
- `set_games(games: Array<ContractAddress>)` - Update allowlisted games
- `set_quiz(answers: Array<felt252>)` - Update quiz answer hashes

All admin functions are protected by `assert_only_owner()`.

**Initialization**:
```cairo
fn dojo_init(ref self: ContractState) {
    let mut world = self.world_default();
    let caller = get_caller_address();
    world.write_model(@RoninOwner { game_id: 0, owner: caller });
}
```

### 2.2 Architectural Details

**Chosen Architecture**: Modular (Option B)
- ✅ Separate NFT contract (`RoninPact`) and game logic (`actions`)
- ✅ NFT contract is reusable and can be integrated with other systems
- ✅ Game logic uses Dojo for configuration storage
- ✅ Minter pattern allows NFT contract to be agnostic of validation logic

**Communication Flow**:
1. Player calls `actions.complete_waza(token_id)`
2. Actions contract validates requirements (game ownership)
3. Actions contract calls `ronin_pact.complete_waza(token_id)`
4. Pact contract verifies caller is authorized minter
5. Pact contract updates bit flags and emits event
6. NFT metadata automatically reflects new state

### 2.3 Dynamic NFT Metadata Strategy

**Implementation**: Fully On-Chain SVG Generation

The contract generates SVG artwork dynamically in the `token_uri()` function based on trial completion state.

**Actual Implementation** (`contracts/src/tokens/pact.cairo`):
```cairo
fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
    self.generate_svg(token_id)
}

fn generate_svg(self: @ContractState, token_id: u256) -> ByteArray {
    let progress = self.get_progress(token_id);

    let mut svg: ByteArray = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>";

    // Background with radial gradient
    svg.append(@self.get_background());

    // Base pact symbol (concentric circles + title)
    svg.append(@self.get_base_pact());

    // Add completed trial slashes conditionally
    if progress.waza_complete {
        svg.append(@self.get_waza_slash());  // Red diagonal (top-left to bottom-right)
    }
    if progress.chi_complete {
        svg.append(@self.get_chi_slash());   // Blue diagonal (top-right to bottom-left)
    }
    if progress.shin_complete {
        svg.append(@self.get_shin_slash());  // Purple vertical (top to bottom)
    }

    // Golden glow effect when all three trials complete
    if progress.waza_complete && progress.chi_complete && progress.shin_complete {
        svg.append(@self.get_completion_glow());
    }

    svg.append(@"</svg>");

    // Return as data URI
    let mut data_uri: ByteArray = "data:image/svg+xml;utf8,";
    data_uri.append(@svg);
    data_uri
}
```

**Visual Design**:
- **Base State** (0/3): Dark blue background with concentric gray circles
- **Waza Complete** (+1/3): Red diagonal slash with gradient and glow effect, "WAZA" label
- **Chi Complete** (+2/3): Blue diagonal slash (opposite direction), "CHI" label
- **Shin Complete** (+3/3): Purple vertical slash, "SHIN" label
- **All Complete** (3/3): Golden radial glow effect, "FORGED" label

**Technical Details**:
- SVG elements use gradients and filters for visual effects
- Each slash has its own gradient definition and glow filter
- Data URI format: `data:image/svg+xml;utf8,<svg>...</svg>`
- No base64 encoding (direct UTF-8 SVG in data URI)
- Fully deterministic based on token progress bits

**Benefits**:
- ✅ Fully on-chain and immutable
- ✅ No external dependencies (IPFS, APIs, etc.)
- ✅ Automatic updates when trials are completed
- ✅ Rich visual effects with SVG gradients and filters
- ✅ Standards-compliant ERC721 metadata

---

## 3. Frontend Architecture

### 3.1 Application Structure

**Implemented Structure** (Vite + React):

```
client/
├── src/
│   ├── components/
│   │   ├── ConnectWallet.tsx        # Controller connection UI
│   │   ├── QuestDashboard.tsx       # Main quest dashboard
│   │   ├── NFTPreview.tsx           # Live NFT artwork display
│   │   ├── TrialCard.tsx            # Reusable trial card component
│   │   ├── WazaTrial.tsx            # Trial 1: Game ownership
│   │   ├── ChiTrial.tsx             # Trial 2: Quiz
│   │   ├── ShinTrial.tsx            # Trial 3: Signer verification
│   │   ├── ShareButton.tsx          # Twitter/X share button
│   │   └── providers/
│   │       └── StarknetProvider.tsx # Starknet + Cartridge setup
│   ├── hooks/
│   │   ├── index.ts                 # Hook exports
│   │   ├── useTrialProgress.ts      # Fetch trial progress
│   │   ├── useWazaClaim.ts          # Waza trial logic
│   │   ├── useChiQuiz.ts            # Chi trial logic
│   │   ├── useShinTrial.ts          # Shin trial logic
│   │   └── useTrialCompletion.ts    # Completion callback utility
│   ├── lib/
│   │   ├── contracts/
│   │   │   ├── RoninPact.abi.json   # Main contract ABI
│   │   │   └── ERC721.abi.json      # ERC721 interface
│   │   ├── starknet.ts              # Starknet provider config
│   │   ├── controller.ts            # Controller connector setup
│   │   ├── constants.ts             # App constants
│   │   └── mockContracts.ts         # Mock contract implementations
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # App entry point
│   └── index.css                    # Global styles + Tailwind
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .env.example
└── README.md
```

**Key Differences from Original Plan:**
- Using Vite (not Next.js) for simpler SPA architecture
- `StarknetProvider.tsx` in `providers/` subdirectory for cleaner organization
- Added `mockContracts.ts` for development without deployed contracts
- Added `useTrialCompletion.ts` utility hook
- Using `pnpm` instead of npm/yarn

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

**Provider Setup** (`components/providers/StarknetProvider.tsx`):
```typescript
import { StarknetConfig, jsonRpcProvider } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { controller } from "@/lib/controller";
import { RPC_URL } from "@/lib/constants";

function rpcProvider() {
  return jsonRpcProvider({
    rpc: () => ({ nodeUrl: RPC_URL }),
  });
}

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      autoConnect
      chains={[mainnet, sepolia]}
      provider={rpcProvider}
      connectors={[controller]}
    >
      {children}
    </StarknetConfig>
  );
}
```

**Usage in App** (`App.tsx`):
```typescript
import { StarknetProvider } from "@/components/providers/StarknetProvider";
import { QuestDashboard } from "@/components/QuestDashboard";

export function App() {
  return (
    <StarknetProvider>
      <QuestDashboard />
    </StarknetProvider>
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

**Hook**: `useShinTrial.ts` (Actual Implementation)
```typescript
import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS } from '@/lib/constants';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
import { SignerInfo } from '@/types';
import { isMockEnabled, mockGetSigners, mockCompleteShin } from '@/lib/mockContracts';

// Cartridge GraphQL API endpoint
const CARTRIDGE_API_URL = 'https://api.cartridge.gg/query';

// Type definitions from Controller codebase
type CredentialType = 'WebauthnCredentials' | 'Eip191Credentials';

interface Signer {
  guid: string;
  metadata: {
    __typename: CredentialType;
    eip191?: Array<{ provider: string }>;
  };
  isRevoked: boolean;
}

export function useShinTrial() {
  const { account, address } = useAccount();
  const [availableSigners, setAvailableSigners] = useState<SignerInfo[]>([]);
  const [selectedSigner, setSelectedSigner] = useState<SignerInfo | null>(null);
  const [vowText, setVowText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const useMock = isMockEnabled();

  const { contract: roninPactContract } = useContract({
    address: RONIN_PACT_ADDRESS,
    abi: RoninPactAbi,
  });

  // Helper function to determine signer type for display
  const credentialToAuthType = (metadata: Signer['metadata']): string => {
    switch (metadata.__typename) {
      case 'Eip191Credentials':
        if (metadata.eip191?.[0]?.provider) {
          return metadata.eip191[0].provider;
        }
        return 'eip191';
      case 'WebauthnCredentials':
        return 'webauthn';
      default:
        return 'unknown';
    }
  };

  // Query signers via GraphQL API
  const getSigners = useCallback(async (): Promise<SignerInfo[]> => {
    if (!address) {
      setError('Please connect your wallet');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      if (useMock) {
        const mockSigners = await mockGetSigners(address);
        setAvailableSigners(mockSigners);
        return mockSigners;
      }

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

      const response = await fetch(CARTRIDGE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { address } }),
      });

      const data = await response.json();
      const fetchedSigners = data?.data?.controller?.signers || [];

      // Map to simplified signer info
      const mappedSigners: SignerInfo[] = fetchedSigners
        .map((signer: Signer) => ({
          guid: signer.guid,
          type: credentialToAuthType(signer.metadata),
          isRevoked: signer.isRevoked,
        }))
        .filter((s: SignerInfo) => !s.isRevoked);

      setAvailableSigners(mappedSigners);
      return mappedSigners;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch signers');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address, useMock]);

  // Auto-fetch signers when address is available
  useEffect(() => {
    if (address) {
      getSigners();
    }
  }, [address, getSigners]);

  // Complete the Shin trial
  const completeVow = useCallback(
    async (): Promise<{ success: boolean }> => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return { success: false };
      }

      if (!selectedSigner) {
        setError('Please select a signer');
        return { success: false };
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        if (useMock) {
          await mockCompleteShin(address, selectedSigner.guid);
          setSuccess(true);
          return { success: true };
        }

        // Call complete_shin with signer GUID
        const tx = await account.execute({
          contractAddress: RONIN_PACT_ADDRESS,
          entrypoint: 'complete_shin',
          calldata: [selectedSigner.guid],
        });

        await account.waitForTransaction(tx.transaction_hash);
        setSuccess(true);
        return { success: true };
      } catch (err: any) {
        setError(err?.message || 'Failed to complete Shin trial');
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, roninPactContract, useMock, selectedSigner]
  );

  return {
    availableSigners,
    selectedSigner,
    vowText,
    setVowText,
    selectSigner: setSelectedSigner,
    completeVow,
    isLoading,
    error,
    success,
  };
}
```

**Key Implementation Details:**
- Auto-fetches signers on mount via `useEffect`
- Direct GraphQL fetch to `https://api.cartridge.gg/query` (not using `cartridgeClient`)
- Returns richer state including `selectedSigner`, `vowText` (UI-only), and `availableSigners`
- `completeVow()` instead of `completeTrial()` for semantic clarity
- Full mock mode support via `isMockEnabled()`

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

### 3.6 Mock Contract System

To enable frontend development and testing without deployed smart contracts, a comprehensive mock system has been implemented.

**Location**: `src/lib/mockContracts.ts`

**Features**:
- Drop-in replacement for real contract interactions
- Simulates network delays (400-1500ms) for realistic testing
- In-memory state management for trial completion
- Console logging with `[MOCK]` prefix for visibility
- Controlled via `VITE_USE_MOCK_CONTRACTS` environment variable

**Mock Functions**:
- `mockGetTrialProgress(address)` - Returns trial completion state
- `mockCompleteWaza(address, collectionAddress)` - Simulates ownership verification (50% success rate, "pistols" always succeeds)
- `mockCheckERC721Ownership(collectionAddress, ownerAddress)` - Simulates balance checks
- `mockCompleteChi(answers)` - Always accepts quiz answers
- `mockCompleteShin(signerGuid)` - Simulates signer verification
- `mockGetSigners(address)` - Returns mock signers (webauthn, discord, google)
- `mockMintNFT(address)` - Simulates NFT minting
- `mockWaitForTransaction(txHash)` - Simulates transaction confirmation

**Utility Functions**:
- `isMockEnabled()` - Checks if mock mode is active
- `resetMockState()` - Clears all progress (useful for testing)
- `getMockState()` - Returns current state for debugging

**Hook Integration Pattern**:
```typescript
export function useHook() {
  const useMock = isMockEnabled();

  // Contract setup disabled when mocking
  const { contract } = useContract({
    enabled: !useMock && !!address
  });

  // Branch on mock mode
  if (useMock) {
    return await mockFunction();
  }
  return await contract.call();
}
```

**Benefits**:
- Develop UI before contracts are deployed
- Test error states and edge cases easily
- No gas costs during development
- Faster iteration cycles
- Consistent testing environment

**Transition to Production**:
Simply set `VITE_USE_MOCK_CONTRACTS=false` and provide real contract addresses. No code changes needed.

### 3.7 Share on X Feature

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

## 13. Controller Integration Implementation

### 13.1 Overview

This section details the specific implementation for enabling signer verification in the Shin trial.

**Goal**: Verify that a user has registered a signer (Discord, Passkey, etc.) on their Cartridge Controller account.

**Approach**: Use a **simplified local implementation** of the signer interface to avoid heavy controller-cairo dependencies. The implementation provides only what's needed for EIP-191 signer verification (used by Discord, Google, etc.).

### 13.2 Architecture Decision

**Chosen Approach**: Minimal Local Implementation

Instead of importing the full `controller-cairo` library (which includes many unused components), the project implements a minimal local version of the required interfaces.

**Files**:
- `contracts/src/controller/eip191.cairo` - Minimal Signer enum and GUID conversion
- `contracts/src/controller/interface.cairo` - IMultipleOwners interface definition
- `contracts/src/tests/mocks.cairo` - MockController for testing

**Benefits**:
- ✅ Lighter dependency footprint
- ✅ Faster compilation times
- ✅ Easier to understand and maintain
- ✅ Compatible with controller-cairo's GUID computation

### 13.3 Implementation Details

#### Component 1: Signer Types (`contracts/src/controller/eip191.cairo`)

```cairo
use starknet::EthAddress;
use core::poseidon;

// Signer type constant - must match controller-cairo
const EIP191_SIGNER_TYPE: felt252 = 'Eip191 Signer';

/// EIP-191 signer struct - contains only the Ethereum address
#[derive(Drop, Copy, Serde, PartialEq)]
pub struct Eip191Signer {
    pub eth_address: EthAddress,
}

/// Simplified Signer enum - only supports Eip191 for our use case
#[derive(Drop, Copy, Signer, PartialEq)]
pub enum Signer {
    Eip191: Eip191Signer,
}

/// Trait for converting signers to GUIDs
pub trait SignerTrait {
    fn into_guid(self: Signer) -> felt252;
}

/// Implementation of GUID conversion
pub impl SignerTraitImpl of SignerTrait {
    fn into_guid(self: Signer) -> felt252 {
        match self {
            Signer::Eip191(signer) => {
                // Hash: poseidon(signer_type, eth_address)
                let (hash, _, _) = poseidon::hades_permutation(
                    EIP191_SIGNER_TYPE,
                    signer.eth_address.into(),
                    2
                );
                hash
            }
        }
    }
}
```

**Key Points**:
- Only implements `Eip191` variant (covers Discord, Google, external wallets)
- Uses identical GUID computation as controller-cairo (`poseidon_2`)
- Lightweight and focused on the specific use case

#### Component 2: Controller Interface (`contracts/src/controller/interface.cairo`)

```cairo
// Minimal Controller interface for checking signer ownership
// This is a local copy of the IMultipleOwners interface from controller-cairo
// to avoid the heavy dependency while still allowing runtime calls to Controller accounts

#[starknet::interface]
pub trait IMultipleOwners<T> {
    fn is_owner(self: @T, guid: felt252) -> bool;
}
```

**Key Points**:
- Minimal interface with just the `is_owner` method
- Compatible with actual Controller accounts deployed on Starknet
- No implementation needed (we call deployed Controller contracts)

#### Component 3: Actions Contract Integration

The Shin trial verification in `contracts/src/systems/actions.cairo`:

```cairo
use ronin_quest::controller::eip191::{Signer, SignerTrait};
use ronin_quest::controller::interface::{
    IMultipleOwnersDispatcher,
    IMultipleOwnersDispatcherTrait
};

fn complete_shin(ref self: ContractState, token_id: u256, signer: Signer) {
    let world = self.world_default();
    let pact_config: RoninPact = world.read_model(0);
    let controller_config: RoninController = world.read_model(0);

    // Convert signer to its GUID (globally unique identifier)
    let signer_guid = signer.into_guid();

    // Create dispatcher to the GLOBAL Controller contract
    // Note: Uses configured controller address, not caller's address
    let controller = IMultipleOwnersDispatcher {
        contract_address: controller_config.controller
    };

    // Verify the signer GUID is registered in the Controller
    let is_owner = controller.is_owner(signer_guid);
    assert(is_owner, 'Signer not registered');

    // Mark trial complete in NFT contract
    let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
    nft.complete_shin(token_id);
}
```

**Important**: The verification checks against a **global Controller contract** address (configured via `set_controller()`), not the caller's address. This is a design decision that may need adjustment based on requirements.

### 13.4 How It Works

**Flow**:

1. **Admin configures global Controller**: Call `set_controller(controller_address)` to set the Controller contract to verify against

2. **Frontend queries signers** via Cartridge GraphQL API:
   ```graphql
   query GetControllerSigners($address: String!) {
     controller(address: $address) {
       signers {
         guid
         metadata {
           __typename
           ... on Eip191Credentials {
             eip191 { provider }
           }
         }
         isRevoked
       }
     }
   }
   ```

3. **User selects a signer** from the UI (Discord, Passkey, etc.)

4. **Frontend constructs `Signer` struct** with the EthAddress:
   ```typescript
   // For Discord signer (Eip191Credentials)
   // Frontend extracts the eth_address from GraphQL response
   const signer = {
     Eip191: {
       eth_address: '0x...'  // From signer metadata
     }
   }
   ```

5. **Frontend calls `complete_shin(token_id, signer)`** with the constructed signer

6. **Contract converts to GUID**:
   ```cairo
   let signer_guid = signer.into_guid();
   // Computes: poseidon('Eip191 Signer', eth_address)
   ```

7. **Contract verifies ownership**: Calls `controller.is_owner(signer_guid)` on the configured Controller address

8. **Contract records completion**: If verified, calls NFT contract to mark trial complete

**Security**:
- No private keys or sensitive data transmitted
- Verification happens on-chain via Controller's storage
- GUIDs are deterministically computed from signer credentials
- Only the configured Controller contract is trusted

### 13.5 Signer Types Supported

**Current Implementation**: Only `Eip191` variant

The minimal implementation currently supports only EIP-191 signers, which covers:

| Signer Type | Frontend Detection | Use Case |
|------------|-------------------|----------|
| `Signer::Eip191` | `Eip191Credentials` with `provider` field | Discord, Google, X (Twitter), External wallets |

**Signer Detection** (Frontend):
- **Discord**: `metadata.__typename === 'Eip191Credentials' && metadata.eip191[0].provider === 'discord'`
- **Google**: `metadata.__typename === 'Eip191Credentials' && metadata.eip191[0].provider === 'google'`
- **Passkeys**: `metadata.__typename === 'WebauthnCredentials'` (not yet supported by contract)

**Limitation**: The current contract implementation does NOT support Webauthn (Passkeys), Secp256k1, or other signer types. To add support:
1. Extend the `Signer` enum in `eip191.cairo`
2. Add corresponding GUID computation logic
3. Ensure type constants match controller-cairo's implementation

**Example Extension** (for future Webauthn support):
```cairo
const WEBAUTHN_SIGNER_TYPE: felt252 = 'Webauthn Signer';

#[derive(Drop, Copy, Serde)]
pub struct WebauthnSigner {
    pub origin: ByteArray,
    pub rp_id_hash: u256,
    pub pubkey: u256,
}

pub enum Signer {
    Eip191: Eip191Signer,
    Webauthn: WebauthnSigner,  // Add new variant
}
```

### 13.6 Testing Strategy

**Implemented Unit Tests** (`contracts/src/controller/eip191.cairo`):

```cairo
#[test]
fn test_into_guid() {
    let eth_addr: EthAddress = 0x1234567890abcdef_felt252.try_into().unwrap();
    let signer = Signer::Eip191(Eip191Signer { eth_address: eth_addr });
    let guid = signer.into_guid();
    let expected_guid = poseidon_2(EIP191_SIGNER_TYPE, 0x1234567890abcdef_felt252);
    assert(guid == expected_guid, 'GUID mismatch');
}

#[test]
fn test_guid_deterministic() {
    // Same input should produce same GUID
    let eth_addr: EthAddress = 0xdeadbeef_felt252.try_into().unwrap();
    let signer1 = Signer::Eip191(Eip191Signer { eth_address: eth_addr });
    let signer2 = Signer::Eip191(Eip191Signer { eth_address: eth_addr });
    assert(signer1.into_guid() == signer2.into_guid(), 'Not deterministic');
}

#[test]
fn test_different_addresses_different_guids() {
    // Different addresses should produce different GUIDs
    let eth_addr1: EthAddress = 0x1111_felt252.try_into().unwrap();
    let eth_addr2: EthAddress = 0x2222_felt252.try_into().unwrap();
    let signer1 = Signer::Eip191(Eip191Signer { eth_address: eth_addr1 });
    let signer2 = Signer::Eip191(Eip191Signer { eth_address: eth_addr2 });
    assert(signer1.into_guid() != signer2.into_guid(), 'GUIDs should differ');
}
```

**Implemented Integration Tests** (`contracts/src/tests/actions.cairo`):

1. ✅ `test_complete_shin()` - Tests successful Shin completion with MockController
2. ✅ `test_set_controller()` - Tests setting Controller address
3. ✅ `test_set_controller_only_owner()` - Tests access control
4. ✅ `test_full_lifecycle()` - Tests all three trials including Shin

**Mock Controller** (`contracts/src/tests/mocks.cairo`):
```cairo
#[starknet::contract]
pub mod MockController {
    use ronin_quest::controller::interface::IMultipleOwners;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MockControllerImpl of IMultipleOwners<ContractState> {
        fn is_owner(self: @ContractState, guid: felt252) -> bool {
            true  // Always returns true for testing
        }
    }
}
```

**Test Results**: All 22 tests passing (including 2 Shin-related tests)

### 13.7 Benefits of This Approach

✅ **Minimal dependencies**: No heavy controller-cairo library import
✅ **Type-safe**: Uses proper `Signer` enum instead of raw `felt252`
✅ **Focused**: Only implements what's needed (Eip191 signers)
✅ **Compatible**: GUID computation matches controller-cairo exactly
✅ **Testable**: Mock Controller enables easy testing
✅ **Secure**: Leverages Controller's built-in ownership verification
✅ **Decentralized**: All verification happens on-chain
✅ **User-friendly**: No complex signing flows, just ownership verification

### 13.8 Known Limitations

1. **Limited signer types**: Only supports `Eip191` (Discord, Google, etc.). Does NOT support Webauthn (Passkeys), Secp256k1, or other types
2. **Global Controller verification**: Verifies against a single configured Controller address, not the caller's Controller account
3. **Frontend must provide eth_address**: Frontend needs to extract the Ethereum address from GraphQL and construct the Signer struct
4. **No revocation checking**: Contract only checks if signer GUID is registered, not if it's been revoked (relies on Controller's internal logic)
5. **GUID computation**: Must exactly match controller-cairo's implementation (using Poseidon hash)

**Critical Design Note**: The current implementation verifies signers against a **global Controller contract** (set via `set_controller()`), not individual user Controller accounts. This means:
- All users' signers are verified against the same Controller contract
- This may not be the intended behavior if each user has their own Controller account
- Consider updating to verify against `get_caller_address()` instead of `controller_config.controller`

### 13.9 Implementation Status

✅ **Completed**:
- [x] Minimal Signer enum with Eip191 variant
- [x] GUID conversion trait (`into_guid()`)
- [x] IMultipleOwners interface definition
- [x] Integration in actions.cairo
- [x] Unit tests for GUID computation
- [x] Integration tests with MockController
- [x] All tests passing (22/22)

❌ **Not Implemented**:
- [ ] Full controller-cairo dependency (intentionally avoided)
- [ ] Webauthn signer support
- [ ] Other signer types (Secp256k1, Secp256r1, etc.)
- [ ] Per-user Controller verification
- [ ] Frontend integration (TBD)

### 13.10 Recommended Improvements

1. **Per-User Verification**: Change from global Controller to per-user:
   ```cairo
   // Instead of:
   let controller = IMultipleOwnersDispatcher {
       contract_address: controller_config.controller
   };

   // Use:
   let caller = get_caller_address();
   let controller = IMultipleOwnersDispatcher {
       contract_address: caller  // Verify against caller's Controller account
   };
   ```

2. **Add Webauthn Support**: Extend Signer enum to include Passkeys:
   ```cairo
   pub enum Signer {
       Eip191: Eip191Signer,
       Webauthn: WebauthnSigner,
   }
   ```

3. **Store Signer Metadata**: Emit events with signer details for analytics:
   ```cairo
   self.emit(ShinCompleted {
       token_id,
       signer_type: 'Eip191',
       eth_address: signer.eth_address
   });
   ```

---

**End of Implementation Plan v1.0**

*This document is a living plan and will be updated as implementation progresses and questions are resolved.*
