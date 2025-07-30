import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: settings, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching user settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        // Return default settings if none found
        const defaultSettings = {
            interviewer_gender: 'neutral',
            interviewer_voice_speed: 1.0,
            theme: 'light',
            language: 'en',
            auto_save_answers: true,
            show_question_timer: true,
            difficulty_preference: 'adaptive',
            feedback_detail_level: 'detailed'
        };

        return NextResponse.json(settings || defaultSettings);

    } catch (error: unknown) {
        console.error('Error in user-settings route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user settings';
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
