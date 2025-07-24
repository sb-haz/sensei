interface QuestionAnswerBoxProps {
    currentQuestion: string;
    answer: string;
    loading: boolean;
    onAnswerChange: (answer: string) => void;
    onSubmit: () => void;
    isRecording: boolean;
    isInterviewerSpeaking: boolean;
    onStartRecording: () => void;
}

export default function QuestionAnswerBox({
    currentQuestion,
    answer,
    loading,
    onAnswerChange,
    onSubmit,
    isRecording,
    isInterviewerSpeaking,
    onStartRecording
}: QuestionAnswerBoxProps) {
    return (
        <div className="bg-slate-900 p-4 rounded-lg">
            <div className="bg-gray-800 rounded p-4 mb-4 min-h-[90px]">
                <p className="text-white text-lg">
                    {currentQuestion || 'Loading question...'}
                </p>
            </div>

            <div className="flex gap-2">
                <textarea
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    disabled={loading || !isRecording}
                    className="flex-1 bg-gray-700 text-white rounded p-3 min-h-[70px] resize-none"
                    placeholder={isRecording ? "Speak your answer..." : "Click 'Start Recording' to begin..."}
                />

                {!isRecording ? (
                    <button
                        onClick={onStartRecording}
                        disabled={loading || isInterviewerSpeaking}
                        className="w-auto min-w-[200px] bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={onSubmit}
                        disabled={!answer.trim() || loading}
                        className="w-auto min-w-[200px] bg-indigo-800 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing' : 'Submit'}
                    </button>
                )}
            </div>
        </div>
    );
}
