// Azure OpenAI Chat with Avatar Integration
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/error-handling';
import { config, validateServiceConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
    return withErrorHandling(async () => {
        logger.api('Azure Chat API called');

        // Validate Azure OpenAI configuration
        if (!validateServiceConfig('azureOpenAI')) {
            logger.error('Azure OpenAI not configured properly');
            return NextResponse.json(
                { error: 'Azure OpenAI not configured' },
                { status: 500 }
            );
        }

        const { userDetails, interviewHistory, settings, template, userMessage } = await request.json();
        
        logger.api('Request data received:', {
            userDetailsName: userDetails?.name,
            historyLength: interviewHistory?.length,
            templateRole: template?.role,
            userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'undefined'
        });

        const { azureOpenAIEndpoint, azureOpenAIApiKey, azureOpenAIDeploymentName } = config;

        // Get user preference for interviewer gender
        const interviewerName = settings?.interviewer_gender === 'female' ? 'Alexandra' : 
                               settings?.interviewer_gender === 'male' ? 'Alexander' : 'Alex';

        // Create system prompt
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

CRITICAL REMINDER: Every single question must be 10 words or fewer. Be extremely concise.`;

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history
        interviewHistory.forEach((qa: any) => {
            if (qa.question) {
                messages.push({ role: 'assistant', content: qa.question });
            }
            if (qa.answer) {
                messages.push({ role: 'user', content: qa.answer });
            }
        });

        // Add current user message or initialization prompt
        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
        } else if (interviewHistory.length === 0) {
            messages.push({
                role: 'user',
                content: `Start the interview with this exact format:
1. Greet appropriately - use name if provided, otherwise say "Hi there"
2. Introduce yourself as ${interviewerName}
3. Specify that this is a ${template?.topic || 'technical'} interview${template?.company ? ` for ${template?.company}` : ''}
4. Mention the role (${template?.role || 'Software Engineer'}) and level (${template?.level || 'not specified'})
5. Ask your first question in MAXIMUM 10 words

Example format: "Hi ${userDetails?.name || 'there'}! I'm ${interviewerName}, and I'll be conducting your [topic] interview${template?.company ? ` for ${template?.company}` : ''} today. We'll be focusing on the [role] ([level]) position. [Very short first question - max 10 words]"

CRITICAL: Questions must be EXTREMELY short - maximum 10 words. No long explanations.`
            });
        } else {
            messages.push({
                role: 'user',
                content: `Continue as ${interviewerName}. Ask your next question based on their previous answer. Questions must be EXTREMELY short - maximum 10 words. No long explanations or context.`
            });
        }

        logger.api(`Calling Azure OpenAI at ${azureOpenAIEndpoint}`);

        // Construct the URL for Azure OpenAI
        const url = `${azureOpenAIEndpoint}openai/deployments/${azureOpenAIDeploymentName}/chat/completions?api-version=2023-06-01-preview`;
        
        logger.api(`Full URL: ${url}`);

        // Create the streaming response
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'api-key': azureOpenAIApiKey!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        logger.api(`Azure OpenAI response status: ${response.status}`);

        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            logger.error('Azure OpenAI API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
        }

        logger.info('Azure OpenAI streaming response initiated');

        // Return the streaming response directly to the client
        // The client will handle the streaming and avatar integration
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    }, 'azure-chat')();
}
