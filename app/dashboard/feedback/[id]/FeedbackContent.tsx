'use client'

import Link from "next/link";
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';

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
  ai_feedback: Record<string, unknown> | null;
  feedback_summary: string;
  strengths: string[];
  improvements: string[];
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  interview_templates: InterviewTemplate | null;
  answers: AnswerItem[];
}

interface FeedbackContentProps {
  interview: InterviewWithFeedback;
}

export default function FeedbackContent({ interview }: FeedbackContentProps) {
  const { t } = useTranslation();

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
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return colors[difficulty as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {t('feedback.title')}
          </h1>
          <p className="text-muted-foreground">
            {interview.interview_templates?.name || "Interview Feedback"}
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← {t('feedback.backToHistory')}
        </Link>
      </div>

      {/* Overall Score */}
      <div className="bg-card rounded-2xl p-8 border border-border">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('feedback.overallScore')}</h2>
          <div
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold ${getOverallScoreColor(
              interview.overall_score
            )}`}
          >
            {interview.overall_score}%
          </div>
        </div>
      </div>

      {/* Interview Details */}
      <div className="bg-card rounded-2xl p-8 border border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-6">{t('feedback.interviewDetails')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interview.interview_templates && (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('feedback.company')}</label>
                <p className="text-lg font-semibold text-foreground">
                  {interview.interview_templates.company}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('feedback.role')}</label>
                <p className="text-lg font-semibold text-foreground">
                  {interview.interview_templates.role}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('feedback.difficulty')}</label>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(
                    interview.interview_templates.difficulty
                  )}`}
                >
                  {interview.interview_templates.difficulty}
                </span>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('feedback.duration')}</label>
            <p className="text-lg font-semibold text-foreground">
              {interview.total_duration_minutes} {t('feedback.minutes')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('feedback.completedAt')}</label>
            <p className="text-lg font-semibold text-foreground">
              {formatDate(interview.completed_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Summary */}
      {interview.feedback_summary && (
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t('feedback.summary')}</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {interview.feedback_summary}
          </p>
        </div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strengths */}
        {interview.strengths && interview.strengths.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
            <h2 className="text-2xl font-semibold text-green-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                ✓
              </span>
              {t('feedback.strengths')}
            </h2>
            <ul className="space-y-3">
              {interview.strengths.map((strength, index) => (
                <li key={index} className="text-green-800 flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {interview.improvements && interview.improvements.length > 0 && (
          <div className="bg-orange-50 rounded-2xl p-8 border border-orange-200">
            <h2 className="text-2xl font-semibold text-orange-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                ⚡
              </span>
              {t('feedback.improvements')}
            </h2>
            <ul className="space-y-3">
              {interview.improvements.map((improvement, index) => (
                <li key={index} className="text-orange-800 flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Questions and Answers */}
      {interview.answers && interview.answers.length > 0 && (
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t('feedback.questionsAndAnswers')}</h2>
          <div className="space-y-8">
            {interview.answers
              .sort((a, b) => a.question_number - b.question_number)
              .map((answer) => (
                <div
                  key={answer.id}
                  className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t('feedback.question')} {answer.question_number}
                      </h3>
                      <p className="text-muted-foreground">{answer.question_text}</p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-2">{t('feedback.yourAnswer')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {answer.user_answer || "No answer provided"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
