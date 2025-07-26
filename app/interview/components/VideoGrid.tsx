import React, { useEffect, useState, RefObject } from 'react';
import Image from 'next/image';

interface VideoGridProps {
    videoRef: RefObject<HTMLVideoElement>;
    className?: string;
}

export default function VideoGrid({ videoRef, className }: VideoGridProps) {
    const [interviewerAvatar, setInterviewerAvatar] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        const fetchAvatar = async () => {
            try {
                const response = await fetch('https://randomuser.me/api/?gender=female');
                const data = await response.json();
                if (data.results?.[0]?.picture?.large) {
                    setInterviewerAvatar(data.results[0].picture.large);
                } else {
                    setAvatarError(true);
                }
            } catch (error) {
                console.error('Failed to fetch avatar:', error);
                setAvatarError(true);
            }
        };

        fetchAvatar();
    }, []);

    // Simple webcam setup
    useEffect(() => {
        const getWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing webcam:', err);
            }
        };

        getWebcam();
    }, [videoRef]);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
            {/* Interviewer Panel */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden h-[280px] flex items-center justify-center">
                {interviewerAvatar && !avatarError ? (
                    <>
                        <Image 
                            src={interviewerAvatar}
                            alt="AI Interviewer"
                            fill
                            className="object-cover"
                            onError={() => setAvatarError(true)}
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-semibold">
                        SA
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-white font-medium">Sarah (AI Interviewer)</p>
                    </div>
                </div>
            </div>

            {/* Candidate Panel - SIMPLE WEBCAM */}
            <div className="relative rounded-2xl h-[280px] overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)', backgroundColor: '#000' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-white font-medium">You</p>
                    </div>
                </div>
            </div>
        </div>
    );
}