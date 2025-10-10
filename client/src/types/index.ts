// Type definitions for The Rōnin's Pact

export interface TrialProgress {
  waza_complete: boolean;
  chi_complete: boolean;
  shin_complete: boolean;
}

export type TrialStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface TrialState {
  waza: TrialStatus;
  chi: TrialStatus;
  shin: TrialStatus;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
}

export interface AllowlistedCollection {
  address: string;
  name: string;
  displayName: string;
}

export interface SignerInfo {
  guid: string;
  type: string; // "discord", "webauthn", "google", "metamask", etc.
  isRevoked: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export type VisualState = 0 | 1 | 2 | 3; // 0-3 slashes lit
