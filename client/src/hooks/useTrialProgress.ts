import { useMemo } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { useEventQuery, useModel, useEntityId } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';
import { RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { TrialProgress } from '@/lib/types';
import { Abi, addAddressPadding } from 'starknet';

interface UseTrialProgressReturn {
  progress: TrialProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  hasNFT: boolean;
  tokenId: string | null;
}

export function useTrialProgress(): UseTrialProgressReturn {
  const { address } = useAccount();

  // Query for PactMinted event for this player
  // Using KeysClause with the player address as key
  useEventQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          ['ronin_quest-PactMinted'],
          [address ? addAddressPadding(address) : undefined],
          'VariableLen'
        ).build()
      )
      .includeHashedKeys()
  );

  // Retrieve PactMinted event from store
  const entityId = useEntityId(address ?? '0x0');
  const mintedPact = useModel(entityId, 'ronin_quest-PactMinted');

  // Extract token_id from event
  const tokenId = useMemo(() => {
    if (!mintedPact) {
      return null;
    }

    // Extract token_id from the PactMinted event
    const tokenIdValue = (mintedPact as any)?.token_id;
    return tokenIdValue ? BigInt(tokenIdValue).toString() : null;
  }, [mintedPact]);

  // Check actual NFT balance to confirm ownership
  const {
    data: balanceData,
    isLoading: balanceIsLoading,
  } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RONIN_PACT_ABI as Abi,
    functionName: 'balance_of',
    args: address ? [address] : undefined,
    watch: true,
    enabled: !!address,
  });

  const hasNFT = useMemo(() => {
    if (!balanceData || !address) return false;
    const balance = balanceData as bigint;
    return balance > 0n;
  }, [balanceData, address]);

  // Fetch progress from contract using token_id from event
  const {
    data: progressData,
    isLoading: progressIsLoading,
    error: progressError,
    refetch,
  } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RONIN_PACT_ABI as Abi,
    functionName: 'get_progress',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    watch: true,
    enabled: hasNFT && !!tokenId,
  });

  // Parse progress data
  const progress = useMemo(() => {
    if (!address || !hasNFT || !progressData) return null;
    const data = progressData as any;
    return {
      waza_complete: Boolean(data.waza_complete),
      chi_complete: Boolean(data.chi_complete),
      shin_complete: Boolean(data.shin_complete),
    };
  }, [progressData, address, hasNFT]);

  const isLoading = address ? (balanceIsLoading || progressIsLoading) : false;

  return {
    progress,
    isLoading,
    error: progressError?.message || null,
    refetch,
    hasNFT,
    tokenId,
  };
}
