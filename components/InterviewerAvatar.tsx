'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export default function InterviewerAvatar() {
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchAvatar = async () => {
            try {
                // Fetch a female avatar since our interviewer is named Sarah
                const response = await fetch('https://randomuser.me/api/?gender=female');
                const data = await response.json();
                if (data.results?.[0]?.picture?.large) {
                    setAvatarUrl(data.results[0].picture.large);
                }
            } catch (error) {
                console.error('Failed to fetch avatar:', error);
                setError(true);
            }
        };

        fetchAvatar();
    }, []);

    if (error) {
        return (
            <Avatar className="h-12 w-12">
                <AvatarFallback>SA</AvatarFallback>
            </Avatar>
        );
    }

    return (
        <Avatar className="h-12 w-12">
            {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Sarah (AI Interviewer)" />
            ) : (
                <AvatarFallback>SA</AvatarFallback>
            )}
        </Avatar>
    );
}
