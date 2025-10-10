import { useAccount } from '@starknet-react/core';
import { ConnectWallet } from './components/ConnectWallet';
import { QuestDashboard } from './components/QuestDashboard';
import { WazaTrial } from './components/WazaTrial';
import { ChiTrial } from './components/ChiTrial';
import { ShinTrial } from './components/ShinTrial';
import { useTrialProgress } from './hooks/useTrialProgress';
import { useState } from 'react';
import { TrialState } from './types';

function App() {
  const { address } = useAccount();
  const { progress, isLoading, refetch } = useTrialProgress();

  const [trialState, setTrialState] = useState<TrialState>({
    waza: 'idle',
    chi: 'idle',
    shin: 'idle',
  });

  const handleCompleteWaza = async () => {
    setTrialState(prev => ({ ...prev, waza: 'loading' }));
    // Trial completion is handled by the WazaTrial component
    await refetch();
    setTrialState(prev => ({ ...prev, waza: 'idle' }));
  };

  const handleCompleteChi = async () => {
    setTrialState(prev => ({ ...prev, chi: 'loading' }));
    await refetch();
    setTrialState(prev => ({ ...prev, chi: 'idle' }));
  };

  const handleCompleteShin = async () => {
    setTrialState(prev => ({ ...prev, shin: 'loading' }));
    await refetch();
    setTrialState(prev => ({ ...prev, shin: 'idle' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ronin-dark to-gray-900 text-ronin-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-ronin-primary mb-2">
              The Rōnin's Pact
            </h1>
            <p className="text-ronin-accent text-lg">
              Forge your path through three trials
            </p>
          </div>
          <ConnectWallet />
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
