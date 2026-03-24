"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getPolicies, Policy } from "@/lib/api";
import { ShieldCheck, Plus } from "lucide-react";
import { format } from "date-fns";

const columns: Column<Policy>[] = [
  {
    key: "name",
    header: "Name",
    render: (p) => <span className="font-medium text-gray-200">{p.name}</span>,
  },
  {
    key: "version",
    header: "Version",
    render: (p) => <span className="font-mono text-xs text-gray-400">v{p.version}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (p) => <StatusBadge status={p.status} />,
  },
  {
    key: "rules",
    header: "Rules",
    render: (p) => {
      const rules = p.rules || [];
      const allows = rules.filter((r) => r.outcome === "allow").length;
      const denies = rules.filter((r) => r.outcome === "deny").length;
      const escalates = rules.filter((r) => r.outcome === "escalate").length;
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 tabular-nums text-xs">{rules.length} rules</span>
          <span className="text-[10px] text-gray-600">
            ({allows > 0 && <span className="text-emerald-500">{allows} allow</span>}
            {denies > 0 && <>{allows > 0 && ", "}<span className="text-red-400">{denies} deny</span></>}
            {escalates > 0 && <>{(allows > 0 || denies > 0) && ", "}<span className="text-amber-400">{escalates} escalate</span></>})
          </span>
        </div>
      );
    },
  },
  {
    key: "updated_at",
    header: "Last Modified",
    render: (p) => (
      <span className="text-gray-500 text-xs">
        {format(new Date(p.updated_at), "MMM d, yyyy")}
      </span>
    ),
  },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPolicies()
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Policies"
        description="Access control policies for agent authorization"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-glow-sm">
            <Plus className="w-4 h-4" />
            Create Policy
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No policies configured"
          description="Create your first policy to define agent access controls."
        />
      ) : (
        <DataTable
          columns={columns}
          data={policies}
          rowHref={(p) => `/policies/${p.id}`}
        />
      )}
    </div>
  );
}
