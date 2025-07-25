interface InterviewHeaderProps {
    elapsedTime: string;
}

export default function InterviewHeader({ elapsedTime }: InterviewHeaderProps) {
    return (
        <div className="bg-card border-b border-border px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <h1 className="text-xl font-semibold text-foreground">AI Interview Session</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Time:</span>
                <span className="font-mono text-sm font-medium text-foreground bg-muted/30 px-3 py-1 rounded-full">
                    {elapsedTime}
                </span>
            </div>
        </div>
    );
}