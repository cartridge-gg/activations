import { useAccount } from '@starknet-react/core';
import { ConnectWallet } from './components/ConnectWallet';
import { QuestDashboard } from './components/QuestDashboard';
import { WazaTrial } from './components/WazaTrial';
import { ChiTrial } from './components/ChiTrial';
import { ShinTrial } from './components/ShinTrial';
import { ShareButton } from './components/ShareButton';
import { useTrialProgress } from './hooks/useTrialProgress';
import { useState, useEffect } from 'react';
import { TrialState, TrialProgress } from './types';

function App() {
  const { address } = useAccount();
  const { progress: fetchedProgress, isLoading } = useTrialProgress();

  // Local progress state for instant updates
  const [progress, setProgress] = useState<TrialProgress | null>(null);

  const [trialState, setTrialState] = useState<TrialState>({
    waza: 'available',
    chi: 'available',
    shin: 'available',
  });

  // Sync local progress with fetched progress
  useEffect(() => {
    if (fetchedProgress) {
      setProgress(fetchedProgress);
    }
  }, [fetchedProgress]);

  const handleCompleteWaza = () => {
    // Optimistically update progress immediately
    setProgress(prev => prev ? { ...prev, waza_complete: true } : null);
    setTrialState(prev => ({ ...prev, waza: 'available' }));
  };

  const handleCompleteChi = () => {
    // Optimistically update progress immediately
    setProgress(prev => prev ? { ...prev, chi_complete: true } : null);
    setTrialState(prev => ({ ...prev, chi: 'available' }));
  };

  const handleCompleteShin = () => {
    // Optimistically update progress immediately
    setProgress(prev => prev ? { ...prev, shin_complete: true } : null);
    setTrialState(prev => ({ ...prev, shin: 'available' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ronin-dark to-gray-900 text-ronin-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div className="flex-shrink-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-ronin-primary mb-2">
              The Rōnin's Pact
            </h1>
            <p className="text-ronin-accent text-base sm:text-lg">
              Forge your path through three trials
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
            {progress && (
              <div className="w-40 sm:w-48">
                <ShareButton progress={progress} />
              </div>
            )}
            <ConnectWallet />
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
            ) : progress ? (
              <QuestDashboard
                progress={progress}
                trialState={trialState}
                onCompleteWaza={handleCompleteWaza}
                onCompleteChi={handleCompleteChi}
                onCompleteShin={handleCompleteShin}
                wazaContent={<WazaTrial />}
                chiContent={<ChiTrial />}
                shinContent={<ShinTrial />}
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
