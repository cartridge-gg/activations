import { useMemo } from 'react';
import { useReadContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { TrialProgress } from '@/lib/types';
import { Abi } from 'starknet';
import { ShareButton } from './ShareButton';

interface NFTRenderProps {
  progress: TrialProgress;
  tokenId: string;
}

const TRIALS = [
  { name: 'Waza', key: 'waza_complete' as const },
  { name: 'Chi', key: 'chi_complete' as const },
  { name: 'Shin', key: 'shin_complete' as const },
];

export function NFTRender({ progress, tokenId }: NFTRenderProps) {
  // Fetch tokenURI from the contract
  const { data: tokenURIData, isLoading } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RONIN_PACT_ABI as Abi,
    functionName: 'token_uri',
    args: [BigInt(tokenId)],
    watch: true, // Poll for updates when progress changes
    enabled: !!tokenId,
  });

  // Parse and extract SVG from tokenURI
  const svgContent = useMemo(() => {
    if (!tokenURIData) return null;

    try {
      const dataURI = tokenURIData as string;

      // Check if it's an SVG data URI directly
      if (dataURI.startsWith('data:image/svg+xml;utf8,')) {
        return dataURI.substring('data:image/svg+xml;utf8,'.length);
      }

      // Otherwise expect format: data:application/json;base64,<base64_encoded_json>
      if (dataURI.startsWith('data:application/json;base64,')) {
        const base64Data = dataURI.split(',')[1];
        const jsonStr = atob(base64Data);
        const metadata = JSON.parse(jsonStr);

        // Extract SVG from image field
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.split(',')[1];
          return atob(svgBase64);
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  }, [tokenURIData]);

  const allComplete = TRIALS.every(({ key }) => progress[key]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-ronin-dark to-ronin-light rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-96 h-96 rounded-lg overflow-hidden bg-ronin-dark/50 flex items-center justify-center">
            <div className="text-ronin-secondary/50">Loading NFT...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="bg-gradient-to-br from-ronin-dark to-ronin-light rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-96 h-96 rounded-lg overflow-hidden bg-ronin-dark/50 flex items-center justify-center">
            <div className="text-ronin-secondary/50">Failed to load NFT</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-ronin-dark to-ronin-light rounded-lg p-8 shadow-xl">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative w-96 h-96 rounded-lg overflow-hidden">
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>

        <div className="flex items-center space-x-4">
          {TRIALS.map(({ name, key }) => (
            <div key={name} className="flex flex-col items-center space-y-1">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  progress[key] ? 'bg-ronin-primary' : 'bg-ronin-secondary/30'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  progress[key] ? 'text-ronin-secondary' : 'text-ronin-secondary/50'
                }`}
              >
                {name}
              </span>
            </div>
          ))}
        </div>

        {allComplete && (
          <div className="w-full space-y-4 pt-4 border-t border-ronin-primary/30">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-ronin-secondary">
                Congratulations, Ronin!
              </h3>
              <p className="text-sm text-ronin-secondary/80">
                You have forged your Pact and mastered all three trials.
              </p>
              <p className="text-xs text-ronin-accent">
                Your legend is complete. Share your achievement with the world.
              </p>
            </div>
            <ShareButton progress={progress} />
          </div>
        )}
      </div>
    </div>
  );
}
