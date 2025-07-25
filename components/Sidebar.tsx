"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { href: "/dashboard", label: "Interview", icon: "🎤" },
        { href: "/dashboard/history", label: "History", icon: "📊" },
        { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
        { href: "/dashboard/profile", label: "Profile", icon: "👤" },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-40">
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-foreground">Sensei</h2>
                    <p className="text-sm text-muted-foreground mt-1">Interview Preparation Platform</p>
                </div>
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-4 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                pathname === item.href
                                    ? "bg-primary text-primary-foreground"
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