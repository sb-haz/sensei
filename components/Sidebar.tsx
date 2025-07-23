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
        <aside className="w-64 h-full bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}