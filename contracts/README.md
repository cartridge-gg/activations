# Ronin's Pact - Smart Contracts

A serverless quest system with a dynamic ERC721 NFT on Starknet, built using Dojo tooling.

## Overview

The Ronin's Pact is a participation NFT that evolves as users complete three thematic trials:
- **Waza (Technique)**: Prove ownership of NFT in allowlisted Dojo games
- **Chi (Wisdom)**: Answer 3 quiz questions about Dojo 1.7 (pseudo-randomly selected from 10)
- **Shin (Spirit)**: Verify a Cartridge Controller signer GUID

The NFT artwork evolves dynamically based on progress, with visual markers appearing as each trial is completed (0/3, 1/3, 2/3, 3/3 states).

## Architecture Overview

This project uses a **separation of concerns** architecture:

### Why This Design?

**Configuration vs Progress Separation**: The Dojo contract (`treasure_hunt.cairo`) stores game configuration and validation logic, while the NFT contract (`ronin_pact.cairo`) stores only player progress. This design provides:

- **Clear Separation**: Game rules and configuration in treasure_hunt, player state in NFT
- **Standard ERC721**: NFT remains a standard ERC721 contract, compatible with wallets and marketplaces
- **Flexible Configuration**: Game config can be updated without affecting player progress
- **Efficient Queries**: Torii indexes both Dojo World state (config) and ERC721 events (player progress)
- **Single Authority**: treasure_hunt is the only contract that can update player progress

### Data Flow

1. User calls `treasure_hunt.complete_waza/chi/shin()`
2. `treasure_hunt` validates the trial using its own configuration (allowlist, quiz questions/hashes, signer verification)
3. If valid, `treasure_hunt` calls `nft.complete_waza/chi/shin()` to record completion
4. NFT updates trial progress in storage and emits events
5. Torii indexes both treasure_hunt state (config) and NFT events (player progress) for UI queries

## Contract Details

### ronin_pact.cairo - NFT Contract (Player Progress Storage)

**Type**: Standard Starknet contract (not a Dojo contract)

**Purpose**: Store player progress and generate dynamic NFTs

**Key Responsibilities**:
- ERC721 token management (mint, transfer, metadata)
- Store player trial progress per wallet
- Enforce one NFT per wallet rule
- Generate dynamic SVG artwork based on progress
- Emit completion events for indexing
- Accept trial completions ONLY from authorized game contract

**Storage Structure**:
```cairo
struct Storage {
    // ERC721 standard storage (OpenZeppelin component)
    erc721: ERC721Component::Storage,

    // Contract owner and authorized game contract
    owner: ContractAddress,
    game_contract: ContractAddress,

    // Token tracking (one per wallet)
    next_token_id: u256,
    owner_to_token_id: Map<ContractAddress, u256>,

    // Player progress (ONLY state stored here)
    trial_progress: Map<ContractAddress, TrialProgress>,
}
```

**Key Functions**:
- `mint()` - Mint NFT (one per wallet enforcement)
- `get_trial_progress(owner)` - Query player progress
- `complete_waza/chi/shin(owner)` - Record trial completion (only callable by game contract)
- `set_game_contract(address)` - Admin: authorize game contract
- `get_game_contract()` - Query authorized game contract
- `token_uri(token_id)` - Returns dynamic metadata with progress state

**Important Notes**:
- Uses OpenZeppelin ERC721 components for standard compliance
- SVG artwork is generated on-chain with 4 visual states
- Does NOT store game configuration (allowlist, quiz) - that lives in treasure_hunt
- Only the authorized game contract can update trial progress

### treasure_hunt.cairo - Dojo Contract (Game Configuration & Validation)

**Type**: Dojo contract (deployed via sozo)

**Purpose**: Store game configuration and validate trials

**Key Responsibilities**:
- Store game configuration (allowlist, quiz questions/hashes)
- Validate Waza trial (check NFT ownership in allowlisted games)
- Validate Chi trial (verify quiz answers)
- Validate Shin trial (verify Controller signer)
- Emit Dojo events for indexing trial attempts
- Coordinate with NFT contract to record completions

**Storage Structure**:
```cairo
struct Storage {
    // NFT contract reference
    nft_contract: ContractAddress,

    // Contract owner for admin operations
    owner: ContractAddress,

    // Waza trial configuration (allowlist)
    allowlist_length: u32,
    allowlisted_collections: Map<u32, ContractAddress>,

    // Chi trial configuration (quiz)
    quiz_length: u32,
    quiz_questions: Map<u32, ByteArray>,
    quiz_answer_hashes: Map<u32, felt252>,
}
```

**Key Functions**:
- `complete_waza(collection_address)` - Validate and record Waza completion
- `complete_chi(answers)` - Validate and record Chi completion
- `complete_shin(signer_guid)` - Validate and record Shin completion
- `get_quiz_questions_for_wallet(wallet)` - Get the 3 questions for a specific wallet
- `set_allowlist(collections)` - Admin: set allowlisted game collections
- `set_quiz(questions, hashes)` - Admin: set quiz questions and answer hashes
- `get_allowlist_length()` - Query allowlist size
- `get_allowlisted_collection(index)` - Query specific allowlisted collection
- `get_quiz_length()` - Query quiz size (should be 10)
- `get_quiz_question(index)` - Query specific quiz question
- `get_quiz_answer_hash(index)` - Query specific quiz answer hash

**Trial Validation Details**:

**Waza (Technique)**:
1. Check if collection is in allowlist (reads from own storage)
2. Check if user owns tokens in that collection (ERC721 balance_of)
3. If valid, call NFT contract to record completion

**Chi (Wisdom)**:
1. Verify user submitted exactly 3 answers
2. Select 3 pseudo-random questions based on wallet address hash
3. Read answer hashes from own storage
4. Verify all answers match
5. If correct, call NFT contract to record completion

**Shin (Spirit)**:
1. Call user's Controller account to verify signer GUID
2. If valid, call NFT contract to record completion

**Important Notes**:
- Stores ALL game configuration (allowlist, quiz)
- Pseudo-random quiz selection is deterministic per wallet (using Poseidon hash)
- Emits attempt events to Dojo World for analytics
- Initialized with NFT contract address AND owner via `dojo_init(nft_contract, owner)`
- Only owner can call admin functions (set_allowlist, set_quiz)

## The Three Trials

### 1. Waza (Technique) - Game Ownership

**Goal**: Prove you own an NFT in an allowlisted Dojo game

**How It Works**:
- Admin configures allowlist of game NFT contracts
- Player calls `complete_waza(collection_address)`
- Contract verifies collection is allowlisted
- Contract checks player owns at least 1 NFT in that collection
- Completion recorded, red diagonal slash appears in artwork

### 2. Chi (Wisdom) - Quiz Challenge

**Goal**: Answer 3 questions about Dojo 1.7 correctly

**How It Works**:
- Admin sets 10 quiz questions with answer hashes
- Each player gets 3 pseudo-randomly selected questions (based on wallet address)
- Questions are deterministic per wallet (same 3 questions always)
- Player submits 3 answer hashes
- All 3 must be correct to complete
- Completion recorded, blue diagonal slash appears in artwork

**Quiz Configuration**:
- Requires exactly 10 questions
- Answer hashes stored (not plaintext answers)
- Use Poseidon hash for answer hashing
- Questions selected deterministically using: `poseidon_hash_span([wallet_address, 1/2/3])`

### 3. Shin (Spirit) - Controller Verification

**Goal**: Prove you have a Cartridge Controller signer

**How It Works**:
- Player provides their Controller signer GUID
- Contract calls the player's wallet (Controller account) to verify signer
- Uses `ISignerList.is_signer_in_list()` interface
- Completion recorded, purple vertical slash appears in artwork

## Building

Build both contracts using Dojo's build system:

```bash
sozo build
```

This compiles both the standard Starknet contract (`ronin_pact`) and the Dojo contract (`treasure_hunt`).

## Deployment Instructions

Deployment requires two steps since we have both a standard Starknet contract and a Dojo contract:

### Step 1: Deploy NFT Contract

The `ronin_pact` contract is a standard Starknet contract (not deployed via sozo). Deploy it using Starkli or your preferred deployment tool:

```bash
# Using Starkli (example)
starkli declare target/dev/ronin_pact_RoninPact.contract_class.json --account <account> --keystore <keystore>

starkli deploy <class_hash> <owner_address> --account <account> --keystore <keystore>
```

Note the deployed NFT contract address - you'll need it for the next step.

### Step 2: Deploy Treasure Hunt via Dojo

Deploy the Dojo contract using sozo migrate, which will call `dojo_init()`:

```bash
sozo migrate --name ronin_pact

# During migration, the dojo_init function will be called with TWO parameters:
# 1. nft_contract: The NFT contract address from Step 1
# 2. owner: The owner address who can call admin functions
```

### Step 3: Configure Contracts

After both contracts are deployed, configure them:

#### 3a. Authorize treasure_hunt in NFT contract

```bash
# Authorize the treasure_hunt contract to update trial progress
sozo execute <nft_contract_address> set_game_contract --calldata <treasure_hunt_address>
```

#### 3b. Configure game rules in treasure_hunt contract

```bash
# Set the allowlist of game collections for Waza trial
sozo execute <treasure_hunt_address> set_allowlist --calldata <num_collections> <collection1> <collection2> ...

# Set the quiz questions and answer hashes (requires exactly 10)
sozo execute <treasure_hunt_address> set_quiz --calldata \
  <num_questions> <question1> <question2> ... <question10> \
  <num_hashes> <hash1> <hash2> ... <hash10>
```

### Step 4: Verify Deployment

Check that everything is configured correctly:

```bash
# Verify game contract is set in NFT
sozo call <nft_contract_address> get_game_contract

# Verify allowlist in treasure_hunt
sozo call <treasure_hunt_address> get_allowlist_length
sozo call <treasure_hunt_address> get_allowlisted_collection --calldata 0

# Verify quiz in treasure_hunt
sozo call <treasure_hunt_address> get_quiz_length
sozo call <treasure_hunt_address> get_quiz_question --calldata 0
```

## Torii Configuration

To enable frontend queries, configure Torii to index both the NFT contract and Dojo World:

### Configuration File

Create a `torii_config.toml` file:

```toml
[indexing]
# Index the NFT contract as an ERC721
contracts = [
    "ERC721:0x<nft_contract_address>"
]

[erc]
# Configure ERC token indexing
max_metadata_tasks = 100
```

### Launch Torii

```bash
torii --config torii_config.toml --world <world_address>
```

### What Gets Indexed

Torii will index:
- **From NFT contract**: ERC721 Transfer events, custom completion events (WazaCompleted, ChiCompleted, ShinCompleted), player trial progress storage
- **From Dojo World (treasure_hunt)**: Game configuration storage (allowlist, quiz), trial attempt events (WazaAttempted, ChiAttempted, ShinAttempted)
- **NFT metadata**: Dynamic SVG artwork based on player progress

## Frontend Integration

### Querying Data with Dojo SDK

The frontend should use Torii's GraphQL API to query data:

```typescript
// Query user's NFT and progress
const { tokens } = useTokens({
  contractAddress: nftContractAddress,
  ownerAddress: userAddress,
});

// Query trial progress via GraphQL
const { data } = useQuery(`
  query GetProgress($wallet: String!) {
    roninPactModels(where: { owner: $wallet }) {
      owner
      waza_complete
      chi_complete
      shin_complete
    }
  }
`, { wallet: userAddress });

// Query quiz questions for wallet
const questions = await treasureHuntContract.get_quiz_questions_for_wallet(userAddress);
```

### Key Integration Points

1. **Minting**: Call `nft.mint()` to create NFT (one per wallet)
2. **Check Progress**: Query `nft.get_trial_progress(wallet)` or use Torii
3. **Complete Trials**: Call `treasure_hunt.complete_waza/chi/shin()` with required params
4. **Display NFT**: Use `token_uri()` to get dynamic metadata and SVG artwork
5. **Show Questions**: Call `get_quiz_questions_for_wallet()` to get user's 3 questions

### Torii Benefits

- Real-time updates via GraphQL subscriptions
- Indexed ERC721 data (standard token queries)
- Historical event data for analytics
- Efficient queries without direct RPC calls

## Admin Operations

### Set Game Contract (NFT Contract)

Authorize the treasure_hunt contract to update trial progress:

```bash
sozo execute <nft_contract_address> set_game_contract --calldata <treasure_hunt_address>
```

**Security**: Only the NFT contract owner can call this. Only the authorized game contract can call `complete_waza/chi/shin()` on the NFT.

### Set Allowlist (treasure_hunt Contract)

Configure which game collections are valid for the Waza trial:

```bash
sozo execute <treasure_hunt_address> set_allowlist --calldata <num_collections> <collection1> <collection2> ...
```

**Example**:
```bash
# Allow 3 game collections
sozo execute <treasure_hunt_address> set_allowlist --calldata 3 0x123... 0x456... 0x789...
```

**Security**: Only the treasure_hunt contract owner can call this.

### Set Quiz (treasure_hunt Contract)

Configure the 10 quiz questions and answer hashes:

```bash
sozo execute <treasure_hunt_address> set_quiz --calldata \
  <num_questions> <question1> <question2> ... <question10> \
  <num_hashes> <hash1> <hash2> ... <hash10>
```

**Requirements**:
- Must provide exactly 10 questions
- Must provide exactly 10 answer hashes
- Questions are ByteArray (text strings)
- Answer hashes are felt252 (use Poseidon hash)

**Security**: Only the treasure_hunt contract owner can call this.

**Generating Answer Hashes**:
```python
# Python example using starknet-py
from starknet_py.hash.poseidon import poseidon_hash_many

answer = "dojo"  # Example answer
answer_felt = int.from_bytes(answer.encode(), 'big')
answer_hash = poseidon_hash_many([answer_felt])
```

## Development

### Local Development with Katana

1. Start Katana (local Starknet devnet):
```bash
katana --disable-fee
```

2. Build contracts:
```bash
sozo build
```

3. Deploy to local network:
```bash
sozo migrate --name ronin_pact
```

4. Run Torii for indexing:
```bash
torii --world <world_address>
```

### Testing

```bash
# Run tests (if implemented)
sozo test
```

### Project Structure

```
contracts/
├── src/
│   ├── ronin_pact.cairo      # NFT contract (player progress storage)
│   ├── treasure_hunt.cairo   # Dojo contract (game config & validation)
│   └── lib.cairo             # Module exports
├── Scarb.toml                # Dojo project configuration
└── README.md                 # This file
```

## Technical Notes

### One NFT Per Wallet

The NFT contract enforces one token per wallet:
- `mint()` checks balance and reverts if user already has a token
- Transfer updates the `owner_to_token_id` mapping
- `token_id_of_owner()` allows querying wallet's token ID

### Pseudo-Random Quiz Selection

Quiz questions are deterministically selected per wallet:
```cairo
// Uses Poseidon hash with wallet address as seed
let hash1 = poseidon_hash_span(array![wallet.into(), 1].span());
let idx1 = (hash1 % 10).try_into().unwrap();
```

This ensures:
- Same wallet always gets same 3 questions
- Questions are distributed uniformly
- No randomness oracle needed
- Cannot be gamed (questions revealed after wallet address)

### Quiz Requirements

- Exactly 10 questions must be configured
- Users answer 3 pseudo-randomly selected questions
- All 3 answers must be correct to complete
- Answer hashes stored (privacy - answers not on-chain)

### Dynamic SVG Artwork

The NFT artwork evolves with progress (4 states):

1. **0/3 Complete**: Base circle with "Unforged" state
2. **1/3 Complete**: Red diagonal slash (Waza)
3. **2/3 Complete**: Red + Blue diagonal slashes (Waza + Chi)
4. **3/3 Complete**: All 3 slashes + golden glow effect ("FORGED")

Artwork is generated on-chain in `token_uri()` - no IPFS needed.

### Event Emission Strategy

**NFT Contract Events** (for state changes):
- `WazaCompleted(owner, timestamp)`
- `ChiCompleted(owner, timestamp)`
- `ShinCompleted(owner, timestamp)`

**Dojo World Events** (for analytics):
- `WazaAttempted(wallet, collection, success)`
- `ChiAttempted(wallet, success)`
- `ShinAttempted(wallet, signer_guid, success)`

This dual-event approach provides:
- Reliable state tracking (NFT events)
- Analytics for success/failure rates (Dojo events)
- Torii indexing of both event types

### Security Considerations

1. **Access Control**: Only authorized game contract can update trial progress
2. **One Token Per Wallet**: Prevents gaming the system with multiple NFTs
3. **Answer Privacy**: Quiz answer hashes stored, not plaintext
4. **Deterministic Randomness**: Cannot game question selection
5. **Allowlist Validation**: Only approved games count for Waza
6. **Signer Verification**: Controller integration prevents spoofing

## License

See repository root for license information.
