import { useState, useEffect } from 'react';
import { useEventQuery, useModel, useEntityId } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';

import { ALLOWLISTED_COLLECTIONS } from '@/lib/config';
import { useWazaClaim } from '@/hooks/useWazaClaim';
import { useTrialCompletion } from '@/hooks/useTrialCompletion';
import { TrialStatus, AllowlistedCollection } from '@/lib/types';
import { StatusMessage, LoadingSpinner } from './TrialStatus';

interface WazaTrialProps {
  status: TrialStatus;
  onComplete: () => void;
  tokenId: string;
}

export function WazaTrial({ status, onComplete, tokenId }: WazaTrialProps) {
  const { tryCollection, isLoading, error } = useWazaClaim(tokenId);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Subscribe to WazaCompleted event for this token
  const tokenIdHex = tokenId ? `0x${BigInt(tokenId).toString(16)}` : undefined;

  useEventQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          ['ronin_quest-WazaCompleted'],
          [tokenIdHex],
          'VariableLen'
        ).build()
      )
      .includeHashedKeys()
  );

  // Retrieve WazaCompleted event from store
  const wazaEventEntityId = useEntityId(tokenIdHex ?? '0x0');
  const wazaCompletedEvent = useModel(wazaEventEntityId, 'ronin_quest-WazaCompleted');

  // Debug logging
  useEffect(() => {
    console.log('=== WazaTrial Component State ===');
    console.log('Token ID:', tokenId);
    console.log('Token ID Hex:', tokenIdHex);
    console.log('Entity ID:', wazaEventEntityId);
    console.log('Waza Completed Event:', wazaCompletedEvent);
    console.log('Status:', status);
  }, [tokenId, tokenIdHex, wazaEventEntityId, wazaCompletedEvent, status]);

  // The event itself confirms completion
  const localSuccess = !!wazaCompletedEvent;

  useTrialCompletion(localSuccess, onComplete);

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

  const handleClaimViaCollection = async (collection: AllowlistedCollection) => {
    try {
      console.log('=== WazaTrial Component: handleClaimViaCollection ===');
      console.log('Collection:', collection);
      console.log('Token ID:', tokenId);
      console.log('Is Disabled:', isDisabled);
      console.log('Is Loading:', isLoading);

      setSelectedCollection(collection.name);
      await tryCollection(collection.address);

      console.log('=== WazaTrial Component: tryCollection completed ===');
    } catch (err) {
      console.error('=== WazaTrial Component: Error in handleClaimViaCollection ===');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <StatusMessage
          type="info"
          message="Trial Complete"
          detail="Your technique has been proven"
        />
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <p className="text-ronin-secondary text-sm font-medium">
              Claim via supported games:
            </p>
            {ALLOWLISTED_COLLECTIONS.map((collection) => (
              <button
                key={collection.name}
                onClick={() => handleClaimViaCollection(collection)}
                disabled={isDisabled || (isLoading && selectedCollection === collection.name)}
                className="w-full bg-ronin-light/20 hover:bg-ronin-light/30 disabled:bg-gray-700/30 disabled:cursor-not-allowed border border-ronin-light/30 rounded-md px-4 py-3 text-ronin-secondary font-medium transition-colors text-left flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-ronin-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {collection.displayName}
                </span>
                {isLoading && selectedCollection === collection.name && (
                  <LoadingSpinner className="h-5 w-5 text-ronin-accent" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {isLoading && !isCompleted && (
        <StatusMessage
          type="info"
          message="Transaction submitted"
          detail="Waiting for confirmation on-chain..."
        />
      )}

      {error && !isCompleted && (
        <StatusMessage
          type="error"
          message={error}
          detail="Ensure you own a token from one of the supported game collections"
        />
      )}

      {localSuccess && !isCompleted && (
        <StatusMessage
          type="success"
          message="Waza trial completed successfully!"
        />
      )}
    </div>
  );
}
