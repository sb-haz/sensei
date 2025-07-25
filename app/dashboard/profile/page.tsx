'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  full_name: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [lastSavedName, setLastSavedName] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!profile || fullName === lastSavedName || loading) return;

    const timeoutId = setTimeout(() => {
      autoSave();
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [fullName, profile, lastSavedName, loading]);

  const loadProfile = async () => {
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
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Error loading profile</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Profile</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">Manage your account information and preferences</p>
      </div>

      <div className="bg-white rounded-xl p-8 border border-border shadow-sm">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="flex items-center space-x-6">
            <div className="bg-primary/10 flex items-center justify-center h-20 w-20 rounded-2xl border border-primary/20">
              <span className="text-3xl font-semibold text-primary">
                {fullName ? fullName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold text-foreground">{fullName || 'No name set'}</h3>
              <p className="text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
              <input
                id="email"
                value={userEmail}
                disabled
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground disabled:opacity-60"
              />
              <p className="text-sm text-muted-foreground">Email is managed through your account settings</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 pr-20"
                />
                {saving && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Saving...</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Changes are automatically saved</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Member Since</label>
              <input
                value={new Date(profile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                disabled
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
