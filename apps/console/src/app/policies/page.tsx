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
    render: (p) => <span className="text-[13px] text-text-secondary">{p.name}</span>,
  },
  {
    key: "version",
    header: "Version",
    render: (p) => <span className="font-mono text-[11px] text-text-muted">v{p.version}</span>,
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
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-text-muted tabular-nums">{rules.length}</span>
          <span className="text-text-faint">
            ({allows > 0 && <span className="text-[#30a46c]">{allows}a</span>}
            {denies > 0 && <>{allows > 0 && "/"}<span className="text-[#ec5d5e]">{denies}d</span></>}
            {escalates > 0 && <>{(allows > 0 || denies > 0) && "/"}<span className="text-[#f5a623]">{escalates}e</span></>})
          </span>
        </div>
      );
    },
  },
  {
    key: "updated_at",
    header: "Last Modified",
    render: (p) => <span className="text-text-faint text-[11px]">{format(new Date(p.updated_at), "MMM d, yyyy")}</span>,
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
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium rounded-md bg-surface-3 text-text-primary border border-border hover:bg-[#ffffff10] transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Create Policy
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-border border-t-text-muted rounded-full animate-spin" />
        </div>
      ) : policies.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No policies configured" description="Create your first policy to define agent access controls." />
      ) : (
        <DataTable columns={columns} data={policies} rowHref={(p) => `/policies/${p.id}`} />
      )}
    </div>
  );
}
