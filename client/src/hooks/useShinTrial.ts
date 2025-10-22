import { useState, useCallback, useMemo } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { hash, Abi } from 'starknet';
import { useModel, useEntityId, useEntityQuery } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';

import { QUEST_MANAGER_ADDRESS, RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { useTrialProgress } from '@/hooks/useTrialProgress';

interface UseShinTrialReturn {
  vowText: string;
  setVowText: (text: string) => void;
  completeVow: () => Promise<{ success: boolean }>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  timeRemaining: number | null;
  canComplete: boolean;
  timeLockDuration: number | null;
}

export function useShinTrial(): UseShinTrialReturn {
  const { account, address } = useAccount();
  const { tokenId } = useTrialProgress();
  const [vowText, setVowText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    async (): Promise<{ success: boolean }> => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return { success: false };
      }

      if (!tokenId) {
        setError('Token ID not found');
        return { success: false };
      }

      if (!vowText.trim()) {
        setError('Please write your vow');
        return { success: false };
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Hash the vow text using Starknet's selector hash
        const vowHash = hash.getSelectorFromName(vowText.trim());

        // Convert tokenId to u256 (low, high)
        const tokenIdBigInt = BigInt(tokenId);
        const tokenIdLow = (tokenIdBigInt & ((1n << 128n) - 1n)).toString();
        const tokenIdHigh = (tokenIdBigInt >> 128n).toString();

        console.log('=== Shin Trial Completion ===');
        console.log('Token ID:', tokenId);
        console.log('Vow Text:', vowText);
        console.log('Vow Hash:', vowHash);
        console.log('Calldata:', { tokenIdLow, tokenIdHigh, vowHash });

        // Call complete_shin on Quest Manager contract
        const tx = await account.execute([{
          contractAddress: QUEST_MANAGER_ADDRESS,
          entrypoint: 'complete_shin',
          calldata: [
            tokenIdLow,
            tokenIdHigh,
            vowHash,
          ],
        }]);

        console.log('Transaction hash:', tx.transaction_hash);

        // Wait for transaction confirmation
        await account.waitForTransaction(tx.transaction_hash);

        console.log('✅ Shin trial transaction confirmed');
        setSuccess(true);
        setError(null);
        return { success: true };
      } catch (err: any) {
        console.error('Error completing Shin trial:', err);

        let errorMessage = 'Failed to complete Shin trial';

        if (err?.message) {
          if (err.message.includes('Time lock not elapsed')) {
            const hours = Math.floor(timeLockDuration / 3600);
            const minutes = Math.floor(timeLockDuration / 60);

            let timeUnit;
            if (hours >= 1) {
              timeUnit = `${hours} hour${hours > 1 ? 's' : ''}`;
            } else if (minutes >= 1) {
              timeUnit = `${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
              timeUnit = `${timeLockDuration} second${timeLockDuration > 1 ? 's' : ''}`;
            }

            errorMessage = `You must wait ${timeUnit} after minting before completing Shin`;
          } else if (err.message.includes('Not token owner')) {
            errorMessage = 'You do not own this token';
          } else if (err.message.includes('Vow cannot be empty')) {
            errorMessage = 'Please write your vow';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setSuccess(false);
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, tokenId, vowText, timeLockDuration]
  );

  return {
    vowText,
    setVowText,
    completeVow,
    isLoading,
    error,
    success,
    timeRemaining,
    canComplete,
    timeLockDuration,
  };
}
