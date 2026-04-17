"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
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
    <header className="sticky top-0 z-20 flex items-center h-14 px-6 lg:px-8 border-b border-border-subtle bg-surface-0/70 backdrop-blur-xl">
      <nav className="flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="text-text-muted hover:text-text-secondary transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-text-faint" />
            {crumb.isLast ? (
              <span className="text-text-primary text-[13px] font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-text-muted text-[13px] hover:text-text-secondary transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}
