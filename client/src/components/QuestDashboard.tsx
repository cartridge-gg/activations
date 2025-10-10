import { TrialProgress, TrialState } from '@/types';
import { NFTPreview } from './NFTPreview';
import { TrialCard } from './TrialCard';

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-ronin-dark via-ronin-dark/95 to-ronin-light/20 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-lg text-ronin-secondary/80 max-w-4xl mx-auto">
            Forge your legend by mastering three trials. Each completed trial
            lights a slash on your Pact NFT.
          </p>
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
      </div>
    </div>
  );
}
