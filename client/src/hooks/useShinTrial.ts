import { useState, useCallback, useEffect } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { isMockEnabled, mockGetSigners, mockCompleteShin } from '@/lib/mockContracts';
import { SignerInfo } from '@/lib/types';

// Cartridge GraphQL API endpoint
const CARTRIDGE_API_URL = 'https://api.cartridge.gg/query';

// Type definitions from Controller codebase
type CredentialType = 'WebauthnCredentials' | 'Eip191Credentials';

interface Signer {
  guid: string; // The signer GUID (felt252 hash)
  metadata: {
    __typename: CredentialType;
    eip191?: Array<{ provider: string }>;
  };
  isRevoked: boolean;
}

interface UseShinTrialReturn {
  availableSigners: SignerInfo[];
  selectedSigner: SignerInfo | null;
  vowText: string;
  setVowText: (text: string) => void;
  selectSigner: (signer: SignerInfo) => void;
  completeVow: () => Promise<{ success: boolean }>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useShinTrial(): UseShinTrialReturn {
  const { account, address } = useAccount();
  const [availableSigners, setAvailableSigners] = useState<SignerInfo[]>([]);
  const [selectedSigner, setSelectedSigner] = useState<SignerInfo | null>(null);
  const [vowText, setVowText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const useMock = isMockEnabled();

  // Helper function to determine signer type for display
  const credentialToAuthType = (metadata: Signer['metadata']): string => {
    switch (metadata.__typename) {
      case 'Eip191Credentials':
        // Check for specific providers
        if (metadata.eip191?.[0]?.provider) {
          return metadata.eip191[0].provider; // "discord", "google", "metamask", etc.
        }
        return 'eip191';
      case 'WebauthnCredentials':
        return 'webauthn';
      default:
        return 'unknown';
    }
  };

  // Query signers via GraphQL API
  const getSigners = useCallback(async (): Promise<SignerInfo[]> => {
    if (!address) {
      setError('Please connect your wallet');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use mock implementation if enabled
      if (useMock) {
        const mockSigners = await mockGetSigners(address);
        setAvailableSigners(mockSigners);
        setError(null);
        return mockSigners;
      }

      // Fetch signers from Controller's GraphQL API
      const query = `
        query GetControllerSigners($address: String!) {
          controller(address: $address) {
            signers {
              guid
              metadata {
                __typename
                ... on Eip191Credentials {
                  eip191 {
                    provider
                  }
                }
              }
              isRevoked
            }
          }
        }
      `;

      const response = await fetch(CARTRIDGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { address },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL query failed');
      }

      const fetchedSigners = data?.data?.controller?.signers || [];

      // Map to simplified signer info with GUIDs
      const mappedSigners: SignerInfo[] = fetchedSigners
        .map((signer: Signer) => ({
          guid: signer.guid,
          type: credentialToAuthType(signer.metadata),
          isRevoked: signer.isRevoked,
        }))
        .filter((s: SignerInfo) => !s.isRevoked);

      setAvailableSigners(mappedSigners);
      setError(null);
      return mappedSigners;
    } catch (err: any) {
      console.error('Error fetching signers:', err);
      setError(err?.message || 'Failed to fetch signers');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address, useMock]);

  // Auto-fetch signers when address is available
  useEffect(() => {
    if (address) {
      getSigners();
    }
  }, [address, getSigners]);

  // Select a signer
  const selectSigner = useCallback((signer: SignerInfo) => {
    setSelectedSigner(signer);
  }, []);

  // Complete the Shin trial with selected signer
  const completeVow = useCallback(
    async (): Promise<{ success: boolean }> => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return { success: false };
      }

      if (!selectedSigner) {
        setError('Please select a signer');
        return { success: false };
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Use mock implementation if enabled
        if (useMock) {
          await mockCompleteShin(address, selectedSigner.guid);
          setSuccess(true);
          setError(null);
          return { success: true };
        }

        // Call complete_shin on Quest Manager contract directly
        // Contract will verify the signer GUID is registered on the caller's account
        const tx = await account.execute([{
          contractAddress: QUEST_MANAGER_ADDRESS,
          entrypoint: 'complete_shin',
          calldata: [selectedSigner.guid],
        }]);

        // Wait for transaction confirmation
        await account.waitForTransaction(tx.transaction_hash);

        setSuccess(true);
        setError(null);
        return { success: true };
      } catch (err: any) {
        console.error('Error completing Shin trial:', err);

        // Parse error message to provide better feedback
        let errorMessage = 'Failed to complete Shin trial';

        if (err?.message) {
          if (err.message.includes('not registered') || err.message.includes('not found')) {
            errorMessage = 'Selected signer is not registered on your account';
          } else if (err.message.includes('already completed')) {
            errorMessage = 'You have already completed this trial';
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
    [account, address, useMock, selectedSigner]
  );

  return {
    availableSigners,
    selectedSigner,
    vowText,
    setVowText,
    selectSigner,
    completeVow,
    isLoading,
    error,
    success,
  };
}
