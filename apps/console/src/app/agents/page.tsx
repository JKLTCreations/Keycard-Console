"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getAgents, Agent } from "@/lib/api";
import { Bot, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const columns: Column<Agent>[] = [
  {
    key: "name",
    header: "Name",
    render: (agent) => <span className="text-[13px] font-medium text-text-primary">{agent.name}</span>,
  },
  {
    key: "type",
    header: "Type",
    render: (agent) => (
      <span className="font-mono text-[11px] text-text-muted bg-surface-2 px-2 py-1 rounded-md">{agent.type}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (agent) => <StatusBadge status={agent.status} />,
  },
  {
    key: "sessions_count",
    header: "Sessions",
    render: (agent) => <span className="text-text-muted tabular-nums text-[13px]">{agent.sessions_count ?? "-"}</span>,
  },
  {
    key: "last_active_at",
    header: "Last Active",
    render: (agent) => (
      <span className="text-text-faint text-[12px]">
        {agent.last_active_at
          ? formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true })
          : "Never"}
      </span>
    ),
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Agents"
        description="Manage registered AI agents and their access"
        action={
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Agent
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents registered"
          description="Register your first AI agent to get started with Keycard access control."
          actionLabel="Register Agent"
          actionHref="/agents/new"
        />
      ) : (
        <DataTable columns={columns} data={agents} rowHref={(agent) => `/agents/${agent.id}`} />
      )}
    </div>
  );
}
