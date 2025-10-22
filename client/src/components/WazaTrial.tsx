import { useState, useEffect } from 'react';

import { ALLOWLISTED_COLLECTIONS } from '@/lib/config';
import { useWazaClaim } from '@/hooks/useWazaClaim';
import { TrialStatus, AllowlistedCollection } from '@/lib/types';
import { StatusMessage, LoadingSpinner } from './TrialStatus';

interface WazaTrialProps {
  status: TrialStatus;
  onComplete: () => void;
  tokenId: string;
}

export function WazaTrial({ status, onComplete, tokenId }: WazaTrialProps) {
  const { tryCollection, isLoading, error } = useWazaClaim(tokenId, onComplete);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

  const handleClaimViaCollection = async (collection: AllowlistedCollection) => {
    setSelectedCollection(collection.name);
    await tryCollection(collection.address);
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

      {error && !isCompleted && (
        <StatusMessage
          type="error"
          message={error}
          detail="Ensure you own a token from one of the supported game collections"
        />
      )}
    </div>
  );
}
