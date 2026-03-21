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
        <div className="w-6 h-6 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
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
        <h1 className="text-2xl font-semibold text-gray-100">{policy.name}</h1>
        <StatusBadge status={policy.status} />
        <span className="font-mono text-xs text-gray-500">v{policy.version}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Policy ID</p>
          <p className="text-sm text-gray-200 font-mono">{(params.id as string).slice(0, 12)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Rules</p>
          <p className="text-sm text-gray-200">{policy.rules?.length || 0} rules</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Last Modified</p>
          <p className="text-sm text-gray-200">{format(new Date(policy.updated_at), "MMM d, yyyy")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Rules</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Tool</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Action</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {(policy.rules || []).map((rule, i) => (
                <tr key={i}>
                  <td className="py-3 font-mono text-xs text-gray-300">{rule.tool}</td>
                  <td className="py-3 font-mono text-xs text-gray-300">{rule.action}</td>
                  <td className="py-3">
                    <StatusBadge
                      status={rule.outcome}
                      variant={rule.outcome === "allow" ? "success" : "danger"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
