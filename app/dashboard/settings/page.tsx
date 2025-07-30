'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18nSettings } from '@/hooks/use-i18n-settings';

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
  const { t, changeLanguage, currentLanguage, availableLanguages } = useI18nSettings();
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

  const loadSettings = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sync local settings with current i18n language
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      language: currentLanguage
    }));
  }, [currentLanguage]);

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
        }, {
          onConflict: 'user_id'
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

  const handleChange = async (key: keyof UserSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Handle language change immediately
    if (key === 'language' && typeof value === 'string') {
      try {
        await changeLanguage(value);
      } catch (error) {
        console.error('Error changing language:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-8">
          <div>
            <div className="h-10 bg-muted rounded w-1/3 mb-3"></div>
            <div className="h-6 bg-muted rounded w-2/3"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-muted rounded-2xl"></div>
            <div className="h-32 bg-muted rounded-2xl"></div>
            <div className="h-32 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('settings.title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {t('settings.description')}
        </p>
      </div>
      
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Interviewer Voice Settings */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold text-foreground">{t('settings.interviewerVoice')}</h2>
          </div>
          
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="gender" className="text-sm font-medium text-foreground">
                  {t('settings.interviewerGender')}
                </label>
                <select
                  id="gender"
                  value={settings.interviewer_gender}
                  onChange={(e) => handleChange('interviewer_gender', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  <option value="neutral">{t('settings.genderOptions.neutral')}</option>
                  <option value="male">{t('settings.genderOptions.male')}</option>
                  <option value="female">{t('settings.genderOptions.female')}</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label htmlFor="speed" className="text-sm font-medium text-foreground">
                  {t('settings.voiceSpeed')}: {settings.interviewer_voice_speed}x
                </label>
                <input
                  id="speed"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.interviewer_voice_speed}
                  onChange={(e) => handleChange('interviewer_voice_speed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x ({t('settings.slow')})</span>
                  <span>1.0x ({t('settings.normal')})</span>
                  <span>2.0x ({t('settings.fast')})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Preferences */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold text-foreground">{t('settings.interviewPreferences')}</h2>
          </div>
          
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="difficulty" className="text-sm font-medium text-foreground">
                  {t('settings.difficultyPreference')}
                </label>
                <select
                  id="difficulty"
                  value={settings.difficulty_preference}
                  onChange={(e) => handleChange('difficulty_preference', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  <option value="adaptive">{t('settings.adaptive')}</option>
                  <option value="easy">{t('settings.easy')}</option>
                  <option value="medium">{t('settings.medium')}</option>
                  <option value="hard">{t('settings.hard')}</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {t('settings.adaptiveDescription')}
                </p>
              </div>

              <div className="space-y-3">
                <label htmlFor="feedback" className="text-sm font-medium text-foreground">
                  {t('settings.feedbackDetailLevel')}
                </label>
                <select
                  id="feedback"
                  value={settings.feedback_detail_level}
                  onChange={(e) => handleChange('feedback_detail_level', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  <option value="brief">{t('settings.brief')}</option>
                  <option value="detailed">{t('settings.detailed')}</option>
                  <option value="comprehensive">{t('settings.comprehensive')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Interface Settings */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold text-foreground">{t('settings.interfaceSettings')}</h2>
          </div>
          
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="theme" className="text-sm font-medium text-foreground">
                  {t('settings.theme')}
                </label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  <option value="light">{t('settings.light')}</option>
                  <option value="dark">{t('settings.dark')}</option>
                </select>
              </div>

              <div className="space-y-3">
                <label htmlFor="language" className="text-sm font-medium text-foreground">
                  {t('settings.language')}
                </label>
                <select
                  id="language"
                  value={currentLanguage}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold text-foreground">{t('settings.features')}</h2>
          </div>
          
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Checkbox
                  id="auto-save"
                  checked={settings.auto_save_answers}
                  onCheckedChange={(checked) => handleChange('auto_save_answers', checked)}
                />
                <label htmlFor="auto-save" className="text-sm font-medium text-foreground cursor-pointer">
                  {t('settings.autoSaveAnswers')}
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <Checkbox
                  id="timer"
                  checked={settings.show_question_timer}
                  onCheckedChange={(checked) => handleChange('show_question_timer', checked)}
                />
                <label htmlFor="timer" className="text-sm font-medium text-foreground cursor-pointer">
                  {t('settings.showQuestionTimer')}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {saving ? t('settings.saving') : t('settings.saveSettings')}
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`text-center p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.includes('Error') ? t('settings.settingsError') : t('settings.settingsSaved')}
          </div>
        )}
      </div>
    </div>
  );
}