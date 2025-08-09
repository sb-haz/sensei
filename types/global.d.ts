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
    
    // New chat avatar functions
    __chatAvatarSendMessage?: (userMessage?: string) => Promise<void>;
    __chatAvatarStop?: () => Promise<void>;
    __chatAvatarStatus?: () => {
      isInitialized: boolean;
      isSessionActive: boolean;
      isReady: boolean;
      isSpeaking: boolean;
      error: string | null;
    };
  }
}

export {};
