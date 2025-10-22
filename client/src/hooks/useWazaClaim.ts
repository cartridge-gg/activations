import { useState, useCallback } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';

interface UseWazaClaimReturn {
  tryCollection: (collectionAddress: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useWazaClaim(tokenId: string, onSuccess?: () => void): UseWazaClaimReturn {
  const { account, address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to complete Waza trial with a specific collection
  const tryCollection = useCallback(
    async (collectionAddress: string) => {
      console.log('=== Waza Trial Attempt ===');
      console.log('Account:', address);
      console.log('Token ID:', tokenId);
      console.log('Collection address:', collectionAddress);

      if (!account || !address) {
        console.error('No account or address');
        setError('Please connect your wallet');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
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

        console.log('=== Waza Trial Transaction ===');
        console.log('Transaction hash:', tx.transaction_hash);
        console.log('Token ID:', tokenId);
        console.log('Collection address:', collectionAddress);

        // Wait for transaction confirmation
        await account.waitForTransaction(tx.transaction_hash);

        console.log('✅ Waza trial transaction confirmed');

        // Call success callback to trigger progress refetch
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error('Error completing Waza trial:', err);
        setError(err?.message || 'Failed to complete Waza trial');
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, tokenId, onSuccess]
  );

  return {
    tryCollection,
    isLoading,
    error,
  };
}
