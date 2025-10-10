import { TrialProgress, TrialState } from '@/types';
import { NFTPreview } from './NFTPreview';
import { TrialCard } from './TrialCard';
import { ShareButton } from './ShareButton';

interface QuestDashboardProps {
  progress: TrialProgress;
  trialState: TrialState;
  onCompleteWaza: () => void;
  onCompleteChi: () => void;
  onCompleteShin: () => void;
  wazaContent?: React.ReactNode;
  chiContent?: React.ReactNode;
  shinContent?: React.ReactNode;
}

export function QuestDashboard({
  progress,
  trialState,
  onCompleteWaza,
  onCompleteChi,
  onCompleteShin,
  wazaContent,
  chiContent,
  shinContent,
}: QuestDashboardProps) {
  // Calculate overall progress
  const completedCount = [
    progress.waza_complete,
    progress.chi_complete,
    progress.shin_complete,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ronin-dark via-ronin-dark/95 to-ronin-light/20 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-ronin-secondary">
            The Ronin's Pact
          </h1>
          <p className="text-lg text-ronin-secondary/80 max-w-2xl mx-auto">
            Forge your legend by mastering three trials. Each completed trial
            lights a slash on your Pact NFT.
          </p>

          {/* Overall Progress */}
          <div className="inline-flex items-center space-x-3 bg-ronin-dark/50 border border-ronin-secondary/30 rounded-full px-6 py-3">
            <span className="text-ronin-secondary/70 font-medium">
              Overall Progress:
            </span>
            <span className="text-2xl font-bold text-ronin-primary">
              {completedCount}
            </span>
            <span className="text-ronin-secondary/50">/</span>
            <span className="text-2xl font-bold text-ronin-secondary/70">
              3
            </span>
            <span className="text-ronin-secondary/70">Trials Complete</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: NFT Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <NFTPreview progress={progress} />
            </div>
          </div>

          {/* Right Column: Trial Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trial 1: Waza */}
            <TrialCard
              trialName="waza"
              status={trialState.waza}
              progress={progress}
              onComplete={onCompleteWaza}
            >
              {wazaContent}
            </TrialCard>

            {/* Trial 2: Chi */}
            <TrialCard
              trialName="chi"
              status={trialState.chi}
              progress={progress}
              onComplete={onCompleteChi}
            >
              {chiContent}
            </TrialCard>

            {/* Trial 3: Shin */}
            <TrialCard
              trialName="shin"
              status={trialState.shin}
              progress={progress}
              onComplete={onCompleteShin}
            >
              {shinContent}
            </TrialCard>
          </div>
        </div>

        {/* Share Button */}
        <div className="max-w-md mx-auto pt-8">
          <ShareButton progress={progress} />
        </div>

        {/* Footer Note */}
        {completedCount === 3 && (
          <div className="text-center py-8">
            <div className="inline-block bg-gradient-to-r from-ronin-primary/20 to-ronin-light/20 border border-ronin-primary/40 rounded-lg px-8 py-6">
              <h3 className="text-2xl font-bold text-ronin-secondary mb-2">
                Congratulations, Ronin!
              </h3>
              <p className="text-ronin-secondary/80">
                You have forged your Pact and mastered all three trials.
              </p>
              <p className="text-sm text-ronin-accent mt-2">
                Your legend is complete. Share your achievement with the world.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
