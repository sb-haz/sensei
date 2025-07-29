import { useRef, useCallback, useState, useEffect } from 'react';
import { AzureAvatarService, AzureAvatarConfig, AvatarServiceCallbacks } from '../app/interview/services/azure-avatar';

interface UseAzureAvatarProps {
    config: AzureAvatarConfig;
    onSpeakingStart?: () => void;
    onSpeakingEnd?: () => void;
    onError?: (error: string) => void;
    onSessionStart?: () => void;
    onSessionEnd?: () => void;
}

interface UseAzureAvatarReturn {
    startSession: (videoContainer: HTMLElement) => Promise<void>;
    stopSession: () => Promise<void>;
    speak: (text: string) => Promise<void>;
    stopSpeaking: () => Promise<void>;
    isSessionActive: boolean;
    isReady: boolean;
    isSpeaking: boolean;
    error: string | null;
    videoElement: HTMLVideoElement | null;
    audioElement: HTMLAudioElement | null;
    isInitialized: boolean;
}

export function useAzureAvatar({
    config,
    onSpeakingStart,
    onSpeakingEnd,
    onError,
    onSessionStart,
    onSessionEnd
}: UseAzureAvatarProps): UseAzureAvatarReturn {
    const avatarServiceRef = useRef<AzureAvatarService | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize avatar service
    useEffect(() => {
        // Prevent re-initialization if already initialized
        if (isInitialized || avatarServiceRef.current) {
            console.log('Azure Avatar Service already initialized, skipping...');
            return;
        }

        const initializeService = async () => {
            try {
                console.log('Initializing Azure Avatar Service for the first time...');
                
                const callbacks: AvatarServiceCallbacks = {
                    onVideoReady: (video: HTMLVideoElement) => {
                        setVideoElement(video);
                    },
                    onAudioReady: (audio: HTMLAudioElement) => {
                        setAudioElement(audio);
                    },
                    onSpeakingStart: () => {
                        setIsSpeaking(true);
                        onSpeakingStart?.();
                    },
                    onSpeakingEnd: () => {
                        setIsSpeaking(false);
                        onSpeakingEnd?.();
                    },
                    onError: (errorMsg: string) => {
                        setError(errorMsg);
                        onError?.(errorMsg);
                    },
                    onSessionStart: () => {
                        setIsSessionActive(true);
                        setIsReady(true);
                        setError(null);
                        onSessionStart?.();
                    },
                    onSessionEnd: () => {
                        setIsSessionActive(false);
                        setIsReady(false);
                        setIsSpeaking(false);
                        setVideoElement(null);
                        setAudioElement(null);
                        onSessionEnd?.();
                    }
                };

                const service = new AzureAvatarService(config, callbacks);
                await service.initialize();
                avatarServiceRef.current = service;
                setIsInitialized(true);
                console.log('Azure Avatar Service initialized successfully');
            } catch (error) {
                const errorMsg = `Failed to initialize Azure Avatar: ${error}`;
                setError(errorMsg);
                setIsInitialized(false);
                onError?.(errorMsg);
            }
        };

        initializeService();

        // Cleanup on unmount
        return () => {
            if (avatarServiceRef.current?.isActive()) {
                avatarServiceRef.current.stopSession();
            }
        };
    }, []); // Empty dependency array to only run once

    const startSession = useCallback(async (videoContainer: HTMLElement) => {
        console.log(`🎬 Hook startSession called - Initialized: ${isInitialized}, Has Service: ${!!avatarServiceRef.current}`);
        
        if (!avatarServiceRef.current || !isInitialized) {
            const error = 'Avatar service not initialized';
            console.error(`❌ ${error}`);
            throw new Error(error);
        }

        try {
            setError(null);
            console.log('🔄 Calling avatarService.startSession...');
            await avatarServiceRef.current.startSession(videoContainer);
            console.log('✅ avatarService.startSession completed');
        } catch (error) {
            const errorMsg = `Failed to start session: ${error}`;
            console.error(`❌ Hook startSession error: ${errorMsg}`);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [isInitialized]);

    const stopSession = useCallback(async () => {
        if (!avatarServiceRef.current) return;

        try {
            await avatarServiceRef.current.stopSession();
        } catch (error) {
            const errorMsg = `Failed to stop session: ${error}`;
            setError(errorMsg);
            console.error(errorMsg);
        }
    }, []);

    const speak = useCallback(async (text: string) => {
        if (!avatarServiceRef.current || !isInitialized) {
            throw new Error('Avatar service not initialized');
        }

        if (!text.trim()) {
            throw new Error('Text cannot be empty');
        }

        try {
            setError(null);
            await avatarServiceRef.current.speak(text);
        } catch (error) {
            const errorMsg = `Failed to speak: ${error}`;
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [isInitialized]);

    const stopSpeaking = useCallback(async () => {
        if (!avatarServiceRef.current) return;

        try {
            await avatarServiceRef.current.stopSpeaking();
        } catch (error) {
            console.error('Failed to stop speaking:', error);
        }
    }, []);

    return {
        startSession,
        stopSession,
        speak,
        stopSpeaking,
        isSessionActive,
        isReady,
        isSpeaking,
        error,
        videoElement,
        audioElement,
        isInitialized
    };
}
