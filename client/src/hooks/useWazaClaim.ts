import { useState, useCallback } from 'react';
import { useAccount, useContract, useReadContract } from '@starknet-react/core';
import { Contract } from 'starknet';
import { RONIN_PACT_ADDRESS, ALLOWLISTED_COLLECTIONS } from '@/lib/constants';
import RoninPactAbi from '@/lib/contracts/RoninPact.abi.json';
import ERC721Abi from '@/lib/contracts/ERC721.abi.json';

interface UseWazaClaimReturn {
  tryCollection: (collectionAddress: string) => Promise<void>;
  tryAll: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useWazaClaim(): UseWazaClaimReturn {
  const { account, address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Contract instance for RoninPact
  const { contract: roninPactContract } = useContract({
    address: RONIN_PACT_ADDRESS,
    abi: RoninPactAbi,
  });

  // Helper function to check ownership of an ERC721 collection
  const checkOwnership = async (collectionAddress: string): Promise<boolean> => {
    if (!address) return false;

    try {
      // Create ERC721 contract instance
      const erc721Contract = new Contract(
        ERC721Abi,
        collectionAddress,
        account?.provider
      );

      // Call balance_of to check ownership
      const balance = await erc721Contract.balance_of(address);

      // Convert balance to number (it's a u256)
      const balanceNum = Number(balance);

      return balanceNum > 0;
    } catch (err) {
      console.error(`Error checking ownership for ${collectionAddress}:`, err);
      return false;
    }
  };

  // Try to complete Waza trial with a specific collection
  const tryCollection = useCallback(
    async (collectionAddress: string) => {
      if (!account || !address) {
        setError('Please connect your wallet');
        return;
      }

      if (!roninPactContract) {
        setError('Contract not initialized');
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // First check if user owns NFT from this collection
        const ownsNFT = await checkOwnership(collectionAddress);

        if (!ownsNFT) {
          setError('You do not own an NFT from this collection');
          setIsLoading(false);
          return;
        }

        // Call complete_waza on the contract
        const tx = await account.execute({
          contractAddress: RONIN_PACT_ADDRESS,
          entrypoint: 'complete_waza',
          calldata: [collectionAddress],
        });

        // Wait for transaction confirmation
        await account.waitForTransaction(tx.transaction_hash);

        setSuccess(true);
        setError(null);
      } catch (err: any) {
        console.error('Error completing Waza trial:', err);
        setError(err?.message || 'Failed to complete Waza trial');
        setSuccess(false);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, roninPactContract]
  );

  // Try all allowlisted collections
  const tryAll = useCallback(async () => {
    if (!account || !address) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Check ownership for all allowlisted collections
      for (const collection of ALLOWLISTED_COLLECTIONS) {
        const ownsNFT = await checkOwnership(collection.address);

        if (ownsNFT) {
          // Found a collection the user owns, try to complete trial
          await tryCollection(collection.address);
          return; // Exit after first successful attempt
        }
      }

      // If we get here, user doesn't own any allowlisted NFTs
      setError('You do not own any NFTs from the allowlisted collections');
    } catch (err: any) {
      console.error('Error trying all collections:', err);
      setError(err?.message || 'Failed to verify collections');
    } finally {
      setIsLoading(false);
    }
  }, [account, address, tryCollection]);

  return {
    tryCollection,
    tryAll,
    isLoading,
    error,
    success,
  };
}
