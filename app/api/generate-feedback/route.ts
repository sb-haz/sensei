import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
    try {
        console.log('Generating feedback...'); // Debugging line

        // Check if the Deepseek API key is configured
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('API key not configured');
        }

        // Parse the request body
        const { userDetails, interviewHistory, settings, interviewId } = await request.json();

        // Debugging: Log the request body
        console.log('Request Body:', {
            userDetails,
            interviewHistory,
            settings,
            interviewId
        });

        // System prompt for generating feedback
        const systemPrompt = `
You are a UK visa interview assessor evaluating candidates for sponsored work visas. 

Context:
- Candidate: ${userDetails?.name || 'candidate'}
- Job Info: ${JSON.stringify(userDetails?.job_info)}
- Difficulty: ${settings.difficulty}
- Transcript: ${JSON.stringify(interviewHistory)}

Core Rules:
- Provide detailed feedback for each question and answer.
- Grade the candidate's responses on a scale of 1 to 10.
- Highlight strengths and areas for improvement.
- Be constructive and professional.

Feedback Format:
You MUST return the feedback as a valid JSON object with the following structure:
{
    "feedback": [
        {
            "question": "What are your main responsibilities in your new role?",
            "answer": "I will be managing the kitchen and ensuring food quality.",
            "feedback": {
                "score": 7,
                "strengths": "Clear understanding of the role.",
                "areas_for_improvement": "Could provide more specific examples of responsibilities.",
                "suggestions": "Mention specific tasks like menu planning, staff training, and inventory management."
            }
        }
    ],
    "overall_feedback": {
        "strengths": "The candidate demonstrated good understanding of their role.",
        "areas_for_improvement": "Responses could include more specific examples.",
        "suggestions": [
            "Practice describing specific tasks and responsibilities in detail.",
            "Focus on technical aspects of the role",
            "Use professional terminology when possible"
        ],
        "final_score": 7
    }
}

Important Notes:
1. The response MUST be a valid JSON object.
2. Do not include any additional text or explanations outside the JSON object.
3. Ensure all keys and values are properly quoted and formatted.
`;

        // Call the Deepseek API to generate feedback
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: 'Generate feedback for the interview transcript. Return ONLY a valid JSON object.'
                    }
                ]
            })
        });

        if (!deepseekResponse.ok) {
            throw new Error(`Deepseek API error: ${deepseekResponse.status}`);
        }

        const data = await deepseekResponse.json();
        const feedbackText = data.choices[0].message.content;

        // Parse the feedback as JSON
        let feedback;
        try {
            feedback = JSON.parse(feedbackText);
        } catch (error) {
            console.error('Failed to parse feedback as JSON:', error);
            throw new Error('Feedback is not in valid JSON format');
        }

        // Validate the feedback structure
        if (!feedback || !feedback.feedback || !Array.isArray(feedback.feedback)) {
            throw new Error('Invalid feedback structure');
        }

        // Initialize the Supabase client
        const supabase = createClient();

        // Save the feedback to the database
        const { error } = await supabase
            .from('interviews')
            .update({ feedback: feedback })
            .eq('id', interviewId);

        if (error) {
            throw new Error(`Failed to save feedback: ${error.message}`);
        }

        return NextResponse.json({ feedback });

    } catch (error: any) {
        console.error('Error generating feedback:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate feedback'
        }, { status: 500 });
    }
}
