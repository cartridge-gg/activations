import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS } from '@/lib/constants';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
import { TrialProgress } from '@/types';
import { isMockEnabled, mockGetTrialProgress } from '@/lib/mockContracts';

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
  const [isLoading, setIsLoading] = useState(false);

  const useMock = isMockEnabled();

  // Read contract hook to fetch progress (only used if not mocking)
  const {
    data,
    isLoading: contractIsLoading,
    error: contractError,
    refetch: contractRefetch,
  } = useReadContract({
    address: RONIN_PACT_ADDRESS,
    abi: RoninPactAbi,
    functionName: 'get_progress',
    args: address ? [address] : undefined,
    watch: true, // Enable real-time updates
    enabled: !useMock && !!address, // Disable if mocking
  });

  // Mock: Fetch progress
  useEffect(() => {
    if (useMock && address) {
      setIsLoading(true);
      mockGetTrialProgress(address)
        .then((mockProgress) => {
          setProgress(mockProgress);
          setError(null);
        })
        .catch((err) => {
          console.error('[MOCK] Error fetching progress:', err);
          setError('Failed to fetch progress');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [useMock, address]);

  // Parse and set progress data (real contract)
  useEffect(() => {
    if (!useMock && data) {
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
  }, [data, address, useMock]);

  // Handle contract errors (real contract)
  useEffect(() => {
    if (!useMock && contractError) {
      console.error('Contract error:', contractError);
      setError(contractError.message || 'Failed to fetch progress');
    }
  }, [contractError, useMock]);

  // Refetch wrapper
  const refetch = useCallback(() => {
    if (!address) return;

    if (useMock) {
      setIsLoading(true);
      mockGetTrialProgress(address)
        .then((mockProgress) => {
          setProgress(mockProgress);
          setError(null);
        })
        .catch((err) => {
          console.error('[MOCK] Error fetching progress:', err);
          setError('Failed to fetch progress');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      contractRefetch();
    }
  }, [address, useMock, contractRefetch]);

  return {
    progress,
    isLoading: useMock ? isLoading : (contractIsLoading && !!address),
    error,
    refetch,
  };
}
