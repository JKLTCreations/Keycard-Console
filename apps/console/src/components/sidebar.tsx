"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  KeyRound,
  LayoutDashboard,
  MonitorDot,
  Bot,
  ShieldCheck,
  Wrench,
  ScrollText,
  Settings,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: MonitorDot },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/policies", label: "Policies", icon: ShieldCheck },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  const nav = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 bg-surface-3">
            <KeyRound className="w-3.5 h-3.5 text-text-secondary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary">Keycard</span>
            <p className="text-[11px] text-text-muted leading-none mt-0.5">Lathu & Jordan LLC</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-px overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#ffffff08] text-text-primary"
                  : "text-text-muted hover:text-text-secondary hover:bg-[#ffffff05]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-3">
            <User className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-text-secondary truncate">Admin</p>
            <p className="text-[11px] text-text-muted truncate">admin@keycard.dev</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-surface-2 text-text-muted lg:hidden"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-60 bg-surface-1 border-r border-border-subtle transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 bg-surface-1 border-r border-border-subtle">
        {nav}
      </aside>
    </>
  );
}
