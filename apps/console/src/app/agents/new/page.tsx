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
    "w-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-primary placeholder-text-faint rounded-lg focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition-all";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      <PageHeader title="Register Agent" description="Create a new AI agent with access controls" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
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
          <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
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
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Configuration (JSON)
          </label>
          <textarea
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            rows={6}
            className={`${inputClasses} font-mono`}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name}
            className="px-6 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? "Creating..." : "Create Agent"}
          </button>
          <Link
            href="/agents"
            className="px-6 py-2.5 text-sm font-medium border border-border text-text-secondary rounded-lg hover:bg-surface-2 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
