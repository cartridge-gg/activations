import { TrialProgress, BaseTrialProps } from '@/lib/types';
import { NFTRender } from './NFTRender';
import { TrialCard } from './TrialCard';
import { DASHBOARD_TEXT } from '@/lib/uiText';

interface QuestDashboardProps {
  progress: TrialProgress;
  tokenId: string;
  onTrialComplete: () => void;
  wazaContent: (props: BaseTrialProps) => React.ReactNode;
  chiContent: (props: BaseTrialProps) => React.ReactNode;
  shinContent: (props: BaseTrialProps) => React.ReactNode;
}

export function QuestDashboard({
  progress,
  tokenId,
  onTrialComplete,
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
            {DASHBOARD_TEXT.description}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: NFT Render */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <NFTRender progress={progress} tokenId={tokenId} />
            </div>
          </div>

          {/* Right Column: Trial Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trial 1: Waza */}
            <TrialCard
              trialName="waza"
              status="available"
              progress={progress}
              onComplete={onTrialComplete}
              tokenId={tokenId}
            >
              {wazaContent}
            </TrialCard>

            {/* Trial 2: Chi */}
            <TrialCard
              trialName="chi"
              status="available"
              progress={progress}
              onComplete={onTrialComplete}
              tokenId={tokenId}
            >
              {chiContent}
            </TrialCard>

            {/* Trial 3: Shin */}
            <TrialCard
              trialName="shin"
              status="available"
              progress={progress}
              onComplete={onTrialComplete}
              tokenId={tokenId}
            >
              {shinContent}
            </TrialCard>
          </div>
        </div>
      </div>
    </div>
  );
}
