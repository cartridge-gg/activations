import { TrialProgress, VisualState } from '@/types';

interface NFTPreviewProps {
  progress: TrialProgress;
}

export function NFTPreview({ progress }: NFTPreviewProps) {
  // Calculate visual state (number of slashes lit)
  const visualState: VisualState = [
    progress.waza_complete,
    progress.chi_complete,
    progress.shin_complete,
  ].filter(Boolean).length as VisualState;

  const slashStates = [
    { name: 'Waza', complete: progress.waza_complete },
    { name: 'Chi', complete: progress.chi_complete },
    { name: 'Shin', complete: progress.shin_complete },
  ];

  return (
    <div className="bg-gradient-to-br from-ronin-dark to-ronin-light rounded-lg p-8 shadow-xl">
      <div className="flex flex-col items-center space-y-6">
        {/* NFT Visual Representation */}
        <div className="relative w-64 h-64 bg-ronin-secondary/10 rounded-lg border-4 border-ronin-secondary/30 flex items-center justify-center overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {/* Three Slashes */}
          <div className="relative z-10 flex items-center justify-center space-x-4">
            {slashStates.map((slash, index) => (
              <div
                key={slash.name}
                className={`w-2 h-32 rounded-full transition-all duration-700 transform ${
                  slash.complete
                    ? 'bg-ronin-primary shadow-lg shadow-ronin-primary/50 scale-110'
                    : 'bg-ronin-secondary/20'
                } ${index === 1 ? 'rotate-12' : index === 2 ? '-rotate-12' : ''}`}
                style={{
                  transformOrigin: 'center',
                }}
              />
            ))}
          </div>

          {/* Center Glow Effect */}
          {visualState === 3 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 bg-ronin-primary/20 rounded-full blur-3xl animate-pulse" />
            </div>
          )}
        </div>

        {/* Progress Text */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-ronin-secondary">
            The Ronin's Pact
          </h3>
          <div className="flex items-center justify-center space-x-2">
            <div className="text-3xl font-bold text-ronin-primary">
              {visualState}
            </div>
            <div className="text-lg text-ronin-secondary/70">/</div>
            <div className="text-3xl font-bold text-ronin-secondary/70">3</div>
          </div>
          <p className="text-sm text-ronin-secondary/80">
            {visualState === 0 && 'Begin your journey'}
            {visualState === 1 && 'One trial complete'}
            {visualState === 2 && 'Two trials complete'}
            {visualState === 3 && 'Fully Forged Pact'}
          </p>
        </div>

        {/* Trial Status Indicators */}
        <div className="flex items-center space-x-4">
          {slashStates.map((slash) => (
            <div
              key={slash.name}
              className="flex flex-col items-center space-y-1"
            >
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  slash.complete ? 'bg-ronin-primary' : 'bg-ronin-secondary/30'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  slash.complete ? 'text-ronin-secondary' : 'text-ronin-secondary/50'
                }`}
              >
                {slash.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
