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
  ai_feedback: any;
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Feedback</h1>
          <p className="text-gray-600 mt-2">Detailed analysis of your performance</p>
        </div>
        <Link
          href="/dashboard/history"
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Back to History
        </Link>
      </div>

      {/* Interview Summary */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Template:</span>
                <p className="text-gray-900">{typedInterview.interview_templates?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Company:</span>
                <p className="text-gray-900">{typedInterview.interview_templates?.company || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Role & Level:</span>
                <p className="text-gray-900">
                  {typedInterview.interview_templates?.role || "N/A"} - {typedInterview.interview_templates?.level || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Topic:</span>
                <p className="text-gray-900">{typedInterview.interview_templates?.topic || "N/A"}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Summary</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Overall Score:</span>
                <p className={`text-2xl font-bold ${getOverallScoreColor(typedInterview.overall_score || 0)}`}>
                  {typedInterview.overall_score || 0}/100
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Duration:</span>
                <p className="text-gray-900">{typedInterview.total_duration_minutes} minutes</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Completed:</span>
                <p className="text-gray-900">{formatDate(typedInterview.completed_at)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Questions Answered:</span>
                <p className="text-gray-900">{typedInterview.answers?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Feedback */}
      {typedInterview.ai_feedback && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overall Interview Feedback</h2>
          
          {typedInterview.feedback_summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{typedInterview.feedback_summary}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            {typedInterview.strengths && typedInterview.strengths.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {typedInterview.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {typedInterview.improvements && typedInterview.improvements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-3">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {typedInterview.improvements.map((improvement: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions and Answers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Interview Questions & Answers</h2>
        {typedInterview.answers?.map((answer: AnswerItem, index: number) => (
          <div key={answer.id} className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Question {answer.question_number}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{answer.question_text}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{answer.user_answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Link
          href="/dashboard"
          className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
        >
          Take Another Interview
        </Link>
        <Link
          href="/dashboard/history"
          className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors"
        >
          View All History
        </Link>
      </div>
    </div>
  );
}