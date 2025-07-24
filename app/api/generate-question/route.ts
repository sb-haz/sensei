import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('API key not configured');
        }

        const { userDetails, interviewHistory, settings, template } = await request.json();

        const systemPrompt = `You are an experienced technical interviewer conducting a software engineering interview.

Context:
- Candidate: ${userDetails?.name || 'candidate'} 
- Questions Remaining: ${settings.duration - interviewHistory.length}/${settings.duration}
- Template: ${template?.name || 'Software Engineering Interview'}
- Role: ${template?.role || 'Software Engineer'}
- Level: ${template?.level || settings.difficulty}
- Company: ${template?.company || 'Not specified'}
${template?.description ? `- Position Details: ${template.description}` : ''}

Core Rules:
- Ask ONE clear, focused question at a time
- Questions should be technical and role-specific
- Use natural conversational language
- Follow up on interesting points from previous answers
- Adapt question difficulty based on previous answers
- Avoid repeating questions or topics
- Maximum question length: 2-3 sentences
- Use follow-up questions to dig deeper into technical knowledge
- Ask for specific examples and scenarios
- Listen for red flags and inconsistencies

Focus Areas:
1. Technical Skills (40%):
  - Programming languages & frameworks
  - System design & architecture
  - Data structures & algorithms
  - Problem-solving approach
  - Best practices & patterns
  - Testing & debugging
  - Version control & CI/CD
  - Performance optimization

2. Past Experience (30%):
  - Previous projects
  - Technical challenges overcome
  - Team collaboration
  - Code quality & standards
  - Development processes
  - Production issues handled
  - Technical decision making

3. Role-Specific Knowledge (30%):
  - ${template?.role || 'Software engineering'} specific concepts
  - Industry best practices
  - Latest technologies
  - Architecture patterns
  - System scaling
  - Security considerations

Previous Q&A History: ${JSON.stringify(interviewHistory)}

Remember to:
- Ask practical, real-world questions
- Focus on understanding depth of knowledge
- Look for problem-solving ability
- Assess technical communication skills
- Evaluate code quality mindset
- Check system design understanding
- Verify practical experience
  - Allergies awareness (eg what common allergies are and how to handle them)
  - SOPs understanding
  - Example questions: main responsibilities be in your new role as a chef?
  describe the type of restaurant youll be working in?
  key duties of a floor manager in your new job?

3. Professional Profile (10%):
  - Team collaboration
  - Cultural adaptability
  - Career progression
  - Communication skills
  - Example questions: What do you hope to achieve in your new role?
  How does this job align with your career goals?

Interview Flow:
1. Start with experience introduction
2. Verify qualifications match requirements
3. Deep dive into technical knowledge
4. Validate role understanding
5. Assess genuine intention through role knowledge

Follow-up Rules by Difficulty:
Easy: 
- Move on after weak answer
- Basic technical questions
- Light probing

Medium:
- Two attempts for better answer
- Deeper technical scenarios
- Moderate follow-ups

Hard:
- Three attempts max
- Complex technical questions
- In-depth probing

Natural Transitions:
- MAKE SURE YOU USE Use filler words like 'ok', 'so', 'well'... TO SOUND NATURAL
- "Tell me about [duty]..."
- "How would you handle [task]..."
- "Regarding [previous point]..."
- "You mentioned [point], could you..."
- "Let's discuss [new topic]..."

Topic Management:
- Reference previous answers
- Move on after topic sufficiently covered
- Ensure balanced coverage
- Prioritize technical/duty questions
- Adapt depth based on difficulty
- For each interview switch up the order of topics
- Avoid repeating questions
- Randomize question selection

Previous Q&A: ${JSON.stringify(interviewHistory)}`;

        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                temperature: 0.7,
                max_tokens: 1000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: interviewHistory.length === 0
                            ? `Start the technical interview with your first question. Focus on understanding the candidate's technical background and experience.`
                            : 'Generate next interview question'
                    }
                ]
            })
        });

        if (!deepseekResponse.ok) {
            let errorText;
            try {
                const errorData = await deepseekResponse.json();
                errorText = JSON.stringify(errorData);
            } catch {
                errorText = await deepseekResponse.text();
            }
            console.error('Deepseek API error:', {
                status: deepseekResponse.status,
                statusText: deepseekResponse.statusText,
                error: errorText
            });
            throw new Error(`Deepseek API error: ${deepseekResponse.status} - ${errorText}`);
        }

        const data = await deepseekResponse.json();
        
        if (!data.choices?.[0]?.message?.content) {
            console.error('Invalid Deepseek response:', data);
            throw new Error('Invalid response format from Deepseek API');
        }

        return NextResponse.json({ question: data.choices[0].message.content });

    } catch (error: any) {
        console.error('Error in generate-question route:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate question'
        }, { status: 500 });
    }
}
