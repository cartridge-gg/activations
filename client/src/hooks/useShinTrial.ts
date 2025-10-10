import { useState, useCallback } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS } from '@/lib/constants';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
import { SignerInfo } from '@/types';

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
  getSigners: () => Promise<SignerInfo[]>;
  completeTrial: (signerGuid: string) => Promise<void>;
  signers: SignerInfo[];
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useShinTrial(): UseShinTrialReturn {
  const { account, address } = useAccount();
  const [signers, setSigners] = useState<SignerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Contract instance for RoninPact
  const { contract: roninPactContract } = useContract({
    address: RONIN_PACT_ADDRESS,
    abi: RoninPactAbi,
  });

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

      setSigners(mappedSigners);
      setError(null);
      return mappedSigners;
    } catch (err: any) {
      console.error('Error fetching signers:', err);
      setError(err?.message || 'Failed to fetch signers');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Complete the Shin trial with selected signer
  const completeTrial = useCallback(
    async (signerGuid: string) => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      if (!roninPactContract) {
        setError('Contract not initialized');
        return;
      }

      if (!signerGuid) {
        setError('Please select a signer');
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Call complete_shin with just the signer GUID
        // Contract will verify it's registered on the caller's account
        const tx = await account.execute({
          contractAddress: RONIN_PACT_ADDRESS,
          entrypoint: 'complete_shin',
          calldata: [signerGuid], // Just the GUID, no signatures needed!
        });

        // Wait for transaction confirmation
        await account.waitForTransaction(tx.transaction_hash);

        setSuccess(true);
        setError(null);
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
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, roninPactContract]
  );

  return {
    getSigners,
    completeTrial,
    signers,
    isLoading,
    error,
    success,
  };
}
