'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";
import { Button } from "./ui/button";
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Brain } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export function ClientNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const AuthSection = () => {
    if (loading) {
      return (
        <div className="flex gap-2">
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      );
    }

    return user ? (
      <div className="flex items-center gap-4">
        <CurrentUserAvatar />
        <Button asChild size="sm" variant={"default"}>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    ) : (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"default"}>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  };

  return (
    <nav className="w-full bg-transparent border-b-0 sticky top-0 z-50 backdrop-blur-sm">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-all duration-200"
          >
            <Brain className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              Sensei
            </span>
          </Link>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="text-sm" />
          <AuthSection />
        </div>
      </div>
    </nav>
  );
}
