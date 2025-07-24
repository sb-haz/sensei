interface TranscriptionService {
    startTranscription: () => void;
    stopTranscription: () => void;
    onTranscriptionResult: (callback: (transcript: string) => void) => void;
}

// Speech recognition type declarations
interface SpeechRecognitionEvent extends Event {
    results: {
        isFinal: boolean;
        [index: number]: { transcript: string; confidence: number; }[];
    }[];
    resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export function createTranscriptionService(): TranscriptionService {
    let recognition: SpeechRecognition | null = null;
    let resultCallback: ((transcript: string) => void) | null = null;

    // Initialize speech recognition
    if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
        }
    }

    return {
        startTranscription: () => {
            if (recognition) {
                try {
                    recognition.start();
                } catch (err) {
                    console.error('Error starting transcription:', err);
                }
            }
        },

        stopTranscription: () => {
            if (recognition) {
                try {
                    recognition.stop();
                } catch (err) {
                    console.error('Error stopping transcription:', err);
                }
            }
        },

        onTranscriptionResult: (callback: (transcript: string) => void) => {
            resultCallback = callback;
            if (recognition) {
                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPart = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcriptPart + ' ';
                        }
                    }
                    if (finalTranscript && resultCallback) {
                        resultCallback(finalTranscript);
                    }
                };
            }
        }
    };
}
