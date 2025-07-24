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
        <div className="w-full md:w-80 bg-slate-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="font-medium text-white">Interview Controls</div>
                <div className="flex gap-2 text-xs">
                    <span className="bg-gray-800 text-white px-2 py-1 rounded-full">
                        Q{questionCount}/{totalQuestions}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={onRepeatQuestion}
                    className="w-full py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
                >
                    Repeat Question
                </button>

                <button
                    onClick={onSkipQuestion}
                    className="w-full py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
                >
                    Skip Question
                </button>

                <label className="flex items-center justify-between p-2 bg-gray-800 rounded text-white">
                    <span>Camera</span>
                    <input
                        type="checkbox"
                        defaultChecked
                        onChange={(e) => {
                            const stream = videoRef.current?.srcObject as MediaStream;
                            stream?.getVideoTracks().forEach(track => {
                                track.enabled = e.target.checked;
                            });
                        }}
                    />
                </label>

                <label className="flex items-center justify-between p-2 bg-gray-800 rounded text-white">
                    <span>Microphone</span>
                    <input
                        type="checkbox"
                        checked={!isMuted}
                        onChange={(e) => onMuteToggle(!e.target.checked)}
                    />
                </label>

                <button
                    onClick={onEndInterview}
                    className="w-full py-2 bg-red-600 text-white hover:bg-red-700 rounded"
                >
                    End Interview
                </button>
            </div>
        </div>
    );
}
