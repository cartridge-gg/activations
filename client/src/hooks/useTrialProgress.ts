import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS } from '@/lib/constants';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
import { TrialProgress } from '@/types';

interface UseTrialProgressReturn {
  progress: TrialProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTrialProgress(): UseTrialProgressReturn {
  const { address } = useAccount();
  const [progress, setProgress] = useState<TrialProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Read contract hook to fetch progress
  const {
    data,
    isLoading,
    error: contractError,
    refetch: contractRefetch,
  } = useReadContract({
    address: RONIN_PACT_ADDRESS,
    abi: RoninPactAbi,
    functionName: 'get_progress',
    args: address ? [address] : undefined,
    watch: true, // Enable real-time updates
  });

  // Parse and set progress data
  useEffect(() => {
    if (data) {
      try {
        // Contract returns (bool, bool, bool) tuple
        const [waza_complete, chi_complete, shin_complete] = data as [boolean, boolean, boolean];

        setProgress({
          waza_complete,
          chi_complete,
          shin_complete,
        });
        setError(null);
      } catch (err) {
        console.error('Error parsing progress data:', err);
        setError('Failed to parse progress data');
        setProgress(null);
      }
    } else if (!address) {
      setProgress(null);
      setError(null);
    }
  }, [data, address]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      console.error('Contract error:', contractError);
      setError(contractError.message || 'Failed to fetch progress');
    }
  }, [contractError]);

  // Refetch wrapper
  const refetch = useCallback(() => {
    if (address) {
      contractRefetch();
    }
  }, [address, contractRefetch]);

  return {
    progress,
    isLoading: isLoading && !!address,
    error,
    refetch,
  };
}
