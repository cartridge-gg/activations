import { useState, useCallback, useMemo } from 'react';
import { useReadContract } from '@starknet-react/core';
import { hash, Abi } from 'starknet';
import { useModel, useEntityId, useEntityQuery } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';

import { RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
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

  // Query the RoninPact model to get time_lock configuration (singleton with game_id = 0)
  useEntityQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          ['ronin_quest-RoninPact'],
          ['0x0'], // game_id = 0 as hex
          'FixedLen'
        ).build()
      )
      .includeHashedKeys()
  );

  const roninPactEntityId = useEntityId('0x0');
  const roninPactModel = useModel(roninPactEntityId, 'ronin_quest-RoninPact');

  // Extract time_lock from the model (memoized since it rarely changes)
  const timeLockDuration = useMemo(() => {
    const DEFAULT_TIME_LOCK = 24 * 60 * 60;
    if (!roninPactModel) {
      return DEFAULT_TIME_LOCK;
    }

    const timeLock = (roninPactModel as any)?.time_lock;
    return timeLock ? Number(timeLock) : DEFAULT_TIME_LOCK;
  }, [roninPactModel]);

  // Fetch mint timestamp from NFT contract
  const { data: mintTimestampData } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RONIN_PACT_ABI as Abi,
    functionName: 'get_timestamp',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    watch: true,
    enabled: !!tokenId,
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
