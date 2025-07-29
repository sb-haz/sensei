import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        console.log('Generating feedback...'); // Debugging line

        // Check if the Deepseek API key is configured
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('API key not configured');
        }

        // Parse the request body
        const { userDetails, interviewHistory, template, interviewId, isEndOfInterview } = await request.json();

        // Debugging: Log the request body
        console.log('Request Body:', {
            userDetails,
            interviewHistory,
            template,
            interviewId,
            isEndOfInterview
        });

        // System prompt for generating feedback
        const systemPrompt = `You are a technical interview assessor providing comprehensive feedback.

Context:
- Candidate: ${userDetails?.name || 'candidate'}
- Role: ${template?.role || 'Software Engineer'}
- Level: ${template?.level || 'Mid-level'}
- Company: ${template?.company || 'Tech Company'}

COMPLETE INTERVIEW ASSESSMENT
Interview History: ${JSON.stringify(interviewHistory)}

Provide comprehensive feedback for the entire interview in the following JSON format:
{
    "overall_score": [number 1-100],
    "feedback_summary": "[2-3 sentence overall assessment]",
    "strengths": ["strength1", "strength2", "strength3"],
    "improvements": ["improvement1", "improvement2", "improvement3"],
    "detailed_analysis": {
        "technical_skills": "[assessment of technical abilities]",
        "communication": "[assessment of communication skills]",
        "problem_solving": "[assessment of problem-solving approach]",
        "interview_performance": "[overall interview performance notes]"
    },
    "recommendations": "[specific advice for improvement]"
}

Focus on providing actionable, constructive feedback that helps the candidate improve.`;

        // Call the Deepseek API to generate feedback
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                temperature: 0.3, // Lower temperature for more consistent JSON output
                max_tokens: 2000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: 'Generate feedback for the interview transcript. Return ONLY a valid JSON object with no additional text or explanations.'
                    }
                ]
            })
        });

        if (!deepseekResponse.ok) {
            throw new Error(`Deepseek API error: ${deepseekResponse.status}`);
        }

        const data = await deepseekResponse.json();
        const feedbackText = data.choices[0].message.content;

        console.log('Raw feedback from AI:', feedbackText); // Debug log

        // Try to extract JSON from the response if it contains extra text
        let cleanedFeedbackText = feedbackText.trim();
        
        // Look for JSON object boundaries
        const jsonStart = cleanedFeedbackText.indexOf('{');
        const jsonEnd = cleanedFeedbackText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            cleanedFeedbackText = cleanedFeedbackText.substring(jsonStart, jsonEnd + 1);
        }

        // Parse the feedback as JSON
        let feedback;
        try {
            feedback = JSON.parse(cleanedFeedbackText);
        } catch (error) {
            console.error('Failed to parse feedback as JSON:', error);
            console.error('Raw feedback text that failed to parse:', feedbackText);
            console.error('Cleaned feedback text that failed to parse:', cleanedFeedbackText);
            throw new Error('Feedback is not in valid JSON format');
        }

        // Validate the feedback structure
        if (!feedback) {
            throw new Error('No feedback generated');
        }

        console.log('Parsed feedback structure:', feedback); // Debug log

        // Initialize the Supabase client
        const supabase = await createClient();

        // Save feedback to interviews table
        if (interviewId) {
            console.log('Updating interview with comprehensive feedback:', interviewId);
            
            const { data: updateResult, error } = await supabase
                .from('interviews')
                .update({ 
                    ai_feedback: feedback,
                    overall_score: feedback.overall_score || null,
                    feedback_summary: feedback.feedback_summary || null,
                    strengths: feedback.strengths || [],
                    improvements: feedback.improvements || []
                })
                .eq('id', interviewId)
                .select(); // Add select to return updated data

            if (error) {
                console.error('Failed to update interview with feedback:', error);
                throw new Error(`Database update failed: ${error.message}`);
            } else {
                console.log('Successfully updated interview with feedback:', updateResult);
            }
        } else {
            console.log('No interviewId provided, skipping database update');
        }
        
        return NextResponse.json({ feedback });

    } catch (error: unknown) {
<<<<<<< HEAD
=======
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback';
>>>>>>> c58e33d9f585021b1060b94cce653f127c797081
        console.error('Error generating feedback:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback';
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
