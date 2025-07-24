import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Interview {
  id: number;
  status: string;
  overall_score: number;
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  interview_templates: {
    name: string;
    company: string;
    role: string;
    level: string;
    difficulty: string;
    topic: string;
  } | null;
}

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: interviewsRaw, error: interviewsError } = await supabase
  .from("interviews")
  .select(`
    id,
    status,
    overall_score,
    started_at,
    completed_at,
    total_duration_minutes,
    interview_templates (
      name,
      company,
      role,
      level,
      difficulty,
      topic
    )
  `)
  .order("started_at", { ascending: false });

const interviews =
  interviewsRaw?.map((interview: any) => ({
    ...interview,
    interview_templates: Array.isArray(interview.interview_templates)
      ? interview.interview_templates[0] || null
      : interview.interview_templates,
  })) || [];

  if (interviewsError) {
    console.error("Error fetching interviews:", interviewsError);
    return <div>Error loading interview history</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "abandoned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
          <p className="text-gray-600 mt-2">Review your past interview performances</p>
        </div>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {!interviews || interviews.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
          <p className="text-gray-600 mb-6">Start practicing with your first mock interview</p>
          <Link
            href="/dashboard"
            className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            Start First Interview
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 font-medium text-sm text-gray-700 border-b">
            <div>Template</div>
            <div>Company</div>
            <div>Role & Level</div>
            <div>Topic</div>
            <div>Status</div>
            <div>Score</div>
            <div>Date</div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {interviews.map((interview: Interview) => (
              <Link
                key={interview.id}
                href={`/dashboard/feedback/${interview.id}`}
                className="grid grid-cols-7 gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {interview.interview_templates?.name || "Unknown Template"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {interview.interview_templates?.difficulty}
                  </div>
                </div>
                
                <div className="text-gray-900">
                  {interview.interview_templates?.company || "N/A"}
                </div>
                
                <div>
                  <div className="text-gray-900">
                    {interview.interview_templates?.role}
                  </div>
                  <div className="text-sm text-gray-500">
                    {interview.interview_templates?.level}
                  </div>
                </div>
                
                <div className="text-gray-900">
                  {interview.interview_templates?.topic}
                </div>
                
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1).replace("_", " ")}
                  </span>
                </div>
                
                <div>
                  {interview.overall_score ? (
                    <span className={`font-semibold ${getScoreColor(interview.overall_score)}`}>
                      {interview.overall_score}/100
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                
                <div>
                  <div className="text-gray-900">
                    {formatDate(interview.started_at)}
                  </div>
                  {interview.total_duration_minutes && (
                    <div className="text-sm text-gray-500">
                      {interview.total_duration_minutes}m
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}