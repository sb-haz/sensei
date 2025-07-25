-- Delete existing tables if they exist
drop table if exists public.feedback cascade;
drop table if exists public.answers cascade;
drop table if exists public.interviews cascade;
drop table if exists public.interview_templates cascade;

-- Interview templates table
create table public.interview_templates (
 id bigserial primary key,
 name text not null,
 company text, -- Optional: 'Google', 'Meta', 'Amazon', etc.
 role text not null, -- 'Software Engineer', 'Frontend', etc.
 level text not null, -- 'L3', 'E4', 'SDE1', etc.
 difficulty text not null, -- 'Easy', 'Medium', 'Hard'
 topic text not null, -- 'Behavioral', 'Technical', 'System Design', 'Cloud', etc.
 description text,
 duration_minutes integer default 60,
 number_of_questions integer default 5,
 is_default boolean default false, -- true for your base templates
 created_by uuid references public.users(id) on delete cascade, -- null for default templates
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

-- Interviews table (completed interviews) - now includes overall AI feedback
create table public.interviews (
 id bigserial primary key,
 user_id uuid references public.users(id) on delete cascade,
 template_id bigint references public.interview_templates(id) on delete set null,
 status text not null default 'in_progress', -- 'in_progress', 'completed', 'abandoned'
 overall_score integer, -- 1-100 overall interview score
 ai_feedback jsonb, -- Complete AI analysis of the entire interview
 feedback_summary text, -- Human-readable summary
 strengths text[], -- Overall strengths identified
 improvements text[], -- Overall areas for improvement
 started_at timestamptz default now(),
 completed_at timestamptz,
 total_duration_minutes integer,
 created_at timestamptz default now()
);

-- Answers table (individual Q&A pairs without per-question feedback)
create table public.answers (
 id bigserial primary key,
 interview_id bigint references public.interviews(id) on delete cascade,
 question_number integer not null, -- 1, 2, 3, etc.
 question_text text not null, -- AI-generated question
 user_answer text not null,
 created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.interview_templates enable row level security;
alter table public.interviews enable row level security;
alter table public.answers enable row level security;

-- RLS policies for interview_templates
create policy "Anyone can view default templates or own templates" 
on public.interview_templates for select 
using (is_default = true or created_by = auth.uid());

create policy "Users can create their own templates"
on public.interview_templates for insert 
with check (auth.uid() = created_by);

create policy "Users can update their own templates"
on public.interview_templates for update 
using (auth.uid() = created_by);

create policy "Users can delete their own templates"
on public.interview_templates for delete 
using (auth.uid() = created_by);

-- RLS policies for interviews (users can only see their own)
create policy "Users can view own interviews" 
on public.interviews for select 
using (auth.uid() = user_id);

create policy "Users can insert own interviews"
on public.interviews for insert 
with check (auth.uid() = user_id);

create policy "Users can update own interviews"
on public.interviews for update 
using (auth.uid() = user_id);

create policy "Users can delete own interviews"
on public.interviews for delete 
using (auth.uid() = user_id);

-- RLS policies for answers (users can only see their own)
create policy "Users can view own answers" 
on public.answers for select 
using (
 exists (
   select 1 from public.interviews 
   where interviews.id = answers.interview_id 
   and interviews.user_id = auth.uid()
 )
);

create policy "Users can insert own answers"
on public.answers for insert 
with check (
 exists (
   select 1 from public.interviews 
   where interviews.id = answers.interview_id 
   and interviews.user_id = auth.uid()
 )
);

create policy "Users can update own answers"
on public.answers for update 
using (
 exists (
   select 1 from public.interviews 
   where interviews.id = answers.interview_id 
   and interviews.user_id = auth.uid()
 )
);

-- Insert base interview templates
insert into public.interview_templates (
 name, company, role, level, difficulty, topic, description, duration_minutes, number_of_questions, is_default, created_by
) values
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

-- Insert demo interviews for user
insert into public.interviews (
 user_id, template_id, status, overall_score, feedback_summary, strengths, improvements, started_at, completed_at, total_duration_minutes
) values
 ('6de08955-5766-4b1a-bf51-93edbe1bfdc3', 1, 'completed', 75, 'Strong technical foundation with good problem-solving skills. Showed clear understanding of algorithms and data structures. Communication was clear and logical throughout the interview.', 
  ARRAY['Strong algorithmic thinking', 'Clear communication', 'Good problem breakdown'], 
  ARRAY['Could improve on optimization discussions', 'More practice with edge cases'], 
  now() - interval '5 days', now() - interval '5 days' + interval '43 minutes', 43),
 ('6de08955-5766-4b1a-bf51-93edbe1bfdc3', 2, 'completed', 68, 'Good understanding of React concepts and frontend development. Some areas need strengthening, particularly around performance optimization and advanced patterns.', 
  ARRAY['Solid React knowledge', 'Good explaining of concepts', 'Practical experience evident'], 
  ARRAY['Performance optimization techniques', 'Advanced React patterns', 'State management strategies'], 
  now() - interval '2 days', now() - interval '2 days' + interval '58 minutes', 58),
 ('6de08955-5766-4b1a-bf51-93edbe1bfdc3', 9, 'completed', 82, 'Excellent cloud architecture knowledge with strong AWS experience. Demonstrated good understanding of scalability and best practices. Well-rounded answers across all topics.', 
  ARRAY['Comprehensive AWS knowledge', 'Scalability thinking', 'Best practices awareness', 'Clear architecture explanations'], 
  ARRAY['Could mention more about monitoring', 'Disaster recovery planning'], 
  now() - interval '1 day', now() - interval '1 day' + interval '47 minutes', 47);

-- Insert answers for first interview (Google SWE L3)
insert into public.answers (
 interview_id, question_number, question_text, user_answer
) values
 (1, 1, 'Implement a function to reverse a linked list iteratively.', 'I would use three pointers: prev, current, and next. Initialize prev to null, current to head. In a while loop, store next as current.next, set current.next to prev, then move prev to current and current to next. Return prev at the end.'),
 (1, 2, 'Given an array of integers, find two numbers that add up to a target sum.', 'I would use a HashMap to store values and their indices. Iterate through the array, for each element check if target minus current element exists in the map. If yes, return the indices. If not, add current element to map.'),
 (1, 3, 'Explain the difference between stack and heap memory.', 'Stack is used for local variables and function calls, follows LIFO principle. It is fast but limited in size. Heap is used for dynamic memory allocation, larger but slower access. Stack automatically manages memory while heap requires manual management in some languages.'),
 (1, 4, 'How would you detect a cycle in a linked list?', 'I would use Floyd''s cycle detection algorithm with two pointers - slow and fast. Slow moves one step, fast moves two steps. If there''s a cycle, they will eventually meet. If fast reaches null, there''s no cycle.');

-- Insert answers for second interview (Meta Frontend E4)
insert into public.answers (
 interview_id, question_number, question_text, user_answer
) values
 (2, 1, 'Explain the virtual DOM and how React uses it.', 'Virtual DOM is a JavaScript representation of the real DOM. React creates a virtual copy, compares it with the previous version when state changes, calculates the minimum changes needed, and updates only those parts in the real DOM. This makes updates more efficient.'),
 (2, 2, 'What are React hooks and why were they introduced?', 'Hooks are functions that let you use state and lifecycle features in functional components. They were introduced to avoid class component complexity, enable better code reuse through custom hooks, and make components easier to test and understand.'),
 (2, 3, 'How would you optimize a React application for performance?', 'I would use React.memo for component memoization, useMemo and useCallback for expensive calculations, code splitting with lazy loading, optimize bundle size, use proper keys in lists, and avoid unnecessary re-renders by managing state properly.'),
 (2, 4, 'Explain event bubbling and how to handle it in React.', 'Event bubbling means events propagate from target element up to parent elements. In React, you can use event.stopPropagation() to prevent bubbling, or event.preventDefault() to prevent default behavior. React uses SyntheticEvents which wrap native events.'),
 (2, 5, 'What is the difference between controlled and uncontrolled components?', 'Controlled components have their form data handled by React state, where value and onChange are managed by React. Uncontrolled components manage their own state internally, and you access values using refs. Controlled components give you more control and are generally preferred.');

-- Insert answers for third interview (Cloud Engineer AWS)
insert into public.answers (
 interview_id, question_number, question_text, user_answer
) values
 (3, 1, 'Design a scalable web application architecture on AWS.', 'I would use ALB for load balancing, EC2 instances in auto-scaling groups across multiple AZs, RDS with read replicas for database, ElastiCache for caching, S3 for static assets, and CloudFront as CDN. VPC for network isolation and security groups for access control.'),
 (3, 2, 'Explain the difference between horizontal and vertical scaling.', 'Vertical scaling means adding more power to existing machines (CPU, RAM), while horizontal scaling means adding more machines. Horizontal scaling is generally better for cloud applications as it provides better fault tolerance and can handle larger loads, though it''s more complex to implement.'),
 (3, 3, 'How would you implement CI/CD pipeline for a microservices application?', 'I would use CodePipeline with CodeBuild for building Docker images, store them in ECR, use CodeDeploy for deployment to ECS or EKS. Implement automated testing at multiple stages, use feature flags for gradual rollouts, and have monitoring and rollback capabilities. Each microservice should have its own pipeline.'),
 (3, 4, 'What are the benefits of using containers and how do they differ from VMs?', 'Containers share the host OS kernel, making them lightweight and fast to start. VMs include full OS, making them heavier but more isolated. Containers provide better resource utilization, easier deployment, and portability. They''re ideal for microservices and DevOps practices.');
