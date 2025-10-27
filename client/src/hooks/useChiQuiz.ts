import { useState, useCallback } from 'react';

import { parseContractError, splitTokenIdToU256 } from '@/lib/utils';
import { useTrialTransaction } from './useTrialTransaction';

interface UseChiQuizReturn {
  submitQuiz: (questionIndices: number[], answerHashes: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChiQuiz(tokenId: string, onSuccess?: () => void): UseChiQuizReturn {
  const { execute, isLoading, error: txError } = useTrialTransaction({
    entrypoint: 'complete_chi',
    label: 'Chi Trial Transaction',
    onSuccess,
    parseError: parseContractError,
  });

  const [error, setError] = useState<string | null>(null);

  // Submit quiz answers
  const submitQuiz = useCallback(
    async (questionIndices: number[], answerHashes: string[]) => {
      if (!tokenId) {
        setError('Token ID not found');
        return;
      }

      if (!questionIndices || questionIndices.length === 0 || !answerHashes || answerHashes.length === 0) {
        setError('Please provide answers');
        return;
      }

      setError(null);

      // Contract signature: complete_chi(token_id: u256, questions: Array<u32>, answers: Array<felt252>)
      const { low, high } = splitTokenIdToU256(tokenId);
      await execute([
        low,
        high,
        questionIndices.length.toString(),
        ...questionIndices.map(String),
        answerHashes.length.toString(),
        ...answerHashes,
      ]);
    },
    [tokenId, execute]
  );

  return {
    submitQuiz,
    isLoading,
    error: error || txError,
  };
}
