'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VideoGridWithAvatar from './components/VideoGridWithAvatar';
import ControlPanel from './components/ControlPanel';
import QuestionAnswerBox from './components/QuestionAnswerBox';
import InterviewHeader from './components/InterviewHeader';
import { createTranscriptionService } from './services/transcription';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useUserSettings } from '@/hooks/use-settings';
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const transcriptionService = useRef(createTranscriptionService());
    const { settings } = useUserSettings();

    // State management
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [showPermissions, setShowPermissions] = useState(true);
    const [elapsedTime, setElapsedTime] = useState('00:00');
    const [isRecording, setIsRecording] = useState(false);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);  // Start with loading state true
    const [currentQuestion, setCurrentQuestion] = useState('');  // Will be set after we load user name
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
    const [template, setTemplate] = useState<Template | null>(null);
    const [interview, setInterview] = useState<Interview>({
        questions: [],
        startTime: new Date()
    });
    const [userFullName, setUserFullName] = useState<string>('');

    // Load user's full name for personalization
    useEffect(() => {
        const loadUserName = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();

                    if (userData?.full_name) {
                        setUserFullName(userData.full_name);
                        setCurrentQuestion(`Hi ${userData.full_name}! Please wait while I prepare your first question...`);
                    } else {
                        setCurrentQuestion('Hi there! Please wait while I prepare your first question...');
                    }
                } else {
                    setCurrentQuestion('Hi there! Please wait while I prepare your first question...');
                }
            } catch (error) {
                console.error('Error loading user name:', error);
                setCurrentQuestion('Hi there! Please wait while I prepare your first question...');
            }
        };

        loadUserName();
    }, []);

    // Set up avatar speaking callback to show question text when speaking starts
    useEffect(() => {
        window.__onAvatarSpeakingStart = (text: string) => {
            console.log('🗣️ Avatar started speaking, showing question text');
            setCurrentQuestion(text);
        };

        return () => {
            delete window.__onAvatarSpeakingStart;
        };
    }, []);

    // Initialize transcription service
    useEffect(() => {
        const service = transcriptionService.current;
        
        service.onTranscriptionResult((transcript) => {
            setAnswer(transcript);
        });

        return () => {
            service.stopTranscription();
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

<<<<<<< HEAD
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
            // Cleanup speech synthesis
            window.speechSynthesis.cancel();
        };
    }, []);

=======
>>>>>>> c58e33d9f585021b1060b94cce653f127c797081
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
                        name: userFullName || 'there', // Use full name if available, otherwise default greeting
                        job_info: {
                            title: template?.role || 'Software Engineer',
                            level: template?.level,
                            company: template?.company
                        }
                    },
                    interviewHistory: prevQuestions,
                    template: template,
                    userSettings: settings, // Pass user settings to API
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

            // Set the question immediately since we're not using pending state anymore
            setCurrentQuestion('The interviewer is preparing to ask you a question...');
            setAnswer('');
            
            console.log('🔄 Set currentQuestion preparation message');

            // Use Azure Avatar to speak the question
            try {
                // Always cancel any browser speech synthesis first
                window.speechSynthesis.cancel();
                
                console.log('🔍 Checking Azure Avatar availability...');
                console.log('__avatarSpeak function exists:', typeof window.__avatarSpeak);
                console.log('__avatarStatus function exists:', typeof window.__avatarStatus);
                
                if (window.__avatarStatus) {
                    const status = window.__avatarStatus();
                    console.log('🔍 Avatar status:', status);
                }
                
                if (window.__avatarSpeak) {
                    console.log('🎤 Attempting to speak question via Azure Avatar');
                    console.log('🎤 Using data.question directly:', data.question.substring(0, 100) + (data.question.length > 100 ? '...' : ''));
                    await window.__avatarSpeak(data.question);
                    console.log('✅ Azure Avatar speech completed successfully');
                } else {
                    console.warn('❌ Azure Avatar __avatarSpeak function not available, falling back to browser speech synthesis');
                    // Fallback to browser speech synthesis
                    setCurrentQuestion(data.question); // Show question text
                    setIsInterviewerSpeaking(true);
                    const utterance = new SpeechSynthesisUtterance(data.question);
                    window.speechSynthesis.cancel();
                    utterance.onend = () => setIsInterviewerSpeaking(false);
                    window.speechSynthesis.speak(utterance);
                }
            } catch (speakError) {
                console.error('❌ Failed to speak question via Azure Avatar, falling back to browser speech:', speakError);
                // Fallback to browser speech synthesis on error
                setCurrentQuestion(data.question); // Show question text
                setIsInterviewerSpeaking(true);
                const utterance = new SpeechSynthesisUtterance(data.question);
                window.speechSynthesis.cancel();
                utterance.onend = () => setIsInterviewerSpeaking(false);
                window.speechSynthesis.speak(utterance);
            }

            // Wait a moment to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify the question was fetched successfully
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

            // Stop avatar speaking if active
            try {
                if (window.__avatarStopSpeaking) {
                    await window.__avatarStopSpeaking();
                }
                // Also stop browser speech synthesis as fallback
                window.speechSynthesis.cancel();
                setIsInterviewerSpeaking(false);
            } catch (error) {
                console.error('Error stopping speech:', error);
            }

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
                        name: userFullName || 'there', // Use full name if available, otherwise default greeting
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
                console.log('Feedback generated:', feedback);
<<<<<<< HEAD
                // Note: feedback display logic would be handled elsewhere
            }

            // Stop all media tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
=======
>>>>>>> c58e33d9f585021b1060b94cce653f127c797081
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

    // Handle repeating current question
    const handleRepeatQuestion = async () => {
        if (!currentQuestion.trim()) return;

        try {
            if (window.__avatarSpeak) {
                console.log('🔄 Repeating question via Azure Avatar');
                await window.__avatarSpeak(currentQuestion);
            } else {
                console.log('🔄 Repeating question via browser speech synthesis');
                // Fallback to browser speech synthesis
                setIsInterviewerSpeaking(true);
                const utterance = new SpeechSynthesisUtterance(currentQuestion);
                window.speechSynthesis.cancel();
                utterance.onend = () => setIsInterviewerSpeaking(false);
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('❌ Failed to repeat question via Azure Avatar, falling back to browser speech:', error);
            // Fallback to browser speech synthesis on error
            setIsInterviewerSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(currentQuestion);
            window.speechSynthesis.cancel();
            utterance.onend = () => setIsInterviewerSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    if (showPermissions) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                <span className="text-3xl">🎤</span>
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">{t('interview.selectTemplate')}</h2>
                            <h3 className="text-lg text-foreground">
                                {t('auth.welcomeBack')}{userFullName ? `, ${userFullName}` : ''}!
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-muted-foreground text-center">
                                {t('interview.chooseTemplate')}
                            </p>

                            {template && (
                                <div className="bg-muted/30 rounded-xl p-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        <span className="font-medium text-foreground">{t('interview.selectTemplate')}:</span><br />
                                        {template.name} - {template.role} ({template.level})
                                    </p>
                                </div>
                            )}
                        </div>

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
                            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200"
                        >
                            {t('interview.startInterview')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <InterviewHeader elapsedTime={elapsedTime} />

            <div className="flex flex-col lg:flex-row gap-6 p-6 flex-1">
                <div className="flex-1 flex flex-col gap-6">
<<<<<<< HEAD
                    <VideoGridWithAvatar 
                        videoRef={videoRef as React.RefObject<HTMLVideoElement>} 
                        className="flex-1" 
                        isInterviewerSpeaking={isInterviewerSpeaking}
                        onInterviewerSpeakingChange={setIsInterviewerSpeaking}
=======
                    <VideoGrid 
                        videoRef={videoRef as React.RefObject<HTMLVideoElement>} 
                        className="flex-1"
>>>>>>> c58e33d9f585021b1060b94cce653f127c797081
                    />
                    <QuestionAnswerBox
                        currentQuestion={currentQuestion}
                        answer={answer}
                        loading={loading}
                        onAnswerChange={setAnswer}
                        onSubmit={handleSubmitAnswer}
                        isRecording={isRecording}
                        isInterviewerSpeaking={isInterviewerSpeaking}
                        onStartRecording={() => setIsRecording(true)}
                        showTimer={settings.show_question_timer}
                        questionNumber={interview.questions.length + 1}
                    />
                </div>
                <ControlPanel
                    questionCount={interview.questions.length + 1}
                    totalQuestions={template?.number_of_questions || 4}
                    isMuted={!isMicEnabled}
                    videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                    onRepeatQuestion={handleRepeatQuestion}
                    onSkipQuestion={fetchNextQuestion}
                    onMuteToggle={(muted) => setIsMicEnabled(!muted)}
                    onEndInterview={handleEndInterview}
                />
            </div>

            {showEndConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-foreground">{t('interview.endInterview')}?</h3>
                                <p className="text-muted-foreground">{t('common.confirm')} {t('interview.endInterview').toLowerCase()}?</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEndConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleEndInterview}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200"
                                >
                                    {t('interview.endInterview')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}