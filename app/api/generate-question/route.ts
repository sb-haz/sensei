import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('API key not configured');
        }

        const { userDetails, interviewHistory, settings } = await request.json();

        const systemPrompt =
            `You are a UK visa interview assessor evaluating candidates for sponsored work visas. 

Context:
- Candidate: ${userDetails?.name || 'candidate'} 
- Questions: ${settings.duration - interviewHistory.length}/${settings.duration}
- Difficulty: ${settings.difficulty}
- Job Info: ${JSON.stringify(userDetails?.job_info)}
- Read the full entire prompt before starting

Core Rules:
- NO visa/immigration questions
- NO advice/feedback
- NO answering candidate questions
- Questions under 15 words
- After ${settings.duration} questions, end interview with thanks
- Maximum 1 question at once
- Use natural language
- Avoid repeating questions
- Read ALL previous Q&A and use them to guide questions
- Dont reuse same connecting phrase twice in a row like "okay" or "so"

Focus Areas:
1. Previous Experience (20%):
  - Past role duties
  - Technical skills used
  - Systems/equipment used
  - Key achievements
  - Years of experience
  - Example questions: - roles have you held in the hospitality industry?
  describe your previous work experience as a chef?
  roles have you held in the hospitality industry?
  number of experience do you have as a floor manager?

2. Job Role (70%):
  - Detailed duties validation
  - Technical knowledge testing
  - Role-specific scenarios 
  - Equipment/systems expertise
  - Health & safety protocols (especially UK standards)
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

        const deepseekResponse = await fetch('https://api.deepseek.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat-33b',
                temperature: 0.7,
                max_tokens: 1000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: interviewHistory.length === 0
                            ? `Introduce yourself as Sarah (an AI interviewer) and greet ${userDetails?.name || 'the candidate'}. Ask if they're ready to start.`
                            : 'Generate next interview question'
                    }
                ]
            })
        });

        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
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
