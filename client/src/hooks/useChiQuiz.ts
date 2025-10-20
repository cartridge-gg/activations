import { useState, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { isMockEnabled, mockCompleteChi } from '@/lib/mockContracts';

interface UseChiQuizReturn {
  submitQuiz: (answers: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useChiQuiz(): UseChiQuizReturn {
  const { account, address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const useMock = isMockEnabled();

  // Submit quiz answers
  const submitQuiz = useCallback(
    async (answers: string[]) => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      if (!answers || answers.length === 0) {
        setError('Please provide answers');
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        if (useMock) {
          // Use mock contract implementation
          await mockCompleteChi(address, answers);
          setSuccess(true);
          setError(null);
        } else {
          // Use real contract implementation
          // Call complete_chi on Quest Manager contract directly
          const tx = await account.execute([{
            contractAddress: QUEST_MANAGER_ADDRESS,
            entrypoint: 'complete_chi',
            calldata: answers,
          }]);

          // Wait for transaction confirmation
          await account.waitForTransaction(tx.transaction_hash);

          setSuccess(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error submitting quiz:', err);

        // Parse error message to provide better feedback
        let errorMessage = 'Failed to submit quiz';

        if (err?.message) {
          // Check for common error patterns
          if (err.message.includes('incorrect') || err.message.includes('wrong')) {
            errorMessage = 'Some answers are incorrect. Please try again.';
          } else if (err.message.includes('already completed')) {
            errorMessage = 'You have already completed this trial';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setSuccess(false);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, useMock]
  );

  return {
    submitQuiz,
    isLoading,
    error,
    success,
  };
}
