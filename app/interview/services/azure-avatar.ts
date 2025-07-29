// Azure Speech Avatar Service
/* eslint-disable @typescript-eslint/no-explicit-any */

// Note: Using 'any' types for Azure Speech SDK as it's an external library
// loaded dynamically from CDN without proper TypeScript definitions
declare global {
    interface Window {
        SpeechSDK: {
            SpeechConfig: any;
            AvatarVideoFormat: any;
            AvatarConfig: any;
            AvatarSynthesizer: any;
            ResultReason: any;
            CancellationDetails: any;
            CancellationReason: any;
            Coordinate: any;
        };
    }
}

export interface AzureAvatarConfig {
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

export interface AvatarServiceCallbacks {
    onVideoReady: (videoElement: HTMLVideoElement) => void;
    onAudioReady: (audioElement: HTMLAudioElement) => void;
    onSpeakingStart: () => void;
    onSpeakingEnd: () => void;
    onError: (error: string) => void;
    onSessionStart: () => void;
    onSessionEnd: () => void;
}

export class AzureAvatarService {
    private avatarSynthesizer: any = null;  // External SDK object
    private peerConnection: RTCPeerConnection | null = null;
    private config: AzureAvatarConfig;
    private callbacks: AvatarServiceCallbacks;
    private videoContainer: HTMLElement | null = null;
    private isSessionActive = false;
    private isConnected = false;

    constructor(config: AzureAvatarConfig, callbacks: AvatarServiceCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
    }

    public async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log('Starting Azure Avatar Service initialization...');
            
            if (typeof window.SpeechSDK === 'undefined') {
                console.log('Loading Azure Speech SDK...');
                // Load Speech SDK if not already loaded
                const script = document.createElement('script');
                script.src = 'https://aka.ms/csspeech/jsbrowserpackageraw';
                script.onload = () => {
                    console.log('Azure Speech SDK loaded successfully');
                    this.initializeSDK().then(resolve).catch(reject);
                };
                script.onerror = () => {
                    const error = new Error('Failed to load Azure Speech SDK');
                    console.error(error);
                    reject(error);
                };
                document.head.appendChild(script);
            } else {
                console.log('Azure Speech SDK already loaded');
                this.initializeSDK().then(resolve).catch(reject);
            }
        });
    }

    private async initializeSDK(): Promise<void> {
        try {
            console.log('Initializing Azure Speech SDK with config:', {
                region: this.config.region,
                character: this.config.character,
                style: this.config.style,
                voice: this.config.voice,
                usingSecureTokenAuth: true
            });

            const { SpeechSDK } = window;
            
            if (!SpeechSDK) {
                throw new Error('Azure Speech SDK not available on window object');
            }
            
            // Get auth token from secure API
            console.log('Getting authentication token...');
            const authResponse = await fetch('/api/azure-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'getAuthToken' })
            });

            if (!authResponse.ok) {
                throw new Error('Failed to get authentication token');
            }

            const { token, region } = await authResponse.json();
            console.log('Authentication token received');

            // Configure speech synthesis with token
            const speechSynthesisConfig = this.config.privateEndpoint
                ? SpeechSDK.SpeechConfig.fromEndpoint(
                    new URL(`wss://${this.config.privateEndpoint}/tts/cognitiveservices/websocket/v1?enableTalkingAvatar=true`)
                )
                : SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);

            if (!speechSynthesisConfig) {
                throw new Error('Failed to create speech synthesis config');
            }

            console.log('Speech synthesis config created with token authentication');

            // Configure video format
            const videoFormat = new SpeechSDK.AvatarVideoFormat();
            if (this.config.videoCrop) {
                videoFormat.setCropRange(
                    new SpeechSDK.Coordinate(600, 0),
                    new SpeechSDK.Coordinate(1320, 1080)
                );
            }

            console.log('Video format configured');

            // Configure avatar
            const avatarConfig = new SpeechSDK.AvatarConfig(
                this.config.character,
                this.config.style,
                videoFormat
            );
            avatarConfig.backgroundColor = this.config.backgroundColor;

            console.log('Avatar config created');

            // Get ICE server token
            console.log('Getting ICE server token...');
            const iceServerData = await this.getIceServerToken();
            console.log('ICE server token received');
            
            avatarConfig.remoteIceServers = [{
                urls: [iceServerData.urls[0]],
                username: iceServerData.username,
                credential: iceServerData.password
            }];

            // Create avatar synthesizer
            console.log('Creating avatar synthesizer...');
            this.avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig);
            
            if (!this.avatarSynthesizer) {
                throw new Error('Failed to create avatar synthesizer');
            }
            
            // Set up event handlers
            this.avatarSynthesizer.avatarEventReceived = (s: any, e: any) => {
                const offsetMessage = e.offset === 0 ? "" : `, offset: ${e.offset / 10000}ms`;
                console.log(`[Avatar Event] ${e.description}${offsetMessage}`);
            };

            console.log('Azure Avatar Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Azure Avatar Service:', error);
            throw error;
        }
    }

    private async getIceServerToken(): Promise<{ urls: string[], username: string, password: string }> {
        console.log('Requesting ICE server token via secure API...');

        const response = await fetch('/api/azure-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getIceServerToken',
                privateEndpoint: this.config.privateEndpoint
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ICE server token request failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Failed to get ICE server token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('ICE server token response:', {
            urlsCount: data.urls?.length,
            hasUsername: !!data.username,
            hasPassword: !!data.password
        });
        
        return {
            urls: data.urls,
            username: data.username,
            password: data.password
        };
    }

    public async startSession(videoContainer: HTMLElement): Promise<void> {
        console.log(`🚀 Starting avatar session - Current state: active=${this.isSessionActive}, connected=${this.isConnected}`);
        
        if (this.isSessionActive) {
            console.warn('Avatar session is already active');
            return;
        }

        this.videoContainer = videoContainer;
        
        try {
            console.log('🔄 Starting avatar session...');
            
            // Get ICE server data
            console.log('🔄 Getting ICE server data...');
            const iceServerData = await this.getIceServerToken();
            console.log('✅ ICE server data retrieved');
            
            // Setup WebRTC and wait for connection
            console.log('🔄 Setting up WebRTC...');
            await this.setupWebRTC(iceServerData.urls[0], iceServerData.username, iceServerData.password);
            console.log('✅ WebRTC setup completed');
            
            // Only set as active if WebRTC setup completed successfully
            this.isSessionActive = true;
            console.log('✅ Avatar session marked as active');
            this.callbacks.onSessionStart();
            
        } catch (error) {
            console.error('❌ Failed to start avatar session:', error);
            // Make sure we're not left in a bad state
            this.isSessionActive = false;
            this.isConnected = false;
            this.callbacks.onError(`Failed to start session: ${error}`);
            throw error;
        }
    }

    private async setupWebRTC(iceServerUrl: string, iceServerUsername: string, iceServerCredential: string): Promise<void> {
        // Create WebRTC peer connection
        this.peerConnection = new RTCPeerConnection({
            iceServers: [{
                urls: [iceServerUrl],
                username: iceServerUsername,
                credential: iceServerCredential
            }]
        });

        // Create a promise that resolves when WebRTC is connected
        let resolved = false;
        let resolve: () => void;
        let reject: (error: Error) => void;
        
        const connectionPromise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
            
            // Timeout after 15 seconds (reduced for faster debugging)
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.error('WebRTC connection timeout after 15 seconds');
                    reject(new Error('WebRTC connection timeout after 15 seconds'));
                }
            }, 15000);
        });

        // Handle connection state changes
        this.peerConnection.oniceconnectionstatechange = () => {
            const state = this.peerConnection?.iceConnectionState;
            console.log(`WebRTC connection state changed: ${state}`);
            
            if ((state === 'connected' || state === 'completed') && !resolved) {
                resolved = true;
                this.isConnected = true;
                console.log('✅ WebRTC connection established via state change');
                resolve();
            } else if (state === 'disconnected' || state === 'failed') {
                this.isConnected = false;
                this.callbacks.onError('WebRTC connection lost');
                if (!resolved) {
                    resolved = true;
                    console.error(`❌ WebRTC connection failed: ${state}`);
                    reject(new Error(`WebRTC connection failed: ${state}`));
                }
            }
        };

        // Handle incoming video/audio streams
        this.peerConnection.ontrack = (event) => {
            if (!this.videoContainer) return;

            console.log(`Received ${event.track.kind} track`);

            // If we receive tracks, the connection is working even if state isn't "connected" yet
            if (!resolved && event.track.kind === 'video') {
                resolved = true;
                this.isConnected = true;
                console.log('✅ WebRTC connection confirmed via video track received');
                resolve();
            }

            // Remove existing elements
            const existingElements = this.videoContainer.querySelectorAll(event.track.kind);
            existingElements.forEach(el => el.remove());

            // Create new media element
            const mediaElement = document.createElement(event.track.kind) as HTMLVideoElement | HTMLAudioElement;
            mediaElement.srcObject = event.streams[0];
            mediaElement.autoplay = true;

            if (event.track.kind === 'video') {
                const videoEl = mediaElement as HTMLVideoElement;
                videoEl.playsInline = true;
                videoEl.style.width = '100%';
                videoEl.style.height = '100%';
                videoEl.style.objectFit = 'cover';
                this.callbacks.onVideoReady(videoEl);
            } else if (event.track.kind === 'audio') {
                const audioEl = mediaElement as HTMLAudioElement;
                audioEl.muted = true; // Start muted, will unmute when speaking
                this.callbacks.onAudioReady(audioEl);
            }

            this.videoContainer.appendChild(mediaElement);
        };

        // Add transceivers
        this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
        this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

        // Start avatar session
        console.log('Starting avatar session...');
        const result = await this.avatarSynthesizer.startAvatarAsync(this.peerConnection);
        
        if (result.reason !== window.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            let errorMsg = 'Failed to start avatar session';
            if (result.reason === window.SpeechSDK.ResultReason.Canceled) {
                const cancellationDetails = window.SpeechSDK.CancellationDetails.fromResult(result);
                if (cancellationDetails.reason === window.SpeechSDK.CancellationReason.Error) {
                    errorMsg = cancellationDetails.errorDetails;
                }
            }
            throw new Error(errorMsg);
        }

        console.log('Avatar session started, waiting for WebRTC connection...');
        
        // Wait for WebRTC connection to be established
        await connectionPromise;
        
        console.log('Avatar session and WebRTC connection established successfully');
    }

    public async speak(text: string): Promise<void> {
        console.log(`🎤 Speak request received - Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        console.log(`🎤 Speak state check - Session Active: ${this.isSessionActive}, Connected: ${this.isConnected}, Has Synthesizer: ${!!this.avatarSynthesizer}`);
        
        if (!this.isSessionActive) {
            const error = 'Avatar session is not active';
            console.error(`❌ ${error}`);
            throw new Error(error);
        }

        // Check if we have an avatar synthesizer - this is the most important check
        if (!this.avatarSynthesizer) {
            const error = 'Avatar synthesizer not available';
            console.error(`❌ ${error}`);
            throw new Error(error);
        }

        // Check WebRTC connection state as a secondary check
        const connectionState = this.peerConnection?.iceConnectionState;
        console.log(`🔗 Connection state: ${connectionState}, isConnected flag: ${this.isConnected}`);
        
        // For now, let's try speaking even if connection state is uncertain
        // The synthesizer should handle the actual connection validation

        const audioElement = this.videoContainer?.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
            audioElement.muted = false; // Unmute for speaking
        }

        this.callbacks.onSpeakingStart();

        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
            <voice name='${this.config.voice}'>
                <mstts:leadingsilence-exact value='0'/>
                ${this.htmlEncode(text)}
            </voice>
        </speak>`;

        try {
            console.log('📤 Sending speech synthesis request...');
            const result = await this.avatarSynthesizer.speakSsmlAsync(ssml);
            
            if (result.reason === window.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                console.log('✅ Speech synthesis completed successfully');
            } else {
                let errorMsg = 'Speech synthesis failed';
                if (result.reason === window.SpeechSDK.ResultReason.Canceled) {
                    const cancellationDetails = window.SpeechSDK.CancellationDetails.fromResult(result);
                    if (cancellationDetails.reason === window.SpeechSDK.CancellationReason.Error) {
                        errorMsg = cancellationDetails.errorDetails;
                    }
                }
                console.error(`❌ ${errorMsg}`);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('❌ Speech synthesis error:', error);
            this.callbacks.onError(`Speech synthesis failed: ${error}`);
            throw error;
        } finally {
            this.callbacks.onSpeakingEnd();
            
            // Mute audio after speaking
            if (audioElement) {
                audioElement.muted = true;
            }
        }
    }

    public async stopSpeaking(): Promise<void> {
        if (this.avatarSynthesizer && this.isSessionActive) {
            await this.avatarSynthesizer.stopSpeakingAsync();
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

            // Clear video container
            if (this.videoContainer) {
                this.videoContainer.innerHTML = '';
            }

            this.isSessionActive = false;
            this.isConnected = false;
            this.callbacks.onSessionEnd();
            
            console.log('Avatar session stopped');
        } catch (error) {
            console.error('Error stopping avatar session:', error);
            this.callbacks.onError(`Failed to stop session: ${error}`);
        }
    }

    public isActive(): boolean {
        return this.isSessionActive;
    }

    public isReady(): boolean {
        // Consider ready if we have an active session and a working synthesizer
        // Remove strict connection requirement as it can be flaky
        const ready = this.isSessionActive && !!this.avatarSynthesizer;
        console.log(`🔍 Avatar readiness check: sessionActive=${this.isSessionActive}, hasSynthesizer=${!!this.avatarSynthesizer}, isConnected=${this.isConnected}, result=${ready}`);
        return ready;
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

export default AzureAvatarService;
