import { RefObject, useEffect, useState } from 'react';

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

    return (
        <div className={`grid grid-cols-2 gap-3 bg-gray-900 rounded-lg p-2 ${className}`}>
            {/* Interviewer Panel */}
            <div className="relative bg-[#3b3a39] rounded-lg overflow-hidden h-[240px] flex items-center justify-center">
                {interviewerAvatar && !avatarError ? (
                    <>
                        <img 
                            src={interviewerAvatar} 
                            alt="AI Interviewer"
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                        />
                        <div className="absolute inset-0 bg-black/20" />
                    </>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-semibold">
                        SA
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                    <p className="text-white text-sm">Sarah (AI Interviewer)</p>
                </div>
            </div>

            {/* Candidate Panel */}
            <div className="relative bg-gray-950 rounded-lg h-[240px]">
                <video
                    key="candidate-video"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                    <p className="text-white text-sm">You</p>
                </div>
            </div>
        </div>
    );
}
