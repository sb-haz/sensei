"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain } from 'lucide-react';
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const navItems = [
        { href: "/dashboard", label: t('navigation.dashboard'), icon: "🎤" },
        { href: "/dashboard/history", label: t('navigation.history'), icon: "📊" },
        { href: "/dashboard/settings", label: t('navigation.settings'), icon: "⚙️" },
        { href: "/dashboard/profile", label: t('navigation.profile'), icon: "👤" },
    ];

    const isActiveRoute = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        if (href === "/dashboard/history") {
            return pathname === "/dashboard/history" || pathname.startsWith("/dashboard/feedback/");
        }
        return pathname === href;
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-40">
            <div className="p-6">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Brain className="w-8 h-8 text-blue-500" />
                        <h2 className="text-xl font-bold text-foreground">Sensei</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Interview Preparation Platform</p>
                </div>
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-4 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                isActiveRoute(item.href)
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}