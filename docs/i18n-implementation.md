# Sensei i18n Implementation

This document describes the internationalization (i18n) implementation for Sensei using react-i18next.

## Features

- **Multi-language support**: English (en) and Polish (pl)
- **Database integration**: Language preference is stored in user settings
- **Session persistence**: Language preference persists across sessions
- **Real-time switching**: Language changes apply immediately without page reload
- **Fallback handling**: Falls back to English if translations are missing

## How It Works

### 1. Language Storage & Loading
- Language preference is stored in the `user_settings` table in Supabase
- On app load, the system:
  1. Checks if user is authenticated
  2. If authenticated: loads language from database
  3. If not authenticated: uses localStorage or browser language
  4. Falls back to English if no preference found

### 2. Language Switching
- Users can change language in Settings page or via LanguageSwitcher component
- Changes are:
  1. Applied immediately to the UI
  2. Saved to localStorage
  3. Saved to database (if user is authenticated)

### 3. Component Integration
- Use `useTranslation()` hook in components
- Use `useI18nSettings()` for full i18n management
- Translation keys follow nested structure: `t('section.key')`

## Usage Examples

### Basic Translation
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <h1>{t('auth.welcomeBack')}</h1>
  );
}
```

### Full i18n Management
```tsx
import { useI18nSettings } from '@/hooks/use-i18n-settings';

function LanguageSettings() {
  const { t, currentLanguage, changeLanguage, availableLanguages } = useI18nSettings();
  
  return (
    <select 
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {availableLanguages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### Language Switcher Component
```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function Navbar() {
  return (
    <nav>
      {/* other content */}
      <LanguageSwitcher />
    </nav>
  );
}
```

## Translation Structure

Translations are organized in nested objects:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "settings": "Settings"
  },
  "auth": {
    "welcomeBack": "Welcome back",
    "signIn": "Sign In"
  },
  "settings": {
    "title": "Settings",
    "language": "Language"
  }
}
```

## Adding New Languages

1. Add translations to `lib/i18n.ts` in the `resources` object
2. Update the `availableLanguages` array in `useI18nSettings` hook
3. Update database schema if needed (currently supports any language code)

## Files Modified/Created

### Core i18n Files
- `lib/i18n.ts` - Main i18n configuration
- `hooks/use-i18n-settings.ts` - Custom hook for i18n + database integration
- `components/I18nProvider.tsx` - Provider component for i18n
- `components/LanguageSwitcher.tsx` - Reusable language switcher

### Updated Components
- `app/layout.tsx` - Added I18nProvider wrapper
- `app/dashboard/settings/page.tsx` - Updated to use translations
- `components/Sidebar.tsx` - Navigation items translated
- `components/login-form.tsx` - Form labels translated
- `components/ClientNavbar.tsx` - Added language switcher

### Translation Files
- `locales/en/common.json` - English translations
- `locales/pl/common.json` - Polish translations

## Database Schema

The language preference is stored in the `user_settings` table:

```sql
CREATE TABLE public.user_settings (
  -- other fields...
  language text NOT NULL DEFAULT 'en', -- 'en', 'pl' etc.
  -- other fields...
);
```

## Best Practices

1. **Always use translation keys**: Never hard-code text in components
2. **Organize translations logically**: Group related translations together
3. **Provide fallbacks**: Always have English translations for all keys
4. **Test language switching**: Ensure all UI elements update correctly
5. **Consider pluralization**: Use i18next pluralization for count-dependent text

## Troubleshooting

### Language not changing
- Check browser console for errors
- Verify user is authenticated for database saves
- Check localStorage for `i18nextLng` key

### Missing translations
- Check translation files for the key
- Ensure key path is correct (e.g., `settings.title` not `settings/title`)
- Verify fallback language (English) has the translation

### TypeScript errors
- Translation imports use `@ts-ignore` due to Next.js/i18next type conflicts
- This is normal and doesn't affect functionality
