import { AuthButton } from "@/components/auth-button";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-all duration-200"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              Sensei
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="/dashboard" 
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            Dashboard
          </Link>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}