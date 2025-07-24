'use client';

import InterviewerAvatar from './InterviewerAvatar';

interface InterviewHeaderProps {
    elapsedTime: string;
}

export default function InterviewHeader({ elapsedTime }: InterviewHeaderProps) {
    return (
        <div className="bg-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <InterviewerAvatar />
                <div>
                    <h2 className="text-lg font-semibold text-white">Sarah</h2>
                    <p className="text-gray-300 text-sm">AI Interviewer</p>
                </div>
            </div>
            <div className="text-white text-lg font-mono">{elapsedTime}</div>
        </div>
    );
}
