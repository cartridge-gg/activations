#!/bin/bash
set -e

# --- Fill these in ---
NAME="Starknet Japan Meetup"
SYMBOL="SNJP"
BASE_URI="https://silver-large-chinchilla-571.mypinata.cloud/ipfs/bafkreiccbxse3l3ccngjqsnhcktwr3qooqn4rxsukdfpk3gkewcsha6aaq"
DESCRIPTION="An NFT to commemorate the Starknet Japan Meetup"

REGISTRY="0x03eb03b8f2be0ec2aafd186d72f6d8f3dd320dbc89f2b6802bca7465f6ccaa43"
DEPLOYER="0x05cb4ea8cc45dd51505a7e585b4a73d87d2f9448ed6a380155006229170e4819"

# --- Build ---
echo "Building..."
cd "$(dirname "$0")"
scarb build

# --- Declare ---
echo "Declaring..."
DECLARE_OUTPUT=$(sncast --wait declare --contract-name ERC721 2>&1 || true)
echo "$DECLARE_OUTPUT"
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -E "(Class Hash:|class hash)" | head -1 | grep -oE '0x[0-9a-fA-F]+')
echo "Class hash: $CLASS_HASH"

# --- Deploy ---
echo "Deploying..."
DEPLOY_OUTPUT=$(sncast --wait deploy --class-hash "$CLASS_HASH" \
    --arguments "$DEPLOYER, \"$NAME\", \"$SYMBOL\", \"$DESCRIPTION\", \"$BASE_URI\"" 2>&1) || true
echo "$DEPLOY_OUTPUT"
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Contract Address:" | grep -oE '0x[0-9a-fA-F]+')
echo "Contract address: $CONTRACT_ADDRESS"

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Error: Deploy failed, no contract address"
    exit 1
fi

# --- Add minter (registry) ---
echo "Adding registry as minter..."
sncast --wait invoke \
    --contract-address "$CONTRACT_ADDRESS" \
    --function add_minter \
    --arguments "$REGISTRY"

# --- Register starterpack ---
echo "Registering starterpack..."
sncast --wait invoke \
    --contract-address "$CONTRACT_ADDRESS" \
    --function set_starterpack \
    --arguments "$REGISTRY, \"$NAME\", \"$DESCRIPTION\", \"$BASE_URI\""

# --- Read starterpack ID ---
echo "Reading starterpack ID..."
sncast call \
    --contract-address "$CONTRACT_ADDRESS" \
    --function get_starterpack_id

# --- Test mint (to deployer) ---
# echo "Test minting to deployer $DEPLOYER..."
# sncast --wait invoke \
#     --contract-address "$CONTRACT_ADDRESS" \
#     --function mint \
#     --arguments "$DEPLOYER"

echo "Done!"
echo "Contract: $CONTRACT_ADDRESS"
