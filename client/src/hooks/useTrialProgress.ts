import { useMemo } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { useTokens } from '@dojoengine/sdk/react';
import { RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { TrialProgress } from '@/types';
import { Abi } from 'starknet';

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

  // Get user's NFTs from Torii
  const { tokens } = useTokens({
    accountAddresses: address ? [address] : [],
  });

  // Find Ronin Pact NFT and extract token ID
  const { hasNFT, tokenId } = useMemo(() => {
    const token = tokens.find(
      (t) => t.contract_address.toLowerCase() === RONIN_PACT_ADDRESS.toLowerCase()
    );
    return {
      hasNFT: !!token,
      tokenId: token?.token_id ? BigInt(token.token_id).toString() : null,
    };
  }, [tokens]);

  // Fetch progress from contract
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
      waza_complete: Boolean(data[0]),
      chi_complete: Boolean(data[1]),
      shin_complete: Boolean(data[2]),
    };
  }, [progressData, address, hasNFT]);

  const isLoading = address ? (hasNFT && !tokenId) || progressIsLoading : false;

  return {
    progress,
    isLoading,
    error: progressError?.message || null,
    refetch,
    hasNFT,
    tokenId,
  };
}
