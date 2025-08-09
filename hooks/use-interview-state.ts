'use client';

import { useState, useCallback, useRef } from 'react';

export interface Template {
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
  candidate_name?: string;
}

export interface Interview {
  id?: number;
  questions: { question: string; answer: string; }[];
  startTime: Date;
}

export interface InterviewState {
  // Core interview data
  template: Template | null;
  interview: Interview;
  userFullName: string;
  
  // UI state
  loading: boolean;
  currentQuestion: string;
  answer: string;
  showEndConfirm: boolean;
  
  // Media state
  isMicEnabled: boolean;
  isRecording: boolean;
  showPermissions: boolean;
  stream: MediaStream | null;
  
  // Avatar state
  isInterviewerSpeaking: boolean;
  
  // Timer state
  elapsedTime: string;
}

const initialState: InterviewState = {
  template: null,
  interview: {
    questions: [],
    startTime: new Date()
  },
  userFullName: '',
  loading: true,
  currentQuestion: '',
  answer: '',
  showEndConfirm: false,
  isMicEnabled: false,
  isRecording: false,
  showPermissions: true,
  stream: null,
  isInterviewerSpeaking: false,
  elapsedTime: '00:00'
};

/**
 * Custom hook for managing interview state
 * Consolidates the complex state management from the interview page
 */
export function useInterviewState() {
  const [state, setState] = useState<InterviewState>(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State updaters
  const updateState = useCallback((updates: Partial<InterviewState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setTemplate = useCallback((template: Template | null) => {
    updateState({ template });
  }, [updateState]);

  const setUserFullName = useCallback((name: string) => {
    updateState({ userFullName: name });
  }, [updateState]);

  const setCurrentQuestion = useCallback((question: string) => {
    updateState({ currentQuestion: question });
  }, [updateState]);

  const setAnswer = useCallback((answer: string) => {
    updateState({ answer });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const setShowEndConfirm = useCallback((show: boolean) => {
    updateState({ showEndConfirm: show });
  }, [updateState]);

  const setIsMicEnabled = useCallback((enabled: boolean) => {
    updateState({ isMicEnabled: enabled });
  }, [updateState]);

  const setIsRecording = useCallback((recording: boolean) => {
    updateState({ isRecording: recording });
  }, [updateState]);

  const setShowPermissions = useCallback((show: boolean) => {
    updateState({ showPermissions: show });
  }, [updateState]);

  const setStream = useCallback((stream: MediaStream | null) => {
    updateState({ stream });
  }, [updateState]);

  const setIsInterviewerSpeaking = useCallback((speaking: boolean) => {
    updateState({ isInterviewerSpeaking: speaking });
  }, [updateState]);

  // Interview actions
  const addQuestionAnswer = useCallback((question: string, answer: string) => {
    setState(prev => ({
      ...prev,
      interview: {
        ...prev.interview,
        questions: [...prev.interview.questions, { question, answer }]
      }
    }));
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return; // Already running
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - prev.interview.startTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        return {
          ...prev,
          elapsedTime: `${minutes}:${seconds}`
        };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetInterview = useCallback(() => {
    stopTimer();
    setState({
      ...initialState,
      interview: {
        questions: [],
        startTime: new Date()
      }
    });
  }, [stopTimer]);

  return {
    state,
    actions: {
      setTemplate,
      setUserFullName,
      setCurrentQuestion,
      setAnswer,
      setLoading,
      setShowEndConfirm,
      setIsMicEnabled,
      setIsRecording,
      setShowPermissions,
      setStream,
      setIsInterviewerSpeaking,
      addQuestionAnswer,
      startTimer,
      stopTimer,
      resetInterview,
      updateState
    }
  };
}
