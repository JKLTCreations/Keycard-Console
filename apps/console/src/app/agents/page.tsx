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
import { clsx } from "clsx";

const typeColors: Record<string, string> = {
  ci: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "coding-agent": "bg-brand-500/10 text-brand-400 border-brand-500/20",
  "service-bot": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  monitoring: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const typeIcons: Record<string, string> = {
  ci: "CI",
  "coding-agent": "CA",
  "service-bot": "SB",
  monitoring: "MO",
};

const columns: Column<Agent>[] = [
  {
    key: "name",
    header: "Name",
    render: (agent) => (
      <div className="flex items-center gap-3">
        <div className={clsx(
          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border",
          typeColors[agent.type] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
        )}>
          {typeIcons[agent.type] || "AG"}
        </div>
        <span className="font-medium text-gray-200">{agent.name}</span>
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    render: (agent) => (
      <span className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        typeColors[agent.type] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
      )}>
        {agent.type}
      </span>
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
    render: (agent) => (
      <span className="text-gray-400 tabular-nums text-xs">{agent.sessions_count ?? "-"}</span>
    ),
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
            Register Agent
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
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
