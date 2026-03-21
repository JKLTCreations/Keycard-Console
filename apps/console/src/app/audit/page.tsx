"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getAuditEvents, AuditEvent } from "@/lib/api";
import { ScrollText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    render: (e) => <span className="font-mono text-xs text-gray-400 max-w-xs truncate block">{e.resource}</span>,
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
      <span className="text-xs text-gray-500">{e.reason || "-"}</span>
    ),
  },
];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Audit Log" description="Complete record of agent actions and policy decisions" />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events"
          description="Audit events will appear here as agents make requests."
        />
      ) : (
        <DataTable columns={columns} data={events} />
      )}
    </div>
  );
}
