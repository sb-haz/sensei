-- =============================================================================
-- SENSEI INTERVIEW APPLICATION - COMPLETE DATABASE SCHEMA
-- =============================================================================
-- This is the MAIN and ONLY database schema file for the Sensei interview app
-- Contains: Tables, RLS Policies, Triggers, Functions, Sample Data
-- Run this entire file in Supabase SQL Editor to set up the complete database
-- =============================================================================

-- =============================================================================
-- CLEANUP - Remove existing tables and functions
-- =============================================================================
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.interview_templates CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================================
-- TABLE CREATION
-- =============================================================================

-- Users table (profiles linked to auth.users)
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User settings table
CREATE TABLE public.user_settings (
 id bigserial PRIMARY KEY,
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
 interviewer_gender text NOT NULL DEFAULT 'neutral', -- 'male', 'female', 'neutral'
 interviewer_voice_speed real NOT NULL DEFAULT 1.0, -- 0.5 to 2.0
 theme text NOT NULL DEFAULT 'light', -- 'light', 'dark'
 language text NOT NULL DEFAULT 'en', -- 'en', 'pl' (English, Polish)
 auto_save_answers boolean NOT NULL DEFAULT true,
 show_question_timer boolean NOT NULL DEFAULT true,
 difficulty_preference text NOT NULL DEFAULT 'adaptive', -- 'easy', 'medium', 'hard', 'adaptive'
 feedback_detail_level text NOT NULL DEFAULT 'detailed', -- 'brief', 'detailed', 'comprehensive'
 created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

-- Interview templates table
CREATE TABLE public.interview_templates (
 id bigserial PRIMARY KEY,
 name text NOT NULL,
 company text, -- Optional: 'Google', 'Meta', 'Amazon', etc.
 role text NOT NULL, -- 'Software Engineer', 'Frontend', etc.
 level text NOT NULL, -- 'L3', 'E4', 'SDE1', etc.
 difficulty text NOT NULL, -- 'Easy', 'Medium', 'Hard'
 topic text NOT NULL, -- 'Behavioral', 'Technical', 'System Design', 'Cloud', etc.
 description text,
 duration_minutes integer DEFAULT 60,
 number_of_questions integer DEFAULT 5,
 is_default boolean DEFAULT false, -- true for base templates
 created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- null for default templates
 created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

-- Interviews table (completed interviews with overall AI feedback)
CREATE TABLE public.interviews (
 id bigserial PRIMARY KEY,
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 template_id bigint REFERENCES public.interview_templates(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
 overall_score integer, -- 1-100 overall interview score
 ai_feedback jsonb, -- Complete AI analysis of the entire interview
 feedback_summary text, -- Human-readable summary
 strengths text[], -- Overall strengths identified
 improvements text[], -- Overall areas for improvement
 started_at timestamptz DEFAULT now(),
 completed_at timestamptz,
 total_duration_minutes integer,
 created_at timestamptz DEFAULT now()
);

-- Answers table (individual Q&A pairs without per-question feedback)
CREATE TABLE public.answers (
 id bigserial PRIMARY KEY,
 interview_id bigint REFERENCES public.interviews(id) ON DELETE CASCADE,
 question_number integer NOT NULL, -- 1, 2, 3, etc.
 question_text text NOT NULL, -- AI-generated question
 user_answer text NOT NULL,
 created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- RLS policies for user_settings (users can only see their own)
CREATE POLICY "Users can view own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
ON public.user_settings FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for interview_templates
CREATE POLICY "Anyone can view default templates or own templates" 
ON public.interview_templates FOR SELECT 
USING (is_default = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
ON public.interview_templates FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
ON public.interview_templates FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
ON public.interview_templates FOR DELETE 
USING (auth.uid() = created_by);

-- RLS policies for interviews (users can only see their own)
CREATE POLICY "Users can view own interviews" 
ON public.interviews FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
ON public.interviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
ON public.interviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews"
ON public.interviews FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for answers (users can only see their own)
CREATE POLICY "Users can view own answers" 
ON public.answers FOR SELECT 
USING (
 EXISTS (
   SELECT 1 FROM public.interviews 
   WHERE interviews.id = answers.interview_id 
   AND interviews.user_id = auth.uid()
 )
);

CREATE POLICY "Users can insert own answers"
ON public.answers FOR INSERT 
WITH CHECK (
 EXISTS (
   SELECT 1 FROM public.interviews 
   WHERE interviews.id = answers.interview_id 
   AND interviews.user_id = auth.uid()
 )
);

CREATE POLICY "Users can update own answers"
ON public.answers FOR UPDATE 
USING (
 EXISTS (
   SELECT 1 FROM public.interviews 
   WHERE interviews.id = answers.interview_id 
   AND interviews.user_id = auth.uid()
 )
);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Trigger function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Insert default user settings
  INSERT INTO public.user_settings (
    user_id,
    interviewer_gender,
    interviewer_voice_speed,
    theme,
    language,
    auto_save_answers,
    show_question_timer,
    difficulty_preference,
    feedback_detail_level
  ) VALUES (
    NEW.id,
    'neutral',
    1.0,
    'light',
    'en',
    true,
    true,
    'adaptive',
    'detailed'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile and settings
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- SAMPLE DATA - Interview Templates
-- =============================================================================

-- Insert base interview templates
INSERT INTO public.interview_templates (
 name, company, role, level, difficulty, topic, description, duration_minutes, number_of_questions, is_default, created_by
) VALUES
 ('Google Software Engineer L3', 'Google', 'Software Engineer', 'L3', 'Medium', 'Technical', 'Standard Google SWE interview focusing on algorithms and data structures', 45, 4, true, null),
 ('Meta Frontend Engineer E4', 'Meta', 'Frontend Engineer', 'E4', 'Medium', 'Technical', 'React, JavaScript, and frontend system design questions', 60, 5, true, null),
 ('Amazon SDE1 Behavioral', 'Amazon', 'Software Engineer', 'SDE1', 'Easy', 'Behavioral', 'Leadership principles and behavioral questions for entry level', 30, 6, true, null),
 ('Microsoft Senior SDE', 'Microsoft', 'Software Engineer', 'Senior', 'Hard', 'System Design', 'Large scale system design and architecture questions', 90, 3, true, null),
 ('Apple iOS Engineer', 'Apple', 'iOS Engineer', 'ICT4', 'Medium', 'Technical', 'Swift, iOS frameworks, and mobile development', 45, 4, true, null),
 ('Netflix Backend Engineer', 'Netflix', 'Backend Engineer', 'Senior', 'Hard', 'Technical', 'Distributed systems, microservices, and scalability', 60, 4, true, null),
 ('Startup CTO Interview', null, 'CTO', 'Executive', 'Hard', 'Behavioral', 'Leadership, vision, and technical strategy questions', 75, 5, true, null),
 ('Junior Developer Basics', null, 'Software Engineer', 'Junior', 'Easy', 'Technical', 'Fundamental programming concepts and basic algorithms', 30, 5, true, null),
 ('Cloud Engineer AWS', null, 'Cloud Engineer', 'Mid-level', 'Medium', 'Cloud', 'AWS services, infrastructure, and DevOps practices', 50, 4, true, null),
 ('Data Scientist ML Focus', null, 'Data Scientist', 'Senior', 'Hard', 'Technical', 'Machine learning algorithms, statistics, and data analysis', 60, 4, true, null);
