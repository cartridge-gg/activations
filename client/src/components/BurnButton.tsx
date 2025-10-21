import { useState } from 'react';

import { useAccount } from '@starknet-react/core';

import { RONIN_PACT_ADDRESS } from '@/lib/config';

interface BurnButtonProps {
  tokenId: string;
}

export function BurnButton({ tokenId }: BurnButtonProps) {
  const { address, account } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBurn = async () => {
    if (!account || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!tokenId) {
      setError('No token ID available');
      return;
    }

    // Confirm with user before burning
    if (!confirm(`Are you sure you want to burn token #${tokenId}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Burning token:', tokenId);
      console.log('From address:', address);
      console.log('Contract address:', RONIN_PACT_ADDRESS);

      // Transfer token to address 0x0 (burn)
      // ERC721 transfer signature: transfer_from(from, to, token_id_low, token_id_high)
      const result = await account.execute([{
        contractAddress: RONIN_PACT_ADDRESS,
        entrypoint: 'transfer_from',
        calldata: [
          address,  // from
          '0x0',    // to (burn address)
          tokenId,  // token_id low (for small token IDs, the full ID)
          '0x0',    // token_id high (0 for small token IDs)
        ],
      }]);

      console.log('✅ Burn transaction submitted!');
      console.log('Transaction hash:', result.transaction_hash);

      // Wait for transaction confirmation
      console.log('Waiting for transaction confirmation...');
      await account.waitForTransaction(result.transaction_hash);

      console.log('✅ Token burned successfully!');
      setSuccess(true);

      // Reload after successful burn
      setTimeout(() => {
        console.log('Reloading page...');
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('❌ Burn failed:', err);
      setError(err?.message || 'Failed to burn token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleBurn}
        disabled={isLoading || !address || success}
        className={`
          w-full px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-300
          ${
            isLoading || !address || success
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
          }
          flex items-center justify-center gap-2
        `}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Burning...</span>
          </>
        ) : success ? (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Burned!</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Burn Token (Dev)</span>
          </>
        )}
      </button>

      {error && !isLoading && (
        <div className="mt-2 p-2 bg-red-900/30 border border-red-500 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {success && !isLoading && (
        <div className="mt-2 p-2 bg-green-900/30 border border-green-500 rounded text-green-400 text-xs">
          Token burned successfully! Reloading...
        </div>
      )}
    </div>
  );
}
