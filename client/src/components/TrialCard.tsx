import { useState } from 'react';

import { TRIALS, TrialName } from '@/lib/config';
import { TrialStatus, TrialProgress } from '@/types';

interface TrialCardProps {
  trialName: TrialName;
  status: TrialStatus;
  progress: TrialProgress;
  onComplete: () => void;
  children: (props: { status: TrialStatus; onComplete: () => void }) => React.ReactNode;
}

export function TrialCard({
  trialName,
  status,
  progress,
  onComplete,
  children,
}: TrialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isComplete = progress[`${trialName}_complete`];
  const trial = TRIALS[trialName];
  const { name: title, subtitle } = trial;

  return (
    <div
      className={`relative bg-gradient-to-br from-ronin-dark/50 to-ronin-light/30 rounded-lg shadow-lg border-2 transition-all duration-300 ${
        isComplete
          ? 'border-ronin-primary shadow-ronin-primary/20'
          : status === 'locked'
          ? 'border-ronin-secondary/20 opacity-60'
          : 'border-ronin-secondary/40 hover:border-ronin-accent hover:shadow-xl'
      }`}
    >
      {/* Clickable Trial Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-left py-5 px-6 focus:outline-none transition-all hover:bg-ronin-light/5 ${
          isExpanded ? 'rounded-t-lg border-b-0' : 'rounded-lg'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-2xl font-bold text-ronin-secondary mb-1">
              {title}
            </h3>
            <p className="text-sm text-ronin-accent italic">{subtitle}</p>
          </div>

          {/* Chevron Icon */}
          <div className="flex-shrink-0 pt-1">
            <svg
              className={`w-6 h-6 text-ronin-accent transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Collapsible Trial Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {status === 'locked' && (
            <div className="flex items-center justify-center py-8 text-ronin-secondary/50">
              <p className="text-sm">Complete previous trials to unlock</p>
            </div>
          )}

          {status !== 'locked' && !isComplete && children({ status, onComplete })}

          {isComplete && (
            <div className="bg-ronin-primary/10 border border-ronin-primary/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-ronin-primary">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold">Trial Complete!</span>
              </div>
              <p className="text-sm text-ronin-secondary/70 mt-2">
                You have mastered {title}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-radial from-ronin-primary/5 to-transparent rounded-tl-full pointer-events-none" />
    </div>
  );
}
