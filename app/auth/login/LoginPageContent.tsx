'use client';

// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';
import { LoginForm } from "@/components/login-form";

export function LoginPageContent() {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.welcomeBack')}</h1>
      <p className="text-gray-600">{t('auth.signInContinue')}</p>
      <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <LoginForm />
      </div>
    </div>
  );
}
