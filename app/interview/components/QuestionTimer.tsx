'use client'

import { useState, useEffect } from 'react';

interface QuestionTimerProps {
  show: boolean;
  onTimeUpdate?: (seconds: number) => void;
  resetTrigger?: number; // Change this to reset the timer
}

export default function QuestionTimer({ show, onTimeUpdate, resetTrigger }: QuestionTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetTrigger]);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setSeconds(prev => {
        const newValue = prev + 1;
        onTimeUpdate?.(newValue);
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, onTimeUpdate]);

  if (!show) return null;

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds < 60) return 'text-green-600'; // Under 1 minute - green
    if (seconds < 120) return 'text-yellow-600'; // 1-2 minutes - yellow
    return 'text-red-600'; // Over 2 minutes - red
  };

  return (
    <div className="flex items-center space-x-3 bg-muted/30 px-4 py-2 rounded-full">
      <span className="text-sm text-muted-foreground">Question time:</span>
      <span className={`font-mono font-semibold text-sm ${getTimeColor(seconds)}`}>
        {formatTime(seconds)}
      </span>
    </div>
  );
}