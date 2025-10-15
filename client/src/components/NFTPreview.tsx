import { TrialProgress } from '@/types';
import { ShareButton } from './ShareButton';
import { useMemo } from 'react';

interface NFTPreviewProps {
  progress: TrialProgress;
}

const TRIALS = [
  { name: 'Waza', key: 'waza_complete' as const },
  { name: 'Chi', key: 'chi_complete' as const },
  { name: 'Shin', key: 'shin_complete' as const },
];

function getBackground(): string {
  return "<rect width='400' height='400' fill='#1a1a2e'/><defs><radialGradient id='bg-gradient'><stop offset='0%' style='stop-color:#2a2a4e;stop-opacity:1'/><stop offset='100%' style='stop-color:#1a1a2e;stop-opacity:1'/></radialGradient></defs><rect width='400' height='400' fill='url(#bg-gradient)'/>";
}

function getBasePact(): string {
  return "<circle cx='200' cy='200' r='80' fill='none' stroke='#4a5568' stroke-width='3' opacity='0.6'/><circle cx='200' cy='200' r='90' fill='none' stroke='#4a5568' stroke-width='2' opacity='0.4'/><circle cx='200' cy='200' r='100' fill='none' stroke='#4a5568' stroke-width='1' opacity='0.2'/><text x='200' y='340' text-anchor='middle' font-family='monospace' font-size='16' fill='#718096'>The Ronins Pact</text>";
}

function getWazaSlash(): string {
  return "<defs><linearGradient id='waza-gradient' x1='140' y1='140' x2='260' y2='260' gradientUnits='userSpaceOnUse'><stop offset='0%' style='stop-color:#ef4444;stop-opacity:1'/><stop offset='100%' style='stop-color:#dc2626;stop-opacity:1'/></linearGradient><filter id='waza-glow'><feGaussianBlur stdDeviation='3' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><line x1='140' y1='140' x2='260' y2='260' stroke='url(#waza-gradient)' stroke-width='8' stroke-linecap='round' filter='url(#waza-glow)'/><text x='120' y='130' font-family='monospace' font-size='14' fill='#ef4444' opacity='0.9'>WAZA</text>";
}

function getChiSlash(): string {
  return "<defs><linearGradient id='chi-gradient' x1='260' y1='140' x2='140' y2='260' gradientUnits='userSpaceOnUse'><stop offset='0%' style='stop-color:#3b82f6;stop-opacity:1'/><stop offset='100%' style='stop-color:#2563eb;stop-opacity:1'/></linearGradient><filter id='chi-glow'><feGaussianBlur stdDeviation='3' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><line x1='260' y1='140' x2='140' y2='260' stroke='url(#chi-gradient)' stroke-width='8' stroke-linecap='round' filter='url(#chi-glow)'/><text x='268' y='130' font-family='monospace' font-size='14' fill='#3b82f6' opacity='0.9'>CHI</text>";
}

function getShinSlash(): string {
  return "<defs><linearGradient id='shin-gradient' x1='200' y1='120' x2='200' y2='280' gradientUnits='userSpaceOnUse'><stop offset='0%' style='stop-color:#a855f7;stop-opacity:1'/><stop offset='100%' style='stop-color:#9333ea;stop-opacity:1'/></linearGradient></defs><line x1='200' y1='120' x2='200' y2='280' stroke='url(#shin-gradient)' stroke-width='8' stroke-linecap='round'/><text x='200' y='110' text-anchor='middle' font-family='monospace' font-size='14' fill='#a855f7' opacity='0.9'>SHIN</text>";
}

function getCompletionGlow(): string {
  return "<defs><radialGradient id='complete-gradient'><stop offset='0%' style='stop-color:#fbbf24;stop-opacity:0.4'/><stop offset='50%' style='stop-color:#f59e0b;stop-opacity:0.2'/><stop offset='100%' style='stop-color:#d97706;stop-opacity:0'/></radialGradient><filter id='complete-glow'><feGaussianBlur stdDeviation='8' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><circle cx='200' cy='200' r='120' fill='url(#complete-gradient)' filter='url(#complete-glow)'/><text x='200' y='360' text-anchor='middle' font-family='monospace' font-size='12' fill='#fbbf24' font-weight='bold'>FORGED</text>";
}

function generateSvg(progress: TrialProgress): string {
  let svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>";

  svg += getBackground();
  svg += getBasePact();

  if (progress.waza_complete) svg += getWazaSlash();
  if (progress.chi_complete) svg += getChiSlash();
  if (progress.shin_complete) svg += getShinSlash();

  if (progress.waza_complete && progress.chi_complete && progress.shin_complete) {
    svg += getCompletionGlow();
  }

  return svg + "</svg>";
}

export function NFTPreview({ progress }: NFTPreviewProps) {
  const svgContent = useMemo(() => generateSvg(progress), [progress]);
  const allComplete = progress.waza_complete && progress.chi_complete && progress.shin_complete;

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
