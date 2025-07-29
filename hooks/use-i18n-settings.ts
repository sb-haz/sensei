'use client';

import { useEffect, useState } from 'react';
// @ts-ignore - react-i18next types issue
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import i18n from '@/lib/i18n';

export const useI18nSettings = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load language from user settings on mount
  useEffect(() => {
    loadLanguageFromDatabase();
  }, []);

  const loadLanguageFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user, try to load from localStorage or default to 'en'
        const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
        await i18nInstance.changeLanguage(savedLanguage);
        setLoading(false);
        return;
      }

      // Load user settings from database
      const { data, error } = await supabase
        .from('user_settings')
        .select('language')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading language from database:', error);
        setLoading(false);
        return;
      }

      if (data?.language) {
        // Update i18n language and localStorage
        await i18nInstance.changeLanguage(data.language);
        localStorage.setItem('i18nextLng', data.language);
      } else {
        // Fallback to browser/localStorage detection
        const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
        await i18nInstance.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error in loadLanguageFromDatabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      // Change language in i18n
      await i18nInstance.changeLanguage(language);
      
      // Save to localStorage
      localStorage.setItem('i18nextLng', language);

      // Save to database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_settings')
          .update({ language })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving language to database:', error);
          // Don't throw error here - language change should still work
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  return {
    t,
    currentLanguage: i18nInstance.language,
    changeLanguage,
    loading,
    availableLanguages: [
      { code: 'en', name: t('languages.en') },
      { code: 'pl', name: t('languages.pl') }
    ]
  };
};
