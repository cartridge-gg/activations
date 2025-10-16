# Deployment Scripts

## Quick Start

### Setup (One-time)

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your credentials
# DOJO_ACCOUNT_ADDRESS=0x...
# DOJO_PRIVATE_KEY=0x...
```

### Deploy

```bash
# Local Katana (no .env needed)
katana --disable-fee  # In another terminal
./scripts/deploy.sh dev

# Sepolia testnet
./scripts/deploy.sh sepolia

# Mainnet
./scripts/deploy.sh mainnet
```

## How It Works

The deployment script uses **Dojo profiles** (configuration files) for each network:

- **`dojo_dev.toml`** - Local Katana (uses default Katana account)
- **`dojo_sepolia.toml`** - Sepolia testnet (reads from `.env`)
- **`dojo_mainnet.toml`** - Mainnet (reads from `.env`)

The network is determined by the `rpc_url` in each profile file, not the profile name.

## Deployment Phases

The script orchestrates the following phases:

1. **Build** - Compiles all contracts with `scarb build`
2. **Deploy Dojo Contracts** - Deploys World and Actions using `sozo migrate --profile <profile>`
3. **Deploy RoninPact NFT** - Deploys the ERC721 contract using `sncast`
4. **Configure Actions** - Sets Pact, Controller, Games, and Quiz via `sozo execute`
5. **Set Minter** - Authorizes Actions contract as minter in RoninPact
6. **Save Addresses** - Writes deployment info to `deployments/<profile>.json`

## Configuration

Before deploying to production, update these placeholder values in `scripts/deploy.sh`:

**Game Allowlist** (Line ~124):
```bash
GAME1="0x..."  # e.g., Pistols at 10 Blocks
GAME2="0x..."  # e.g., Loot Survivor Season Pass
```

**Quiz Answers** (Line ~130):
```bash
ANSWER1="0x..."  # Hashed answer to question 1
ANSWER2="0x..."  # Hashed answer to question 2
# ... etc (5 total)
```

**Controller Address** (Line ~139):
```bash
CONTROLLER_ADDRESS="0x..."  # Global Controller contract for signer verification
```

The script will warn you about these placeholders during deployment.

## Deployment Output

After deployment, addresses are saved to `deployments/<profile>.json`:

```json
{
  "profile": "sepolia",
  "rpc_url": "https://api.cartridge.gg/x/starknet/sepolia",
  "timestamp": "2025-10-16T...",
  "contracts": {
    "world": "0x...",
    "actions": "0x...",
    "pact": "0x..."
  },
  "config": {
    "controller": "0x...",
    "minter": "0x..."
  }
}
```

Use these addresses for frontend integration.

## Troubleshooting

### Account Credentials Not Set
```
ERROR: Account credentials not set!
```
**Solution**: Create a `.env` file with your credentials:
```bash
cp .env.example .env
# Edit .env and fill in DOJO_ACCOUNT_ADDRESS and DOJO_PRIVATE_KEY
```

### Failed to Declare RoninPact
- Ensure contracts are built: `scarb build`
- Check RPC connection is working
- Verify account has funds (for testnet/mainnet)

### Could Not Auto-Detect World Address
- Check `sozo inspect --json` output manually
- Look for world address in deployment output
- Script will prompt you to enter it manually

### Failed to Set Minter
- Verify Actions contract address is correct
- Check that deployer owns the Pact contract
- Ensure transaction succeeded (check block explorer)

### Re-deploying

To redeploy from scratch:
```bash
# Clean build artifacts
scarb clean

# Restart Katana (for local dev)
# Kill existing Katana and restart
katana --disable-fee

# Run deployment again
./scripts/deploy.sh dev
```

## Dependencies

- `scarb` - Cairo build tool
- `sozo` - Dojo CLI
- `sncast` - Starknet Foundry CLI
- `jq` - JSON parsing (optional)

Install Dojo: https://book.dojoengine.org/getting-started/quick-start.html
Install Starknet Foundry: https://foundry-rs.github.io/starknet-foundry/
