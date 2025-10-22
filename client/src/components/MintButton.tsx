import { useState } from 'react';

import { useAccount } from '@starknet-react/core';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';

export function MintButton() {
  const { address, account } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMint = async () => {
    if (!account || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Starting mint transaction...');
      console.log('Connected address:', address);
      console.log('Quest Manager address:', QUEST_MANAGER_ADDRESS);

      console.log('Account object:', account);
      console.log('Account type:', account?.constructor?.name);

      const result = await account.execute([{
        contractAddress: QUEST_MANAGER_ADDRESS,
        entrypoint: 'mint',
        calldata: [],
      }]);

      console.log('✅ Transaction submitted successfully!');
      console.log('Transaction hash:', result.transaction_hash);
      console.log('Full result:', result);

      // Wait for transaction to be confirmed
      console.log('Waiting for transaction confirmation...');
      await account.waitForTransaction(result.transaction_hash);

      console.log('✅ Transaction confirmed!');
      setSuccess(true);

      // Auto-redirect after showing success message
      setTimeout(() => {
        console.log('Reloading page to show progress...');
        window.location.reload();
      }, 2000); // 2 second delay to show success message
    } catch (err: any) {
      console.error('❌ Mint failed:', err);
      setError(err?.message || 'Failed to mint NFT');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Container with gradient border effect */}
      <div className="relative p-1 rounded-2xl bg-gradient-to-br from-ronin-primary via-ronin-accent to-ronin-light shadow-2xl">
        <div className="bg-ronin-dark rounded-2xl p-8 md:p-10">

          {/* Header Section */}
          <div className="text-center mb-8">
            {/* Decorative Japanese-inspired icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-ronin-primary to-red-700 shadow-lg">
              <svg
                className="w-10 h-10 text-ronin-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Sword icon */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-ronin-secondary mb-3">
              Forge Your Pact
            </h2>
            <p className="text-ronin-accent text-base md:text-lg max-w-md mx-auto leading-relaxed">
              Mint your Rōnin's Pact NFT and begin your journey through the three sacred trials
            </p>
          </div>

          {/* Mint Button */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <button
              onClick={handleMint}
              disabled={isLoading || !address || success}
              className={`
                w-full md:w-auto
                px-10 py-4 rounded-xl font-bold text-lg
                transition-all duration-300 ease-out
                transform
                ${
                  success
                    ? 'bg-green-600 text-white cursor-default shadow-lg'
                    : isLoading || !address
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-ronin-primary to-red-600 hover:from-red-600 hover:to-ronin-primary text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95'
                }
                disabled:transform-none disabled:shadow-none
                flex items-center justify-center gap-3
              `}
            >
              {isLoading ? (
                <>
                  {/* Spinning loader */}
                  <svg
                    className="animate-spin h-6 w-6"
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
                  <span>Forging Pact...</span>
                </>
              ) : success ? (
                <>
                  <svg
                    className="w-6 h-6"
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
                  <span>Pact Forged!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Mint Your NFT</span>
                </>
              )}
            </button>

            {/* Helper text for non-connected state */}
            {!address && !success && (
              <p className="text-ronin-accent text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Connect your wallet to begin
              </p>
            )}

            {/* Redirect message for success state */}
            {success && (
              <p className="text-gray-400 text-sm italic animate-in fade-in duration-500">
                Redirecting to your journey in a moment...
              </p>
            )}
          </div>

          {/* Status Messages */}
          <div className="min-h-[100px]">
            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-900/30 border-2 border-ronin-primary rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-ronin-primary flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-ronin-primary font-semibold mb-2">
                      Transaction Failed
                    </p>
                    <p className="text-ronin-secondary text-sm mb-2">
                      {error}
                    </p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-ronin-accent hover:text-ronin-secondary text-sm underline transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-8 pt-6 border-t border-ronin-accent/20">
            <p className="text-ronin-accent text-xs md:text-sm text-center">
              This NFT grants you access to complete the three trials and prove your worth as a true Rōnin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
