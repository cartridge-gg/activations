import { useState, useEffect } from 'react';
import { TrialStatus, SignerInfo } from '@/types';
import { useShinTrial } from '@/hooks/useShinTrial';

interface ShinTrialProps {
  status: TrialStatus;
  onComplete: () => void;
}

export function ShinTrial({ status, onComplete }: ShinTrialProps) {
  const {
    availableSigners,
    selectedSigner,
    vowText,
    setVowText,
    selectSigner,
    completeVow,
    isLoading,
    error,
    success
  } = useShinTrial();

  const [localError, setLocalError] = useState<string | null>(null);

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

  useEffect(() => {
    if (success) {
      onComplete();
    }
  }, [success, onComplete]);

  const handleSignerSelect = (signer: SignerInfo) => {
    if (isDisabled || signer.isRevoked) return;
    selectSigner(signer);
    setLocalError(null);
  };

  const handleVowChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVowText(e.target.value);
    setLocalError(null);
  };

  const handleCompleteVow = async () => {
    if (!vowText.trim()) {
      setLocalError('Please write your vow before completing the trial');
      return;
    }

    if (!selectedSigner) {
      setLocalError('Please select a signer before completing the trial');
      return;
    }

    const result = await completeVow();
    if (result.success) {
      onComplete();
    }
  };

  const getSignerIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'discord':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      case 'webauthn':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        );
      case 'google':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'metamask':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.05 7.54l-4.43-3.26-1.83 2.67 2.35 1.38-1.41 2.06 1.83.99 3.49-3.84zm-19.6 0L6.88 3.54 5.05 6.21l2.35 1.38-1.41 2.06L7.82 10.64 11.31 6.8zM12 14.73l-1.54-2.91-1.54 2.91H12zm9.47-3.42l-2.99-1.68L12 16.31l6.48-5.68 2.99 1.68zm-18.94 0l2.99-1.68L12 16.31 5.52 10.63l-2.99 1.68z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-ronin-dark/50 rounded-lg p-6 border border-ronin-light/20">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-ronin-primary mb-2">
          Trial 3: Shin
        </h3>
        <p className="text-ronin-accent text-sm mb-2">The Way of Spirit</p>
        <p className="text-ronin-secondary/80 text-sm">
          Pledge your vow and commit your spirit to the journey ahead.
        </p>
      </div>

      {isCompleted ? (
        <div className="bg-ronin-primary/10 border border-ronin-primary/30 rounded-md p-4">
          <p className="text-ronin-primary font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trial Complete
          </p>
          <p className="text-ronin-secondary/70 text-sm mt-1">
            Your spirit has been pledged
          </p>
        </div>
      ) : (
        <>
          {/* Vow Text Input */}
          <div className="mb-6">
            <label className="block text-ronin-secondary text-sm font-medium mb-2">
              Write Your Vow
            </label>
            <textarea
              value={vowText}
              onChange={handleVowChange}
              disabled={isDisabled}
              placeholder="I pledge to..."
              rows={4}
              className="w-full bg-ronin-dark/30 border border-ronin-light/20 rounded-md px-4 py-3 text-ronin-secondary placeholder-ronin-accent/40 focus:outline-none focus:ring-2 focus:ring-ronin-accent/50 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-ronin-accent/60 text-xs mt-1">
              Your vow will be recorded onchain as a public commitment
            </p>
          </div>

          {/* Signer Selection */}
          <div className="mb-6">
            <label className="block text-ronin-secondary text-sm font-medium mb-3">
              Select Your Signer
            </label>
            {availableSigners.length === 0 ? (
              <div className="bg-ronin-dark/30 border border-ronin-light/10 rounded-md p-4">
                <p className="text-ronin-accent/60 text-sm flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading available signers...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSigners.map((signer) => {
                  const isSelected = selectedSigner?.guid === signer.guid;
                  const isRevoked = signer.isRevoked;

                  return (
                    <button
                      key={signer.guid}
                      onClick={() => handleSignerSelect(signer)}
                      disabled={isDisabled || isRevoked}
                      className={`w-full text-left px-4 py-3 rounded-md border transition-all ${
                        isSelected
                          ? 'border-ronin-accent/50 bg-ronin-accent/10'
                          : 'border-ronin-light/20 bg-ronin-light/10'
                      } ${
                        isRevoked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-ronin-accent/40'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-ronin-accent bg-ronin-accent'
                            : 'border-ronin-light/30'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-ronin-dark"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          {getSignerIcon(signer.type)}
                          <div className="flex-1">
                            <p className="text-ronin-secondary font-medium capitalize">
                              {signer.type}
                            </p>
                            <p className="text-ronin-accent/60 text-xs font-mono">
                              {signer.guid.slice(0, 8)}...{signer.guid.slice(-6)}
                            </p>
                          </div>
                          {isRevoked && (
                            <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                              Revoked
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Complete Vow Button */}
          <button
            onClick={handleCompleteVow}
            disabled={!vowText.trim() || !selectedSigner || isDisabled || isLoading}
            className="w-full bg-ronin-primary hover:bg-ronin-primary/90 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-md px-6 py-3 text-ronin-secondary font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Completing Vow...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Vow
              </>
            )}
          </button>
        </>
      )}

      {(error || localError) && !isCompleted && (
        <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-md p-4">
          <p className="text-red-400 text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error || localError}
          </p>
        </div>
      )}

      {success && !isCompleted && (
        <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-md p-4">
          <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Shin trial completed successfully!
          </p>
        </div>
      )}

      {status === 'locked' && (
        <div className="mt-4 bg-ronin-dark/80 border border-ronin-light/10 rounded-md p-4">
          <p className="text-ronin-accent/60 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            This trial is currently locked
          </p>
        </div>
      )}
    </div>
  );
}
