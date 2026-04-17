"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import Image from "next/image";
import {
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
  ChevronRight,
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
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/keycard-logo.webp"
            alt="Keycard"
            width={28}
            height={28}
            className="w-7 h-7"
          />
          <div>
            <span className="text-[14px] font-semibold text-text-primary tracking-tight">Keycard</span>
            <p className="text-[11px] text-text-muted leading-none mt-0.5">Lathu & Jordan LLC</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-2 text-[10px] font-semibold text-text-faint uppercase tracking-widest">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
              )}
            >
              <Icon className={clsx("w-[18px] h-[18px] flex-shrink-0", active && "text-accent")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-accent/50" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 mx-3 mb-3 rounded-lg bg-surface-2/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-3 ring-1 ring-border">
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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-2 text-text-muted hover:text-text-secondary transition-colors lg:hidden"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-[260px] bg-surface-1/80 backdrop-blur-xl border-r border-border-subtle transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] bg-surface-1/80 backdrop-blur-xl border-r border-border-subtle">
        {nav}
      </aside>
    </>
  );
}
