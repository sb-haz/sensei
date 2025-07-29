'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: string;
  full_name: string;
  created_at: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [lastSavedName, setLastSavedName] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get email from auth user
      setUserEmail(user.email || '');

      // Get profile from users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1);

      if (error) {
        console.error('Error loading profile:', error);
        setLoading(false);
        return;
      }

      const profileData = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (profileData) {
        setProfile(profileData);
        const name = profileData.full_name || '';
        setFullName(name);
        setLastSavedName(name);
      } else {
        console.error('No profile found for user - this should be created automatically on signup');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  const autoSave = useCallback(async () => {
    if (!profile || saving) return;

    setSaving(true);
    try {
      const trimmedName = fullName.trim();
      const { error } = await supabase
        .from('users')
        .update({
          full_name: trimmedName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        full_name: trimmedName
      });
      setLastSavedName(trimmedName);
    } catch (error) {
      console.error('Error auto-saving profile:', error);
    } finally {
      setSaving(false);
    }
  }, [fullName, profile, saving, supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!profile || fullName === lastSavedName || loading) return;

    const timeoutId = setTimeout(() => {
      autoSave();
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [fullName, profile, lastSavedName, loading, autoSave]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-8">
          <div>
            <div className="h-10 bg-muted rounded w-1/4 mb-3"></div>
            <div className="h-6 bg-muted rounded w-2/3"></div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">{t('profile.errorLoadingTitle')}</h3>
              <p className="text-muted-foreground">
                {t('profile.errorLoadingMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('profile.title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {t('profile.description')}
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-primary rounded-full"></div>
          <h2 className="text-3xl font-bold text-foreground">{t('profile.accountInformation')}</h2>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex items-center space-x-6">
              <div className="bg-primary/10 flex items-center justify-center h-20 w-20 rounded-2xl border border-primary/20">
                <span className="text-3xl font-semibold text-primary">
                  {fullName ? fullName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold text-foreground">{fullName || t('profile.noNameSet')}</h3>
                <p className="text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-8">
              <div className="space-y-3">
                <label htmlFor="email" className="text-sm font-medium text-foreground">{t('profile.emailAddress')}</label>
                <input
                  id="email"
                  value={userEmail}
                  disabled
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground disabled:opacity-60"
                />
                <p className="text-sm text-muted-foreground">{t('profile.emailManagedMessage')}</p>
              </div>

              <div className="space-y-3">
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">{t('profile.fullName')}</label>
                <div className="relative">
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('profile.enterFullName')}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 pr-24"
                  />
                  {saving && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">{t('profile.saving')}</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t('profile.autoSaveMessage')}</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{t('profile.memberSince')}</label>
                <input
                  value={new Date(profile.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  disabled
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}