import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface InterviewTemplate {
  name: string;
  company: string;
  role: string;
  level: string;
  difficulty: string;
  topic: string;
}

interface AnswerItem {
  id: number;
  question_number: number;
  question_text: string;
  user_answer: string;
}

interface InterviewWithFeedback {
  id: number;
  status: string;
  overall_score: number;
  ai_feedback: Record<string, unknown>;
  feedback_summary: string;
  strengths: string[];
  improvements: string[];
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  interview_templates: InterviewTemplate | null;
  answers: AnswerItem[];
}

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select(`
      id,
      status,
      overall_score,
      ai_feedback,
      feedback_summary,
      strengths,
      improvements,
      started_at,
      completed_at,
      total_duration_minutes,
      interview_templates:template_id (
        name,
        company,
        role,
        level,
        difficulty,
        topic
      ),
      answers (
        id,
        question_number,
        question_text,
        user_answer
      )
    `)
    .eq("id", id)
    .single();

  if (interviewError || !interview) {
    console.error("Interview fetch error:", interviewError, interview);
    redirect("/dashboard/history");
  }

  // Ensure interview_templates is an object, not array
  const typedInterview: InterviewWithFeedback = {
    ...interview,
    interview_templates: Array.isArray(interview.interview_templates)
      ? interview.interview_templates[0] || null
      : interview.interview_templates,
    answers: interview.answers || [],
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOverallScoreColor = (score: number) => {
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
            Interview Feedback
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Detailed analysis of your performance and areas for improvement
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          Back to History
        </Link>
      </div>

      {/* Interview Summary */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-primary rounded-full"></div>
          <h2 className="text-3xl font-bold text-foreground">Interview Summary</h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">Interview Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Template:</span>
                  <p className="text-foreground font-medium">{typedInterview.interview_templates?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Company:</span>
                  <p className="text-foreground font-medium">{typedInterview.interview_templates?.company || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Role & Level:</span>
                  <p className="text-foreground font-medium">
                    {typedInterview.interview_templates?.role || "N/A"} - {typedInterview.interview_templates?.level || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Topic:</span>
                  <p className="text-foreground font-medium">{typedInterview.interview_templates?.topic || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">Performance Summary</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Overall Score:</span>
                  <p className={`text-3xl font-bold ${getOverallScoreColor(typedInterview.overall_score || 0)}`}>
                    {typedInterview.overall_score || 0}/100
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Duration:</span>
                  <p className="text-foreground font-medium">{typedInterview.total_duration_minutes} minutes</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Completed:</span>
                  <p className="text-foreground font-medium">{formatDate(typedInterview.completed_at)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Questions Answered:</span>
                  <p className="text-foreground font-medium">{typedInterview.answers?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Feedback */}
      {typedInterview.ai_feedback && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold text-foreground">AI Analysis</h2>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
            {typedInterview.feedback_summary && (
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Overall Assessment</h3>
                <div className="bg-accent/30 rounded-xl p-6">
                  <p className="text-foreground leading-relaxed">{typedInterview.feedback_summary}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Strengths */}
              {typedInterview.strengths && typedInterview.strengths.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Strengths
                  </h3>
                  <div className="bg-green-50 rounded-xl p-6">
                    <ul className="space-y-3">
                      {typedInterview.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                          <span className="text-green-800 leading-relaxed">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {typedInterview.improvements && typedInterview.improvements.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-amber-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Areas for Improvement
                  </h3>
                  <div className="bg-amber-50 rounded-xl p-6">
                    <ul className="space-y-3">
                      {typedInterview.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></span>
                          <span className="text-amber-800 leading-relaxed">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions and Answers */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-primary rounded-full"></div>
          <h2 className="text-3xl font-bold text-foreground">Questions & Answers</h2>
        </div>

        <div className="space-y-6">
          {typedInterview.answers?.map((answer: AnswerItem) => (
            <div key={answer.id} className="bg-card border border-border rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{answer.question_number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Question {answer.question_number}</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Question:</h4>
                    <div className="bg-muted/30 rounded-xl p-6">
                      <p className="text-foreground leading-relaxed">{answer.question_text}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Your Answer:</h4>
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                      <p className="text-foreground leading-relaxed">{answer.user_answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200"
        >
          Take Another Interview
        </Link>
        <Link
          href="/dashboard/history"
          className="bg-muted text-foreground px-8 py-3 rounded-full font-medium hover:bg-muted/80 transition-all duration-200 border border-border"
        >
          View All History
        </Link>
      </div>
    </div>
  );
}
