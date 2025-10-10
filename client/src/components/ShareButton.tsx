import { TrialProgress } from '@/types';
import { SHARE_URL, SHARE_HASHTAGS } from '@/lib/constants';

interface ShareButtonProps {
  progress: TrialProgress;
}

export function ShareButton({ progress }: ShareButtonProps) {
  const completedCount = [
    progress.waza_complete,
    progress.chi_complete,
    progress.shin_complete,
  ].filter(Boolean).length;

  const handleShare = () => {
    // Craft the message based on progress
    let message = '';

    if (completedCount === 0) {
      message = `I've just started my journey on The Ronin's Pact! 🗡️\n\nJoin me in proving mastery across three trials.`;
    } else if (completedCount === 1) {
      message = `First trial complete on The Ronin's Pact! ⚔️\n\n1/3 slashes forged. The journey continues...`;
    } else if (completedCount === 2) {
      message = `Two trials down, one to go on The Ronin's Pact! 🔥\n\n2/3 slashes forged. Victory is near...`;
    } else {
      message = `The Ronin's Pact is Fully Forged! 🎌\n\nAll three trials complete. Waza, Chi, and Shin mastered.`;
    }

    // Add hashtags and URL
    const hashtags = SHARE_HASHTAGS.join(',');
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      message
    )}&url=${encodeURIComponent(SHARE_URL)}&hashtags=${hashtags}`;

    // Open Twitter compose in new window
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  return (
    <button
      onClick={handleShare}
      className="w-full bg-gradient-to-r from-ronin-primary to-ronin-light hover:from-ronin-primary/90 hover:to-ronin-light/90 text-ronin-secondary font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>Share on X</span>
    </button>
  );
}
