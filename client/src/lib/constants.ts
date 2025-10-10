// Constants for The Rōnin's Pact

import { AllowlistedCollection } from '@/types';

// Contract addresses (placeholder - update after deployment)
export const RONIN_PACT_ADDRESS = import.meta.env.VITE_RONIN_PACT_ADDRESS || '0x0';
export const QUEST_MANAGER_ADDRESS = import.meta.env.VITE_QUEST_MANAGER_ADDRESS || '0x0';

// Network configuration
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://api.cartridge.gg/x/starknet/sepolia';
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || 'SN_SEPOLIA';

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
