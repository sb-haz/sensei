import { RefObject, useRef, useEffect, useState } from 'react';
import { useAzureAvatar } from '@/hooks/use-azure-avatar';
import { AzureAvatarConfig } from '../services/azure-avatar';
import { AZURE_AVATAR_CONFIG } from '@/lib/azure-config';

interface VideoGridProps {
    videoRef: RefObject<HTMLVideoElement>;
    className?: string;
    isInterviewerSpeaking?: boolean;
    onInterviewerSpeakingChange?: (speaking: boolean) => void;
    avatarConfig?: AzureAvatarConfig;
}

export default function VideoGrid({ 
    videoRef, 
    className,
    onInterviewerSpeakingChange,
    avatarConfig = AZURE_AVATAR_CONFIG
}: VideoGridProps) {
    const avatarContainerRef = useRef<HTMLDivElement>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const {
        startSession,
        stopSession,
        speak,
        stopSpeaking,
        isSessionActive,
        isReady,
        isSpeaking,
        error: avatarServiceError,
        isInitialized
    } = useAzureAvatar({
        config: avatarConfig,
        onSpeakingStart: () => {
            onInterviewerSpeakingChange?.(true);
        },
        onSpeakingEnd: () => {
            onInterviewerSpeakingChange?.(false);
        },
        onError: (error) => {
            console.error('Azure Avatar error:', error);
            setAvatarError(error);
        },
        onSessionStart: () => {
            console.log('Avatar session started');
            setAvatarError(null);
        },
        onSessionEnd: () => {
            console.log('Avatar session ended');
        }
    });

    // Initialize avatar session when component mounts and service is initialized
    useEffect(() => {
        console.log(`🔍 VideoGrid useEffect - Container: ${!!avatarContainerRef.current}, SessionActive: ${isSessionActive}, Initialized: ${isInitialized}`);
        
        // Add a small delay to ensure the DOM is ready
        const initializeWithDelay = async () => {
            // Wait a bit for the DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log(`🔍 After delay - Container: ${!!avatarContainerRef.current}, SessionActive: ${isSessionActive}, Initialized: ${isInitialized}`);
            
            if (avatarContainerRef.current && !isSessionActive && isInitialized) {
                const initializeAvatar = async () => {
                    try {
                        console.log('🚀 Starting avatar session from VideoGrid...');
                        console.log('🚀 Container element:', avatarContainerRef.current);
                        await startSession(avatarContainerRef.current!);
                        console.log('✅ Avatar session started successfully from VideoGrid');
                    } catch (error) {
                        console.error('❌ Failed to initialize avatar from VideoGrid:', error);
                        setAvatarError(`Failed to start avatar: ${error}`);
                    }
                };

                initializeAvatar();
            } else {
                console.log(`⏸️ Skipping avatar session start after delay - Container: ${!!avatarContainerRef.current}, SessionActive: ${isSessionActive}, Initialized: ${isInitialized}`);
            }
        };

        initializeWithDelay();

        // Cleanup on unmount
        return () => {
            if (isSessionActive) {
                stopSession();
            }
        };
    }, [startSession, stopSession, isSessionActive, isInitialized]);

    // Debug effect to track container ref availability
    useEffect(() => {
        console.log(`📦 Container ref updated: ${!!avatarContainerRef.current}`);
        if (avatarContainerRef.current) {
            console.log(`📦 Container element details:`, {
                tagName: avatarContainerRef.current.tagName,
                className: avatarContainerRef.current.className,
                id: avatarContainerRef.current.id
            });
        }
    }, [avatarContainerRef.current]);

    // Expose speak function to parent component via a custom hook or context
    useEffect(() => {
        // Store the speak function globally so it can be accessed by the interview page
        window.__avatarSpeak = async (text: string) => {
            console.log(`🎤 Global avatarSpeak called - Ready: ${isReady}, SessionActive: ${isSessionActive}, Initialized: ${isInitialized}`);
            
            if (!isInitialized) {
                const error = 'Avatar service not initialized';
                console.error(`❌ ${error}`);
                throw new Error(error);
            }
            
            if (!isReady) {
                const error = 'Avatar is not ready for speech';
                console.error(`❌ ${error} (sessionActive: ${isSessionActive}, initialized: ${isInitialized})`);
                throw new Error(error);
            }
            
            // Call the onSpeakingStart callback if available to update question text
            if (window.__onAvatarSpeakingStart) {
                window.__onAvatarSpeakingStart(text);
            }
            
            console.log(`✅ Calling avatar speak function with text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            await speak(text);
        };

        window.__avatarStopSpeaking = async () => {
            console.log('🛑 Global avatarStopSpeaking called');
            await stopSpeaking();
        };

        window.__avatarStatus = () => {
            return {
                isInitialized,
                isSessionActive,
                isReady,
                isSpeaking,
                error: avatarServiceError
            };
        };

        return () => {
            delete window.__avatarSpeak;
            delete window.__avatarStopSpeaking;
            delete window.__avatarStatus;
        };
    }, [speak, stopSpeaking, isReady, isInitialized, isSessionActive, isSpeaking, avatarServiceError]);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
            {/* Interviewer Panel - Azure Avatar */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden h-[280px]">
                <div 
                    ref={avatarContainerRef}
                    className="w-full h-full relative"
                >
                    {/* Loading state */}
                    {!isReady && !avatarError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                            <div className="text-center space-y-3">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-sm text-muted-foreground">
                                    {!isInitialized ? 'Initializing avatar service...' : 
                                     !isSessionActive ? 'Starting avatar session...' : 
                                     'Connecting to avatar...'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Debug: Init={isInitialized.toString()}, Session={isSessionActive.toString()}, Ready={isReady.toString()}
                                </p>
                                <button
                                    onClick={async () => {
                                        console.log('🔧 Debug: Force session start');
                                        console.log('🔧 Current states:', { isInitialized, isSessionActive, isReady });
                                        if (avatarContainerRef.current && isInitialized) {
                                            try {
                                                await startSession(avatarContainerRef.current);
                                            } catch (error) {
                                                console.error('🔧 Debug session start failed:', error);
                                            }
                                        }
                                    }}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 mt-2"
                                >
                                    Force Start
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {avatarError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                            <div className="text-center space-y-3 p-4">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Avatar Error</p>
                                    <p className="text-xs text-muted-foreground mt-1">{avatarError}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setAvatarError(null);
                                        // Reset initialization to trigger retry
                                        window.location.reload();
                                    }}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs hover:bg-primary/90"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={async () => {
                                        console.log('🔧 Manual session start triggered');
                                        try {
                                            if (avatarContainerRef.current) {
                                                await startSession(avatarContainerRef.current);
                                                setAvatarError(null);
                                            } else {
                                                console.error('No container ref available');
                                            }
                                        } catch (error) {
                                            console.error('Manual session start failed:', error);
                                        }
                                    }}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 ml-2"
                                >
                                    Manual Start
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success state - Avatar video will be inserted here by the service */}
                    {isReady && !avatarError && (
                        <div className="absolute inset-0">
                            {/* The avatar video element will be dynamically inserted here */}
                        </div>
                    )}
                </div>

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                            isSpeaking ? 'bg-red-500 animate-pulse' : 
                            isReady ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <p className="text-white font-medium">
                            Sarah (AI Interviewer)
                            {isSpeaking && <span className="ml-2 text-xs">Speaking...</span>}
                        </p>
                    </div>
                </div>

                {/* Session status indicator */}
                {isReady && (
                    <div className="absolute top-2 right-2">
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Live
                        </div>
                    </div>
                )}
            </div>

            {/* Candidate Panel */}
            <div className="relative bg-card border border-border rounded-2xl h-[280px] overflow-hidden">
                <video
                    key="candidate-video"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-white font-medium">You</p>
                    </div>
                </div>
                {/* No video fallback */}
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground" style={{ display: 'none' }}>
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <span className="text-2xl">👤</span>
                        </div>
                        <p className="text-sm">Camera not available</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
