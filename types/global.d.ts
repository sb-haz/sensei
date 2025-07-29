// Global type definitions for custom window properties

declare global {
  interface Window {
    __avatarSpeak?: (text: string) => Promise<void>;
    __avatarStopSpeaking?: () => Promise<void>;
    __avatarStatus?: () => {
      isInitialized: boolean;
      isSessionActive: boolean;
      isReady: boolean;
      isSpeaking: boolean;
      error: string | null;
    };
    __onAvatarSpeakingStart?: (text: string) => void;
  }
}

export {};
