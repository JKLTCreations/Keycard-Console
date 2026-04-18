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

const tooltipStyle = {
  backgroundColor: "#171717",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "6px",
  fontSize: "12px",
  padding: "6px 10px",
};

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
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-surface-3 border-t-text-muted" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Dashboard" description="System overview and recent activity" />
        <div className="border border-border rounded-lg p-6 text-center text-text-muted text-[13px]">
          <p>Unable to load dashboard data. Make sure the API server is running on port 3001.</p>
          {error && <p className="text-text-faint mt-1">{error}</p>}
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
  }));

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Dashboard" description="System overview and recent activity" />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Total Agents"
          value={stats.total_agents}
          icon={<Bot className="w-4 h-4" />}
          trend={{ value: 12, direction: "up" }}
        />
        <MetricCard
          label="Requests Today"
          value={stats.requests_today}
          icon={<Activity className="w-4 h-4" />}
          trend={{ value: 8, direction: "up" }}
        />
        <MetricCard
          label="Success Rate"
          value={`${stats.success_rate}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          trend={{ value: 2, direction: "up" }}
        />
        <MetricCard
          label="Active Sessions"
          value={stats.active_sessions}
          icon={<Zap className="w-4 h-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2 border border-border rounded-lg p-4">
          <h3 className="text-[12px] text-text-muted mb-4">Activity (24h)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="gAllow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" stroke="#444" fontSize={11} tickLine={false} />
                <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="allowed" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#gAllow)" stackId="1" />
                <Area type="monotone" dataKey="denied" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#gDeny)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">
          <h3 className="text-[12px] text-text-muted mb-4">Approval Breakdown</h3>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={approvalBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {approvalBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-lg font-semibold text-text-primary tabular-nums">{totalApprovals}</p>
                <p className="text-[10px] text-text-faint uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {approvalBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-text-muted">{item.name}</span>
                </div>
                <span className="text-text-secondary tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="border border-border rounded-lg p-4 mb-6">
        <h3 className="text-[12px] text-text-muted mb-3">Recent Activity</h3>
        <div className="space-y-0">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 px-1.5 py-2 rounded-md hover:bg-surface-1 transition-colors duration-100">
              <span className="text-[12px] font-mono text-text-secondary w-24 flex-shrink-0 truncate">
                {event.agent_name || event.agent_id.slice(0, 10)}
              </span>
              <span className="text-[12px] text-text-faint flex-shrink-0">{event.action}</span>
              <span className="text-[12px] text-text-faint font-mono truncate flex-1">{event.resource}</span>
              <StatusBadge status={event.outcome} />
              <span className="text-[11px] text-text-faint flex-shrink-0 tabular-nums">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
          {recentEvents.length === 0 && (
            <p className="text-[13px] text-text-muted text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-[12px] text-text-muted mb-3">Recent Denials</h3>
          <div className="space-y-2">
            {stats.recent_denials.map((d) => (
              <div key={d.id} className="p-3 rounded-md bg-surface-1 border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-mono text-text-secondary">{d.agent_name}</span>
                  <span className="text-[11px] text-text-faint">
                    {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[12px] text-text-muted font-mono truncate">{d.resource}</p>
                {d.reason && <p className="text-[11px] text-text-faint mt-1">{d.reason}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">
          <h3 className="text-[12px] text-text-muted mb-3">Agent Activity</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#444" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="events" fill="#333333" radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
