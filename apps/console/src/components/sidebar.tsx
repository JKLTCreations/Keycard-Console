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
<<<<<<< HEAD
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
=======
      <div className="h-12 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-4 h-4 text-text-primary" />
          <span className="text-[13px] font-semibold text-text-primary tracking-tight">Keycard</span>
>>>>>>> cdeeae7 (ui)
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-px overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] rounded-md transition-colors duration-100",
                active
                  ? "bg-surface-2 text-text-primary font-medium"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-3">
            <User className="w-3 h-3 text-text-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-text-secondary truncate">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 p-1.5 rounded-md bg-surface-2 text-text-muted lg:hidden cursor-pointer"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-[240px] bg-surface-0 border-r border-border transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[240px] bg-surface-0 border-r border-border">
        {nav}
      </aside>
    </>
  );
}
