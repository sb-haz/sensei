import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

<<<<<<< HEAD
=======
interface InterviewTemplate {
  name: string;
  company: string;
  role: string;
  level: string;
  difficulty: string;
  topic: string;
}

interface InterviewRaw {
  id: number;
  status: string;
  overall_score: number;
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  interview_templates: InterviewTemplate | InterviewTemplate[] | null;
}

interface Interview {
  id: number;
  status: string;
  overall_score: number;
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  interview_templates: InterviewTemplate | null;
}

>>>>>>> c58e33d9f585021b1060b94cce653f127c797081
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

<<<<<<< HEAD
interface RawInterview {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  overall_score: number | null;
  total_duration_minutes: number | null;
  interview_templates: Array<{
    name: string;
    company: string;
    role: string;
    level: string;
    difficulty: string;
    topic: string;
  }> | {
    name: string;
    company: string;
    role: string;
    level: string;
    difficulty: string;
    topic: string;
  };
}

const interviews =
  interviewsRaw?.map((interview: RawInterview) => ({
=======
const interviews: Interview[] =
  interviewsRaw?.map((interview: InterviewRaw) => ({
>>>>>>> c58e33d9f585021b1060b94cce653f127c797081
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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Interview History
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Review your past interview performances and track your progress
          </p>
        </div>
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          Back to Dashboard
        </Link>
      </div>

      {!interviews || interviews.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">📊</span>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">No interviews yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start practicing with your first mock interview to see your progress here
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200"
            >
              Start First Interview
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold text-foreground">Your Interview Sessions</h2>
          </div>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 gap-4 p-6 bg-muted/50 font-medium text-sm text-muted-foreground border-b border-border">
              <div>Template</div>
              <div>Company</div>
              <div>Role & Level</div>
              <div>Topic</div>
              <div>Status</div>
              <div>Score</div>
              <div>Date</div>
            </div>
            
            <div className="divide-y divide-border">
              {interviews.map((interview) => (
                <Link
                  key={interview.id}
                  href={`/dashboard/feedback/${interview.id}`}
                  className="grid grid-cols-7 gap-4 p-6 hover:bg-accent hover:text-accent-foreground transition-all duration-200 cursor-pointer group"
                >
                  <div>
                    <div className="font-medium text-foreground group-hover:text-accent-foreground">
                      {interview.interview_templates?.name || "Unknown Template"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {interview.interview_templates?.difficulty}
                    </div>
                  </div>
                  
                  <div className="text-foreground group-hover:text-accent-foreground">
                    {interview.interview_templates?.company || "N/A"}
                  </div>
                  
                  <div>
                    <div className="text-foreground group-hover:text-accent-foreground">
                      {interview.interview_templates?.role}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {interview.interview_templates?.level}
                    </div>
                  </div>
                  
                  <div className="text-foreground group-hover:text-accent-foreground">
                    {interview.interview_templates?.topic}
                  </div>
                  
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                      {interview.status.charAt(0).toUpperCase() + interview.status.slice(1).replace("_", " ")}
                    </span>
                  </div>
                  
                  <div>
                    {interview.overall_score ? (
                      <span className={`font-semibold ${getScoreColor(interview.overall_score)}`}>
                        {interview.overall_score}/100
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-foreground group-hover:text-accent-foreground">
                      {formatDate(interview.started_at)}
                    </div>
                    {interview.total_duration_minutes && (
                      <div className="text-sm text-muted-foreground">
                        {interview.total_duration_minutes}m
                      </div>
                    )}
                  </div>
              </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}