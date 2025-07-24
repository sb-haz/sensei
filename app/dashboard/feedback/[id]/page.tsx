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

interface FeedbackItem {
  id: number;
  question_text: string;
  user_answer: string;
  ai_feedback: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

interface InterviewWithFeedback {
  id: number;
  status: string;
  overall_score: number;
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  interview_templates: InterviewTemplate | null;
  feedback: FeedbackItem[];
}

export default async function FeedbackPage({ params }: { params: { id: string } }) {
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
      started_at,
      completed_at,
      total_duration_minutes,
      interview_templates:interview_templates!interviews_interview_templates_fkey (
        name,
        company,
        role,
        level,
        difficulty,
        topic
      ),
      feedback (
        id,
        question_text,
        user_answer,
        ai_feedback,
        score,
        strengths,
        improvements
      )
    `)
    .eq("id", params.id)
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
    feedback: interview.feedback || [],
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
                <p className="text-gray-900">{typedInterview.feedback?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Question-by-Question Feedback</h2>
        {typedInterview.feedback?.map((item, index) => (
          <div key={item.id} className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Question {index + 1}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(item.score)}`}>
                {item.score}/10
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{item.question_text}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Your Answer:</h4>
                <p className="text-gray-900 bg-blue-50 p-3 rounded-md">{item.user_answer}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">AI Feedback:</h4>
                <p className="text-gray-900 bg-green-50 p-3 rounded-md">{item.ai_feedback}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Strengths:</h4>
                  <ul className="space-y-1">
                    {item.strengths?.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Areas for Improvement:</h4>
                  <ul className="space-y-1">
                    {item.improvements?.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
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