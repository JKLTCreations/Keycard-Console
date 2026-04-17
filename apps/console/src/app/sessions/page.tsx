"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LiveIndicator } from "@/components/live-indicator";
import { getSessions, Session } from "@/lib/api";
import { MonitorDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

const filters = ["All", "Running", "Completed", "Failed"] as const;

const columns: Column<Session>[] = [
  {
    key: "id",
    header: "ID",
    render: (s) => <span className="font-mono text-[12px] text-text-muted">{s.id.slice(0, 12)}</span>,
  },
  {
    key: "agent_name",
    header: "Agent",
    render: (s) => <span className="text-[13px] font-medium text-text-primary">{s.agent_name || s.agent_id.slice(0, 8)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (s) => (
      <div className="flex items-center gap-2">
        {s.status === "running" && <LiveIndicator />}
        <StatusBadge status={s.status} />
      </div>
    ),
  },
  {
    key: "task_description",
    header: "Task",
    render: (s) => <span className="text-text-muted text-[12px] max-w-xs truncate block">{s.task_description}</span>,
  },
  {
    key: "tool_call_count",
    header: "Tool Calls",
    render: (s) => <span className="text-text-muted tabular-nums text-[13px]">{s.tool_call_count}</span>,
  },
  {
    key: "started_at",
    header: "Started",
    render: (s) => (
      <span className="text-text-faint text-[12px]">
        {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
      </span>
    ),
  },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof filters[number]>("All");

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All"
    ? sessions
    : sessions.filter((s) => s.status.toLowerCase() === filter.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <PageHeader title="Sessions" description="View active and historical agent sessions" />

      <div className="flex items-center gap-1.5 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 cursor-pointer",
              filter === f
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-text-muted border border-transparent hover:text-text-secondary hover:bg-surface-2"
            )}
          >
            {f}
            {f !== "All" && (
              <span className="ml-1.5 tabular-nums text-text-faint">
                {sessions.filter((s) => s.status.toLowerCase() === f.toLowerCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MonitorDot}
          title="No sessions found"
          description="Sessions will appear here when agents start making requests."
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowHref={(s) => `/sessions/${s.id}`} />
      )}
    </div>
  );
}
