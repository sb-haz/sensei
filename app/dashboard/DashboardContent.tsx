'use client';

// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';
import TemplatesList from "@/components/TemplatesList";
import Link from "next/link";

interface InterviewTemplate {
    id: number;
    name: string;
    company: string;
    role: string;
    level: string;
    difficulty: string;
    topic: string;
    description: string;
    duration_minutes: number;
    is_default: boolean;
}

interface DashboardContentProps {
  templates: InterviewTemplate[] | null;
}

export function DashboardContent({ templates }: DashboardContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {t('interview.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {t('interview.chooseTemplate')}
          </p>
        </div>
        <Link
          href="/interview"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          {t('interview.startInterview')}
        </Link>
      </div>
      
      {/* Templates Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-primary rounded-full"></div>
          <h2 className="text-3xl font-bold text-foreground">{t('templates.title')}</h2>
        </div>
        
        <TemplatesList templates={templates} />
      </div>
    </div>
  );
}
