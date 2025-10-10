import { useState, useCallback } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS } from '@/lib/constants';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
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

  // Contract instance for RoninPact
  const { contract: roninPactContract } = useContract({
    address: RONIN_PACT_ADDRESS,
    abi: RoninPactAbi,
  });

  // Submit quiz answers
  const submitQuiz = useCallback(
    async (answers: string[]) => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      if (!roninPactContract && !useMock) {
        setError('Contract not initialized');
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
          // Convert string answers to felt252 array
          // Answers should already be in the correct format (felt252-compatible strings)
          const answerCalldata = answers;

          // Call complete_chi on the contract
          const tx = await account.execute({
            contractAddress: RONIN_PACT_ADDRESS,
            entrypoint: 'complete_chi',
            calldata: answerCalldata,
          });

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
    [account, address, roninPactContract, useMock]
  );

  return {
    submitQuiz,
    isLoading,
    error,
    success,
  };
}
