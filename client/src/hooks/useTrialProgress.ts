import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS } from '@/lib/config';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
import { TrialProgress } from '@/types';
import { isMockEnabled, mockGetTrialProgress } from '@/lib/mockContracts';
import { Contract, Abi } from 'starknet';

interface UseTrialProgressReturn {
  progress: TrialProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  hasNFT: boolean;
  tokenId: string | null;
}

export function useTrialProgress(): UseTrialProgressReturn {
  const { address, account } = useAccount();
  const [progress, setProgress] = useState<TrialProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);

  const useMock = isMockEnabled();

  // Step 1: Check balance_of to see if user has an NFT
  const {
    data: balanceData,
    isLoading: balanceIsLoading,
    error: balanceError,
  } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RoninPactAbi as Abi,
    functionName: 'balance_of',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !useMock && !!address,
  });

  // Parse balance
  const balance = balanceData ? BigInt(balanceData.toString()) : BigInt(0);
  const hasNFT = balance > BigInt(0);

  // Step 2: Find token_id by searching owner_of if user has NFT
  useEffect(() => {
    if (!useMock && hasNFT && !tokenId && address && account) {
      const findTokenId = async () => {
        setIsLoading(true);
        try {
          // Create a contract instance
          // @ts-ignore - Contract constructor signature varies between starknet.js versions
          const contract = new Contract(RoninPactAbi as Abi, RONIN_PACT_ADDRESS, account);

          // Search through token IDs 0-99
          // Since this is a new contract and each user gets one token, this should be sufficient
          for (let id = 0; id < 100; id++) {
            try {
              const owner = await contract.owner_of(BigInt(id));
              if (owner.toString().toLowerCase() === address.toLowerCase()) {
                setTokenId(id.toString());
                setError(null);
                setIsLoading(false);
                return;
              }
            } catch (e) {
              // Token doesn't exist or not owned by user, continue
              continue;
            }
          }

          // If we get here, we didn't find the token
          setError('Could not find your NFT token ID');
          setIsLoading(false);
        } catch (err) {
          console.error('Error finding token ID:', err);
          setError('Failed to find NFT token ID');
          setIsLoading(false);
        }
      };

      findTokenId();
    }
  }, [useMock, hasNFT, tokenId, address, account]);

  // Step 3: Fetch progress using token_id
  const {
    data: progressData,
    isLoading: progressIsLoading,
    error: progressError,
    refetch: progressRefetch,
  } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RoninPactAbi as Abi,
    functionName: 'get_progress',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    watch: true,
    enabled: !useMock && hasNFT && !!tokenId,
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

  // Parse progress data from contract
  useEffect(() => {
    if (!useMock && progressData) {
      try {
        const [waza_complete, chi_complete, shin_complete] = progressData as [boolean, boolean, boolean];
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
    } else if (!useMock && !address) {
      setProgress(null);
      setError(null);
      setTokenId(null);
    } else if (!useMock && !hasNFT) {
      // User doesn't have NFT, clear progress
      setProgress(null);
      setError(null);
      setTokenId(null);
    }
  }, [progressData, address, useMock, hasNFT]);

  // Handle errors
  useEffect(() => {
    if (!useMock) {
      if (balanceError) {
        console.error('Balance check error:', balanceError);
        setError(balanceError.message || 'Failed to check NFT balance');
      } else if (progressError) {
        console.error('Progress fetch error:', progressError);
        setError(progressError.message || 'Failed to fetch progress');
      }
    }
  }, [balanceError, progressError, useMock]);

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
      // Clear token ID to trigger re-search
      setTokenId(null);
      progressRefetch();
    }
  }, [address, useMock, progressRefetch]);

  // Calculate combined loading state
  const combinedIsLoading = useMock
    ? isLoading
    : (balanceIsLoading || isLoading || (hasNFT && !tokenId) || progressIsLoading);

  return {
    progress,
    isLoading: combinedIsLoading && !!address,
    error,
    refetch,
    hasNFT,
    tokenId,
  };
}
