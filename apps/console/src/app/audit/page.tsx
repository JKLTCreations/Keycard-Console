"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getAuditEvents, AuditEvent } from "@/lib/api";
import { ScrollText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

const filters = ["All", "Allow", "Deny", "Escalate"] as const;

const columns: Column<AuditEvent>[] = [
  {
    key: "created_at",
    header: "Time",
    render: (e) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "agent_name",
    header: "Agent",
    render: (e) => <span className="font-mono text-xs text-gray-300">{e.agent_name || e.agent_id.slice(0, 8)}</span>,
  },
  {
    key: "tool_name",
    header: "Tool",
    render: (e) => <span className="text-xs text-gray-400">{e.tool_name || "-"}</span>,
  },
  {
    key: "action",
    header: "Action",
    render: (e) => <span className="font-mono text-xs text-gray-300">{e.action}</span>,
  },
  {
    key: "resource",
    header: "Resource",
    render: (e) => (
      <span className="font-mono text-xs text-gray-400 max-w-xs truncate block" title={e.resource}>
        {e.resource}
      </span>
    ),
  },
  {
    key: "outcome",
    header: "Outcome",
    render: (e) => <StatusBadge status={e.outcome} />,
  },
  {
    key: "reason",
    header: "Reason",
    render: (e) => (
      <span className="text-xs text-gray-500 max-w-[200px] truncate block">{e.reason || "-"}</span>
    ),
  },
];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof filters[number]>("All");

  useEffect(() => {
    getAuditEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All"
    ? events
    : events.filter((e) => e.outcome.toLowerCase() === filter.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Audit Log" description="Complete record of agent actions and policy decisions" />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
              filter === f
                ? f === "Allow" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : f === "Deny" ? "bg-red-500/15 text-red-300 border border-red-500/30"
                : f === "Escalate" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "bg-brand-600/20 text-brand-300 border border-brand-500/30"
                : "bg-gray-800/30 text-gray-500 border border-gray-800/50 hover:text-gray-300 hover:border-gray-700/50"
            )}
          >
            {f}
            <span className="ml-1.5 text-[10px] tabular-nums">
              {f === "All" ? events.length : events.filter((e) => e.outcome.toLowerCase() === f.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events"
          description="Audit events will appear here as agents make requests."
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  );
}
