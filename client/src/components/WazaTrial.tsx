import { useState, useEffect } from 'react';
import { useEventQuery, useModel } from '@dojoengine/sdk/react';
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
  useEventQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          ['ronin_quest-WazaCompleted'],
          [tokenId ? `0x${BigInt(tokenId).toString(16)}` : undefined],
          'VariableLen'
        ).build()
      )
      .includeHashedKeys()
  );

  // Retrieve WazaCompleted event from store
  const wazaCompletedEvent = useModel(tokenId, 'ronin_quest-WazaCompleted');

  // The event itself confirms completion - no need to refetch
  const localSuccess = !!wazaCompletedEvent;

  useTrialCompletion(localSuccess, onComplete);

  const handleClaimViaCollection = async (collection: AllowlistedCollection) => {
    setSelectedCollection(collection.name);
    await tryCollection(collection.address);
  };

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

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
