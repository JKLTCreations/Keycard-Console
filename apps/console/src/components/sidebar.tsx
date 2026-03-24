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
import { LiveIndicator } from "./live-indicator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, showLive: true },
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
      {/* Gradient accent line */}
      <div className="h-[2px] bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500" />

      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 shadow-glow-sm">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-100">Keycard</span>
        </div>
        <p className="text-[11px] text-gray-600 mt-1.5 pl-11">Acme Corp</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                active
                  ? "bg-brand-600/10 text-white border-l-2 border-brand-500 ml-0 pl-[10px]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border-l-2 border-transparent ml-0 pl-[10px]"
              )}
            >
              <Icon className={clsx("w-4 h-4 flex-shrink-0", active && "text-brand-400")} />
              {item.label}
              {item.showLive && <LiveIndicator className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600/20 ring-1 ring-brand-500/20">
            <User className="w-4 h-4 text-brand-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">Admin</p>
            <p className="text-[11px] text-gray-500 truncate">admin@keycard.dev</p>
          </div>
          <span className="ml-auto text-[10px] font-medium text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-gray-300 lg:hidden"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0d14] border-r border-gray-800/50 transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-[#0a0d14] border-r border-gray-800/50">
        {nav}
      </aside>
    </>
  );
}
