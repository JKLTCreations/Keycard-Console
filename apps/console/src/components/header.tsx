"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home, Bell, Search } from "lucide-react";
import Link from "next/link";

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1),
    href: "/" + parts.slice(0, i + 1).join("/"),
    isLast: i === parts.length - 1,
  }));
}

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b border-gray-800/50 bg-[#06080f]/80 backdrop-blur-md">
      <nav className="flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
            {crumb.isLast ? (
              <span className="text-gray-200 font-medium bg-gray-800/50 px-2.5 py-0.5 rounded-md text-xs">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800/50 bg-gray-900/30 text-gray-600 text-xs">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 text-[10px] font-mono">/</kbd>
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
