'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VideoGridWithChatAvatar from './components/VideoGridWithChatAvatar';
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
    const [stream, setStream] = useState<MediaStream | null>(null);
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
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [isInterviewCompleting, setIsInterviewCompleting] = useState(false);

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
        if (showCompletionDialog || isInterviewCompleting) {
            // Stop timer when interview is completing or completed
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - interview.startTime.getTime()) / 1000);
            const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
            const seconds = (diff % 60).toString().padStart(2, '0');
            setElapsedTime(`${minutes}:${seconds}`);
            
            // Check if duration limit is reached
            if (template?.duration_minutes) {
                const elapsedMinutes = Math.floor(diff / 60);
                if (elapsedMinutes >= template.duration_minutes && !isInterviewCompleting) {
                    console.log(`⏰ Duration limit reached: ${elapsedMinutes}/${template.duration_minutes} minutes`);
                    handleInterviewCompletion('duration');
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [interview.startTime, template?.duration_minutes, isInterviewCompleting, showCompletionDialog]);

    // Check if interview should end based on questions or duration
    const shouldEndInterview = (questionCount: number): { shouldEnd: boolean; reason: 'questions' | 'duration' | null } => {
        const maxQuestions = template?.number_of_questions || 4;
        const maxDuration = template?.duration_minutes || 60;
        const elapsedMinutes = Math.floor((new Date().getTime() - interview.startTime.getTime()) / 60000);
        
        if (questionCount >= maxQuestions) {
            return { shouldEnd: true, reason: 'questions' };
        }
        
        if (elapsedMinutes >= maxDuration) {
            return { shouldEnd: true, reason: 'duration' };
        }
        
        return { shouldEnd: false, reason: null };
    };

    // Generate feedback in background without blocking UI
    const generateFeedbackInBackground = async (interviewId: number, durationMinutes: number) => {
        try {
            console.log('🤖 Background feedback generation started for interview:', interviewId);
            
            // Add a small delay to ensure interview completion is saved first
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const feedbackResponse = await fetch('/api/generate-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userDetails: { name: 'User' },
                    interviewHistory: interview.questions,
                    template: {
                        role: template?.role || 'Software Engineer',
                        level: template?.level || 'Mid-level',
                        company: template?.company || 'Tech Company'
                    },
                    interviewId: interviewId,
                    isEndOfInterview: true
                }),
            });

            if (!feedbackResponse.ok) {
                console.error('❌ Background feedback generation failed:', feedbackResponse.status);
                const errorText = await feedbackResponse.text();
                console.error('❌ Error details:', errorText);
                
                // Try once more after a delay
                console.log('🔄 Retrying feedback generation in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const retryResponse = await fetch('/api/generate-feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userDetails: { name: 'User' },
                        interviewHistory: interview.questions,
                        template: {
                            role: template?.role || 'Software Engineer',
                            level: template?.level || 'Mid-level',
                            company: template?.company || 'Tech Company'
                        },
                        interviewId: interviewId,
                        isEndOfInterview: true
                    }),
                });
                
                if (!retryResponse.ok) {
                    const retryErrorText = await retryResponse.text();
                    console.error('❌ Retry also failed:', retryResponse.status, retryErrorText);
                    return;
                }
                
                const retryFeedbackData = await retryResponse.json();
                console.log('✅ Background feedback generated successfully on retry:', retryFeedbackData);
            } else {
                const feedbackData = await feedbackResponse.json();
                console.log('✅ Background feedback generated successfully:', feedbackData);
            }
        } catch (feedbackError) {
            console.error('❌ Error in background feedback generation:', feedbackError);
            // Background process - don't throw error, just log it
            console.log('💡 Feedback can be regenerated later from the dashboard');
        }
    };

    // Handle interview completion with AI conclusion
    const handleInterviewCompletion = async (reason: 'questions' | 'duration') => {
        if (isInterviewCompleting) return; // Prevent multiple calls
        
        setIsInterviewCompleting(true);
        setLoading(true);
        
        try {
            console.log(`🎯 Interview completing due to: ${reason}`);
            
            // Create completion message
            const completionMessage = reason === 'questions' 
                ? `Thank you for completing all ${template?.number_of_questions || 4} questions! Your interview is now finished. Your results will be available shortly in your dashboard. Great job!`
                : `Thank you! We've reached the ${template?.duration_minutes || 60}-minute time limit for this interview. Your responses have been recorded and your results will be available shortly in your dashboard. Well done!`;
            
            setCurrentQuestion(completionMessage);
            
            // Update interview completion in database
            if (interview.id) {
                console.log('💾 Updating interview completion status in database...');
                const supabase = createClient();
                
                // Calculate total duration in minutes using same logic as timer
                const now = new Date();
                const diffSeconds = Math.floor((now.getTime() - interview.startTime.getTime()) / 1000);
                const durationMinutes = Math.floor(diffSeconds / 60);
                
                const { error: updateError } = await supabase
                    .from('interviews')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        total_duration_minutes: durationMinutes
                    })
                    .eq('id', interview.id);

                if (updateError) {
                    console.error('❌ Failed to update interview completion:', updateError);
                } else {
                    console.log('✅ Interview completion updated successfully:', {
                        interviewId: interview.id,
                        durationMinutes,
                        totalQuestions: interview.questions.length,
                        completionReason: reason
                    });
                }

                // Generate feedback asynchronously in the background
                console.log('🤖 Starting background feedback generation...');
                // Don't await this - let it run in background
                generateFeedbackInBackground(interview.id, durationMinutes);
            } else {
                console.warn('⚠️ No interview ID available for database update');
            }
            
            // Have the Azure AI avatar speak the completion message
            try {
                if (window.__chatAvatarSpeakCompletion) {
                    console.log('🎤 Azure AI avatar speaking completion message...');
                    
                    // Use the dedicated completion speaking function
                    await new Promise<void>((resolve) => {
                        setIsInterviewerSpeaking(true);
                        
                        // Use a timeout to resolve after a reasonable time
                        const timeout = setTimeout(() => {
                            setIsInterviewerSpeaking(false);
                            resolve();
                        }, Math.max(3000, completionMessage.length * 80)); // Estimate based on message length
                        
                        // Send completion message to avatar for direct speech
                        window.__chatAvatarSpeakCompletion!(completionMessage).then(() => {
                            clearTimeout(timeout);
                            setIsInterviewerSpeaking(false);
                            resolve();
                        }).catch((error) => {
                            console.error('Error with chat avatar completion speech:', error);
                            clearTimeout(timeout);
                            setIsInterviewerSpeaking(false);
                            resolve();
                        });
                    });
                    
                    console.log('✅ Azure AI avatar completion message spoken');
                } else if (window.__chatAvatarSendMessage) {
                    console.log('🎤 Using fallback chat avatar method...');
                    // Fallback to sending message through chat system
                    await new Promise<void>((resolve) => {
                        setIsInterviewerSpeaking(true);
                        const timeout = setTimeout(() => {
                            setIsInterviewerSpeaking(false);
                            resolve();
                        }, Math.max(3000, completionMessage.length * 80));
                        
                        window.__chatAvatarSendMessage!(completionMessage).then(() => {
                            clearTimeout(timeout);
                            setIsInterviewerSpeaking(false);
                            resolve();
                        }).catch((error) => {
                            console.error('Error with fallback chat avatar speech:', error);
                            clearTimeout(timeout);
                            setIsInterviewerSpeaking(false);
                            resolve();
                        });
                    });
                } else {
                    console.warn('⚠️ Chat avatar not available, using browser speech synthesis');
                    // Fallback to browser speech synthesis only if chat avatar is not available
                    await new Promise<void>((resolve) => {
                        setIsInterviewerSpeaking(true);
                        const utterance = new SpeechSynthesisUtterance(completionMessage);
                        utterance.rate = 0.9;
                        utterance.onend = () => {
                            setIsInterviewerSpeaking(false);
                            resolve();
                        };
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                    });
                }
            } catch (error) {
                console.error('Error speaking completion message:', error);
                // Even if speech fails, continue with completion
                setIsInterviewerSpeaking(false);
            }
            
            // Wait a moment after speech completes
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show completion dialog and ensure timer stops
            setShowCompletionDialog(true);
            setLoading(false);
            
            console.log('✅ Interview completion process finished', {
                questionsAnswered: interview.questions.length,
                interviewId: interview.id,
                completionReason: reason
            });
            
        } catch (error) {
            console.error('Error during interview completion:', error);
            setLoading(false);
            // Still show completion dialog even if speech fails
            setShowCompletionDialog(true);
        }
    };

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

    // Fetch next question using Azure Chat Avatar
    const fetchNextQuestion = async (prevQuestions = interview.questions) => {
        const { shouldEnd, reason } = shouldEndInterview(prevQuestions.length);
        if (shouldEnd && reason) {
            await handleInterviewCompletion(reason);
            return true;
        }

        setCurrentQuestion('The interviewer is preparing your next question...');
        setAnswer('');
        setLoading(true);

        try {
            console.log('Fetching next question via chat avatar...', {
                questionCount: prevQuestions.length,
                template: template
            });

            // Create an interview record if we don't have one yet (for first question)
            if (!interview.id && template?.id) {
                console.log('🆕 Creating interview record for first question...');
                const supabase = createClient();
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
                        started_at: interview.startTime.toISOString()
                    })
                    .select()
                    .single();

                if (interviewError) {
                    console.error('Failed to create interview:', interviewError);
                    throw new Error('Failed to create interview record');
                }

                if (!interviewData) {
                    console.error('No interview data returned after creation');
                    throw new Error('Interview creation returned no data');
                }

                console.log('✅ Interview created successfully:', {
                    interviewId: interviewData.id,
                    templateId: template.id,
                    startTime: interview.startTime.toISOString()
                });

                setInterview(prev => ({ ...prev, id: interviewData.id }));
            }

            // Use the new chat avatar system to get and speak the question
            if (window.__chatAvatarSendMessage) {
                console.log('🎤 Sending message to chat avatar for question generation');
                
                // For first question, don't send user message, for subsequent questions send undefined to continue
                const userMessage = prevQuestions.length === 0 ? undefined : undefined;
                
                await window.__chatAvatarSendMessage(userMessage);
                console.log('✅ Chat avatar message sent successfully');
                
                return true;
            } else {
                throw new Error('Chat avatar system not available');
            }

        } catch (error) {
            console.error('Failed to get next question via chat avatar:', error);
            setCurrentQuestion('Error: Failed to load question. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Handle answer submission
    const handleSubmitAnswer = async () => {
        if (!answer.trim() || loading || isInterviewCompleting) return;

        setLoading(true);
        transcriptionService.current.stopTranscription();
        setIsRecording(false);

        try {
            console.log('Saving answer and getting next question via chat avatar...', {
                currentQuestion,
                answer: answer.trim(),
                interviewId: interview.id,
                questionNumber: interview.questions.length + 1
            });

            // Ensure interview record exists before saving answer
            let interviewId = interview.id;
            if (!interviewId && template?.id) {
                console.log('🆕 Creating interview record before saving answer...');
                const supabase = createClient();
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
                        started_at: interview.startTime.toISOString()
                    })
                    .select()
                    .single();

                if (interviewError) {
                    console.error('Failed to create interview:', interviewError);
                    throw new Error('Failed to create interview record');
                }

                if (!interviewData) {
                    console.error('No interview data returned after creation');
                    throw new Error('Interview creation returned no data');
                }

                console.log('✅ Interview created successfully:', {
                    interviewId: interviewData.id,
                    templateId: template.id,
                    startTime: interview.startTime.toISOString()
                });

                interviewId = interviewData.id;
                setInterview(prev => ({ ...prev, id: interviewData.id }));
            }

            // First update the interview state with the new Q&A
            const newQuestions = [...interview.questions, {
                question: currentQuestion,
                answer: answer.trim()
            }];

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

            if (interviewId) {
                // Save the answer to Supabase answers table
                const supabase = createClient();
                const answerData = {
                    interview_id: interviewId,
                    question_number: interview.questions.length + 1, // Fix: Should be +1 to start from 1, not 0
                    question_text: currentQuestion,
                    user_answer: answer.trim()
                };
                
                console.log('💾 Saving answer to database:', answerData);
                
                const { error: answerError } = await supabase
                    .from('answers')
                    .insert(answerData);

                if (answerError) {
                    console.error('❌ Failed to save answer:', answerError);
                    console.error('❌ Answer data that failed:', answerData);
                    console.error('❌ Database error details:', answerError.message, answerError.code);
                } else {
                    console.log('✅ Successfully saved answer to database', {
                        question_number: answerData.question_number,
                        interview_id: answerData.interview_id,
                        question_text: answerData.question_text.substring(0, 50) + '...',
                        answer_length: answerData.user_answer.length
                    });
                }
            } else {
                console.warn('❌ No interview ID available, answer only saved in local state');
            }

            // Clear current state
            setCurrentQuestion('The interviewer is processing your answer...');
            setAnswer('');

            // Check if this is the last question or time limit reached
            const { shouldEnd, reason } = shouldEndInterview(newQuestions.length);
            if (shouldEnd && reason) {
                await handleInterviewCompletion(reason);
                return;
            }

            // Send the user's answer to the chat avatar to get the next question
            if (window.__chatAvatarSendMessage) {
                console.log('🎤 Sending user answer to chat avatar for next question');
                await window.__chatAvatarSendMessage(answer.trim());
                console.log('✅ User answer sent to chat avatar successfully');
            } else {
                throw new Error('Chat avatar system not available');
            }

        } catch (error) {
            console.error('Failed to save answer and get next question:', error);
            setCurrentQuestion('Error: Failed to process your answer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle ending the interview
    const handleEndInterview = async () => {
        try {
            setLoading(true);
            setShowCompletionDialog(false); // Hide completion dialog if showing

            // Stop chat avatar speaking if active
            try {
                if (window.__chatAvatarStop) {
                    await window.__chatAvatarStop();
                }
                // Also stop browser speech synthesis as fallback
                window.speechSynthesis.cancel();
                setIsInterviewerSpeaking(false);
            } catch (error) {
                console.error('Error stopping chat avatar speech:', error);
            }

            if (interview.id) {
                // Update interview status
                const supabase = createClient();
                
                // Calculate duration properly
                const durationMinutes = Math.floor((new Date().getTime() - interview.startTime.getTime()) / 60000);
                
                const { error: updateError } = await supabase
                    .from('interviews')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        total_duration_minutes: durationMinutes
                    })
                    .eq('id', interview.id);

                if (updateError) {
                    console.error('Failed to update interview status:', updateError);
                } else {
                    console.log('Successfully updated interview status', {
                        interview_id: interview.id,
                        duration_minutes: durationMinutes,
                        questions_count: interview.questions.length
                    });
                }

                // Generate final comprehensive feedback in background
                console.log('🤖 Starting background feedback generation for manual end...');
                // Don't await this - let it run in background  
                generateFeedbackInBackground(interview.id, durationMinutes);
            }

            // Stop all media tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Navigate to dashboard immediately without waiting for feedback
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
            // Use chat avatar to speak the current question
            if (window.__chatAvatarSendMessage) {
                console.log('🔄 Repeating question via chat avatar');
                // Send empty message to make avatar repeat the current question
                setCurrentQuestion('The interviewer is repeating the question...');
                
                // We'll use the chat avatar's speak functionality directly
                // For now, fall back to browser speech synthesis for repeat
                setIsInterviewerSpeaking(true);
                const utterance = new SpeechSynthesisUtterance(currentQuestion);
                window.speechSynthesis.cancel();
                utterance.onend = () => setIsInterviewerSpeaking(false);
                window.speechSynthesis.speak(utterance);
            } else {
                console.log('🔄 Repeating question via browser speech synthesis');
                setIsInterviewerSpeaking(true);
                const utterance = new SpeechSynthesisUtterance(currentQuestion);
                window.speechSynthesis.cancel();
                utterance.onend = () => setIsInterviewerSpeaking(false);
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('❌ Failed to repeat question:', error);
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
                                // Start the interview with the chat avatar system
                                const startInterview = async () => {
                                    // Wait for chat avatar to be ready
                                    let attempts = 0;
                                    const maxAttempts = 20; // 10 seconds max
                                    
                                    while (attempts < maxAttempts) {
                                        if (window.__chatAvatarStatus) {
                                            const status = window.__chatAvatarStatus();
                                            console.log(`🔍 Chat avatar status check ${attempts + 1}:`, status);
                                            
                                            if (status.isReady && window.__chatAvatarSendMessage) {
                                                console.log('✅ Chat avatar is ready, starting interview');
                                                try {
                                                    await window.__chatAvatarSendMessage();
                                                    return;
                                                } catch (error) {
                                                    console.error('Failed to start interview with chat avatar:', error);
                                                    setCurrentQuestion('Error starting interview. Please try again.');
                                                    return;
                                                }
                                            }
                                        }
                                        
                                        attempts++;
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                    }
                                    
                                    // If we get here, chat avatar didn't become ready in time
                                    console.warn('⚠️ Chat avatar not ready after 10 seconds, falling back to old system');
                                    try {
                                        await fetchNextQuestion();
                                    } catch (error) {
                                        console.error('Failed to start interview with fallback:', error);
                                        setCurrentQuestion('Error starting interview. Please try again.');
                                    }
                                };
                                
                                startInterview();
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

    // Wrapper function to log question updates
    const handleQuestionUpdate = (message: string) => {
        console.log('📝 Question updated in main display:', message.substring(0, 100) + '...');
        setCurrentQuestion(message);
        
        // Clear loading state as soon as we start receiving the question
        if (loading && message.trim()) {
            console.log('🔄 Clearing loading state - question started streaming');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <InterviewHeader elapsedTime={elapsedTime} />

            <div className="flex flex-col lg:flex-row gap-6 p-6 flex-1">
                <div className="flex-1 flex flex-col gap-6">
                    <VideoGridWithChatAvatar 
                        videoRef={videoRef as React.RefObject<HTMLVideoElement>} 
                        className="flex-1" 
                        isInterviewerSpeaking={isInterviewerSpeaking}
                        onInterviewerSpeakingChange={setIsInterviewerSpeaking}
                        onMessageReceived={handleQuestionUpdate}
                        userDetails={{
                            name: userFullName || 'there',
                            job_info: {
                                title: template?.role || 'Software Engineer',
                                level: template?.level,
                                company: template?.company
                            }
                        }}
                        interviewHistory={interview.questions}
                        settings={settings}
                        template={template}
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
                    onEndInterview={() => {
                        if (!isInterviewCompleting) {
                            setShowEndConfirm(true);
                        }
                    }}
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

            {showCompletionDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
                        <div className="space-y-6 text-center">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-4xl">🎉</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Interview Complete!</h3>
                                    <p className="text-muted-foreground mb-2">
                                        Great job! You've completed your {template?.topic || 'technical'} interview
                                        {template?.company ? ` for ${template.company}` : ''}.
                                    </p>
                                    <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-2">
                                        📊 Your detailed feedback is being generated and will be available in your dashboard shortly.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Questions Answered:</span>
                                    <span className="font-medium">{interview.questions.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Duration:</span>
                                    <span className="font-medium">{elapsedTime}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Position:</span>
                                    <span className="font-medium">{template?.role || 'Software Engineer'}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Your responses are being analyzed. Detailed feedback will be available in your dashboard shortly.
                                </p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCompletionDialog(false);
                                            handleEndInterview();
                                        }}
                                        className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200"
                                    >
                                        View Results
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCompletionDialog(false);
                                            router.push('/dashboard');
                                        }}
                                        className="flex-1 border border-border text-foreground px-6 py-3 rounded-full font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                    >
                                        Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}