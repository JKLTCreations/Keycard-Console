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
    "w-full border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      <PageHeader title="Register Agent" description="Create a new AI agent with access controls" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
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
          <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
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
          <label className="block text-sm font-medium text-gray-400 mb-2">
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
            className="px-6 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating..." : "Create Agent"}
          </button>
          <Link
            href="/agents"
            className="px-6 py-2.5 text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
