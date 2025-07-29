'use client';

// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';
import Link from "next/link";

interface InterviewTemplate {
  name: string;
  company: string;
  role: string;
  level: string;
  difficulty: string;
  topic: string;
}

interface Interview {
  id: number;
  status: string;
  overall_score: number;
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  template: InterviewTemplate | null;
}

interface HistoryContentProps {
  interviews: Interview[];
}

export function HistoryContent({ interviews }: HistoryContentProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('history.completed');
      case 'in_progress':
        return t('history.inProgress');
      default:
        return status;
    }
  };

  if (interviews.length === 0) {
    return (
      <div className="space-y-12">
        {/* Header Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {t('history.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {t('history.noInterviews')}
          </p>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t('history.noInterviews')}
          </h3>
          <p className="text-muted-foreground mb-8">
            {t('history.startFirstInterview')}
          </p>
          <Link
            href="/dashboard"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200"
          >
            {t('dashboard.startNewInterview')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {t('history.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {t('history.performance')}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          {t('dashboard.startNewInterview')}
        </Link>
      </div>

      {/* Interviews Grid */}
      <div className="grid gap-6">
        {interviews.map((interview) => (
          <div
            key={interview.id}
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {interview.template?.name || 'Custom Interview'}
                  </h3>
                  <span className={getStatusBadge(interview.status)}>
                    {getStatusText(interview.status)}
                  </span>
                </div>
                
                {interview.template && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span>{interview.template.company}</span>
                    <span>{interview.template.role}</span>
                    <span>{interview.template.level}</span>
                    <span className="capitalize">{interview.template.difficulty}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>{t('history.date')}: {formatDate(interview.started_at)}</span>
                  <span>{t('history.duration')}: {formatDuration(interview.total_duration_minutes)}</span>
                  {interview.overall_score && (
                    <span>{t('history.score')}: {interview.overall_score}/100</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                {interview.status === 'completed' && (
                  <Link
                    href={`/dashboard/feedback/${interview.id}`}
                    className="px-4 py-2 border border-border text-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                  >
                    {t('history.viewDetails')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
