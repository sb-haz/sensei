'use client';

import { useRef, useState } from 'react';
import { useAzureAvatar } from '@/hooks/use-azure-avatar';
import { AZURE_AVATAR_CONFIG } from '@/lib/azure-config';

export default function AzureAvatarTest() {
    const avatarContainerRef = useRef<HTMLDivElement>(null);
    const [testText, setTestText] = useState('Hello! This is a test of the Azure Avatar integration.');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    const {
        startSession,
        stopSession,
        speak,
        stopSpeaking,
        isSessionActive,
        isReady,
        isSpeaking,
        error
    } = useAzureAvatar({
        config: AZURE_AVATAR_CONFIG,
        onSpeakingStart: () => addLog('Avatar started speaking'),
        onSpeakingEnd: () => addLog('Avatar finished speaking'),
        onError: (error) => addLog(`Error: ${error}`),
        onSessionStart: () => addLog('Avatar session started successfully'),
        onSessionEnd: () => addLog('Avatar session ended')
    });

    const handleStartSession = async () => {
        if (!avatarContainerRef.current) return;
        
        try {
            addLog('Starting avatar session...');
            await startSession(avatarContainerRef.current);
        } catch (error) {
            addLog(`Failed to start session: ${error}`);
        }
    };

    const handleSpeak = async () => {
        if (!testText.trim()) return;
        
        try {
            addLog(`Speaking: "${testText}"`);
            await speak(testText);
        } catch (error) {
            addLog(`Failed to speak: ${error}`);
        }
    };

    const handleStopSpeaking = async () => {
        try {
            addLog('Stopping speech...');
            await stopSpeaking();
        } catch (error) {
            addLog(`Failed to stop speaking: ${error}`);
        }
    };

    const handleStopSession = async () => {
        try {
            addLog('Stopping avatar session...');
            await stopSession();
        } catch (error) {
            addLog(`Failed to stop session: ${error}`);
        }
    };

    const clearLogs = () => setLogs([]);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Azure Avatar Test</h1>
                <p className="text-muted-foreground">Test the Azure Speech Avatar integration</p>
            </div>

            {/* Avatar Container */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Avatar Display</h2>
                <div 
                    ref={avatarContainerRef}
                    className="relative bg-muted/30 rounded-xl h-[400px] flex items-center justify-center"
                >
                    {!isSessionActive && (
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <p className="text-muted-foreground">Avatar not active</p>
                        </div>
                    )}
                    
                    {isSessionActive && !isReady && (
                        <div className="text-center space-y-3">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-muted-foreground">Initializing avatar...</p>
                        </div>
                    )}

                    {/* Status indicators */}
                    {isSessionActive && (
                        <div className="absolute top-4 left-4 space-y-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                            }`}>
                                {isReady ? 'Ready' : 'Connecting'}
                            </div>
                            {isSpeaking && (
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse">
                                    Speaking
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="font-medium text-red-800">Error</h3>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                
                <div className="space-y-4">
                    {/* Session Controls */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleStartSession}
                            disabled={isSessionActive}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
                        >
                            Start Session
                        </button>
                        <button
                            onClick={handleStopSession}
                            disabled={!isSessionActive}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
                        >
                            Stop Session
                        </button>
                    </div>

                    {/* Speech Controls */}
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="testText" className="block text-sm font-medium text-foreground mb-2">
                                Text to Speak:
                            </label>
                            <textarea
                                id="testText"
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                                className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none"
                                rows={3}
                                placeholder="Enter text for the avatar to speak..."
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleSpeak}
                                disabled={!isReady || isSpeaking || !testText.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                            >
                                Speak
                            </button>
                            <button
                                onClick={handleStopSpeaking}
                                disabled={!isSpeaking}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700"
                            >
                                Stop Speaking
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration Display */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium">Region:</span> {AZURE_AVATAR_CONFIG.region}
                    </div>
                    <div>
                        <span className="font-medium">Character:</span> {AZURE_AVATAR_CONFIG.character}
                    </div>
                    <div>
                        <span className="font-medium">Style:</span> {AZURE_AVATAR_CONFIG.style}
                    </div>
                    <div>
                        <span className="font-medium">Voice:</span> {AZURE_AVATAR_CONFIG.voice}
                    </div>
                    <div>
                        <span className="font-medium">API Key:</span> {AZURE_AVATAR_CONFIG.subscriptionKey ? '•••••••' : 'Not set'}
                    </div>
                    <div>
                        <span className="font-medium">Background:</span> {AZURE_AVATAR_CONFIG.backgroundColor}
                    </div>
                </div>
            </div>

            {/* Logs */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Logs</h2>
                    <button
                        onClick={clearLogs}
                        className="px-3 py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 text-sm"
                    >
                        Clear
                    </button>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <p className="text-muted-foreground">No logs yet...</p>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="mb-1">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
