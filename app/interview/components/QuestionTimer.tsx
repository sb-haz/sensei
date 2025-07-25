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
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-500">Question time:</span>
      <span className={`font-mono font-medium ${getTimeColor(seconds)}`}>
        {formatTime(seconds)}
      </span>
    </div>
  );
}
