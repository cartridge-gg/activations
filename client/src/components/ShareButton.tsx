import { TrialProgress } from '@/lib/types';
import { SHARE_TEXT } from '@/lib/uiText';

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
      message = SHARE_TEXT.messages.started;
    } else if (completedCount === 1) {
      message = SHARE_TEXT.messages.oneTrial;
    } else if (completedCount === 2) {
      message = SHARE_TEXT.messages.twoTrials;
    } else {
      message = SHARE_TEXT.messages.complete;
    }

    // Build full message with tags, URL, and hashtags
    const tags = SHARE_TEXT.tags.join(' ');
    const hashtags = SHARE_TEXT.hashtags.map(tag => `#${tag}`).join(' ');
    const fullMessage = `${message}\n\nForge your own and compete for the $15k prize at Dojo Game Jam VII: ${SHARE_TEXT.url}\n\n${tags} ${hashtags}`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      fullMessage
    )}`;

    // Open Twitter compose in new window
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  return (
    <button
      onClick={handleShare}
      className="w-full bg-ronin-primary hover:bg-red-600 text-ronin-secondary font-semibold py-4 px-6 border-2 border-ronin-secondary/30 transition-all duration-300 flex items-center justify-center space-x-3"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>{SHARE_TEXT.button}</span>
    </button>
  );
}
