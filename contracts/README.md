# The Ronin's Pact - Smart Contracts

A Dojo-based quest system on Starknet featuring a dynamic NFT that evolves as players complete three trials.

## Overview

The Ronin's Pact is a gamified quest where players forge their commitment to the Ronin by completing three trials:
- **Waza** (Technique) - Prove mastery by owning NFTs from approved game collections
- **Chi** (Wisdom) - Demonstrate knowledge by passing a quiz (3+ correct answers required)
- **Shin** (Spirit) - Show dedication through Controller integration (TODO)

Each completed trial adds a colored slash to the NFT's visual representation. When all three trials are complete, the NFT displays a golden glow effect with "FORGED" text.

## Architecture

This project uses a **separation of concerns** architecture:

### RoninPact NFT (`src/tokens/pact.cairo`)
**Type**: Standard ERC721 contract

**Purpose**: Store player progress and generate dynamic SVG artwork

**Key Responsibilities**:
- ERC721 token management (mint, transfer, metadata)
- Store trial progress using bit flags (3 bits for 3 trials)
- Generate dynamic on-chain SVG artwork based on progress
- Emit events for each trial completion
- Enforce minter authorization (only actions contract can update progress)

**Progress Storage**:
```cairo
// Efficient bit-flag storage
const WAZA_BIT: u8 = 0x04; // 0b100
const CHI_BIT: u8 = 0x02;  // 0b010
const SHIN_BIT: u8 = 0x01; // 0b001
```

**Key Functions**:
- `mint()` - Public minting (anyone can mint)
- `get_progress(token_id)` - Query trial progress
- `complete_waza/chi/shin(token_id)` - Record completion (minter only)
- `set_minter(address)` - Set authorized minter contract (owner only)
- `token_uri(token_id)` - Returns dynamic SVG data URI

### Actions Contract (`src/systems/actions.cairo`)
**Type**: Dojo contract

**Purpose**: Validate trial completion and manage game configuration

**Key Responsibilities**:
- Validate Waza trial (check NFT ownership in approved collections)
- Validate Chi trial (verify quiz answers)
- Validate Shin trial (TODO: Controller signer verification)
- Store game configuration using Dojo models
- Coordinate with NFT contract to record completions

**Trial Validation**:

**Waza (Technique)**:
1. Reads allowlisted game collections from Dojo models
2. Iterates through collections checking ERC721 balance
3. Requires balance ≥ 1 across all collections
4. Calls `nft.complete_waza(token_id)` to record

**Chi (Wisdom)**:
1. Verifies question and answer arrays match in length
2. Reads answer hashes from Dojo models
3. Validates submitted answers against stored hashes
4. Requires 3+ correct answers
5. Calls `nft.complete_chi(token_id)` to record

**Shin (Spirit)**:
1. TODO: Integrate with Controller to verify signer GUID
2. Currently placeholder (always validates)
3. Calls `nft.complete_shin(token_id)` to record

**Admin Functions**:
- `set_owner(owner)` - Update contract owner
- `set_pact(pact)` - Set NFT contract address
- `set_games(games)` - Set allowlisted game collections
- `set_quiz(answers)` - Set quiz answer hashes

### Dojo Models (`src/models.cairo`)

Configuration stored using Dojo's ECS pattern (all use singleton `game_id: 0`):

```cairo
// Contract owner
struct RoninOwner {
    game_id: u32,        // Always 0
    owner: ContractAddress,
}

// NFT contract address
struct RoninPact {
    game_id: u32,        // Always 0
    pact: ContractAddress,
}

// Allowlisted game collections for Waza
struct RoninGames {
    game_id: u32,        // Always 0
    games: Array<ContractAddress>,
}

// Quiz answer hashes for Chi
struct RoninAnswers {
    game_id: u32,        // Always 0
    answers: Array<felt252>,
}
```

## Data Flow

1. User calls `actions.complete_waza/chi/shin(token_id, ...)`
2. Actions contract validates trial using configuration from Dojo models
3. If valid, actions calls `pact.complete_waza/chi/shin(token_id)`
4. NFT updates progress in storage and emits events
5. Torii indexes both actions state (config) and NFT events (player progress)

## The Three Trials

### 1. Waza (Technique) - Game Ownership

**Goal**: Prove you own an NFT in an allowlisted game collection

**How It Works**:
- Admin configures array of allowlisted ERC721 collections
- Player calls `complete_waza(token_id)`
- Contract sums balance across all allowlisted collections
- Requires balance ≥ 1
- On success: Red diagonal slash appears (top-left to bottom-right)

### 2. Chi (Wisdom) - Quiz Challenge

**Goal**: Answer quiz questions correctly (3+ required)

**How It Works**:
- Admin sets quiz with array of answer hashes
- Player submits question indices and answer hashes
- Contract validates arrays match in length
- Contract compares answers against stored hashes
- Requires 3+ correct to complete
- On success: Blue diagonal slash appears (top-right to bottom-left)

**Answer Hashing**:
Use Poseidon hash for answer hashing:
```python
from starknet_py.hash.poseidon import poseidon_hash_many
answer_hash = poseidon_hash_many([int.from_bytes(answer.encode(), 'big')])
```

### 3. Shin (Spirit) - Controller Verification

**Goal**: Prove you have a Cartridge Controller signer (TODO)

**Current State**: Placeholder implementation (always validates)

**Planned Implementation**:
- Player provides Controller signer GUID
- Contract calls player's wallet to verify signer
- Uses Controller's `ISignerList.is_signer_in_list()` interface
- On success: Purple vertical slash appears (top to bottom)

**Reference**: https://github.com/cartridge-gg/controller-cairo

## Dynamic NFT Artwork

The NFT generates SVG artwork on-chain with 4 visual states:

1. **Base State**:
   - Dark gradient background
   - Gray concentric circles
   - "The Ronins Pact" text

2. **Waza Complete (+1)**:
   - Red gradient diagonal slash (top-left to bottom-right)
   - "WAZA" label with glow effect

3. **Chi Complete (+2)**:
   - Blue gradient diagonal slash (top-right to bottom-left)
   - "CHI" label with glow effect

4. **Shin Complete (+3)**:
   - Purple gradient vertical slash (top to bottom)
   - "SHIN" label

5. **All Complete (Final State)**:
   - All three slashes present
   - Golden radial glow effect
   - "FORGED" text at bottom

The artwork is generated in `token_uri()` as a data URI - no IPFS required.

## Building

```bash
# Build all contracts
sozo build

# This compiles:
# - RoninPact (ERC721 contract)
# - actions (Dojo contract)
# - Dojo models
```

## Testing

The project includes comprehensive integration tests (20 tests):

```bash
# Run all tests
snforge test

# Run with verbose output
snforge test -v

# Run specific test
snforge test test_complete_waza
```

**Test Coverage**:
- ✓ Admin function access control (4 tests)
- ✓ NFT minting (1 test)
- ✓ Waza trial (success + 2 failure cases)
- ✓ Chi trial (success + 3 failure cases)
- ✓ Shin trial (success + 1 failure case)
- ✓ Full lifecycle (all trials)

Tests use:
- Actual contract deployments
- Mock ERC721 for game collections
- Dojo test utilities for world setup

## Deployment

### Step 1: Build Contracts

```bash
sozo build
```

### Step 2: Deploy World & Contracts

```bash
sozo migrate --name ronin_pact
```

This deploys:
- Dojo World contract
- Actions contract
- All Dojo models
- Initializes owner via `dojo_init()`

### Step 3: Deploy NFT Contract

The RoninPact NFT is a standard contract (not deployed via Sozo):

```bash
# Get the contract class hash
sozo build

# Deploy using starkli or your preferred tool
starkli declare target/dev/ronin_quest_RoninPact.contract_class.json
starkli deploy <class_hash> <owner_address>
```

Save the NFT contract address for configuration.

### Step 4: Configure System

```bash
# Set NFT contract address in actions
sozo execute ronin_quest-actions set_pact --calldata <nft_address>

# Set allowlisted game collections
sozo execute ronin_quest-actions set_games --calldata <game1>,<game2>,...

# Set quiz answer hashes
sozo execute ronin_quest-actions set_quiz --calldata <hash1>,<hash2>,...
```

### Step 5: Configure NFT Contract

```bash
# Authorize actions contract as minter
# (Call directly on NFT contract, not via sozo)
<call_nft_contract> set_minter --calldata <actions_address>
```

### Step 6: Verify Deployment

```bash
# Check NFT minter is set
<call_nft_contract> get_minter

# Check actions configuration
sozo call ronin_quest-actions --help
```

## Scripts

Scarb.toml defines helpful scripts:

```bash
# Build and migrate
scarb run migrate

# Mint an NFT (for testing)
scarb run mint
```

## Project Structure

```
contracts/
├── Scarb.toml              # Package configuration
├── README.md               # This file
├── src/
│   ├── lib.cairo           # Module declarations
│   ├── models.cairo        # Dojo models (4 singletons)
│   ├── systems/
│   │   └── actions.cairo   # Trial validation logic
│   ├── tokens/
│   │   └── pact.cairo      # Dynamic ERC721 NFT
│   └── tests/
│       ├── actions.cairo   # Integration tests (20)
│       └── mocks.cairo     # Mock ERC721 for testing
```

## Dependencies

- **Dojo** 1.7.1 - ECS framework and world management
- **Starknet** 2.12.2 - Cairo standard library
- **OpenZeppelin** v0.20.0 - ERC721 components
- **Starknet Foundry** 0.48.1 - Testing framework

## Development Guide

### Local Development with Katana

```bash
# Start local devnet
katana --disable-fee

# In another terminal: Build and deploy
sozo build
sozo migrate --name ronin_pact_dev

# Configure system
sozo execute ronin_quest-actions set_pact --calldata <nft_addr>
# ... other configuration
```

### Adding New Trials

To add a new trial (e.g., "Gi" - Honor):

1. Add bit flag to `pact.cairo`:
```cairo
const GI_BIT: u8 = 0x08; // 0b1000
```

2. Add field to `TrialProgress`:
```cairo
pub struct TrialProgress {
    pub waza_complete: bool,
    pub chi_complete: bool,
    pub shin_complete: bool,
    pub gi_complete: bool, // New
}
```

3. Add `complete_gi()` to NFT interface and implementation

4. Add validation logic to `actions.cairo`

5. Add artwork generation in `get_gi_slash()`

6. Update tests in `tests/actions.cairo`

### Updating Quiz

```bash
# Hash new answers (Python)
from starknet_py.hash.poseidon import poseidon_hash_many

answers = ["dojo", "starknet", "cairo"]
hashes = [poseidon_hash_many([int.from_bytes(a.encode(), 'big')]) for a in answers]

# Update on-chain
sozo execute ronin_quest-actions set_quiz --calldata <hash1>,<hash2>,<hash3>
```

### Updating Allowlist

```bash
# Add new game collection
sozo execute ronin_quest-actions set_games --calldata <game1>,<game2>,<new_game>
```

## Security Considerations

1. **Access Control**:
   - Actions contract: Only owner can modify configuration
   - NFT contract: Only minter (actions) can update progress
   - NFT contract: Only owner can set minter

2. **Progress Integrity**:
   - Bit flags prevent tampering
   - Double-completion prevented (bit already set check)
   - Only authorized minter can update

3. **Validation**:
   - Waza: Real-time balance checks via ERC721
   - Chi: Answer hashes stored (not plaintext)
   - Shin: TODO - Controller integration required

4. **Quiz Privacy**:
   - Answer hashes stored on-chain
   - Actual answers never revealed
   - Use Poseidon hash (collision-resistant)

## TODOs

- [ ] Implement Controller integration for Shin trial
- [ ] Add base64 encoding for SVG data URIs (currently UTF-8)
- [ ] Consider adding rate limiting between trials
- [ ] Add events to actions contract for analytics
- [ ] Add metadata JSON generation alongside SVG
- [ ] Consider adding trial completion timestamps
- [ ] Add admin function to pause/unpause system

## Known Issues

- Shin trial is currently a placeholder (always validates)
- SVG data URIs use UTF-8 encoding (should use base64)
- No rate limiting between trials
- No events emitted from actions contract

## License

See parent repository for license information.
