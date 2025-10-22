import { useState, useCallback } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { parseContractError, executeTx } from '@/lib/utils';
import { useTrialProgress } from './useTrialProgress';

interface UseChiQuizReturn {
  submitQuiz: (questionIndices: number[], answerHashes: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChiQuiz(onSuccess?: () => void): UseChiQuizReturn {
  const { account, address } = useAccount();
  const { tokenId } = useTrialProgress();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit quiz answers
  const submitQuiz = useCallback(
    async (questionIndices: number[], answerHashes: string[]) => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      if (!tokenId) {
        setError('Token ID not found');
        return;
      }

      if (!questionIndices || questionIndices.length === 0 || !answerHashes || answerHashes.length === 0) {
        setError('Please provide answers');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Contract signature: complete_chi(token_id: u256, questions: Array<u32>, answers: Array<felt252>)
        await executeTx(
          account,
          [{
            contractAddress: QUEST_MANAGER_ADDRESS,
            entrypoint: 'complete_chi',
            calldata: [
              tokenId, // u256 low
              '0',     // u256 high
              questionIndices.length, // questions array length
              ...questionIndices,
              answerHashes.length,   // answers array length
              ...answerHashes,
            ],
          }],
          'Chi Trial Transaction'
        );

        // Call success callback to trigger progress refetch
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        const errorMessage = parseContractError(err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, tokenId, onSuccess]
  );

  return {
    submitQuiz,
    isLoading,
    error,
  };
}
