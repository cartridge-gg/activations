/**
 * UI Text Configuration for The Rōnin's Pact
 *
 * This file contains all user-facing text strings used throughout the application.
 * Edit this file to update copy without searching through multiple components.
 */

// ============================================================================
// MAIN APP HEADER & FOOTER
// ============================================================================

export const APP_TEXT = {
  header: {
    title: "The Rōnin's Pact",
    subtitle: "Forge your path through three trials",
  },
  footer: {
    poweredBy: "Powered by Cartridge Controller & Starknet",
  },
  loading: {
    progress: "Loading your progress...",
  },
  errors: {
    unableToLoad: "Unable to load quest data",
    checkConnection: "Please check your connection and try again",
  },
  noWallet: {
    title: "Connect your wallet to begin your journey",
    subtitle: "The trials await those brave enough to face them",
  },
} as const;

// ============================================================================
// QUEST DASHBOARD
// ============================================================================

export const DASHBOARD_TEXT = {
  description: "Forge your legend by mastering three trials. Each trial adds a blade to your Pact.",
} as const;

// ============================================================================
// TRIAL CARDS (General)
// ============================================================================

export const TRIAL_CARD_TEXT = {
  locked: "Complete previous trials to unlock",
  complete: {
    title: "Trial Complete!",
    message: "You have mastered", // Followed by trial name
  },
} as const;

// ============================================================================
// TRIAL METADATA
// ============================================================================

export const TRIAL_METADATA = {
  waza: {
    name: 'Waza',
    subtitle: 'The Way of Technique',
    description: 'Prove your mastery by acquiring a token from a Dojo world.',
  },
  chi: {
    name: 'Chi',
    subtitle: 'The Way of Wisdom',
    description: 'Test your knowledge of Dojo 1.7 architecture and principles.',
  },
  shin: {
    name: 'Shin',
    subtitle: 'The Way of Spirit',
    description: 'Pledge your vow and commit your spirit to the journey ahead.',
  },
} as const;

// ============================================================================
// WAZA TRIAL (Technique)
// ============================================================================

export const WAZA_TEXT = {
  complete: {
    title: "Trial Complete",
    message: "Your technique has been proven",
  },
  claimPrompt: "Claim via supported games:",
  error: "Ensure you own a token from one of the supported game collections",
} as const;

// ============================================================================
// CHI TRIAL (Wisdom)
// ============================================================================

export const CHI_TEXT = {
  complete: {
    title: "Trial Complete",
    message: "Your wisdom has been demonstrated",
  },
  submit: "Submit Answers",
  submitting: "Submitting...",
  errors: {
    answerAll: "Please answer all questions before submitting",
    needCorrect: "You need at least 3 correct answers to pass",
  },
} as const;

// ============================================================================
// SHIN TRIAL (Spirit)
// ============================================================================

export const SHIN_TEXT = {
  complete: {
    title: "Trial Complete",
    message: "Your vow has been sealed on-chain",
  },
  timer: {
    remaining: "Time remaining:",
    waitMessage: "You must wait", // Followed by duration and "after minting before completing Shin"
    afterMinting: "after minting before completing Shin",
  },
  form: {
    label: "Write Your Vow",
    placeholder: "I pledge to bravely explore the new horizons of onchain gaming, fearlessly engage with strange mechanisms, and courageously experiment with fresh ideas...",
    info: "Your vow will be recorded on-chain as a permanent commitment",
  },
  buttons: {
    wait: "Wait", // Followed by duration
    seal: "Seal Your Vow",
    submitting: "Submitting...",
  },
  errors: {
    writeVow: "Please write your vow before completing the trial",
  },
} as const;

// ============================================================================
// WALLET CONNECTION
// ============================================================================

export const WALLET_TEXT = {
  connect: "Connect with Controller",
  dropdown: {
    profile: "Profile",
    settings: "Settings",
    disconnect: "Disconnect",
  },
} as const;

// ============================================================================
// MINT BUTTON / NFT MINTING
// ============================================================================

export const MINT_TEXT = {
  header: {
    title: "Forge Your Pact",
    description: "Mint your Rōnin's Pact NFT and begin your journey through the three sacred trials",
  },
  button: {
    mint: "Mint Your NFT",
    minting: "Forging Pact...",
    success: "Pact Forged!",
  },
  helpText: {
    connectWallet: "Connect your wallet to begin",
    redirecting: "Redirecting to your journey in a moment...",
  },
  error: {
    title: "Transaction Failed",
    tryAgain: "Try again",
    pleaseConnect: "Please connect your wallet first",
  },
  footer: {
    info: "This NFT grants you access to complete the three trials and prove your worth as a true Rōnin",
  },
} as const;

// ============================================================================
// SHARE BUTTON & MESSAGES
// ============================================================================

export const SHARE_TEXT = {
  button: "Share on X",
  messages: {
    started: "I've just started my journey towards The Ronin's Pact! 🗡️\n\nJoin me in proving mastery across three trials.",
    oneTrial: "First trial complete on The Ronin's Pact! ⚔️\n\n1/3 slashes forged. The journey continues...",
    twoTrials: "Two trials down, one to go on The Ronin's Pact! 🔥\n\n2/3 slashes forged. Victory is near...",
    complete: "The Ronin's Pact is Fully Forged! 🎌\n\nAll three trials have been completed.",
  },
  tags: ['@ohayo_dojo'],
  hashtags: ['Starknet', 'FOCG'],
  url: 'https://ronin-pact.xyz', // TODO: Update with actual URL
} as const;

// ============================================================================
// NFT RENDER / COMPLETION
// ============================================================================

export const NFT_RENDER_TEXT = {
  loading: "Loading NFT...",
  error: "Failed to load NFT",
  completion: {
    title: "Congratulations, Ronin!",
    message: "Your legend is complete. ",
    callToAction: "Share your achievement with the world.",
  },
  trials: {
    waza: "Waza",
    chi: "Chi",
    shin: "Shin",
  },
} as const;

// ============================================================================
// GENERAL BUTTON TEXT
// ============================================================================

export const BUTTON_TEXT = {
  defaultLoading: "Submitting...",
} as const;
