import { useState } from 'react';

import { useShinTrial } from '@/hooks/useShinTrial';
import { useTrialCompletion } from '@/hooks/useTrialCompletion';
import { TrialStatus } from '@/lib/types';
import { StatusMessage, LoadingSpinner } from './TrialStatus';

interface ShinTrialProps {
  status: TrialStatus;
  onComplete: () => void;
  tokenId: string;
}

export function ShinTrial({ status, onComplete }: ShinTrialProps) {
  const {
    vowText,
    setVowText,
    completeVow,
    isLoading,
    error,
    success,
    timeRemaining,
    canComplete,
    timeLockDuration,
  } = useShinTrial();

  const [localError, setLocalError] = useState<string | null>(null);

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

  useTrialCompletion(success, onComplete);

  const handleVowChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVowText(e.target.value);
    setLocalError(null);
  };

  const handleCompleteVow = async () => {
    if (!vowText.trim()) {
      setLocalError('Please write your vow before completing the trial');
      return;
    }

    const result = await completeVow();
    if (result.success) {
      onComplete();
    }
  };

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    // For durations less than an hour, show seconds
    if (hours === 0 && minutes === 0) {
      return `${seconds}s`;
    }
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Format the time lock duration for display
  const formatTimeLockDuration = () => {
    if (!timeLockDuration) {
      return 'the required time';
    }

    const hours = Math.floor(timeLockDuration / 3600);
    const minutes = Math.floor(timeLockDuration / 60);

    if (hours >= 1) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes >= 1) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${timeLockDuration} second${timeLockDuration > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <StatusMessage
          type="info"
          message="Trial Complete"
          detail="Your vow has been sealed on-chain"
        />
      ) : (
        <>
          {/* Time Lock Info */}
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="bg-ronin-dark/30 border border-ronin-accent/30 rounded-md p-4">
              <div className="flex items-center gap-2 text-ronin-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  Time remaining: {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              <p className="text-ronin-accent/60 text-xs mt-1">
                You must wait {formatTimeLockDuration()} after minting before completing Shin
              </p>
            </div>
          )}

          {/* Vow Text Input */}
          <div className="mb-6">
            <label className="block text-ronin-secondary text-sm font-medium mb-2">
              Write Your Vow
            </label>
            <textarea
              value={vowText}
              onChange={handleVowChange}
              disabled={isDisabled}
              placeholder="I pledge to bravely explore the new horizons of onchain gaming, courageously engage with new dynamics and mechanisms, and fearlessly experiment with fresh ideas..."
              rows={4}
              className="w-full bg-ronin-dark/30 border border-ronin-light/20 rounded-md px-4 py-3 text-ronin-secondary placeholder-ronin-accent/40 focus:outline-none focus:ring-2 focus:ring-ronin-accent/50 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-ronin-accent/60 text-xs mt-1">
              Your vow will be recorded on-chain as a permanent commitment
            </p>
          </div>

          {/* Complete Vow Button */}
          <button
            onClick={handleCompleteVow}
            disabled={!vowText.trim() || isDisabled || isLoading || !canComplete}
            className="w-full bg-ronin-primary hover:bg-ronin-primary/90 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-md px-6 py-3 text-ronin-secondary font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Sealing Your Vow...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!canComplete ? `Wait ${formatTimeLockDuration()}` : 'Seal Your Vow'}
              </>
            )}
          </button>
        </>
      )}

      {(error || localError) && !isCompleted && (
        <StatusMessage
          type="error"
          message={error || localError || ''}
        />
      )}

      {success && !isCompleted && (
        <StatusMessage
          type="success"
          message="Shin trial completed! Your vow is sealed on-chain."
        />
      )}
    </div>
  );
}
