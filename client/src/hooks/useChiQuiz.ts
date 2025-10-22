import { useState, useCallback } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { useTrialProgress } from './useTrialProgress';

interface UseChiQuizReturn {
  submitQuiz: (questionIndices: number[], answerHashes: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChiQuiz(): UseChiQuizReturn {
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
        const tx = await account.execute([{
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
        }]);

        console.log('=== Chi Trial Transaction ===');
        console.log('Transaction hash:', tx.transaction_hash);
        console.log('Token ID:', tokenId);
        console.log('Questions:', questionIndices);
        console.log('Answer hashes:', answerHashes);

        // Wait for transaction confirmation
        await account.waitForTransaction(tx.transaction_hash);

        console.log('✅ Chi trial transaction confirmed');
      } catch (err: any) {
        console.error('Error submitting quiz:', err);

        // Parse error message to provide better feedback
        let errorMessage = 'Failed to submit quiz';

        if (err?.message) {
          // Check for common error patterns
          if (err.message.includes('incorrect') || err.message.includes('Incorrect answers')) {
            errorMessage = 'Not enough correct answers. You need at least 3 correct to pass.';
          } else if (err.message.includes('already completed')) {
            errorMessage = 'You have already completed this trial';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, tokenId]
  );

  return {
    submitQuiz,
    isLoading,
    error,
  };
}
