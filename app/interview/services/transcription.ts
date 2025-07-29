interface TranscriptionService {
    startTranscription: () => void;
    stopTranscription: () => void;
    onTranscriptionResult: (callback: (transcript: string) => void) => void;
}

// Speech recognition type declarations
interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: {
        transcript: string;
        confidence: number;
    };
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
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
                        const result = event.results[i];
                        const transcriptPart = result[0].transcript;
                        if (result.isFinal) {
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
