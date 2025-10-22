import { useState, useCallback } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { splitTokenIdToU256, executeTx } from '@/lib/utils';

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
        const { low, high } = splitTokenIdToU256(tokenId);

        await executeTx(
          account,
          [{
            contractAddress: QUEST_MANAGER_ADDRESS,
            entrypoint: 'complete_waza',
            calldata: [low, high, collectionAddress],
          }],
          'Waza Trial Transaction'
        );

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
