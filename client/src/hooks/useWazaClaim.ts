import { useState, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { Contract } from 'starknet';
import { QUEST_MANAGER_ADDRESS, ALLOWLISTED_COLLECTIONS } from '@/lib/config';
import ERC721Abi from '@/lib/contracts/ERC721.abi.json';
import { isMockEnabled, mockCompleteWaza, mockCheckERC721Ownership } from '@/lib/mockContracts';

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
  const useMock = isMockEnabled();

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

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        if (useMock) {
          // Use mock implementations
          const ownsNFT = await mockCheckERC721Ownership(collectionAddress, address);

          if (!ownsNFT) {
            setError('You do not own an NFT from this collection');
            setIsLoading(false);
            return;
          }

          // Call mock complete_waza
          await mockCompleteWaza(address, collectionAddress);

          setSuccess(true);
          setError(null);
        } else {
          // Use real contract implementations
          // First check if user owns NFT from this collection
          const ownsNFT = await checkOwnership(collectionAddress);

          if (!ownsNFT) {
            setError('You do not own an NFT from this collection');
            setIsLoading(false);
            return;
          }

          // Call complete_waza on Quest Manager contract directly
          const tx = await account.execute([{
            contractAddress: QUEST_MANAGER_ADDRESS,
            entrypoint: 'complete_waza',
            calldata: [collectionAddress],
          }]);

          // Wait for transaction confirmation
          await account.waitForTransaction(tx.transaction_hash);

          setSuccess(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error completing Waza trial:', err);
        setError(err?.message || 'Failed to complete Waza trial');
        setSuccess(false);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, useMock]
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
      if (useMock) {
        // Use mock implementations
        for (const collection of ALLOWLISTED_COLLECTIONS) {
          const ownsNFT = await mockCheckERC721Ownership(collection.address, address);

          if (ownsNFT) {
            // Found a collection the user owns, try to complete trial
            await mockCompleteWaza(address, collection.address);
            setSuccess(true);
            setError(null);
            return; // Exit after first successful attempt
          }
        }

        // If we get here, user doesn't own any allowlisted NFTs
        setError('You do not own any NFTs from the allowlisted collections');
      } else {
        // Use real contract implementations
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
      }
    } catch (err: any) {
      console.error('Error trying all collections:', err);
      setError(err?.message || 'Failed to verify collections');
    } finally {
      setIsLoading(false);
    }
  }, [account, address, tryCollection, useMock]);

  return {
    tryCollection,
    tryAll,
    isLoading,
    error,
    success,
  };
}
