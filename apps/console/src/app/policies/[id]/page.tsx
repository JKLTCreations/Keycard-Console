"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getPolicy, Policy } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

const outcomeBorder: Record<string, string> = {
  allow: "border-l-emerald-500 bg-emerald-500/5",
  deny: "border-l-red-500 bg-red-500/5",
  escalate: "border-l-amber-500 bg-amber-500/5",
};

export default function PolicyDetailPage() {
  const params = useParams();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    getPolicy(id)
      .then(setPolicy)
      .catch(() => setPolicy(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16 text-gray-400">
        Policy not found.
      </div>
    );
  }

  const rules = policy.rules || [];
  const allows = rules.filter((r) => r.outcome === "allow").length;
  const denies = rules.filter((r) => r.outcome === "deny").length;
  const escalates = rules.filter((r) => r.outcome === "escalate").length;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/policies"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Policies
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-100">{policy.name}</h1>
        <StatusBadge status={policy.status} />
        <span className="font-mono text-xs text-gray-500">v{policy.version}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-gray-800/60 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Policy ID</p>
          <p className="text-sm text-gray-200 font-mono">{(params.id as string).slice(0, 12)}</p>
        </div>
        <div className="rounded-lg border border-gray-800/60 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Rules</p>
          <p className="text-sm text-gray-200">{rules.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800/60 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Breakdown</p>
          <div className="flex items-center gap-2 text-xs">
            {allows > 0 && <span className="text-emerald-400">{allows} allow</span>}
            {denies > 0 && <span className="text-red-400">{denies} deny</span>}
            {escalates > 0 && <span className="text-amber-400">{escalates} escalate</span>}
          </div>
        </div>
        <div className="rounded-lg border border-gray-800/60 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Last Modified</p>
          <p className="text-sm text-gray-200">{format(new Date(policy.updated_at), "MMM d, yyyy")}</p>
        </div>
      </div>

      {/* Rules as cards */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-4">Rules</h3>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div
              key={i}
              className={clsx(
                "rounded-lg border border-gray-800/40 p-4 border-l-2 transition-colors hover:bg-gray-800/20 animate-fade-in",
                outcomeBorder[rule.outcome] || "border-l-gray-500"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Tool</span>
                    <p className="font-mono text-sm text-gray-200">{rule.tool}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Action</span>
                    <p className="font-mono text-sm text-gray-200">{rule.action}</p>
                  </div>
                  {(rule as any).condition && (
                    <div>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">Condition</span>
                      <p className="font-mono text-xs text-amber-300">{(rule as any).condition}</p>
                    </div>
                  )}
                </div>
                <StatusBadge
                  status={rule.outcome}
                  variant={rule.outcome === "allow" ? "success" : rule.outcome === "escalate" ? "warning" : "danger"}
                />
              </div>
              {(rule as any).reason && (
                <p className="text-xs text-gray-500 mt-2">{(rule as any).reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
