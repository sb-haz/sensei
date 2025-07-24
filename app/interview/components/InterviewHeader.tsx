interface InterviewHeaderProps {
    elapsedTime: string;
}

export default function InterviewHeader({ elapsedTime }: InterviewHeaderProps) {
    return (
        <div className="bg-slate-900 text-white px-2 md:px-4 py-2 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <h1 className="font-semibold">AI Interview Session</h1>
            </div>
            <div className="text-sm">
                <span>{elapsedTime}</span>
            </div>
        </div>
    );
}
