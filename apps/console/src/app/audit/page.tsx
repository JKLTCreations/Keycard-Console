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
      <span className="text-text-faint text-[12px] whitespace-nowrap">
        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "agent_name",
    header: "Agent",
    render: (e) => <span className="font-mono text-[12px] text-text-secondary">{e.agent_name || e.agent_id.slice(0, 8)}</span>,
  },
  {
    key: "tool_name",
    header: "Tool",
    render: (e) => <span className="text-[12px] text-text-muted">{e.tool_name || "-"}</span>,
  },
  {
    key: "action",
    header: "Action",
    render: (e) => <span className="font-mono text-[12px] text-text-secondary">{e.action}</span>,
  },
  {
    key: "resource",
    header: "Resource",
    render: (e) => <span className="font-mono text-[12px] text-text-muted max-w-xs truncate block">{e.resource}</span>,
  },
  {
    key: "outcome",
    header: "Outcome",
    render: (e) => <StatusBadge status={e.outcome} />,
  },
  {
    key: "reason",
    header: "Reason",
    render: (e) => <span className="text-[12px] text-text-faint max-w-[180px] truncate block">{e.reason || "-"}</span>,
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Audit Log" description="Complete record of agent actions and policy decisions" />

      <div className="flex items-center gap-0.5 mb-4 border border-border rounded-md w-fit p-0.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-2.5 py-1 text-[12px] rounded transition-colors duration-100 cursor-pointer",
              filter === f
                ? "bg-surface-2 text-text-primary font-medium"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {f}
            <span className="ml-1 tabular-nums text-text-faint">
              {f === "All" ? events.length : events.filter((e) => e.outcome.toLowerCase() === f.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-surface-3 border-t-text-muted rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit events" description="Audit events will appear here as agents make requests." />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  );
}
