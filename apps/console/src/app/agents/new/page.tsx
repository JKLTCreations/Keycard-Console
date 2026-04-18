"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createAgent } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const agentTypes = [
  { value: "coding-agent", label: "Coding Agent" },
  { value: "ci", label: "CI/CD Runner" },
  { value: "service-bot", label: "Service Bot" },
  { value: "monitoring", label: "Monitoring" },
  { value: "custom", label: "Custom" },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("coding-agent");
  const [config, setConfig] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      JSON.parse(config);
    } catch {
      setError("Invalid JSON in configuration field");
      setSubmitting(false);
      return;
    }

    try {
      await createAgent({ name, type, config: JSON.parse(config) });
      router.push("/agents");
    } catch {
      setError("Failed to create agent. The API server may not be running.");
      setSubmitting(false);
    }
  };

  const inputClasses =
    "w-full border border-border bg-surface-1 px-3 py-2 text-[13px] text-text-primary placeholder-text-faint rounded-md focus:border-blue focus:ring-1 focus:ring-blue/30 outline-none transition-colors duration-100";

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text-secondary mb-4 transition-colors duration-100 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Agents
      </Link>

      <PageHeader title="Register Agent" description="Create a new AI agent with access controls" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 text-[13px] text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[12px] font-medium text-text-muted mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., code-agent-1"
            required
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-text-muted mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClasses}
          >
            {agentTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-text-muted mb-1.5">
            Configuration (JSON)
          </label>
          <textarea
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            rows={5}
            className={`${inputClasses} font-mono text-[12px]`}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting || !name}
            className="px-4 py-2 text-[13px] font-medium bg-text-primary text-surface-0 rounded-md hover:bg-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-100 cursor-pointer"
          >
            {submitting ? "Creating..." : "Create Agent"}
          </button>
          <Link
            href="/agents"
            className="px-4 py-2 text-[13px] font-medium border border-border text-text-secondary rounded-md hover:bg-surface-1 transition-colors duration-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
