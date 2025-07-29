'use client'

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserSettings {
  interviewer_gender: 'male' | 'female' | 'neutral';
  interviewer_voice_speed: number;
  theme: 'light' | 'dark';
  language: string;
  auto_save_answers: boolean;
  show_question_timer: boolean;
  difficulty_preference: 'easy' | 'medium' | 'hard' | 'adaptive';
  feedback_detail_level: 'brief' | 'detailed' | 'comprehensive';
}

const defaultSettings: UserSettings = {
  interviewer_gender: 'neutral',
  interviewer_voice_speed: 1.0,
  theme: 'light',
  language: 'en',
  auto_save_answers: true,
  show_question_timer: true,
  difficulty_preference: 'adaptive',
  feedback_detail_level: 'detailed'
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Loading settings for user:', user.id);

      // Use the same pattern as working queries, and let RLS handle the filtering
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      console.log('Settings query result:', { data, error });

      if (error) {
        console.error('Error loading settings:', error);
        setLoading(false);
        return;
      }

      // Check if we have data (should be an array)
      const settingsData = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (settingsData) {
        console.log('Found existing settings:', settingsData);
        setSettings({
          interviewer_gender: settingsData.interviewer_gender,
          interviewer_voice_speed: settingsData.interviewer_voice_speed,
          theme: settingsData.theme,
          language: settingsData.language,
          auto_save_answers: settingsData.auto_save_answers,
          show_question_timer: settingsData.show_question_timer,
          difficulty_preference: settingsData.difficulty_preference,
          feedback_detail_level: settingsData.feedback_detail_level
        });
      } else {
        // No settings found, create default settings for this user
        console.log('No settings found, creating default settings for user');
        await createDefaultSettings(user.id);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async (userId: string) => {
    try {
      console.log('Creating default settings for user:', userId);
      console.log('Default settings to insert:', defaultSettings);
      
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...defaultSettings
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default settings:', error);
      } else {
        console.log('Default settings created successfully:', data);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings({
          interviewer_gender: data.interviewer_gender,
          interviewer_voice_speed: data.interviewer_voice_speed,
          theme: data.theme,
          language: data.language,
          auto_save_answers: data.auto_save_answers,
          show_question_timer: data.show_question_timer,
          difficulty_preference: data.difficulty_preference,
          feedback_detail_level: data.feedback_detail_level
        });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: loadUserSettings };
}
