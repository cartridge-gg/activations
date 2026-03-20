#!/bin/bash
set -e

# --- Fill these in ---
NAME="Starknet Japan Meetup"
SYMBOL="SNJP"
BASE_URI="https://silver-large-chinchilla-571.mypinata.cloud/ipfs/bafkreiccbxse3l3ccngjqsnhcktwr3qooqn4rxsukdfpk3gkewcsha6aaq"
DESCRIPTION="An NFT to commemorate the Starknet Japan Meetup"

REGISTRY="0x03eb03b8f2be0ec2aafd186d72f6d8f3dd320dbc89f2b6802bca7465f6ccaa43"

# --- Build ---
echo "Building..."
cd "$(dirname "$0")"
scarb build

# --- Declare ---
echo "Declaring..."
DECLARE_OUTPUT=$(sncast declare --contract-name ERC721)
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep "class_hash:" | awk '{print $2}')
echo "Class hash: $CLASS_HASH"

# --- Deploy ---
echo "Deploying..."
DEPLOY_OUTPUT=$(sncast deploy --class-hash "$CLASS_HASH" \
    --arguments "'\"$NAME\", \"$SYMBOL\", \"$BASE_URI\"'")
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "contract_address:" | awk '{print $2}')
echo "Contract address: $CONTRACT_ADDRESS"

# --- Add minter (registry) ---
echo "Adding registry as minter..."
sncast invoke \
    --contract-address "$CONTRACT_ADDRESS" \
    --function add_minter \
    --arguments "'$REGISTRY'"

# --- Register starterpack ---
echo "Registering starterpack..."
sncast invoke \
    --contract-address "$CONTRACT_ADDRESS" \
    --function add_starterpack \
    --arguments "'$REGISTRY, \"$NAME\", \"$DESCRIPTION\", \"$BASE_URI\"'"

# --- Test mint (to deployer) ---
DEPLOYER=$(grep 'account' sncast.toml | head -1 | awk -F'"' '{print $2}')
echo "Test minting to deployer $DEPLOYER..."
sncast invoke \
    --contract-address "$CONTRACT_ADDRESS" \
    --function mint \
    --arguments "'$DEPLOYER'"

echo "Done!"
echo "Contract: $CONTRACT_ADDRESS"
