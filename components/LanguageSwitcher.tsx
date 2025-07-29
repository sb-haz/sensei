'use client';

import { useCallback } from 'react';
import { useI18nSettings } from '@/hooks/use-i18n-settings';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage, availableLanguages, t } = useI18nSettings();

  const handleLanguageChange = useCallback(async (language: string) => {
    try {
      await changeLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [changeLanguage]);

  return (
    <select
      value={currentLanguage}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className={`
        flex h-9 rounded-full border border-border/30 bg-background px-3 py-1 text-sm font-medium shadow-sm 
        transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
        hover:bg-accent hover:text-accent-foreground cursor-pointer ${className}
      `}
      aria-label={t('settings.language')}
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
