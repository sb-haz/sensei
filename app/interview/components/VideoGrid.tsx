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
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
            {/* Interviewer Panel */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden h-[280px] flex items-center justify-center">
                {interviewerAvatar && !avatarError ? (
                    <>
                        <img 
                            src={interviewerAvatar}
                            alt="AI Interviewer"
                            className="w-full h-full object-cover"
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

            {/* Candidate Panel */}
            <div className="relative bg-card border border-border rounded-2xl h-[280px] overflow-hidden">
                <video
                    key="candidate-video"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-white font-medium">You</p>
                    </div>
                </div>
                {/* No video fallback */}
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground" style={{ display: 'none' }}>
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <span className="text-2xl">👤</span>
                        </div>
                        <p className="text-sm">Camera not available</p>
                    </div>
                </div>
            </div>
        </div>
    );
}