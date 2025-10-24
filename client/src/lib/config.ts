// Consolidated configuration for The Rōnin's Pact
// This file combines manifest loading, contract addresses, and app constants
// Simplified for local development on Katana (localhost:5050)

import manifest from "../../../contracts/manifest_dev.json";
import { setupWorld } from "../../../contracts/bindings/typescript/contracts.gen";
import { SchemaType } from "../../../contracts/bindings/typescript/models.gen";
import { AllowlistedCollection } from "./types";

// ============================================================================
// LOCAL KATANA CONFIGURATION
// ============================================================================
// Hardcoded for local development - environment switching removed for simplicity

export const KATANA_CHAIN_ID = "0x4b4154414e41"; // "KATANA" hex-encoded
export const KATANA_URL = "http://localhost:5050";
export const RELAY_URL = "/ip4/127.0.0.1/tcp/9090";

// ============================================================================
// MANIFEST & DOJO CONFIG
// ============================================================================

export { manifest, setupWorld };
export type { SchemaType };

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
export const ALLOWLISTED_COLLECTIONS: AllowlistedCollection[] = [
  {
    address: '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd',
    name: 'ls-adventurer',
    displayName: 'Loot Survivor 2 Adventurers',
  },
  {
    address: '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd',
    name: 'ls-beast',
    displayName: 'Loot Survivor 2 Beasts',
  },
  {
    address: '0x0',
    name: 'pistols-duel',
    displayName: 'Pistols at Dawn Duels',
  },
  {
    address: '0x0',
    name: 'bloberts',
    displayName: 'Bloberts',
  },
  {
    address: RONIN_PACT_ADDRESS,
    name: 'ronin-pact',
    displayName: 'Ronin Pact',
  },
];

// Trial metadata - imported from centralized UI text configuration
export { TRIAL_METADATA as TRIALS } from './uiText';
export type TrialName = keyof typeof import('./uiText').TRIAL_METADATA;
