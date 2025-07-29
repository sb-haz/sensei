'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TemplatesList from './TemplatesList';

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

export function Hero() {
  const [templates, setTemplates] = useState<InterviewTemplate[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      const supabase = createClient();
      const { data } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('is_default', true);
      
      setTemplates(data);
      setLoading(false);
    }

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-16 items-center">
        <h1>HERO</h1>
        <div>Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 items-center">
      <h1>HERO</h1>
      <TemplatesList templates={templates} />
    </div>
  );
}