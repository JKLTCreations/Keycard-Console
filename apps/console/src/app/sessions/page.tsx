"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getSessions, Session } from "@/lib/api";
import { MonitorDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    key: "task_description",
    header: "Task",
    render: (s) => <span className="text-gray-400 text-xs max-w-xs truncate block">{s.task_description}</span>,
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

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Sessions" description="View active and historical agent sessions" />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={MonitorDot}
          title="No sessions found"
          description="Sessions will appear here when agents start making requests."
        />
      ) : (
        <DataTable
          columns={columns}
          data={sessions}
          rowHref={(s) => `/sessions/${s.id}`}
        />
      )}
    </div>
  );
}
