// Constants for The Rōnin's Pact

import { AllowlistedCollection } from '@/types';
import { dojoConfig } from './dojoConfig';
import { getEnvironmentConfig } from './dojo';

// Contract addresses from manifest (can be overridden by environment variables)
const manifest = dojoConfig.manifest;

export const WORLD_ADDRESS =
  import.meta.env.VITE_WORLD_ADDRESS ||
  manifest.world.address;

// Find the Ronin Pact NFT contract from external_contracts in the manifest
// The manifest structure has: external_contracts[{tag: "ronin_quest-ronin_pact_nft", address: "0x..."}]
export const RONIN_PACT_ADDRESS =
  import.meta.env.VITE_RONIN_PACT_ADDRESS ||
  manifest.external_contracts?.find((c: any) => c.tag === "ronin_quest-ronin_pact_nft")?.address ||
  '0x0';

// Find the Quest Manager (actions) contract from contracts in the manifest
export const QUEST_MANAGER_ADDRESS =
  import.meta.env.VITE_QUEST_MANAGER_ADDRESS ||
  manifest.contracts.find((c: any) => c.tag === "ronin_quest-actions")?.address ||
  '0x0';

// Log contract addresses for debugging
console.log('Contract addresses loaded:');
console.log('  World:', WORLD_ADDRESS);
console.log('  Ronin Pact NFT:', RONIN_PACT_ADDRESS);
console.log('  Quest Manager:', QUEST_MANAGER_ADDRESS);

// Network configuration from environment
const envConfig = getEnvironmentConfig();
export const RPC_URL = envConfig.rpcUrl;
export const CHAIN_ID = envConfig.chainId;
export const TORII_URL = envConfig.toriiUrl;

// Allowlisted game collections for Waza trial
export const ALLOWLISTED_COLLECTIONS: AllowlistedCollection[] = [
  {
    address: '0x0', // TODO: Replace with actual Pistols contract address
    name: 'pistols',
    displayName: 'Pistols at 10 Blocks',
  },
  {
    address: '0x0', // TODO: Replace with actual Loot Survivor contract address
    name: 'loot-survivor',
    displayName: 'Loot Survivor',
  },
  {
    address: '0x0', // TODO: Replace with actual Blob Arena contract address
    name: 'blob-arena',
    displayName: 'Blob Arena',
  },
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
