import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/error-handling';
import { validateServiceConfig } from '@/lib/config';

export async function POST(request: Request) {
    return withErrorHandling(async () => {
        if (!validateServiceConfig('deepseek')) {
            throw new Error('API key not configured');
        }

        const { userDetails, interviewHistory, settings, template } = await request.json();

        // Get user preference for interviewer gender
        const interviewerName = settings?.interviewer_gender === 'female' ? 'Alexandra' : 
                               settings?.interviewer_gender === 'male' ? 'Alexander' : 'Alex';

        const systemPrompt = `You are an experienced technical interviewer conducting a software engineering interview. Act as a friendly yet professional interviewer who builds rapport while maintaining high technical standards.

Context:
Interview Setup:
- Interviewer: ${interviewerName}
- Candidate: ${userDetails?.name || 'there'}
- Progress: Question ${interviewHistory.length + 1} of ${template?.number_of_questions || 4}
- Duration: ${template?.duration_minutes || 60} minutes planned
- Questions: ${template?.number_of_questions || 4} total questions

Position Details:
- Company: ${template?.company || 'Not specified'}
- Role: ${template?.role || 'Software Engineer'}
- Level: ${template?.level || 'Not specified'}
- Interview Type: ${template?.topic || 'Technical'}
- Difficulty: ${template?.difficulty || 'Medium'}
- Template Name: ${template?.name || 'Software Engineering Interview'}

${template?.description ? `Position Description:\n${template.description}\n` : ''}
${template?.level ? `Level Context: Adjust questions based on ${template.level} seniority.\n` : ''}
${template?.company ? `Company Context: This is a ${template.company} interview.\n` : ''}

Interview Personality:
- Be warm and welcoming, especially at the start
- Use casual yet professional language
- Show active listening by referencing previous answers
- Use conversational transitions
- Express genuine interest in candidate's experiences
- Acknowledge good answers with positive feedback
- Guide candidates when they struggle without being dismissive

Core Rules:
- First message should always introduce yourself and set expectations
- Ask ONE clear, focused question at a time - MAXIMUM 10 WORDS
- Questions should flow naturally from previous answers
- Use follow-up questions based on actual responses
- Adapt question difficulty based on candidate's performance
- Avoid repeating topics unless clarification is needed
- Keep questions EXTREMELY concise and clear - NO MORE THAN 10 WORDS
- Mix technical and behavioral questions appropriately
- Listen for opportunities to deep dive into interesting points

QUESTION LENGTH RULE: ALL QUESTIONS MUST BE MAXIMUM 10 WORDS. NO EXCEPTIONS.

Examples of good questions:
- "What programming languages do you use?"
- "Tell me about your current role."
- "How do you handle debugging?"
- "What's your biggest technical challenge?"
- "Describe your ideal work environment."

Question Categories:
1. Experience (3-4 words): "Your background in Python?"
2. Technical (5-6 words): "How do you optimize database queries?"
3. Problem-solving (4-5 words): "Biggest coding challenge you solved?"
4. Role-specific (6-8 words): "Why do you want this position?"

Previous Q&A History: ${JSON.stringify(interviewHistory)}

CRITICAL REMINDER: Every single question must be 10 words or fewer. Be extremely concise.

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
                max_tokens: 150,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: interviewHistory.length === 0
                            ? `Start the interview with this exact format:
1. Greet appropriately - use name if provided, otherwise say "Hi there"
2. Introduce yourself as ${interviewerName}
3. Specify that this is a ${template?.topic || 'technical'} interview${template?.company ? ` for ${template?.company}` : ''}
4. Mention the role (${template?.role || 'Software Engineer'}) and level (${template?.level || 'not specified'})
5. Ask your first question in MAXIMUM 10 words

Example format: "Hi ${userDetails?.name || 'there'}! I'm ${interviewerName}, and I'll be conducting your [topic] interview${template?.company ? ` for ${template?.company}` : ''} today. We'll be focusing on the [role] ([level]) position. [Very short first question - max 10 words]"

CRITICAL: Questions must be EXTREMELY short - maximum 10 words. No long explanations.`
                            : `Continue as ${interviewerName}. Ask your next question based on their previous answer. Questions must be EXTREMELY short - maximum 10 words. No long explanations or context.`
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
            logger.error('Invalid Deepseek response:', data);
            throw new Error('Invalid response format from Deepseek API');
        }

        return NextResponse.json({ question: data.choices[0].message.content });
    }, 'generate-question')();
}
