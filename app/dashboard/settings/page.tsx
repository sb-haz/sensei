'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    interviewer_gender: 'neutral',
    interviewer_voice_speed: 1.0,
    theme: 'light',
    language: 'en',
    auto_save_answers: true,
    show_question_timer: true,
    difficulty_preference: 'adaptive',
    feedback_detail_level: 'detailed'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading settings:', error);
        return;
      }

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
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Interview Settings</h1>
      
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Interviewer Voice Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interviewer Voice</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                Interviewer Gender
              </Label>
              <select
                id="gender"
                value={settings.interviewer_gender}
                onChange={(e) => handleChange('interviewer_gender', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="neutral">Neutral</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="speed" className="text-sm font-medium text-gray-700">
                Voice Speed: {settings.interviewer_voice_speed}x
              </Label>
              <input
                id="speed"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.interviewer_voice_speed}
                onChange={(e) => handleChange('interviewer_voice_speed', parseFloat(e.target.value))}
                className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Interview Preferences */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Preferences</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="difficulty" className="text-sm font-medium text-gray-700">
                Difficulty Preference
              </Label>
              <select
                id="difficulty"
                value={settings.difficulty_preference}
                onChange={(e) => handleChange('difficulty_preference', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="adaptive">Adaptive (Recommended)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Adaptive adjusts difficulty based on your performance
              </p>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                Feedback Detail Level
              </Label>
              <select
                id="feedback"
                value={settings.feedback_detail_level}
                onChange={(e) => handleChange('feedback_detail_level', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="brief">Brief</option>
                <option value="detailed">Detailed (Recommended)</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Interface Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interface Settings</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="theme" className="text-sm font-medium text-gray-700">
                Theme
              </Label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                Language
              </Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Feature Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-save"
                checked={settings.auto_save_answers}
                onCheckedChange={(checked) => handleChange('auto_save_answers', checked)}
              />
              <Label htmlFor="auto-save" className="text-sm font-medium text-gray-700">
                Auto-save answers as you type
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="timer"
                checked={settings.show_question_timer}
                onCheckedChange={(checked) => handleChange('show_question_timer', checked)}
              />
              <Label htmlFor="timer" className="text-sm font-medium text-gray-700">
                Show question timer during interviews
              </Label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveSettings}
            disabled={saving}
            className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
