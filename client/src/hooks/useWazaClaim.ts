import { useState, useCallback } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { isMockEnabled, mockCompleteWaza, mockCheckERC721Ownership } from '@/lib/mockContracts';

interface UseWazaClaimReturn {
  tryCollection: (collectionAddress: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useWazaClaim(tokenId: string): UseWazaClaimReturn {
  const { account, address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const useMock = isMockEnabled();

  // Try to complete Waza trial with a specific collection
  const tryCollection = useCallback(
    async (collectionAddress: string) => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (useMock) {
          // Use mock implementations
          const ownsNFT = await mockCheckERC721Ownership(collectionAddress, address);

          if (!ownsNFT) {
            setError('You do not own an NFT from this collection');
            setIsLoading(false);
            return;
          }

          // Call mock complete_waza
          await mockCompleteWaza(address, collectionAddress);
        } else {
          // Call complete_waza on Quest Manager contract directly
          // The contract will verify ownership
          // Convert tokenId to u256 (low, high)
          const tokenIdBigInt = BigInt(tokenId);
          const low = tokenIdBigInt & ((1n << 128n) - 1n);
          const high = tokenIdBigInt >> 128n;

          const tx = await account.execute([{
            contractAddress: QUEST_MANAGER_ADDRESS,
            entrypoint: 'complete_waza',
            calldata: [low.toString(), high.toString(), collectionAddress],
          }]);

          // Wait for transaction confirmation
          await account.waitForTransaction(tx.transaction_hash);
        }
      } catch (err: any) {
        console.error('Error completing Waza trial:', err);
        setError(err?.message || 'Failed to complete Waza trial');
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, tokenId, useMock]
  );

  return {
    tryCollection,
    isLoading,
    error,
  };
}
