"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getPolicy, Policy } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

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
        <div className="w-5 h-5 border-2 border-border border-t-text-muted rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16 text-text-muted">
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
      <Link href="/policies" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-secondary mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Policies
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-xl font-semibold text-text-primary">{policy.name}</h1>
        <StatusBadge status={policy.status} />
        <span className="font-mono text-[11px] text-text-muted">v{policy.version}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="border border-border bg-surface-1 p-3">
          <p className="text-[11px] text-text-faint font-medium mb-1">Policy ID</p>
          <p className="text-[13px] text-text-secondary font-mono">{(params.id as string).slice(0, 12)}</p>
        </div>
        <div className="border border-border bg-surface-1 p-3">
          <p className="text-[11px] text-text-faint font-medium mb-1">Total Rules</p>
          <p className="text-[13px] text-text-secondary">{rules.length}</p>
        </div>
        <div className="border border-border bg-surface-1 p-3">
          <p className="text-[11px] text-text-faint font-medium mb-1">Breakdown</p>
          <div className="flex items-center gap-2 text-[11px]">
            {allows > 0 && <span className="text-[#30a46c]">{allows} allow</span>}
            {denies > 0 && <span className="text-[#ec5d5e]">{denies} deny</span>}
            {escalates > 0 && <span className="text-[#f5a623]">{escalates} escalate</span>}
          </div>
        </div>
        <div className="border border-border bg-surface-1 p-3">
          <p className="text-[11px] text-text-faint font-medium mb-1">Last Modified</p>
          <p className="text-[13px] text-text-secondary">{format(new Date(policy.updated_at), "MMM d, yyyy")}</p>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-text-muted mb-3">Rules</h3>
        <div className="space-y-1.5">
          {rules.map((rule, i) => (
            <div key={i} className="border border-border bg-surface-1 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[13px]">
                  <div>
                    <span className="text-[10px] text-text-faint uppercase tracking-wider block">Tool</span>
                    <span className="font-mono text-text-secondary">{rule.tool}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-faint uppercase tracking-wider block">Action</span>
                    <span className="font-mono text-text-secondary">{rule.action}</span>
                  </div>
                  {(rule as any).condition && (
                    <div>
                      <span className="text-[10px] text-text-faint uppercase tracking-wider block">Condition</span>
                      <span className="font-mono text-[11px] text-text-muted">{(rule as any).condition}</span>
                    </div>
                  )}
                </div>
                <StatusBadge
                  status={rule.outcome}
                  variant={rule.outcome === "allow" ? "success" : rule.outcome === "escalate" ? "warning" : "danger"}
                />
              </div>
              {(rule as any).reason && (
                <p className="text-[11px] text-text-faint mt-2">{(rule as any).reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
