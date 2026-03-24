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

      <div className="space-y-3">
        {settingsSections.map((section, i) => (
          <div
            key={section.title}
            className="flex items-center gap-4 rounded-xl border border-gray-800/60 bg-gray-900/50 p-5 hover:border-brand-500/20 hover:shadow-glow-sm transition-all cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex-shrink-0">
              <section.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-200">{section.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-md flex-shrink-0">
              {section.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-800/60 bg-gray-900/50 p-5">
        <p className="text-sm text-gray-500 text-center">
          Full settings configuration coming in a future release.
        </p>
      </div>
    </div>
  );
}
