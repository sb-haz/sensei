import { RefObject, useRef, useEffect, useState } from 'react';
import { AzureChatAvatarService, AzureChatAvatarConfig } from '../services/azure-chat-avatar';
import { AZURE_AVATAR_CONFIG } from '@/lib/azure-config';

interface VideoGridProps {
    videoRef: RefObject<HTMLVideoElement>;
    className?: string;
    isInterviewerSpeaking?: boolean;
    onInterviewerSpeakingChange?: (speaking: boolean) => void;
    onMessageReceived?: (message: string) => void;
    avatarConfig?: AzureChatAvatarConfig;
    userDetails?: any;
    interviewHistory?: any[];
    settings?: any;
    template?: any;
}

export default function VideoGridWithChatAvatar({ 
    videoRef, 
    className,
    onInterviewerSpeakingChange,
    onMessageReceived,
    avatarConfig = AZURE_AVATAR_CONFIG,
    userDetails,
    interviewHistory = [],
    settings,
    template
}: VideoGridProps) {
    const avatarContainerRef = useRef<HTMLDivElement>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [chatAvatarService, setChatAvatarService] = useState<AzureChatAvatarService | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');

    // Initialize chat avatar service
    useEffect(() => {
        const initService = async () => {
            try {
                const service = new AzureChatAvatarService(avatarConfig, {
                    onVideoReady: (videoElement) => {
                        console.log('Video ready:', videoElement);
                    },
                    onAudioReady: (audioElement) => {
                        console.log('Audio ready:', audioElement);
                    },
                    onSpeakingStart: () => {
                        setIsSpeaking(true);
                        onInterviewerSpeakingChange?.(true);
                    },
                    onSpeakingEnd: () => {
                        setIsSpeaking(false);
                        onInterviewerSpeakingChange?.(false);
                    },
                    onError: (error) => {
                        console.error('Chat Avatar error:', error);
                        setAvatarError(error);
                    },
                    onSessionStart: () => {
                        console.log('Chat Avatar session started');
                        setIsSessionActive(true);
                        setIsReady(true);
                        setAvatarError(null);
                    },
                    onSessionEnd: () => {
                        console.log('Chat Avatar session ended');
                        setIsSessionActive(false);
                        setIsReady(false);
                    },
                    onMessageUpdate: (partialMessage) => {
                        console.log('🔄 Message update:', partialMessage.substring(0, 100) + '...');
                        setCurrentMessage(partialMessage);
                        // Update the main question display with partial message
                        onMessageReceived?.(partialMessage);
                    },
                    onMessageComplete: (fullMessage) => {
                        console.log('✅ Message complete:', fullMessage.substring(0, 100) + '...');
                        setCurrentMessage(fullMessage);
                        // Update the main question display with complete message
                        onMessageReceived?.(fullMessage);
                    }
                });

                await service.initialize();
                setChatAvatarService(service);
                setIsInitialized(true);
                console.log('Chat Avatar service initialized');
            } catch (error) {
                console.error('Failed to initialize Chat Avatar service:', error);
                setAvatarError(`Initialization failed: ${error}`);
            }
        };

        initService();

        return () => {
            if (chatAvatarService) {
                chatAvatarService.stopSession();
            }
        };
    }, []);

    // Start session when service is ready and container is available
    useEffect(() => {
        const startSession = async () => {
            if (avatarContainerRef.current && chatAvatarService && isInitialized && !isSessionActive && !avatarError) {
                try {
                    console.log('Starting chat avatar session...');
                    setAvatarError(null); // Clear any previous errors
                    await chatAvatarService.startSession(avatarContainerRef.current);
                    console.log('Chat avatar session started successfully');
                } catch (error) {
                    console.error('Failed to start chat avatar session:', error);
                    
                    // Provide more user-friendly error messages
                    let userFriendlyError = 'Unknown error occurred';
                    const errorStr = error?.toString() || '';
                    
                    if (errorStr.includes('Media devices not available') || errorStr.includes('NotFoundError')) {
                        userFriendlyError = 'Camera or microphone access issue. The avatar will work for audio only.';
                    } else if (errorStr.includes('timeout') || errorStr.includes('connection')) {
                        userFriendlyError = 'Connection timeout. Please check your internet connection and try again.';
                    } else if (errorStr.includes('Failed to start avatar session')) {
                        userFriendlyError = 'Avatar service unavailable. Please try refreshing the page.';
                    } else if (errorStr.includes('WebRTC')) {
                        userFriendlyError = 'Video connection failed. Please try refreshing the page.';
                    } else {
                        userFriendlyError = `Session error: ${errorStr.substring(0, 100)}...`;
                    }
                    
                    setAvatarError(userFriendlyError);
                }
            }
        };

        if (isInitialized && !isSessionActive && !avatarError) {
            // Add small delay to ensure DOM is ready
            const timeoutId = setTimeout(startSession, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [isInitialized, isSessionActive, chatAvatarService, avatarError]);

    // Auto-retry mechanism
    useEffect(() => {
        if (avatarError && !isSessionActive && chatAvatarService) {
            const retryTimeout = setTimeout(() => {
                console.log('Auto-retrying avatar session...');
                setAvatarError(null);
            }, 5000); // Retry after 5 seconds

            return () => clearTimeout(retryTimeout);
        }
    }, [avatarError, isSessionActive, chatAvatarService]);

    // Expose functions globally for the interview page
    useEffect(() => {
        window.__chatAvatarSendMessage = async (userMessage?: string) => {
            if (!chatAvatarService) {
                throw new Error('Chat Avatar service not available');
            }

            // Allow sending messages even if session isn't fully ready (fallback mode)
            if (!isReady && !avatarError) {
                throw new Error('Chat Avatar service not ready');
            }

            console.log('Sending chat message via avatar...');
            await chatAvatarService.sendChatMessage(
                userDetails,
                interviewHistory,
                settings,
                template,
                userMessage
            );
        };

        window.__chatAvatarSpeakCompletion = async (message: string) => {
            if (!chatAvatarService) {
                throw new Error('Chat Avatar service not available');
            }

            console.log('Speaking completion message via avatar...');
            await chatAvatarService.speakCompletionMessage(message);
        };

        window.__chatAvatarStop = async () => {
            if (chatAvatarService) {
                await chatAvatarService.stopSpeaking();
            }
        };

        window.__chatAvatarStatus = () => {
            return {
                isInitialized,
                isSessionActive,
                isReady: isReady || !!avatarError, // Consider ready if user chose to continue without video
                isSpeaking,
                error: avatarError
            };
        };

        return () => {
            delete window.__chatAvatarSendMessage;
            delete window.__chatAvatarSpeakCompletion;
            delete window.__chatAvatarStop;
            delete window.__chatAvatarStatus;
        };
    }, [chatAvatarService, isReady, avatarError, userDetails, interviewHistory, settings, template, isInitialized, isSessionActive, isSpeaking]);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
            {/* Interviewer Panel - Azure Chat Avatar */}
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
                                    {!isInitialized ? 'Initializing chat avatar...' : 
                                     !isSessionActive ? 'Starting avatar session...' : 
                                     'Connecting to avatar...'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Debug: Init={isInitialized.toString()}, Session={isSessionActive.toString()}, Ready={isReady.toString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {avatarError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
                            <div className="text-center space-y-4 p-4 max-w-sm">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground mb-2">Avatar Connection Issue</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{avatarError}</p>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => {
                                            setAvatarError(null);
                                            // Trigger re-initialization
                                            if (chatAvatarService) {
                                                chatAvatarService.stopSession();
                                            }
                                        }}
                                        className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs hover:bg-primary/90 transition-colors"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAvatarError(null);
                                            // Enable text-only mode and mark as ready
                                            if (chatAvatarService) {
                                                chatAvatarService.enableTextOnlyMode();
                                            }
                                            setIsReady(true);
                                        }}
                                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs hover:bg-secondary/90 transition-colors"
                                    >
                                        Continue Without Video
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground opacity-75">
                                    Auto-retry in 5 seconds...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success state - Avatar video will be inserted here by the service */}
                    {isReady && !avatarError && (
                        <div className="absolute inset-0">
                            {/* The avatar video element will be dynamically inserted here */}
                            {/* Fallback for text-only mode */}
                            {!isSessionActive && (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                    <div className="text-center space-y-3">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                            <span className="text-3xl">🤖</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">AI Interviewer</p>
                                            <p className="text-xs text-muted-foreground">Text Mode Active</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Message display overlay - Remove this since message goes to main question area */}
                {/* {currentMessage && (
                    <div className="absolute top-4 left-4 right-4 bg-black/70 text-white p-2 rounded-lg text-sm">
                        {currentMessage}
                    </div>
                )} */}

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
                            Live Chat
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
