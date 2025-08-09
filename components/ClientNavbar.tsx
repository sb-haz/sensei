'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { LogoutButton } from '@/components/logout-button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function ClientNavbar() {
  const { user, loading } = useAuth();

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
        <LogoutButton />
      </div>
    ) : (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
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
