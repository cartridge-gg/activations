import { useState, useEffect, useCallback } from 'react';

import { useAccount } from '@starknet-react/core';

import { TrialName } from './lib/config';
import { ConnectWallet } from './components/ConnectWallet';
import { MintButton } from './components/MintButton';
import { QuestDashboard } from './components/QuestDashboard';
import { WazaTrial } from './components/WazaTrial';
import { ChiTrial } from './components/ChiTrial';
import { ShinTrial } from './components/ShinTrial';
import { ShareButton } from './components/ShareButton';
import { useTrialProgress } from './hooks/useTrialProgress';
import { TrialProgress } from './types';

function App() {
  const { address } = useAccount();
  const { progress: fetchedProgress, isLoading, hasNFT } = useTrialProgress();

  // Local progress state for instant updates
  const [progress, setProgress] = useState<TrialProgress | null>(null);

  // Sync local progress with fetched progress
  useEffect(() => {
    if (fetchedProgress) {
      setProgress(fetchedProgress);
    }
  }, [fetchedProgress]);

  // Generic trial completion handler
  const handleTrialComplete = useCallback((trial: TrialName) => {
    setProgress(prev => prev ? { ...prev, [`${trial}_complete`]: true } : null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ronin-dark to-gray-900 text-ronin-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-12">
          <div className="flex-shrink-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-ronin-primary mb-2">
              The Rōnin's Pact
            </h1>
            <p className="text-ronin-accent text-base sm:text-lg">
              Forge your path through three trials
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {progress && (
              <div className="w-full sm:w-48 flex-shrink-0">
                <ShareButton progress={progress} />
              </div>
            )}
            <div className="w-full sm:w-48 flex-shrink-0">
              <ConnectWallet />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {address ? (
            isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ronin-primary"></div>
                <p className="text-ronin-secondary mt-4">Loading your progress...</p>
              </div>
            ) : !hasNFT ? (
              <div className="py-12 md:py-20">
                <MintButton />
              </div>
            ) : progress ? (
              <QuestDashboard
                progress={progress}
                onCompleteWaza={() => handleTrialComplete('waza')}
                onCompleteChi={() => handleTrialComplete('chi')}
                onCompleteShin={() => handleTrialComplete('shin')}
                wazaContent={(props) => <WazaTrial {...props} />}
                chiContent={(props) => <ChiTrial {...props} />}
                shinContent={(props) => <ShinTrial {...props} />}
              />
            ) : (
              <div className="text-center py-20">
                <h2 className="text-2xl text-ronin-secondary mb-4">
                  Unable to load quest data
                </h2>
                <p className="text-ronin-accent">
                  Please check your connection and try again
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl text-ronin-secondary mb-4">
                Connect your wallet to begin your journey
              </h2>
              <p className="text-ronin-accent">
                The trials await those brave enough to face them
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-20 text-center text-ronin-accent text-sm">
          <p>Powered by Cartridge Controller & Starknet</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
