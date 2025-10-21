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
export const TORII_URL = "http://localhost:8080";
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

// Find the Ronin Pact NFT contract from external_contracts in the manifest
// Used for reading state (balance_of, owner_of, get_progress, token_uri)
const roninPactContract = manifest.external_contracts?.find((c: any) => c.tag === "ronin_quest-ronin_pact");
export const RONIN_PACT_ADDRESS = roninPactContract?.address || '0x0';
export const RONIN_PACT_ABI = roninPactContract?.abi;

// Find the Quest Manager (actions) contract from contracts in the manifest
const questManagerContract = manifest.contracts?.find((c: any) => c.tag === "ronin_quest-actions");
export const QUEST_MANAGER_ADDRESS = questManagerContract?.address || '0x0';

// Log contract addresses for debugging
console.log('Contract addresses loaded from manifest:');
console.log('  World:', WORLD_ADDRESS);
console.log('  Ronin Pact NFT:', RONIN_PACT_ADDRESS);
console.log('  Quest Manager:', QUEST_MANAGER_ADDRESS);

// ============================================================================
// APP CONSTANTS
// ============================================================================

// Allowlisted game collections for Waza trial
export const ALLOWLISTED_COLLECTIONS: AllowlistedCollection[] = [
  {
    address: '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd',
    name: 'loot-survivor',
    displayName: 'Loot Survivor',
  },
  // {
  //   address: '0x0', // TODO: Replace with actual Pistols contract address
  //   name: 'pistols',
  //   displayName: 'Pistols at Dawn',
  // },
];

// Social sharing
export const SHARE_URL = 'https://ronin-pact.xyz'; // TODO: Update with actual URL
export const SHARE_HASHTAGS = ['RoninsPact', 'DojoEngine', 'Starknet'];

// Trial metadata - consolidated structure
export const TRIALS = {
  waza: {
    name: 'Waza',
    subtitle: 'The Way of Technique',
    description: 'Prove your mastery by demonstrating game ownership in a Dojo-powered world.',
  },
  chi: {
    name: 'Chi',
    subtitle: 'The Way of Wisdom',
    description: 'Test your knowledge of Dojo 1.7 architecture and principles.',
  },
  shin: {
    name: 'Shin',
    subtitle: 'The Way of Spirit',
    description: 'Pledge your vow and commit your spirit to the journey ahead.',
  },
} as const;

export type TrialName = keyof typeof TRIALS;
