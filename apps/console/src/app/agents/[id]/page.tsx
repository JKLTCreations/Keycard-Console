"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, Column } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { getAgent, getAgentSessions, deleteAgent, Agent, Session } from "@/lib/api";
import { ArrowLeft, Trash2, Activity, Clock, Terminal } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

const typeColors: Record<string, string> = {
  ci: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "coding-agent": "bg-brand-500/10 text-brand-400 border-brand-500/20",
  "service-bot": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  monitoring: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const sessionColumns: Column<Session>[] = [
  {
    key: "id",
    header: "Session ID",
    render: (s) => <span className="font-mono text-xs text-gray-400">{s.id.slice(0, 12)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    key: "task_description",
    header: "Task",
    render: (s) => <span className="text-gray-300 text-xs max-w-xs truncate block">{s.task_description}</span>,
  },
  {
    key: "tool_call_count",
    header: "Tool Calls",
    render: (s) => <span className="text-gray-400 tabular-nums">{s.tool_call_count}</span>,
  },
  {
    key: "started_at",
    header: "Started",
    render: (s) => (
      <span className="text-gray-500 text-xs">
        {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
      </span>
    ),
  },
];

export default function AgentDetailPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    Promise.all([
      getAgent(id).catch(() => null),
      getAgentSessions(id).catch(() => []),
    ]).then(([a, s]) => {
      setAgent(a);
      setSessions(s);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16 text-gray-400">
        Agent not found.
      </div>
    );
  }

  const handleRevoke = async () => {
    await deleteAgent(agent.id).catch(() => {});
    setAgent({ ...agent, status: "revoked" });
    setShowConfirm(false);
  };

  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const totalToolCalls = sessions.reduce((sum, s) => sum + s.tool_call_count, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-100">{agent.name}</h1>
          <StatusBadge status={agent.status} />
          <span className={clsx(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
            typeColors[agent.type] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
          )}>
            {agent.type}
          </span>
        </div>
        {agent.status === "active" && (
          <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Revoke
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-red-300 mb-3">
            Are you sure you want to revoke this agent? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRevoke}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              Confirm Revoke
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Total Sessions"
          value={sessions.length}
          icon={<Activity className="w-5 h-5" />}
          accentColor="violet"
        />
        <MetricCard
          label="Completed"
          value={completedSessions}
          icon={<Clock className="w-5 h-5" />}
          accentColor="green"
        />
        <MetricCard
          label="Total Tool Calls"
          value={totalToolCalls}
          icon={<Terminal className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Type", value: agent.type },
          { label: "Created", value: format(new Date(agent.created_at), "MMM d, yyyy") },
          { label: "Last Active", value: agent.last_active_at ? formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true }) : "Never" },
          { label: "Updated", value: format(new Date(agent.updated_at), "MMM d, yyyy") },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-800/60 bg-gray-900/50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">{item.label}</p>
            <p className="text-sm text-gray-200">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Configuration with syntax-highlighted look */}
      <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5 mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Configuration</h3>
        <div className="bg-[#06080f] rounded-lg border border-gray-800/40 p-4 overflow-x-auto">
          <pre className="text-xs font-mono">
            {JSON.stringify(agent.config || {}, null, 2).split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="text-gray-700 select-none w-6 text-right mr-4 flex-shrink-0">{i + 1}</span>
                <span className="text-gray-300">
                  {line.replace(/"([^"]+)":/g, (_, key) => `"${key}":`).split(/(".*?")/g).map((part, j) =>
                    part.startsWith('"') ? (
                      <span key={j} className={line.includes(`:`) && j === 1 ? "text-brand-300" : "text-emerald-300"}>{part}</span>
                    ) : (
                      <span key={j} className={/true|false/.test(part) ? "text-amber-300" : /\d+/.test(part) ? "text-cyan-300" : ""}>{part}</span>
                    )
                  )}
                </span>
              </div>
            ))}
          </pre>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Sessions</h3>
        {sessions.length > 0 ? (
          <DataTable
            columns={sessionColumns}
            data={sessions}
            rowHref={(s) => `/sessions/${s.id}`}
          />
        ) : (
          <div className="text-sm text-gray-500 py-4">No sessions found for this agent.</div>
        )}
      </div>
    </div>
  );
}
