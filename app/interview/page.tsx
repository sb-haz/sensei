'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VideoGrid from './components/VideoGrid';
import ControlPanel from './components/ControlPanel';
import QuestionAnswerBox from './components/QuestionAnswerBox';
import InterviewHeader from './components/InterviewHeader';
import { createTranscriptionService } from './services/transcription';

interface Interview {
    questions: { question: string; answer: string; }[];
    settings: {
        difficulty: 'easy' | 'medium' | 'hard';
        duration: number;
    };
    startTime: Date;
}

export default function InterviewPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const transcriptionService = useRef(createTranscriptionService());
    
    // State management
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showPermissions, setShowPermissions] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00');
    const [isRecording, setIsRecording] = useState(false);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
    const [interview, setInterview] = useState<Interview>({
        questions: [],
        settings: {
            difficulty: 'medium',
            duration: 5
        },
        startTime: new Date()
    });

    // Initialize transcription service
    useEffect(() => {
        transcriptionService.current.onTranscriptionResult((transcript) => {
            setAnswer(transcript);
        });

        return () => {
            transcriptionService.current.stopTranscription();
        };
    }, []);

    // Handle recording state
    useEffect(() => {
        if (isRecording) {
            transcriptionService.current.startTranscription();
        } else {
            transcriptionService.current.stopTranscription();
        }
    }, [isRecording]);

    // Update elapsed time
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - interview.startTime.getTime()) / 1000);
            const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
            const seconds = (diff % 60).toString().padStart(2, '0');
            setElapsedTime(`${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [interview.startTime]);

    // Set up media devices
    useEffect(() => {
        const setupMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.muted = true;
                }
                setStream(stream);
                setIsMicEnabled(true);
                setIsCameraEnabled(true);
                setShowPermissions(false);

                // Start with first question
                fetchNextQuestion();
            } catch (err) {
                console.error('Failed to access camera/microphone:', err);
                setShowPermissions(false);
            }
        };

        setupMedia();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Toggle microphone
    const toggleMic = async () => {
        try {
            if (stream) {
                const audioTracks = stream.getAudioTracks();
                audioTracks.forEach((track: MediaStreamTrack) => {
                    track.enabled = !isMicEnabled;
                });
                setIsMicEnabled(!isMicEnabled);
            } else if (!isMicEnabled) {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setStream(mediaStream);
                setIsMicEnabled(true);
            }
        } catch (err) {
            console.error('Failed to toggle microphone:', err);
        }
    };

    // Toggle camera
    const toggleCamera = async () => {
        try {
            if (stream) {
                const videoTracks = stream.getVideoTracks();
                videoTracks.forEach((track: MediaStreamTrack) => {
                    track.enabled = !isCameraEnabled;
                });
                setIsCameraEnabled(!isCameraEnabled);
            } else if (!isCameraEnabled) {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                setIsCameraEnabled(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            }
        } catch (err) {
            console.error('Failed to toggle camera:', err);
        }
    };

    // Fetch next question
    const fetchNextQuestion = async () => {
        if (interview.questions.length >= interview.settings.duration) {
            await handleEndInterview();
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching next question...', {
                questionCount: interview.questions.length,
                settings: interview.settings
            });

            const response = await fetch('/api/generate-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userDetails: {
                        name: 'Test User', // TODO: Replace with actual user details
                        job_info: {
                            title: 'Chef',
                            experience: '5 years',
                            sector: 'Hospitality'
                        }
                    },
                    interviewHistory: interview.questions,
                    settings: interview.settings
                }),
            });

            const data = await response.json();

            // Check for API-level errors
            if (!response.ok) {
                console.error('API request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    data
                });
                throw new Error(
                    data.error || 
                    `API request failed with status ${response.status}`
                );
            }

            // Check for application-level errors
            if (data.error) {
                console.error('Application error:', data.error);
                throw new Error(`Application error: ${data.error}`);
            }

            // Validate response data
            if (!data.question) {
                console.error('Invalid response:', data);
                throw new Error('Invalid API response: missing question');
            }

            console.log('Successfully fetched question:', data.question);
            setCurrentQuestion(data.question);
            setAnswer('');
        } catch (error) {
            console.error('Failed to get next question:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle answer submission
    const handleSubmitAnswer = async () => {
        if (!answer.trim() || loading) return;

        setLoading(true);
        transcriptionService.current.stopTranscription();
        setIsRecording(false);

        try {
            const newQuestions = [...interview.questions, {
                question: currentQuestion,
                answer: answer.trim()
            }];

            setInterview(prev => ({
                ...prev,
                questions: newQuestions
            }));

            await fetchNextQuestion();
        } catch (error) {
            console.error('Failed to save answer:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle ending the interview
    const handleEndInterview = async () => {
        try {
            setLoading(true);
            
            // Generate feedback first
            const feedbackResponse = await fetch('/api/generate-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userDetails: {
                        name: 'Test User', // TODO: Replace with actual user details
                        job_info: {
                            title: 'Chef',
                            experience: '5 years',
                            sector: 'Hospitality'
                        }
                    },
                    interviewHistory: interview.questions,
                    settings: interview.settings,
                    interviewId: 'test-id' // TODO: Replace with actual interview ID
                }),
            });

            if (!feedbackResponse.ok) {
                throw new Error('Failed to generate feedback');
            }

            // Stop all media tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Navigate to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Error ending interview:', error);
        } finally {
            setLoading(false);
        }
    };

    if (showPermissions) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center">Setup Your Interview</h2>
                    <p className="text-gray-600 mb-6">
                        Please allow access to your camera and microphone to start the interview.
                    </p>
                    <button
                        onClick={() => setShowPermissions(false)}
                        className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <InterviewHeader elapsedTime={elapsedTime} />

            <div className="flex flex-col md:flex-row gap-3 p-3">
                <div className="flex-1 flex flex-col gap-3">
                    <VideoGrid videoRef={videoRef as React.RefObject<HTMLVideoElement>} className="flex-1 flex flex-col gap-3" />
                    <QuestionAnswerBox
                        currentQuestion={currentQuestion}
                        answer={answer}
                        loading={loading}
                        onAnswerChange={setAnswer}
                        onSubmit={handleSubmitAnswer}
                        isRecording={isRecording}
                        isInterviewerSpeaking={isInterviewerSpeaking}
                        onStartRecording={() => setIsRecording(true)}
                    />
                </div>
                <ControlPanel
                    questionCount={interview.questions.length + 1}
                    totalQuestions={interview.settings.duration}
                    isMuted={!isMicEnabled}
                    videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                    onRepeatQuestion={() => setCurrentQuestion(currentQuestion)}
                    onSkipQuestion={fetchNextQuestion}
                    onMuteToggle={(muted) => setIsMicEnabled(!muted)}
                    onEndInterview={handleEndInterview}
                />
            </div>

            {showEndConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
                        <h3 className="text-lg font-semibold mb-4">End Interview?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to end this interview? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEndInterview}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                End Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
