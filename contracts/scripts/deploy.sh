#!/bin/bash
# Streamlined deployment script using Dojo profiles and .env
# Usage: ./scripts/deploy.sh [dev|sepolia|mainnet]

set -e  # Exit on error

PROFILE=${1:-dev}

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load .env file if it exists
if [ -f .env ]; then
    log_info "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Determine network config based on profile
if [ "$PROFILE" == "dev" ]; then
    RPC_URL="http://localhost:5050"
    ACCOUNT_ADDRESS="0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec"
    PRIVATE_KEY="0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912"
elif [ "$PROFILE" == "sepolia" ]; then
    RPC_URL="https://api.cartridge.gg/x/starknet/sepolia"
    ACCOUNT_ADDRESS="${DOJO_ACCOUNT_ADDRESS:-}"
    PRIVATE_KEY="${DOJO_PRIVATE_KEY:-}"
elif [ "$PROFILE" == "mainnet" ]; then
    RPC_URL="https://api.cartridge.gg/x/starknet/mainnet"
    ACCOUNT_ADDRESS="${DOJO_ACCOUNT_ADDRESS:-}"
    PRIVATE_KEY="${DOJO_PRIVATE_KEY:-}"
else
    log_error "Invalid profile: $PROFILE"
    log_info "Usage: ./scripts/deploy.sh [dev|sepolia|mainnet]"
    exit 1
fi

log_info "Starting deployment with profile: $PROFILE"
log_info "RPC: $RPC_URL"
log_info "Account: $ACCOUNT_ADDRESS"
echo ""

# Verify credentials for non-dev profiles
if [ "$PROFILE" != "dev" ]; then
    if [ -z "$ACCOUNT_ADDRESS" ] || [ -z "$PRIVATE_KEY" ]; then
        log_error "Account credentials not set!"
        log_info "Create a .env file with:"
        echo "  DOJO_ACCOUNT_ADDRESS=0x..."
        echo "  DOJO_PRIVATE_KEY=0x..."
        exit 1
    fi
fi

# ============================================================================
# Phase 1: Build Contracts
# ============================================================================

log_info "Phase 1: Building contracts..."
scarb build
log_success "Build complete"
echo ""

# ============================================================================
# Phase 2: Deploy Dojo World + Actions (using sozo with profile)
# ============================================================================

log_info "Phase 2: Deploying Dojo contracts..."

if [ "$PROFILE" == "dev" ]; then
    sozo migrate apply
else
    sozo migrate apply --profile "$PROFILE"
fi

# Get addresses from sozo
WORLD_ADDRESS=$(sozo inspect --json | jq -r '.world_address' 2>/dev/null || echo "")
if [ -z "$WORLD_ADDRESS" ]; then
    log_warning "Could not auto-detect World address"
    read -p "Enter World address: " WORLD_ADDRESS
fi

ACTIONS_ADDRESS=$(sozo inspect --json | jq -r '.contracts[] | select(.tag == "ronin_quest-actions") | .address' 2>/dev/null || echo "")
if [ -z "$ACTIONS_ADDRESS" ]; then
    log_warning "Could not auto-detect Actions address"
    read -p "Enter Actions address: " ACTIONS_ADDRESS
fi

log_success "Dojo World deployed: $WORLD_ADDRESS"
log_success "Actions contract: $ACTIONS_ADDRESS"
echo ""

# ============================================================================
# Phase 3: Deploy RoninPact NFT (using sncast)
# ============================================================================

log_info "Phase 3: Deploying RoninPact NFT..."

# Declare the contract
log_info "Declaring RoninPact..."
PACT_CLASS_HASH=$(sncast \
    --url "$RPC_URL" \
    --account "$ACCOUNT_ADDRESS" \
    declare \
    --contract-name RoninPact \
    --fee-token eth \
    2>&1 | grep "class_hash" | awk '{print $2}')

if [ -z "$PACT_CLASS_HASH" ]; then
    log_error "Failed to declare RoninPact"
    exit 1
fi
log_success "RoninPact declared: $PACT_CLASS_HASH"

# Deploy the contract
log_info "Deploying RoninPact..."
PACT_DEPLOY_OUTPUT=$(sncast \
    --url "$RPC_URL" \
    --account "$ACCOUNT_ADDRESS" \
    deploy \
    --class-hash "$PACT_CLASS_HASH" \
    --constructor-calldata "$ACCOUNT_ADDRESS" \
    --fee-token eth \
    2>&1)

PACT_ADDRESS=$(echo "$PACT_DEPLOY_OUTPUT" | grep "contract_address" | awk '{print $2}')

if [ -z "$PACT_ADDRESS" ]; then
    log_error "Failed to deploy RoninPact"
    echo "$PACT_DEPLOY_OUTPUT"
    exit 1
fi
log_success "RoninPact deployed: $PACT_ADDRESS"
echo ""

# ============================================================================
# Phase 4: Configuration Data
# ============================================================================

log_info "Phase 4: Preparing configuration..."

# Game allowlist (TODO: Update with actual addresses)
log_warning "Using placeholder game addresses. Update script with real addresses!"
GAME1="0x0"
GAME2="0x0"
GAMES_CALLDATA="2,$GAME1,$GAME2"

# Quiz answers (TODO: Update with actual hashes)
log_warning "Using placeholder quiz answers. Update script with real hashes!"
ANSWER1="0x12345678"
ANSWER2="0x23456789"
ANSWER3="0x34567890"
ANSWER4="0x45678901"
ANSWER5="0x56789012"
ANSWERS_CALLDATA="5,$ANSWER1,$ANSWER2,$ANSWER3,$ANSWER4,$ANSWER5"

# Controller address (TODO: Update)
log_warning "Using placeholder Controller address. Update script with real address!"
CONTROLLER_ADDRESS="0x0"

echo ""

# ============================================================================
# Phase 5: Configure Actions Contract (using sozo execute)
# ============================================================================

log_info "Phase 5: Configuring Actions contract..."

# Set Pact address
log_info "Setting Pact NFT address..."
sozo execute ronin_quest-actions set_pact \
    --calldata "$PACT_ADDRESS" \
    --wait \
    || log_warning "Failed to set pact"

# Set Controller address
log_info "Setting Controller address..."
sozo execute ronin_quest-actions set_controller \
    --calldata "$CONTROLLER_ADDRESS" \
    --wait \
    || log_warning "Failed to set controller"

# Set game allowlist
log_info "Setting game allowlist..."
sozo execute ronin_quest-actions set_games \
    --calldata "$GAMES_CALLDATA" \
    --wait \
    || log_warning "Failed to set games"

# Set quiz answers
log_info "Setting quiz answers..."
sozo execute ronin_quest-actions set_quiz \
    --calldata "$ANSWERS_CALLDATA" \
    --wait \
    || log_warning "Failed to set quiz"

log_success "Actions configured"
echo ""

# ============================================================================
# Phase 6: Set Minter in RoninPact
# ============================================================================

log_info "Phase 6: Setting minter..."

sncast \
    --url "$RPC_URL" \
    --account "$ACCOUNT_ADDRESS" \
    invoke \
    --contract-address "$PACT_ADDRESS" \
    --function set_minter \
    --calldata "$ACTIONS_ADDRESS" \
    --fee-token eth \
    --wait \
    || log_error "Failed to set minter"

log_success "Minter set to Actions contract"
echo ""

# ============================================================================
# Deployment Summary
# ============================================================================

log_success "========================================="
log_success "Deployment Complete!"
log_success "========================================="
echo ""
echo "Profile:          $PROFILE"
echo "RPC URL:          $RPC_URL"
echo ""
echo "Deployed Contracts:"
echo "-------------------"
echo "World:            $WORLD_ADDRESS"
echo "Actions:          $ACTIONS_ADDRESS"
echo "RoninPact NFT:    $PACT_ADDRESS"
echo ""
echo "Configuration:"
echo "--------------"
echo "Controller:       $CONTROLLER_ADDRESS"
echo "Minter:           $ACTIONS_ADDRESS"
echo ""

# Save addresses to file
OUTPUT_FILE="deployments/$PROFILE.json"
mkdir -p deployments
cat > "$OUTPUT_FILE" <<EOF
{
  "profile": "$PROFILE",
  "rpc_url": "$RPC_URL",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {
    "world": "$WORLD_ADDRESS",
    "actions": "$ACTIONS_ADDRESS",
    "pact": "$PACT_ADDRESS"
  },
  "config": {
    "controller": "$CONTROLLER_ADDRESS",
    "minter": "$ACTIONS_ADDRESS"
  }
}
EOF

log_success "Deployment info saved to $OUTPUT_FILE"
echo ""
log_warning "Remember to update:"
echo "  1. Game allowlist addresses in script"
echo "  2. Quiz answer hashes in script"
echo "  3. Controller contract address in script"
