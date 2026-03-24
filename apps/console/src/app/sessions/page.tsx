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
    render: (s) => <span className="font-mono text-xs text-gray-400">{s.id.slice(0, 12)}</span>,
  },
  {
    key: "agent_name",
    header: "Agent",
    render: (s) => <span className="font-medium text-gray-200">{s.agent_name || s.agent_id.slice(0, 8)}</span>,
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
    render: (s) => (
      <span className="text-gray-400 text-xs max-w-xs truncate block" title={s.task_description}>
        {s.task_description}
      </span>
    ),
  },
  {
    key: "tool_call_count",
    header: "Tool Calls",
    render: (s) => <span className="text-gray-400 tabular-nums">{s.tool_call_count}</span>,
  },
  {
    key: "started_at",
    header: "Started At",
    render: (s) => (
      <span className="text-gray-500 text-xs">
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
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Sessions" description="View active and historical agent sessions" />

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
              filter === f
                ? "bg-brand-600/20 text-brand-300 border border-brand-500/30"
                : "bg-gray-800/30 text-gray-500 border border-gray-800/50 hover:text-gray-300 hover:border-gray-700/50"
            )}
          >
            {f}
            {f !== "All" && (
              <span className="ml-1.5 text-[10px] tabular-nums">
                {sessions.filter((s) => s.status.toLowerCase() === f.toLowerCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MonitorDot}
          title="No sessions found"
          description="Sessions will appear here when agents start making requests."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowHref={(s) => `/sessions/${s.id}`}
        />
      )}
    </div>
  );
}
