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
    render: (agent) => (
      <span className="font-medium text-gray-200">{agent.name}</span>
    ),
  },
  {
    key: "type",
    header: "Type",
    render: (agent) => (
      <span className="font-mono text-xs text-gray-400">{agent.type}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (agent) => <StatusBadge status={agent.status} />,
  },
  {
    key: "last_active_at",
    header: "Last Active",
    render: (agent) => (
      <span className="text-gray-500 text-xs">
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
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Agents"
        description="Manage registered AI agents and their access"
        action={
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Agent
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
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
        <DataTable
          columns={columns}
          data={agents}
          rowHref={(agent) => `/agents/${agent.id}`}
        />
      )}
    </div>
  );
}
