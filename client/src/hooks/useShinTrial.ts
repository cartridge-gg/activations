import { useState, useCallback, useMemo } from 'react';
import { useReadContract } from '@starknet-react/core';
import { hash, Abi } from 'starknet';

import { RONIN_PACT_ADDRESS, RONIN_PACT_ABI, QUEST_MANAGER_ADDRESS, QUEST_MANAGER_ABI } from '@/lib/config';
import { splitTokenIdToU256, parseContractError } from '@/lib/utils';
import { useTrialTransaction } from './useTrialTransaction';

interface UseShinTrialReturn {
  vowText: string;
  setVowText: (text: string) => void;
  completeVow: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  timeRemaining: number | null;
  canComplete: boolean;
  timeLockDuration: number | null;
}

export function useShinTrial(tokenId: string, onSuccess?: () => void): UseShinTrialReturn {
  const [vowText, setVowText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch time lock from Quest Manager contract
  const {
    data: timeLockData,
    isPending: timeLockIsPending,
    error: timeLockError,
  } = useReadContract({
    abi: QUEST_MANAGER_ABI as Abi,
    address: QUEST_MANAGER_ADDRESS,
    functionName: 'get_time_lock',
    args: [],
    enabled: !!QUEST_MANAGER_ADDRESS,
  });

  const timeLockDuration = useMemo(() => {
    if (!timeLockData) return null;
    return Number(timeLockData);
  }, [timeLockData]);

  // Fetch mint timestamp from NFT contract
  const { data: mintTimestampData } = useReadContract({
    abi: RONIN_PACT_ABI as Abi,
    address: RONIN_PACT_ADDRESS,
    functionName: 'get_timestamp',
    args: [tokenId ? BigInt(tokenId) : 0n],
    enabled: !!tokenId && !!RONIN_PACT_ADDRESS,
  });

  // Calculate time remaining and whether trial can be completed
  const { timeRemaining, canComplete } = useMemo(() => {
    if (!mintTimestampData || !tokenId || !timeLockDuration) {
      return { timeRemaining: null, canComplete: false };
    }

    const mintTimestamp = Number(mintTimestampData);
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeElapsed = currentTimestamp - mintTimestamp;

    const remaining = timeLockDuration - timeElapsed;

    return {
      timeRemaining: remaining > 0 ? remaining : 0,
      canComplete: timeElapsed >= timeLockDuration,
    };
  }, [mintTimestampData, tokenId, timeLockDuration]);

  // Use the base transaction hook with custom error parsing
  const { execute, isLoading: txIsLoading, error: txError } = useTrialTransaction({
    entrypoint: 'complete_shin',
    label: 'Shin Trial Transaction',
    onSuccess,
    parseError: (err) => parseContractError(err, timeLockDuration ?? undefined),
  });

  const completeVow = useCallback(
    async (): Promise<void> => {
      if (!tokenId) {
        setError('Token ID not found');
        return;
      }

      if (!vowText.trim()) {
        setError('Please write your vow');
        return;
      }

      setError(null);

      // Hash the vow text using Starknet's selector hash
      const vowHash = hash.getSelectorFromName(vowText.trim());

      // Convert tokenId to u256 (low, high)
      const { low: tokenIdLow, high: tokenIdHigh } = splitTokenIdToU256(tokenId);

      // Call complete_shin on Quest Manager contract
      await execute([tokenIdLow, tokenIdHigh, vowHash]);
    },
    [tokenId, vowText, execute]
  );

  return {
    vowText,
    setVowText,
    completeVow,
    isLoading: txIsLoading,
    error: error || txError,
    timeRemaining,
    canComplete,
    timeLockDuration,
  };
}
