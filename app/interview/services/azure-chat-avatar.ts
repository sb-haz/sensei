// Azure Chat Avatar Service - Integrates Azure OpenAI Chat with Avatar
/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@/lib/logger';

export interface AzureChatAvatarConfig {
    region: string;
    subscriptionKey: string;
    privateEndpoint?: string;
    character: string;
    style: string;
    voice: string;
    backgroundColor: string;
    videoCrop: boolean;
    transparentBackground: boolean;
}

export interface ChatAvatarCallbacks {
    onVideoReady: (videoElement: HTMLVideoElement) => void;
    onAudioReady: (audioElement: HTMLAudioElement) => void;
    onSpeakingStart: () => void;
    onSpeakingEnd: () => void;
    onError: (error: string) => void;
    onSessionStart: () => void;
    onSessionEnd: () => void;
    onMessageUpdate: (partialMessage: string) => void;
    onMessageComplete: (fullMessage: string) => void;
}

export class AzureChatAvatarService {
    private avatarSynthesizer: any = null;
    private peerConnection: RTCPeerConnection | null = null;
    private config: AzureChatAvatarConfig;
    private callbacks: ChatAvatarCallbacks;
    private videoContainer: HTMLElement | null = null;
    private isSessionActive = false;
    private isConnected = false;
    private isSpeaking = false;
    private currentMessage = '';
    private spokenTextQueue: string[] = [];
    private sentencePunctuations = ['.', '?', '!', ':', ';', '。', '？', '！', '：', '；'];
    private textOnlyMode = false; // Fallback mode when video fails

    constructor(config: AzureChatAvatarConfig, callbacks: ChatAvatarCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
    }

    public async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            logger.avatar('Starting Azure Chat Avatar Service initialization...');
            
            if (typeof window.SpeechSDK === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://aka.ms/csspeech/jsbrowserpackageraw';
                script.onload = () => {
                    this.initializeSDK().then(resolve).catch(reject);
                };
                script.onerror = () => {
                    reject(new Error('Failed to load Azure Speech SDK'));
                };
                document.head.appendChild(script);
            } else {
                this.initializeSDK().then(resolve).catch(reject);
            }
        });
    }

    private async initializeSDK(): Promise<void> {
        try {
            // Check browser compatibility
            if (!navigator.mediaDevices) {
                logger.avatar('Warning: MediaDevices API not available, running in degraded mode');
            }

            if (!window.RTCPeerConnection) {
                throw new Error('WebRTC not supported in this browser');
            }

            const { SpeechSDK } = window;
            if (!SpeechSDK) {
                throw new Error('Azure Speech SDK not available');
            }
            
            // Get auth token
            const authResponse = await fetch('/api/azure-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getAuthToken' })
            });

            if (!authResponse.ok) {
                throw new Error('Failed to get authentication token');
            }

            const { token, region } = await authResponse.json();

            // Configure speech synthesis
            const speechSynthesisConfig = this.config.privateEndpoint
                ? SpeechSDK.SpeechConfig.fromEndpoint(
                    new URL(`wss://${this.config.privateEndpoint}/tts/cognitiveservices/websocket/v1?enableTalkingAvatar=true`)
                )
                : SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);

            // Configure video format
            const videoFormat = new SpeechSDK.AvatarVideoFormat();
            if (this.config.videoCrop) {
                videoFormat.setCropRange(
                    new SpeechSDK.Coordinate(600, 0),
                    new SpeechSDK.Coordinate(1320, 1080)
                );
            }

            // Configure avatar
            const avatarConfig = new SpeechSDK.AvatarConfig(
                this.config.character,
                this.config.style,
                videoFormat
            );
            avatarConfig.backgroundColor = this.config.backgroundColor;

            // Get ICE server token
            const iceServerData = await this.getIceServerToken();
            avatarConfig.remoteIceServers = [{
                urls: [iceServerData.urls[0]],
                username: iceServerData.username,
                credential: iceServerData.password
            }];

            // Create avatar synthesizer
            this.avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig);
            
            this.avatarSynthesizer.avatarEventReceived = (s: any, e: any) => {
                const offsetMessage = e.offset === 0 ? "" : `, offset: ${e.offset / 10000}ms`;
                logger.avatar(`Event: ${e.description}${offsetMessage}`);
            };

            logger.avatar('Azure Chat Avatar Service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Azure Chat Avatar Service:', error);
            throw error;
        }
    }

    private async getIceServerToken(): Promise<{ urls: string[], username: string, password: string }> {
        const response = await fetch('/api/azure-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getIceServerToken',
                privateEndpoint: this.config.privateEndpoint
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to get ICE server token: ${response.status}`);
        }

        return await response.json();
    }

    public async startSession(videoContainer: HTMLElement): Promise<void> {
        if (this.isSessionActive) {
            logger.avatar('Session already active');
            return;
        }

        this.videoContainer = videoContainer;
        
        // Check for media device availability first (but don't require user media)
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            logger.avatar('Available media devices:', {
                audio: devices.filter(d => d.kind === 'audioinput').length,
                video: devices.filter(d => d.kind === 'videoinput').length
            });
        } catch (error) {
            logger.avatar('Media devices enumeration failed (will continue anyway):', error);
        }

        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds

        while (retryCount < maxRetries) {
            try {
                logger.avatar(`Starting session attempt ${retryCount + 1}/${maxRetries}`);
                
                // Get fresh ICE server token for each attempt
                const iceServerData = await this.getIceServerToken();
                logger.avatar('ICE server token obtained');
                
                await this.setupWebRTC(iceServerData.urls[0], iceServerData.username, iceServerData.password);
                
                this.isSessionActive = true;
                this.callbacks.onSessionStart();
                logger.avatar('Session started successfully on attempt', retryCount + 1);
                return;
                
            } catch (error) {
                retryCount++;
                this.isSessionActive = false;
                this.isConnected = false;
                
                logger.avatar(`Session start attempt ${retryCount} failed:`, error);
                
                if (retryCount >= maxRetries) {
                    const finalError = `Failed to start session after ${maxRetries} attempts: ${error}`;
                    logger.error('Final session start failure:', finalError);
                    this.callbacks.onError(finalError);
                    throw new Error(finalError);
                }
                
                // Wait before retrying
                logger.avatar(`Retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    private async setupWebRTC(iceServerUrl: string, iceServerUsername: string, iceServerCredential: string): Promise<void> {
        // Enhanced WebRTC configuration with better error handling
        const rtcConfig: RTCConfiguration = {
            iceServers: [{
                urls: [iceServerUrl],
                username: iceServerUsername,
                credential: iceServerCredential
            }],
            iceTransportPolicy: 'all',
            bundlePolicy: 'balanced',
            rtcpMuxPolicy: 'require'
        };

        logger.avatar('Setting up WebRTC with config:', { iceServerUrl: iceServerUrl.substring(0, 50) + '...' });

        this.peerConnection = new RTCPeerConnection(rtcConfig);

        // Set up connection state monitoring
        let resolved = false;
        let connectionStartTime = Date.now();
        
        const connectionPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    const duration = Date.now() - connectionStartTime;
                    logger.avatar(`WebRTC connection timeout after ${duration}ms`);
                    reject(new Error('WebRTC connection timeout after 20 seconds'));
                }
            }, 20000); // Increased timeout to 20 seconds

            // Enhanced connection state handling
            this.peerConnection!.oniceconnectionstatechange = () => {
                const state = this.peerConnection?.iceConnectionState;
                const duration = Date.now() - connectionStartTime;
                logger.avatar(`WebRTC ICE state: ${state} (${duration}ms)`);
                
                if ((state === 'connected' || state === 'completed') && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    this.isConnected = true;
                    logger.avatar(`WebRTC connected successfully in ${duration}ms`);
                    resolve();
                } else if ((state === 'disconnected' || state === 'failed' || state === 'closed') && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    this.isConnected = false;
                    reject(new Error(`WebRTC connection failed: ${state} after ${duration}ms`));
                }
            };

            // Additional connection state monitoring
            this.peerConnection!.onconnectionstatechange = () => {
                const state = this.peerConnection?.connectionState;
                logger.avatar(`WebRTC connection state: ${state}`);
                
                if (state === 'failed' && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    reject(new Error(`WebRTC connection failed: ${state}`));
                }
            };

            // Track handling with better error recovery
            this.peerConnection!.ontrack = (event) => {
                logger.avatar(`WebRTC track received: ${event.track.kind}`, {
                    trackId: event.track.id,
                    streamCount: event.streams.length
                });

                if (!this.videoContainer) {
                    logger.avatar('Warning: No video container available for track');
                    return;
                }

                // Resolve on first video track if not already resolved
                if (!resolved && event.track.kind === 'video') {
                    resolved = true;
                    clearTimeout(timeout);
                    this.isConnected = true;
                    const duration = Date.now() - connectionStartTime;
                    logger.avatar(`WebRTC video track ready in ${duration}ms`);
                    resolve();
                }

                try {
                    // Clean up existing elements of the same type
                    const existingElements = this.videoContainer.querySelectorAll(event.track.kind);
                    existingElements.forEach(el => {
                        logger.avatar(`Removing existing ${event.track.kind} element`);
                        el.remove();
                    });

                    // Create and configure media element
                    const mediaElement = document.createElement(event.track.kind) as HTMLVideoElement | HTMLAudioElement;
                    mediaElement.srcObject = event.streams[0];
                    mediaElement.autoplay = true;

                    if (event.track.kind === 'video') {
                        const videoEl = mediaElement as HTMLVideoElement;
                        videoEl.playsInline = true;
                        videoEl.style.width = '100%';
                        videoEl.style.height = '100%';
                        videoEl.style.objectFit = 'cover';
                        videoEl.style.background = this.config.backgroundColor || '#000';
                        
                        // Add error handling for video element
                        videoEl.onerror = (error) => {
                            logger.avatar('Video element error:', error);
                        };
                        
                        videoEl.onloadedmetadata = () => {
                            logger.avatar('Video metadata loaded:', {
                                width: videoEl.videoWidth,
                                height: videoEl.videoHeight
                            });
                        };
                        
                        this.callbacks.onVideoReady(videoEl);
                    } else if (event.track.kind === 'audio') {
                        const audioEl = mediaElement as HTMLAudioElement;
                        audioEl.muted = true; // Start muted to prevent feedback
                        
                        // Add error handling for audio element
                        audioEl.onerror = (error) => {
                            logger.avatar('Audio element error:', error);
                        };
                        
                        this.callbacks.onAudioReady(audioEl);
                    }

                    this.videoContainer.appendChild(mediaElement);
                    logger.avatar(`${event.track.kind} element added to container`);

                } catch (error) {
                    logger.error(`Error handling ${event.track.kind} track:`, error);
                }
            };

            // ICE candidate handling
            this.peerConnection!.onicecandidate = (event) => {
                if (event.candidate) {
                    logger.avatar('ICE candidate generated:', {
                        type: event.candidate.type,
                        protocol: event.candidate.protocol
                    });
                } else {
                    logger.avatar('ICE candidate gathering complete');
                }
            };

            // Data channel handling (if needed)
            this.peerConnection!.ondatachannel = (event) => {
                logger.avatar('Data channel received:', event.channel.label);
            };
        });

        try {
            // Add transceivers with proper configuration
            logger.avatar('Adding WebRTC transceivers...');
            this.peerConnection.addTransceiver('video', { 
                direction: 'recvonly',
                streams: []
            });
            this.peerConnection.addTransceiver('audio', { 
                direction: 'recvonly',
                streams: []
            });

            // Start avatar session
            logger.avatar('Starting avatar session...');
            const result = await this.avatarSynthesizer.startAvatarAsync(this.peerConnection);
            
            if (result.reason !== window.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                const errorDetails = result.errorDetails || 'Unknown error';
                logger.avatar('Avatar start failed:', { reason: result.reason, errorDetails });
                throw new Error(`Failed to start avatar session: ${errorDetails}`);
            }

            logger.avatar('Avatar session started, waiting for WebRTC connection...');

            // Wait for WebRTC connection to establish
            await connectionPromise;
            
            logger.avatar('WebRTC setup completed successfully');

        } catch (error) {
            logger.error('WebRTC setup failed:', error);
            
            // Clean up on failure
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }
            
            throw error;
        }
    }

    public async sendChatMessage(userDetails: any, interviewHistory: any[], settings: any, template: any, userMessage?: string): Promise<void> {
        // Allow text-only mode if session failed but service is available
        if (!this.isSessionActive && !this.textOnlyMode) {
            throw new Error('Session not active');
        }

        try {
            console.log('🎤 Sending chat message to Azure OpenAI...', {
                userDetails: userDetails?.name,
                historyLength: interviewHistory?.length,
                templateRole: template?.role,
                userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'undefined',
                mode: this.textOnlyMode ? 'text-only' : 'avatar'
            });

            // Call Azure OpenAI Chat API
            const response = await fetch('/api/azure-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userDetails,
                    interviewHistory,
                    settings,
                    template,
                    userMessage
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Azure Chat API failed:', response.status, errorText);
                throw new Error(`Chat API failed: ${response.status} - ${errorText}`);
            }

            console.log('✅ Azure Chat API response received, processing stream...');

            // Handle streaming response
            await this.handleStreamingResponse(response);

        } catch (error) {
            logger.error('Chat message failed:', error);
            this.callbacks.onError(`Chat failed: ${error}`);
            throw error;
        }
    }

    public enableTextOnlyMode(): void {
        this.textOnlyMode = true;
        logger.avatar('Text-only mode enabled - avatar video unavailable');
    }

    private async handleStreamingResponse(response: Response): Promise<void> {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        this.currentMessage = '';
        let spokenSentence = '';
        let displaySentence = '';

        const processChunk = async (chunkString: string): Promise<void> => {
            const lines = chunkString.split('\n\n');
            
            for (const line of lines) {
                if (line.startsWith('data:') && !line.endsWith('[DONE]')) {
                    try {
                        const responseJson = JSON.parse(line.substring(5).trim());
                        const responseToken = responseJson.choices?.[0]?.delta?.content;

                        if (responseToken !== undefined && responseToken !== null) {
                            this.currentMessage += responseToken;
                            displaySentence += responseToken;
                            spokenSentence += responseToken;
                            
                            // Update UI with current message
                            this.callbacks.onMessageUpdate(this.currentMessage);

                            // Check for sentence boundaries
                            if (responseToken === '\n' || responseToken === '\n\n') {
                                await this.speak(spokenSentence);
                                spokenSentence = '';
                            } else {
                                // Check for punctuation that indicates end of sentence
                                const cleanToken = responseToken.replace(/\n/g, '');
                                if (cleanToken.length <= 2) {
                                    for (const punct of this.sentencePunctuations) {
                                        if (cleanToken.includes(punct)) {
                                            await this.speak(spokenSentence);
                                            spokenSentence = '';
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        logger.error('Error parsing response chunk:', error);
                    }
                }
            }
        };

        try {
            let previousChunk = '';

            while (true) {
                const { value, done } = await reader.read();
                
                if (done) break;

                let chunkString = new TextDecoder().decode(value, { stream: true });
                
                if (previousChunk) {
                    chunkString = previousChunk + chunkString;
                    previousChunk = '';
                }

                if (!chunkString.endsWith('}\n\n') && !chunkString.endsWith('[DONE]\n\n')) {
                    // Incomplete chunk, save for next iteration
                    previousChunk = chunkString;
                    continue;
                }

                await processChunk(chunkString);
            }

            // Speak any remaining text
            if (spokenSentence.trim()) {
                await this.speak(spokenSentence);
            }

            // Mark message as complete
            this.callbacks.onMessageComplete(this.currentMessage);

        } finally {
            reader.releaseLock();
        }
    }

    // Public method to speak completion messages directly without OpenAI API
    public async speakCompletionMessage(message: string): Promise<void> {
        console.log('🎤 Speaking completion message directly via Azure Avatar...', message.substring(0, 50) + '...');
        
        // Update current message for display
        this.currentMessage = message;
        this.callbacks.onMessageUpdate(message);
        this.callbacks.onMessageComplete(message);
        
        // Speak the message directly
        await this.speak(message);
        
        console.log('✅ Completion message spoken successfully');
    }

    private async speak(text: string): Promise<void> {
        if (!text.trim()) return;

        // In text-only mode, skip avatar speech
        if (this.textOnlyMode) {
            logger.avatar('Skipping speech in text-only mode:', text.substring(0, 50));
            return;
        }

        if (this.isSpeaking) {
            this.spokenTextQueue.push(text);
            return;
        }

        await this.speakNext(text);
    }

    private async speakNext(text: string): Promise<void> {
        if (!this.avatarSynthesizer || (!this.isSessionActive && !this.textOnlyMode)) return;

        // In text-only mode, just log the text
        if (this.textOnlyMode) {
            logger.avatar('Text-only speech:', text);
            return;
        }

        const audioElement = this.videoContainer?.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
            audioElement.muted = false;
        }

        this.isSpeaking = true;
        this.callbacks.onSpeakingStart();

        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
            <voice name='${this.config.voice}'>
                <mstts:leadingsilence-exact value='0'/>
                ${this.htmlEncode(text)}
            </voice>
        </speak>`;

        try {
            const result = await this.avatarSynthesizer.speakSsmlAsync(ssml);
            
            if (result.reason === window.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                logger.avatar(`Speech completed: ${text.substring(0, 50)}...`);
            } else {
                throw new Error('Speech synthesis failed');
            }
        } catch (error) {
            logger.error('Speech error:', error);
            this.callbacks.onError(`Speech failed: ${error}`);
        } finally {
            this.isSpeaking = false;
            this.callbacks.onSpeakingEnd();

            if (audioElement) {
                audioElement.muted = true;
            }

            // Process queue
            if (this.spokenTextQueue.length > 0) {
                const nextText = this.spokenTextQueue.shift()!;
                await this.speakNext(nextText);
            }
        }
    }

    public async stopSpeaking(): Promise<void> {
        this.spokenTextQueue = [];
        if (this.avatarSynthesizer && this.isSessionActive) {
            await this.avatarSynthesizer.stopSpeakingAsync();
            this.isSpeaking = false;
            this.callbacks.onSpeakingEnd();
        }
    }

    public async stopSession(): Promise<void> {
        if (!this.isSessionActive) return;

        try {
            if (this.avatarSynthesizer) {
                await this.avatarSynthesizer.stopSpeakingAsync();
                this.avatarSynthesizer.close();
                this.avatarSynthesizer = null;
            }

            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            if (this.videoContainer) {
                this.videoContainer.innerHTML = '';
            }

            this.isSessionActive = false;
            this.isConnected = false;
            this.isSpeaking = false;
            this.spokenTextQueue = [];
            this.callbacks.onSessionEnd();
            
            logger.avatar('Session stopped');
        } catch (error) {
            logger.error('Error stopping session:', error);
            this.callbacks.onError(`Failed to stop session: ${error}`);
        }
    }

    public isActive(): boolean {
        return this.isSessionActive;
    }

    public isReady(): boolean {
        return this.isSessionActive && !!this.avatarSynthesizer;
    }

    private htmlEncode(text: string): string {
        const entityMap: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };

        return String(text).replace(/[&<>"'\/]/g, (match) => entityMap[match]);
    }
}

export default AzureChatAvatarService;
