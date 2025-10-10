import { TrialStatus, TrialProgress } from '@/types';
import {
  TRIAL_NAMES,
  TRIAL_SUBTITLES,
  TRIAL_DESCRIPTIONS,
} from '@/lib/constants';

interface TrialCardProps {
  trialName: 'waza' | 'chi' | 'shin';
  status: TrialStatus;
  progress: TrialProgress;
  onComplete: () => void;
  children?: React.ReactNode;
}

export function TrialCard({
  trialName,
  status,
  progress,
  onComplete,
  children,
}: TrialCardProps) {
  const isComplete = progress[`${trialName}_complete`];
  const title = TRIAL_NAMES[trialName];
  const subtitle = TRIAL_SUBTITLES[trialName];
  const description = TRIAL_DESCRIPTIONS[trialName];

  // Status badge configuration
  const statusConfig = {
    locked: {
      label: 'Locked',
      className: 'bg-ronin-secondary/20 text-ronin-secondary/50',
      icon: '🔒',
    },
    available: {
      label: 'Available',
      className: 'bg-ronin-accent/30 text-ronin-accent',
      icon: '✓',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-ronin-light/30 text-ronin-light',
      icon: '⏳',
    },
    completed: {
      label: 'Completed',
      className: 'bg-ronin-primary/30 text-ronin-primary',
      icon: '✓',
    },
  };

  const currentStatus = isComplete ? 'completed' : status;
  const statusInfo = statusConfig[currentStatus];

  return (
    <div
      className={`relative bg-gradient-to-br from-ronin-dark/50 to-ronin-light/30 rounded-lg p-6 shadow-lg border-2 transition-all duration-300 ${
        isComplete
          ? 'border-ronin-primary shadow-ronin-primary/20'
          : status === 'locked'
          ? 'border-ronin-secondary/20 opacity-60'
          : 'border-ronin-secondary/40 hover:border-ronin-accent hover:shadow-xl'
      }`}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}
        >
          <span>{statusInfo.icon}</span>
          <span>{statusInfo.label}</span>
        </span>
      </div>

      {/* Trial Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-ronin-secondary mb-1">
          {title}
        </h3>
        <p className="text-sm text-ronin-accent italic mb-3">{subtitle}</p>
        <p className="text-sm text-ronin-secondary/80 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Trial Content */}
      <div className="space-y-4">
        {status === 'locked' && (
          <div className="flex items-center justify-center py-8 text-ronin-secondary/50">
            <p className="text-sm">Complete previous trials to unlock</p>
          </div>
        )}

        {status !== 'locked' && !isComplete && children}

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

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-radial from-ronin-primary/5 to-transparent rounded-tl-full pointer-events-none" />
    </div>
  );
}
