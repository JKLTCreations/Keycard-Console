"use client";

import { PageHeader } from "@/components/page-header";
import { KeyRound, Globe, Bell, Shield } from "lucide-react";

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
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings" description="Configure your Keycard instance" />

      <div className="space-y-1.5">
        {settingsSections.map((section) => (
          <div
            key={section.title}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface-1 p-4 hover:bg-[#ffffff03] transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-2 text-text-muted flex-shrink-0">
              <section.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-medium text-text-secondary">{section.title}</h3>
              <p className="text-[11px] text-text-muted mt-0.5">{section.description}</p>
            </div>
            <span className="text-[11px] text-text-faint bg-surface-2 px-2 py-0.5 rounded flex-shrink-0">
              {section.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface-1 p-5">
        <p className="text-[13px] text-text-muted text-center">
          Full settings configuration coming in a future release.
        </p>
      </div>
    </div>
  );
}
