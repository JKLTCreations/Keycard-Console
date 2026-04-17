"use client";

import { PageHeader } from "@/components/page-header";
import { KeyRound, Globe, Bell, Shield, ChevronRight } from "lucide-react";

const settingsSections = [
  {
    icon: KeyRound,
    title: "API Keys",
    description: "Manage API keys for agent authentication",
    status: "3 active keys",
  },
  {
    icon: Globe,
    title: "Endpoints",
    description: "Configure API server endpoints and CORS settings",
    status: "localhost:3001",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alerting for denied requests and escalations",
    status: "Email + Slack",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Token rotation, session timeouts, and rate limits",
    status: "Default policy",
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader title="Settings" description="Configure your Keycard instance" />

      <div className="space-y-2">
        {settingsSections.map((section) => (
          <div
            key={section.title}
            className="group flex items-center gap-4 rounded-xl border border-border bg-surface-1 p-5 hover:border-border-hover hover:bg-surface-2/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent flex-shrink-0 group-hover:bg-accent/15 transition-colors">
              <section.icon className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-text-primary">{section.title}</h3>
              <p className="text-[12px] text-text-muted mt-0.5">{section.description}</p>
            </div>
            <span className="text-[11px] font-medium text-text-faint bg-surface-2 px-2.5 py-1 rounded-md flex-shrink-0">
              {section.status}
            </span>
            <ChevronRight className="w-4 h-4 text-text-faint group-hover:text-text-muted transition-colors flex-shrink-0" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface-1 p-6">
        <p className="text-[13px] text-text-muted text-center">
          Full settings configuration coming in a future release.
        </p>
      </div>
    </div>
  );
}
