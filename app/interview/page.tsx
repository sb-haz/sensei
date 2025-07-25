'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VideoGrid from './components/VideoGrid';
import ControlPanel from './components/ControlPanel';
import QuestionAnswerBox from './components/QuestionAnswerBox';
import InterviewHeader from './components/InterviewHeader';
import { createTranscriptionService } from './services/transcription';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Template {
    id: string;
    name: string;
    company?: string;
    role: string;
    level: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    description?: string;
    duration_minutes: number;
    number_of_questions: number;
    is_default: boolean;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    candidate_name?: string; // Added for interview context
}

interface Interview {
    id?: number;
    questions: { question: string; answer: string; }[];
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
    const [loading, setLoading] = useState(true);  // Start with loading state true
    const [currentQuestion, setCurrentQuestion] = useState('Hi! Please wait while I prepare your first question...');  // Initial loading message
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
    const [template, setTemplate] = useState<Template | null>(null);
    const [interview, setInterview] = useState<Interview>({
        questions: [],
        startTime: new Date()
    });
    const [feedback, setFeedback] = useState<any>(null);
    const [showFeedback, setShowFeedback] = useState(false);

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

    // Load template data
    useEffect(() => {
        const loadTemplate = async () => {
            const params = new URLSearchParams(window.location.search);
            const templateId = params.get('template');
            
            if (templateId) {
                const supabase = createClient();
                const { data: templateData } = await supabase
                    .from('interview_templates')
                    .select(`
                        id,
                        name,
                        company,
                        role,
                        level,
                        difficulty,
                        topic,
                        description,
                        duration_minutes,
                        number_of_questions,
                        is_default,
                        created_by,
                        created_at,
                        updated_at
                    `)
                    .eq('id', templateId)
                    .single();

                if (templateData) {
                    setTemplate(templateData);
                }
            }
        };

        loadTemplate();
    }, []);

    // Set up media devices
    useEffect(() => {
        const setupMedia = async () => {
            try {
                // Try to get both video and audio, but don't fail if they're not available
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
                } catch (mediaError) {
                    console.log('Media devices not available:', mediaError);
                    // Try audio only if both failed
                    try {
                        const audioStream = await navigator.mediaDevices.getUserMedia({
                            audio: true
                        });
                        setStream(audioStream);
                        setIsMicEnabled(true);
                    } catch (audioError) {
                        console.log('Audio not available:', audioError);
                    }
                }
            } catch (err) {
                console.error('Failed to setup interview:', err);
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
    const fetchNextQuestion = async (prevQuestions = interview.questions) => {
        if (prevQuestions.length >= (template?.number_of_questions || 4)) {
            await handleEndInterview();
            return true;
        }

        setCurrentQuestion(''); // Clear current question while loading
        setAnswer(''); // Clear previous answer
        setLoading(true);

        try {
            console.log('Fetching next question...', {
                questionCount: prevQuestions.length,
                template: template
            });

            // First, create an interview record if we don't have one yet
            if (!interview.id && template?.id) {
                const supabase = createClient();
                
                // Get the current user first
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                
                if (userError || !user) {
                    console.error('Auth error:', userError);
                    throw new Error('User not authenticated');
                }

                const { data: interviewData, error: interviewError } = await supabase
                    .from('interviews')
                    .insert({
                        template_id: template.id,
                        user_id: user.id,
                        status: 'in_progress',
                        started_at: interview.startTime
                    })
                    .select()
                    .single();
                
                if (interviewError) {
                    console.error('Failed to create interview:', interviewError);
                    throw new Error('Failed to create interview record');
                }

                setInterview(prev => ({ ...prev, id: interviewData.id }));
            }

            const response = await fetch('/api/generate-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userDetails: {
                        name: template?.candidate_name || 'Candidate',
                        job_info: {
                            title: template?.role || 'Software Engineer',
                            level: template?.level,
                            company: template?.company
                        }
                    },
                    interviewHistory: prevQuestions,
                    template: template,
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
            
            // Read out the question using text-to-speech
            setIsInterviewerSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(data.question);
            // Make sure any previous speech is cancelled
            window.speechSynthesis.cancel();
            utterance.onend = () => setIsInterviewerSpeaking(false);
            window.speechSynthesis.speak(utterance);
            
            // Set the question after starting speech synthesis
            setCurrentQuestion(data.question);
            setAnswer('');
            
            // Wait a moment to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify the question was set
            if (data.question) {
                return true;
            } else {
                throw new Error('Question was not set properly');
            }
        } catch (error) {
            console.error('Failed to get next question:', error);
            setCurrentQuestion('Error: Failed to load question. Please try again.');
            return false;
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
            console.log('Saving answer...', {
                currentQuestion,
                answer: answer.trim(),
                interviewId: interview.id
            });

            // First update the interview state with the new Q&A
            const newQuestions = [...interview.questions, {
                question: currentQuestion,
                answer: answer.trim()
            }];

            // Log the updated questions array
            console.log('Updated questions array:', newQuestions);

            // Update interview state first
            setInterview(prev => {
                console.log('Previous interview state:', prev);
                const newState = {
                    ...prev,
                    questions: newQuestions
                };
                console.log('New interview state:', newState);
                return newState;
            });

            if (interview.id) {
                // Save the answer to Supabase answers table
                const supabase = createClient();
                const { error: answerError } = await supabase
                    .from('answers')
                    .insert({
                        interview_id: interview.id,
                        question_number: interview.questions.length,
                        question_text: currentQuestion,
                        user_answer: answer.trim()
                    });
                
                if (answerError) {
                    console.error('Failed to save answer:', answerError);
                } else {
                    console.log('Successfully saved answer to database');
                }
            } else {
                console.warn('No interview ID available, answer only saved in local state');
            }

            // Clear current state before fetching next question
            setCurrentQuestion('');
            setAnswer('');

            // Then fetch the next question with the updated questions array
            await fetchNextQuestion(newQuestions);
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

            if (interview.id) {
                // Update interview status
                const supabase = createClient();
                const { error: updateError } = await supabase
                    .from('interviews')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        total_duration_minutes: Math.floor((new Date().getTime() - interview.startTime.getTime()) / 60000)
                    })
                    .eq('id', interview.id);

                if (updateError) {
                    console.error('Failed to update interview status:', updateError);
                }

                // Generate final comprehensive feedback
                console.log('Preparing final feedback with template:', {
                    template
                });

                const finalFeedbackData = {
                    userDetails: {
                        name: template?.candidate_name || 'Candidate',
                        job_info: {
                            title: template?.role || 'Software Engineer',
                            level: template?.level || 'Mid-Level',
                            company: template?.company || 'Company'
                        }
                    },
                    interviewHistory: interview.questions,
                    template: template,
                    interviewId: interview.id,
                    isEndOfInterview: true
                };

                console.log('Sending final feedback request:', finalFeedbackData);

                const feedbackResponse = await fetch('/api/generate-feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(finalFeedbackData),
                });

                if (!feedbackResponse.ok) {
                    throw new Error('Failed to generate feedback');
                }

                const feedback = await feedbackResponse.json();
                setFeedback(feedback);
                setShowFeedback(true);
            }

            // Stop all media tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Navigate to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Error ending interview:', error);
            toast.error('Failed to end interview. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (showPermissions) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center">Setup Your Interview</h2>
                    <h3 className="text-lg text-center mb-2">Welcome to your technical interview!</h3>
                    <p className="text-gray-600 mb-6">
                        Allow access to your camera and microphone if available. You can proceed with the interview even without these devices.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        {template ? `Interview type: ${template.name} - ${template.role} (${template.level})` : 'Standard Software Engineering Interview'}
                    </p>
                    <button
                        onClick={() => {
                            setShowPermissions(false);
                            // Start fetching the question after transitioning to the interview view
                            setTimeout(() => {
                                fetchNextQuestion().catch(error => {
                                    console.error('Failed to start interview:', error);
                                    setCurrentQuestion('Error starting interview. Please try again.');
                                });
                            }, 0);
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                        Start Interview
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
                    totalQuestions={template?.number_of_questions || 4}
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
