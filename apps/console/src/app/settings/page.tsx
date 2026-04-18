"use client";

import { PageHeader } from "@/components/page-header";
import { KeyRound, Globe, Bell, Shield, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

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
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Settings" description="Configure your Keycard instance" />

      <div className="space-y-px border border-border rounded-lg overflow-hidden">
        {settingsSections.map((section, i) => (
          <div
            key={section.title}
            className={clsx(
              "flex items-center gap-3 p-3.5 hover:bg-surface-1 transition-colors duration-100 cursor-pointer",
              i !== settingsSections.length - 1 && "border-b border-border"
            )}
          >
            <section.icon className="w-4 h-4 text-text-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-medium text-text-primary">{section.title}</h3>
              <p className="text-[12px] text-text-muted mt-0.5">{section.description}</p>
            </div>
            <span className="text-[11px] text-text-faint flex-shrink-0">
              {section.status}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-text-faint flex-shrink-0" />
          </div>
        ))}
      </div>

      <div className="mt-6 border border-border rounded-lg p-4">
        <p className="text-[13px] text-text-muted text-center">
          Full settings configuration coming in a future release.
        </p>
      </div>
    </div>
  );
}
