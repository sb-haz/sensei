interface ControlPanelProps {
    questionCount: number;
    totalQuestions: number;
    isMuted: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    onRepeatQuestion: () => void;
    onSkipQuestion: () => void;
    onMuteToggle: (muted: boolean) => void;
    onEndInterview: () => void;
}

export default function ControlPanel({
    questionCount,
    totalQuestions,
    isMuted,
    videoRef,
    onRepeatQuestion,
    onSkipQuestion,
    onMuteToggle,
    onEndInterview
}: ControlPanelProps) {
    return (
        <div className="w-full md:w-80 bg-card border border-border rounded-2xl p-6">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-primary rounded-full"></div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Interview Controls</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                Question {questionCount}/{totalQuestions}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onRepeatQuestion}
                        className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-all duration-200"
                    >
                        🔄 Repeat Question
                    </button>

                    <button
                        onClick={onSkipQuestion}
                        className="w-full py-3 bg-muted text-foreground hover:bg-muted/80 rounded-xl font-medium transition-all duration-200 border border-border"
                    >
                        ⏭️ Skip Question
                    </button>

                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-accent/30 rounded-xl cursor-pointer group hover:bg-accent/50 transition-all duration-200">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📹</span>
                                <span className="font-medium text-foreground">Camera</span>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked
                                className="accent-primary"
                                onChange={(e) => {
                                    const stream = videoRef.current?.srcObject as MediaStream;
                                    stream?.getVideoTracks().forEach(track => {
                                        track.enabled = e.target.checked;
                                    });
                                }}
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-accent/30 rounded-xl cursor-pointer group hover:bg-accent/50 transition-all duration-200">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">🎤</span>
                                <span className="font-medium text-foreground">Microphone</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={!isMuted}
                                className="accent-primary"
                                onChange={(e) => onMuteToggle(!e.target.checked)}
                            />
                        </label>
                    </div>

                    <button
                        onClick={onEndInterview}
                        className="w-full py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium transition-all duration-200"
                    >
                        🛑 End Interview
                    </button>
                </div>
            </div>
        </div>
    );
}