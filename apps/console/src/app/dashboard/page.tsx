"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardStats, getAuditEvents, DashboardStats, AuditEvent } from "@/lib/api";
import { Bot, Activity, CheckCircle, Zap } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getAuditEvents().catch(() => []),
    ])
      .then(([s, events]) => {
        setStats(s);
        setRecentEvents(events.slice(0, 10));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Dashboard" description="System overview and recent activity" />
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-8 text-center text-gray-400">
          <p>Unable to load dashboard data. Make sure the API server is running on port 3001.</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const totalApprovals = stats.approval_breakdown.allow + stats.approval_breakdown.deny + stats.approval_breakdown.escalate;
  const approvalBreakdown = [
    { name: "Allowed", value: stats.approval_breakdown.allow, color: "#10b981" },
    { name: "Denied", value: stats.approval_breakdown.deny, color: "#ef4444" },
    { name: "Escalated", value: stats.approval_breakdown.escalate, color: "#f59e0b" },
  ];

  const activityData = stats.activity_24h.map((item) => ({
    time: new Date(item.hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    allowed: item.allow,
    denied: item.deny,
    total: item.total,
  }));

  const agentBarData = stats.top_agents.map((agent) => ({
    name: agent.name,
    events: agent.event_count,
    type: agent.type,
  }));

  const outcomeColor = (outcome: string) => {
    switch (outcome) {
      case "allow": return "bg-emerald-400";
      case "deny": return "bg-red-400";
      case "escalate": return "bg-amber-400";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="System overview and recent activity" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Agents"
          value={stats.total_agents}
          icon={<Bot className="w-5 h-5" />}
          accentColor="violet"
          trend={{ value: 12, direction: "up" }}
        />
        <MetricCard
          label="Requests Today"
          value={stats.requests_today}
          icon={<Activity className="w-5 h-5" />}
          accentColor="blue"
          trend={{ value: 8, direction: "up" }}
        />
        <MetricCard
          label="Success Rate"
          value={`${stats.success_rate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          accentColor="green"
          trend={{ value: 2, direction: "up" }}
        />
        <MetricCard
          label="Active Sessions"
          value={stats.active_sessions}
          icon={<Zap className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800/60 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Activity (24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2e" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1219",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 0 20px rgba(124,58,237,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAllowed)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="denied"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDenied)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval Breakdown */}
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Approval Breakdown</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={approvalBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {approvalBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1219",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-100 tabular-nums">{totalApprovals}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {approvalBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-gray-300 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <h3 className="text-sm font-medium text-gray-400">Live Activity Feed</h3>
        </div>
        <div className="space-y-0">
          {recentEvents.map((event, i) => (
            <div
              key={event.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${outcomeColor(event.outcome)}`} />
              <span className="text-xs font-mono text-brand-400 w-24 flex-shrink-0 truncate">
                {event.agent_name || event.agent_id.slice(0, 10)}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">{event.action}</span>
              <span className="text-xs text-gray-600 font-mono truncate flex-1">{event.resource}</span>
              <StatusBadge status={event.outcome} />
              <span className="text-[11px] text-gray-600 flex-shrink-0 tabular-nums">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
          {recentEvents.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Denials + Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Denials */}
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Recent Denials</h3>
          <div className="space-y-3">
            {stats.recent_denials.map((denial) => (
              <div key={denial.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-300">{denial.agent_name}</span>
                    <span className="text-[10px] text-gray-600">{denial.tool_name}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{denial.resource}</p>
                  {denial.reason && (
                    <p className="text-[11px] text-red-400/70 mt-1">{denial.reason}</p>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0">
                  {formatDistanceToNow(new Date(denial.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Activity Bar Chart */}
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Agent Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBarData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2e" horizontal={false} />
                <XAxis type="number" stroke="#4b5563" fontSize={11} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1219",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="events"
                  fill="#7c3aed"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
