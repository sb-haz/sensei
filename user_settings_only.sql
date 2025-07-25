-- Create just the user_settings table with RLS policies
-- Run this in Supabase SQL Editor

-- Create user_settings table
create table if not exists public.user_settings (
 id bigserial primary key,
 user_id uuid references auth.users(id) on delete cascade unique,
 interviewer_gender text not null default 'neutral', -- 'male', 'female', 'neutral'
 interviewer_voice_speed real not null default 1.0, -- 0.5 to 2.0
 theme text not null default 'light', -- 'light', 'dark'
 language text not null default 'en', -- 'en', 'pl' (English, Polish)
 auto_save_answers boolean not null default true,
 show_question_timer boolean not null default true,
 difficulty_preference text not null default 'adaptive', -- 'easy', 'medium', 'hard', 'adaptive'
 feedback_detail_level text not null default 'detailed', -- 'brief', 'detailed', 'comprehensive'
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- RLS policies for user_settings (users can only see their own)
create policy "Users can view own settings" 
on public.user_settings for select 
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings for insert 
with check (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings for update 
using (auth.uid() = user_id);

create policy "Users can delete own settings"
on public.user_settings for delete 
using (auth.uid() = user_id);
