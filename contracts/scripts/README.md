# Deployment Scripts

This directory contains automated deployment scripts for the Ronin Quest Dojo project.

## Script Architecture

The deployment system uses a **unified approach** for maintainability:

- **`deploy_network.sh`** - Unified deployment logic for Sepolia and Mainnet (single source of truth)
- **`deploy_katana.sh`** - Standalone local development script with Katana

Scarb.toml provides convenient aliases:
- `scarb run deploy_katana` → `./scripts/deploy_katana.sh`
- `scarb run deploy_sepolia` → `./scripts/deploy_network.sh sepolia`
- `scarb run deploy_mainnet` → `./scripts/deploy_network.sh mainnet`

This architecture provides:
- ✓ **DRY**: Shared logic maintained in one place
- ✓ **Simple**: Fewer files to maintain
- ✓ **Clear**: Explicit Scarb commands show intent
- ✓ **Flexible**: Easy to add new networks

## Available Scripts

### `deploy_katana.sh` - Local Development
Deploys to local Katana testnet with hot-reload for development.

```bash
# Using Scarb alias (recommended)
scarb run deploy_katana

# Direct call
./scripts/deploy_katana.sh
```

**Configuration:**
- Uses `dojo_dev.toml` and `katana.toml`
- Time lock: 60 seconds (for quick testing)
- Starts Katana automatically
- Stays running until Ctrl+C

### `deploy_network.sh sepolia` - Testnet Deployment
Deploys to Starknet Sepolia testnet.

```bash
# Using Scarb alias (recommended)
scarb run deploy_sepolia

# Direct call
./scripts/deploy_network.sh sepolia
```

**Prerequisites:**
- Create `.env.sepolia` with your credentials
- Fund your account with Sepolia ETH

**Configuration:**
- Uses `dojo_sepolia.toml`
- Time lock: 3600 seconds (1 hour)
- RPC: Cartridge Sepolia endpoint

### `deploy_network.sh mainnet` - Production Deployment
Deploys to Starknet Mainnet with safety confirmations.

```bash
# Using Scarb alias (recommended)
scarb run deploy_mainnet

# Direct call
./scripts/deploy_network.sh mainnet
```

**Prerequisites:**
- Create `.env.mainnet` with your credentials
- Fund your account with Mainnet ETH
- Test thoroughly on Sepolia first!

**Configuration:**
- Uses `dojo_mainnet.toml`
- Time lock: 86400 seconds (24 hours)
- RPC: Cartridge Mainnet endpoint
- Requires explicit "yes" confirmation

## What Each Script Does

All deployment scripts perform these steps:

1. **Build**: Compile Cairo contracts with appropriate profile
2. **Migrate**: Deploy World and all contracts to the network
3. **Extract Addresses**: Parse manifest for contract addresses
4. **Update Config**: Write world address to appropriate `.toml` file
5. **Configure Permissions**: Grant owner role to deployer account
6. **Setup NFT Minter**: Set Actions contract as NFT minter
7. **Configure Actions**: Set NFT address and time lock in Actions contract
8. **Whitelist Games**: Configure Waza trial with whitelisted contracts
9. **Setup Quiz**: Configure Chi trial with quiz answer hashes
10. **Mint Initial NFT**: Create deployer's NFT to verify setup

## Environment Files

Create these files from the examples:

```bash
# For Sepolia
cp ../.env.sepolia.example ../.env.sepolia
# Edit and add your credentials

# For Mainnet
cp ../.env.mainnet.example ../.env.mainnet
# Edit and add your credentials
```

Required variables:
- `DOJO_ACCOUNT_ADDRESS`: Your deployed Starknet account address
- `DOJO_PRIVATE_KEY`: Your account's private key

## Time Lock Values

Different networks use different time locks between trials:

- **Local (Katana)**: 60 seconds - Fast iteration for development
- **Sepolia**: 3600 seconds (1 hour) - Reasonable for testing
- **Mainnet**: 86400 seconds (24 hours) - Production rate limiting

## Script Output

Each script outputs:
- Contract addresses (World, NFT, Actions)
- Configuration status (permissions, minter, quiz, etc.)
- Links to block explorers
- Manifest file locations

## Troubleshooting

### "Network argument required" or "Invalid network"
Make sure you're calling the script correctly:
```bash
# Using Scarb aliases (recommended)
scarb run deploy_sepolia
scarb run deploy_mainnet

# Direct calls
./scripts/deploy_network.sh sepolia
./scripts/deploy_network.sh mainnet
```

### "Tool not found"
Install Dojo toolchain: `curl -L https://install.dojoengine.org | bash`

### "Environment file not found"
Copy the example file and fill in your credentials:
```bash
cp ../.env.sepolia.example ../.env.sepolia
# Edit and add your credentials
```

### "Account not funded"
Get testnet ETH from a faucet or ensure mainnet account has ETH.

### "Migration failed"
- Check RPC endpoint is accessible
- Verify account address and private key are correct
- Ensure account is deployed on the target network

### Updating Deployment Logic
Since all deployment logic lives in `deploy_network.sh`, you only need to update one file. The Scarb aliases automatically use the updated script.

## Security Notes

- **Never commit** `.env.sepolia` or `.env.mainnet` files
- Use different accounts for testnet and mainnet
- Test thoroughly on Sepolia before mainnet deployment
- Keep private keys secure (consider hardware wallets for mainnet)

## Next Steps After Deployment

1. **Verify Contracts**: Check on Starkscan
2. **Configure Client**: Update client with contract addresses
3. **Setup Indexer**: Configure Torii for the deployed world
4. **Test Integration**: Verify all functionality works end-to-end
5. **Announce**: Let your users know about the deployment

## Support

For issues or questions:
- Check `../DEPLOYMENT.md` for detailed deployment guide
- Review Dojo docs: https://book.dojoengine.org
- Check contract configuration in `../dojo_*.toml` files
