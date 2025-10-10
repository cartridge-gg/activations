/**
 * Mock Contract Service
 *
 * This file provides mock implementations of all contract interactions
 * to enable frontend testing without deployed contracts.
 *
 * To switch between mock and real implementations, set VITE_USE_MOCK_CONTRACTS
 * in your .env file.
 */

import { TrialProgress } from '@/types';

// In-memory mock state
let mockState = {
  wazaComplete: false,
  chiComplete: false,
  shinComplete: false,
  mintedNFT: false,
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock: Fetch trial progress
 */
export async function mockGetTrialProgress(address: string): Promise<TrialProgress> {
  await delay(500); // Simulate network latency

  console.log('[MOCK] Fetching trial progress for:', address);

  return {
    waza_complete: mockState.wazaComplete,
    chi_complete: mockState.chiComplete,
    shin_complete: mockState.shinComplete,
  };
}

/**
 * Mock: Mint NFT
 */
export async function mockMintNFT(address: string): Promise<{ transaction_hash: string }> {
  await delay(1000);

  console.log('[MOCK] Minting NFT for:', address);
  mockState.mintedNFT = true;

  return {
    transaction_hash: '0xmock_mint_tx_' + Date.now(),
  };
}

/**
 * Mock: Complete Waza trial (game ownership verification)
 */
export async function mockCompleteWaza(
  address: string,
  collectionAddress: string
): Promise<{ transaction_hash: string; success: boolean }> {
  await delay(800);

  console.log('[MOCK] Attempting Waza trial for:', address, 'with collection:', collectionAddress);

  // Simulate: First collection succeeds, others fail
  const success = collectionAddress.includes('pistols') || Math.random() > 0.5;

  if (success) {
    mockState.wazaComplete = true;
    console.log('[MOCK] ✅ Waza trial completed!');
  } else {
    console.log('[MOCK] ❌ No ownership found for this collection');
  }

  return {
    transaction_hash: success ? '0xmock_waza_tx_' + Date.now() : '',
    success,
  };
}

/**
 * Mock: Complete Chi trial (quiz)
 */
export async function mockCompleteChi(
  answers: string[]
): Promise<{ transaction_hash: string; success: boolean }> {
  await delay(1000);

  console.log('[MOCK] Submitting Chi quiz answers:', answers);

  // Mock mode: Accept any answers as correct
  mockState.chiComplete = true;
  console.log('[MOCK] ✅ Chi trial completed!');

  return {
    transaction_hash: '0xmock_chi_tx_' + Date.now(),
    success: true,
  };
}

/**
 * Mock: Complete Shin trial (signer verification)
 */
export async function mockCompleteShin(
  signerGuid: string
): Promise<{ transaction_hash: string }> {
  await delay(800);

  console.log('[MOCK] Completing Shin trial with signer GUID:', signerGuid);

  mockState.shinComplete = true;
  console.log('[MOCK] ✅ Shin trial completed!');

  return {
    transaction_hash: '0xmock_shin_tx_' + Date.now(),
  };
}

/**
 * Mock: Get signers for current account
 */
export async function mockGetSigners(address: string) {
  await delay(600);

  console.log('[MOCK] Fetching signers for:', address);

  // Return mock signers
  return [
    {
      guid: '0xmock_signer_webauthn_' + Date.now(),
      type: 'webauthn',
      isRevoked: false,
    },
    {
      guid: '0xmock_signer_discord_' + Date.now(),
      type: 'discord',
      isRevoked: false,
    },
    {
      guid: '0xmock_signer_google_' + Date.now(),
      type: 'google',
      isRevoked: false,
    },
  ];
}

/**
 * Mock: Check ERC721 ownership
 */
export async function mockCheckERC721Ownership(
  collectionAddress: string,
  ownerAddress: string
): Promise<boolean> {
  await delay(400);

  console.log('[MOCK] Checking ERC721 ownership:', { collectionAddress, ownerAddress });

  // Simulate: First collection returns true, others random
  return collectionAddress.includes('pistols') || Math.random() > 0.7;
}

/**
 * Mock: Wait for transaction
 */
export async function mockWaitForTransaction(txHash: string): Promise<void> {
  await delay(1500);
  console.log('[MOCK] Transaction confirmed:', txHash);
}

/**
 * Reset mock state (useful for testing)
 */
export function resetMockState(): void {
  console.log('[MOCK] Resetting state...');
  mockState = {
    wazaComplete: false,
    chiComplete: false,
    shinComplete: false,
    mintedNFT: false,
  };
}

/**
 * Get current mock state (for debugging)
 */
export function getMockState() {
  return { ...mockState };
}

/**
 * Check if mocking is enabled
 */
export function isMockEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK_CONTRACTS === 'true';
}
