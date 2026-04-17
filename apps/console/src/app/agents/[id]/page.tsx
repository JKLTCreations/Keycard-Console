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

const sessionColumns: Column<Session>[] = [
  {
    key: "id",
    header: "Session ID",
    render: (s) => <span className="font-mono text-[12px] text-text-muted">{s.id.slice(0, 12)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (s) => <StatusBadge status={s.status} />,
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
        <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16 text-text-muted">
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      <Link href="/agents" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-secondary mb-4 transition-colors cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Agents
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">{agent.name}</h1>
          <StatusBadge status={agent.status} />
          <span className="font-mono text-[11px] text-text-muted bg-surface-2 px-2 py-1 rounded-md">{agent.type}</span>
        </div>
        {agent.status === "active" && (
          <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Revoke
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-[13px] text-red-400 mb-3">
            Are you sure you want to revoke this agent? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={handleRevoke} className="px-4 py-2 text-[13px] font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer">
              Confirm Revoke
            </button>
            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-[13px] font-medium rounded-lg border border-border text-text-secondary hover:bg-surface-2 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Total Sessions" value={sessions.length} icon={<Activity className="w-4 h-4" />} />
        <MetricCard label="Completed" value={completedSessions} icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Total Tool Calls" value={totalToolCalls} icon={<Terminal className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Type", value: agent.type },
          { label: "Created", value: format(new Date(agent.created_at), "MMM d, yyyy") },
          { label: "Last Active", value: agent.last_active_at ? formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true }) : "Never" },
          { label: "Updated", value: format(new Date(agent.updated_at), "MMM d, yyyy") },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface-1 p-4">
            <p className="text-[11px] text-text-faint font-semibold uppercase tracking-wide mb-1.5">{item.label}</p>
            <p className="text-[13px] text-text-secondary font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface-1 p-6 mb-8">
        <h3 className="text-[13px] font-semibold text-text-muted mb-4 uppercase tracking-wide">Configuration</h3>
        <pre className="text-[12px] text-text-secondary font-mono bg-surface-0 border border-border-subtle rounded-lg p-4 overflow-x-auto">
          {JSON.stringify(agent.config || {}, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h3 className="text-[13px] font-semibold text-text-muted mb-4 uppercase tracking-wide">Recent Sessions</h3>
        {sessions.length > 0 ? (
          <DataTable columns={sessionColumns} data={sessions} rowHref={(s) => `/sessions/${s.id}`} />
        ) : (
          <div className="text-[13px] text-text-muted py-4">No sessions found for this agent.</div>
        )}
      </div>
    </div>
  );
}
