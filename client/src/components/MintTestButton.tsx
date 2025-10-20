import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useDojo } from '@/hooks/useDojo';

export function MintTestButton() {
  const { address, account } = useAccount();
  const { setup } = useDojo();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleMint = async () => {
    if (!account || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      console.log('Starting mint transaction...');
      console.log('Connected address:', address);

      // Call the mint function through Dojo SDK
      const result = await setup.actions.mint(account);

      console.log('✅ Transaction submitted successfully!');
      console.log('Transaction hash:', result.transaction_hash);
      console.log('Full result:', result);

      setTxHash(result.transaction_hash);

      // Wait for transaction to be confirmed
      console.log('Waiting for transaction confirmation...');
      await account.waitForTransaction(result.transaction_hash);

      console.log('✅ Transaction confirmed!');
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Mint failed:', err);
      setError(err?.message || 'Failed to mint NFT');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Test Mint Function</h2>

      <button onClick={handleMint} disabled={isLoading || !address}>
        {isLoading ? 'Minting...' : 'Mint NFT'}
      </button>

      {!address && <p>Connect wallet to mint</p>}

      {isLoading && (
        <div>
          <p>Transaction in progress...</p>
          {txHash && <p>TX Hash: {txHash}</p>}
        </div>
      )}

      {success && (
        <div>
          <p>✅ Mint successful!</p>
          {txHash && <p>TX Hash: {txHash}</p>}
        </div>
      )}

      {error && (
        <div>
          <p>❌ Error: {error}</p>
        </div>
      )}
    </div>
  );
}
