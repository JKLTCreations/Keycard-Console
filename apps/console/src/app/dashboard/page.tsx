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
  backgroundColor: "#14151b",
  border: "1px solid #1e2028",
  borderRadius: "10px",
  fontSize: "12px",
  fontFamily: "Plus Jakarta Sans",
  padding: "8px 12px",
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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent/20 border-t-accent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Dashboard" description="System overview and recent activity" />
        <div className="rounded-xl border border-border bg-surface-1 p-8 text-center text-text-muted">
          <p>Unable to load dashboard data. Make sure the API server is running on port 3001.</p>
          <p className="text-[13px] text-text-faint mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const totalApprovals = stats.approval_breakdown.allow + stats.approval_breakdown.deny + stats.approval_breakdown.escalate;
  const approvalBreakdown = [
    { name: "Allowed", value: stats.approval_breakdown.allow, color: "#34d399" },
    { name: "Denied", value: stats.approval_breakdown.deny, color: "#f87171" },
    { name: "Escalated", value: stats.approval_breakdown.escalate, color: "#fbbf24" },
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
    <div className="max-w-7xl mx-auto animate-fade-in">
      <PageHeader title="Dashboard" description="System overview and recent activity" />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-1 p-6">
          <h3 className="text-[13px] font-semibold text-text-muted mb-5 uppercase tracking-wide">Activity (24h)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="gAllow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2028" />
                <XAxis dataKey="time" stroke="#383c44" fontSize={11} tickLine={false} />
                <YAxis stroke="#383c44" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="allowed" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#gAllow)" stackId="1" />
                <Area type="monotone" dataKey="denied" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#gDeny)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h3 className="text-[13px] font-semibold text-text-muted mb-5 uppercase tracking-wide">Approval Breakdown</h3>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={approvalBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {approvalBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-bold text-text-primary tabular-nums">{totalApprovals}</p>
                <p className="text-[10px] text-text-faint uppercase tracking-widest font-semibold">Total</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {approvalBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-text-muted font-medium">{item.name}</span>
                </div>
                <span className="text-text-secondary tabular-nums font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl border border-border bg-surface-1 p-6 mb-8">
        <h3 className="text-[13px] font-semibold text-text-muted mb-5 uppercase tracking-wide">Recent Activity</h3>
        <div className="space-y-0">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2/50 transition-colors">
              <span className="text-[12px] font-mono text-text-secondary w-24 flex-shrink-0 truncate font-medium">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Denials */}
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h3 className="text-[13px] font-semibold text-text-muted mb-5 uppercase tracking-wide">Recent Denials</h3>
          <div className="space-y-2.5">
            {stats.recent_denials.map((d) => (
              <div key={d.id} className="p-3.5 rounded-lg bg-surface-2/60 border border-border-subtle">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-mono text-text-secondary font-medium">{d.agent_name}</span>
                  <span className="text-[11px] text-text-faint">
                    {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[12px] text-text-muted font-mono truncate">{d.resource}</p>
                {d.reason && <p className="text-[11px] text-text-faint mt-1.5">{d.reason}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Agent Activity */}
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h3 className="text-[13px] font-semibold text-text-muted mb-5 uppercase tracking-wide">Agent Activity</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2028" horizontal={false} />
                <XAxis type="number" stroke="#383c44" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#383c44" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="events" fill="#34d399" radius={[0, 6, 6, 0]} barSize={18} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
