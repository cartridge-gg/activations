# Deployment Guide

This guide covers deploying the Ronin Quest Dojo project to Sepolia testnet and Mainnet.

## Prerequisites

1. **Funded Starknet Account**: You need a deployed Starknet account with ETH on Sepolia (for testnet) or Mainnet
2. **Sozo CLI**: Ensure you have Sozo installed (part of Dojo toolkit)
3. **RPC Access**: The project is configured to use Cartridge RPC endpoints

## Configuration Setup

### Step 1: Create Environment Files

Copy the example environment files and fill in your credentials:

```bash
# For Sepolia deployment
cp .env.sepolia.example .env.sepolia

# For Mainnet deployment
cp .env.mainnet.example .env.mainnet
```

### Step 2: Fill in Your Credentials

Edit `.env.sepolia` or `.env.mainnet` with your account details:

```bash
# Your deployed Starknet account address
DOJO_ACCOUNT_ADDRESS=0x...

# Your account's private key (keep this secure!)
DOJO_PRIVATE_KEY=0x...
```

**Security Warning**: Never commit these `.env` files to version control! They contain your private key.

## Deployment Process

### Deploying to Sepolia

Use the automated deployment script that handles build, migration, and full configuration:

```bash
# Using Scarb alias (recommended)
scarb run deploy_sepolia

# Direct call
./scripts/deploy_network.sh sepolia
```

The script will:
- Build contracts for Sepolia
- Migrate the world and deploy all contracts
- Extract contract addresses from the manifest
- Configure all permissions and settings
- Set up the NFT minter
- Configure time locks (1 hour for testnet)
- Whitelist games for Waza trial
- Set up Chi trial quiz answers
- Mint an initial NFT
- Update `dojo_sepolia.toml` with the world address

### Deploying to Mainnet

Use the automated deployment script with safety confirmations:

```bash
# Using Scarb alias (recommended)
scarb run deploy_mainnet

# Direct call
./scripts/deploy_network.sh mainnet
```

The script will:
- Request explicit confirmation before deploying
- Build contracts for Mainnet
- Migrate the world and deploy all contracts
- Extract contract addresses from the manifest
- Configure all permissions and settings
- Set up the NFT minter
- Configure time locks (24 hours for mainnet)
- Whitelist games for Waza trial
- Set up Chi trial quiz answers
- Mint an initial NFT
- Update `dojo_mainnet.toml` with the world address

**Important:** The mainnet script uses a 24-hour time lock between trials for production use.

## Post-Deployment

The deployment scripts automatically handle most post-deployment tasks:

### 1. World Address (Automatic)

The scripts automatically update `dojo_sepolia.toml` or `dojo_mainnet.toml` with the deployed world address.

### 2. Contract Addresses

The deployment outputs addresses for:
- **World contract**: The main Dojo world
- **RoninPact NFT contract**: The dynamic NFT contract
- **Actions contract**: The game logic contract

These are saved in the manifest files:
- Sepolia: `manifests/sepolia/manifest.json`
- Mainnet: `manifests/mainnet/manifest.json`

### 3. Configuration Summary

The scripts automatically configure:
- ✓ Owner permissions granted to deployer account
- ✓ NFT minter set to Actions contract
- ✓ Actions contract configured with NFT address
- ✓ Time locks (1 hour for Sepolia, 24 hours for Mainnet)
- ✓ Pact NFT whitelisted for Waza trial
- ✓ Chi trial quiz answers configured
- ✓ Initial NFT minted from deployer account

## Configuration Files

- **Scarb.toml**: Project configuration with profile declarations
- **dojo_sepolia.toml**: Sepolia network configuration
- **dojo_mainnet.toml**: Mainnet network configuration
- **.env.sepolia**: Sepolia credentials (not in version control)
- **.env.mainnet**: Mainnet credentials (not in version control)

## Key Configuration Details

### External Contracts

The RoninPact NFT contract is configured as an external contract and will be deployed with your account address as the constructor parameter (making you the minter).

### RPC Endpoints

- Sepolia: `https://api.cartridge.gg/x/starknet/sepolia`
- Mainnet: `https://api.cartridge.gg/x/starknet/mainnet`

### Permissions

The configuration grants write permissions to the `ronin_quest-actions` contract for the `ronin_quest` namespace.

## Troubleshooting

### Account Not Funded
Ensure your account has sufficient ETH for deployment costs.

### RPC Issues
Verify the RPC endpoint is accessible:
```bash
curl -X POST https://api.cartridge.gg/x/starknet/sepolia \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"starknet_chainId","params":[],"id":1}'
```

### Profile Not Found
Ensure you're using the correct profile flag: `-P sepolia` or `-P mainnet`

## Security Best Practices

1. Never commit `.env` files
2. Use different accounts for testnet and mainnet
3. Keep private keys secure
4. Test thoroughly on Sepolia before deploying to Mainnet
5. Consider using a hardware wallet or secure key management solution for mainnet deployments
