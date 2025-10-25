// Consolidated configuration for The Rōnin's Pact
// This file combines manifest loading, contract addresses, and app constants
// Simplified for local development on Katana (localhost:5050)

import { constants } from "starknet";

import manifest from "../../../contracts/manifest_dev.json";

import wazaConfig from "../../../spec/waza.json";
import { AllowlistedCollection } from "./types";

// Environment is set via ENV variable at runtime (e.g., ENV=dev pnpm run dev)
const ENVIRONMENT = import.meta.env.VITE_ENV || 'dev';
console.log('Current environment:', ENVIRONMENT);

// ============================================================================
// CHAIN CONFIGURATION
// ============================================================================
// Support for local Katana, Sepolia testnet, and Mainnet
// Using starknet.js constants for standard chain IDs

export const KATANA_CHAIN_ID = "0x4b4154414e41"; // "KATANA" hex-encoded
export const KATANA_URL = "http://localhost:5050";

export const SEPOLIA_CHAIN_ID = constants.StarknetChainId.SN_SEPOLIA;
export const SEPOLIA_URL = "https://api.cartridge.gg/x/starknet/sepolia";

export const MAINNET_CHAIN_ID = constants.StarknetChainId.SN_MAIN;
export const MAINNET_URL = "https://api.cartridge.gg/x/starknet/mainnet";

export const DEFAULT_CHAIN_ID = KATANA_CHAIN_ID;

// ============================================================================
// CONTRACT ADDRESSES AND ABIS FROM MANIFEST
// ============================================================================
// All contract addresses and ABIs are sourced directly from the manifest files
// (manifest_dev.json for local development, manifest_prod.json for production).
// This ensures they stay in sync with deployed contracts - no separate ABI files needed.

export const WORLD_ADDRESS = manifest.world.address;

// Find the Quest Manager (actions) contract from contracts in the manifest
const questManagerContract = manifest.contracts?.find((c: any) => c.tag === "ronin_quest-actions");
export const QUEST_MANAGER_ADDRESS = questManagerContract?.address || '0x0';
export const QUEST_MANAGER_ABI = questManagerContract?.abi;

// Find the Ronin Pact NFT contract from external_contracts in the manifest
// Used for reading state (balance_of, owner_of, get_progress, token_uri)
const roninPactContract = manifest.external_contracts?.find((c: any) => c.tag === "ronin_quest-ronin_pact");
export const RONIN_PACT_ADDRESS = roninPactContract?.address || '0x0';
export const RONIN_PACT_ABI = roninPactContract?.abi;

// Log contract addresses for debugging
console.log('Contract addresses loaded from manifest:');
console.log('  World:', WORLD_ADDRESS);
console.log('  Quest Manager:', QUEST_MANAGER_ADDRESS);
console.log('  Ronin Pact:', RONIN_PACT_ADDRESS);

// ============================================================================
// APP CONSTANTS
// ============================================================================

// Allowlisted game collections for Waza trial
// Loaded from waza.json and filtered by environment

export const ALLOWLISTED_COLLECTIONS: AllowlistedCollection[] = wazaConfig.collections
  .filter((collection: any) => collection.environments.includes(ENVIRONMENT))
  .map((collection: any) => ({
    name: collection.name,
    displayName: collection.displayName,
    // Replace 'self' with the actual Ronin Pact address
    address: collection.address === 'self' ? RONIN_PACT_ADDRESS : collection.address,
  }));

// Trial metadata - imported from centralized UI text configuration
export { TRIAL_METADATA as TRIALS } from './uiText';
export type TrialName = keyof typeof import('./uiText').TRIAL_METADATA;
