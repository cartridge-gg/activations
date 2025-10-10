import { useState, useEffect } from 'react';
import { TrialStatus, AllowlistedCollection } from '@/types';
import { ALLOWLISTED_COLLECTIONS } from '@/lib/constants';
import { useWazaClaim } from '@/hooks/useWazaClaim';

interface WazaTrialProps {
  status: TrialStatus;
  onComplete: () => void;
}

export function WazaTrial({ status, onComplete }: WazaTrialProps) {
  const { tryCollection, tryAll, isLoading, error, success } = useWazaClaim();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      onComplete();
    }
  }, [success, onComplete]);

  const handleClaimViaCollection = async (collection: AllowlistedCollection) => {
    setSelectedCollection(collection.name);
    await tryCollection(collection.address);
  };

  const handleClaimAll = async () => {
    setSelectedCollection('all');
    await tryAll();
  };

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <div className="bg-ronin-primary/10 border border-ronin-primary/30 rounded-md p-4 mb-4">
          <p className="text-ronin-primary font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trial Complete
          </p>
          <p className="text-ronin-secondary/70 text-sm mt-1">
            Your technique has been proven
          </p>
        </div>
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
                  <svg className="animate-spin h-5 w-5 text-ronin-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-ronin-light/20">
            <button
              onClick={handleClaimAll}
              disabled={isDisabled || (isLoading && selectedCollection === 'all')}
              className="w-full bg-ronin-primary hover:bg-ronin-primary/90 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-md px-6 py-3 text-ronin-secondary font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && selectedCollection === 'all' ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Try All Games
                </>
              )}
            </button>
          </div>
        </>
      )}

      {error && !isCompleted && (
        <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-md p-4">
          <p className="text-red-400 text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
          <p className="text-red-400/70 text-xs mt-1">
            Ensure you own a token from one of the supported game collections
          </p>
        </div>
      )}

      {success && !isCompleted && (
        <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-md p-4">
          <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Waza trial completed successfully!
          </p>
        </div>
      )}

    </div>
  );
}
