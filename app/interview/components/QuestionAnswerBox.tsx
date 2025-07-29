import QuestionTimer from './QuestionTimer';

interface QuestionAnswerBoxProps {
    currentQuestion: string;
    answer: string;
    loading: boolean;
    onAnswerChange: (answer: string) => void;
    onSubmit: () => void;
    isRecording: boolean;
    isInterviewerSpeaking: boolean;
    onStartRecording: () => void;
    showTimer?: boolean;
    questionNumber?: number;
}

export default function QuestionAnswerBox({
    currentQuestion,
    answer,
    loading,
    onAnswerChange,
    onSubmit,
    isRecording,
    isInterviewerSpeaking,
    onStartRecording,
    showTimer = false,
    questionNumber = 0
}: QuestionAnswerBoxProps) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-primary rounded-full"></div>
                        <h3 className="text-xl font-semibold text-foreground">Current Question</h3>
                    </div>
                    
                    <div className="bg-muted/30 rounded-xl p-6 min-h-[100px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-card/80 flex items-center justify-center rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-foreground">Loading question...</span>
                                </div>
                            </div>
                        )}
                        <p className="text-foreground text-lg leading-relaxed">
                            {currentQuestion}
                        </p>
                    </div>
                </div>

                {showTimer && (
                    <div className="flex justify-center">
                        <QuestionTimer
                            show={!loading && currentQuestion !== ''}
                            resetTrigger={questionNumber}
                        />
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-primary rounded-full"></div>
                        <h3 className="text-xl font-semibold text-foreground">Your Answer</h3>
                    </div>
                    
                    <div className="flex gap-4">
                        <textarea
                            value={answer}
                            onChange={(e) => onAnswerChange(e.target.value)}
                            disabled={loading || !isRecording}
                            className="flex-1 bg-background border border-border rounded-xl p-4 min-h-[100px] resize-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            placeholder={isRecording ? "Speak your answer..." : "Click 'Start Recording' to begin..."}
                        />

                        {!isRecording ? (
                            <button
                                onClick={onStartRecording}
                                disabled={loading || isInterviewerSpeaking}
                                className="w-auto min-w-[180px] bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium transition-all duration-200"
                            >
                                🎤 Start Recording
                            </button>
                        ) : (
                            <button
                                onClick={onSubmit}
                                disabled={!answer.trim() || loading}
                                className="w-auto min-w-[180px] bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 font-medium transition-all duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                        Processing
                                    </span>
                                ) : (
                                    '📤 Submit'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}