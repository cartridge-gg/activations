import { useState, useCallback, useMemo } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { hash, Abi } from 'starknet';
import { useModel, useEntityId, useEntityQuery } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';

import { QUEST_MANAGER_ADDRESS, RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { useTrialProgress } from '@/hooks/useTrialProgress';
import { splitTokenIdToU256, parseContractError, executeTx } from '@/lib/utils';

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

export function useShinTrial(onSuccess?: () => void): UseShinTrialReturn {
  const { account, address } = useAccount();
  const { tokenId } = useTrialProgress();
  const [vowText, setVowText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    functionName: 'get_mint_timestamp',
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

  const completeVow = useCallback(
    async (): Promise<void> => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      if (!tokenId) {
        setError('Token ID not found');
        return;
      }

      if (!vowText.trim()) {
        setError('Please write your vow');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Hash the vow text using Starknet's selector hash
        const vowHash = hash.getSelectorFromName(vowText.trim());

        // Convert tokenId to u256 (low, high)
        const { low: tokenIdLow, high: tokenIdHigh } = splitTokenIdToU256(tokenId);

        // Call complete_shin on Quest Manager contract
        await executeTx(
          account,
          [{
            contractAddress: QUEST_MANAGER_ADDRESS,
            entrypoint: 'complete_shin',
            calldata: [
              tokenIdLow,
              tokenIdHigh,
              vowHash,
            ],
          }],
          'Shin Trial Transaction'
        );

        setError(null);

        // Call success callback to trigger progress refetch
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error('Error completing Shin trial:', err);
        const errorMessage = parseContractError(err, timeLockDuration ?? undefined);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, tokenId, vowText, timeLockDuration, onSuccess]
  );

  return {
    vowText,
    setVowText,
    completeVow,
    isLoading,
    error,
    timeRemaining,
    canComplete,
    timeLockDuration,
  };
}
