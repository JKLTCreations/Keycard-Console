"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { getDashboardStats, DashboardStats } from "@/lib/api";
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
} from "recharts";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Dashboard" description="System overview and recent activity" />
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400">
          <p>Unable to load dashboard data. Make sure the API server is running on port 3001.</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="System overview and recent activity" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Agents"
          value={stats.total_agents}
          icon={<Bot className="w-5 h-5" />}
        />
        <MetricCard
          label="Requests Today"
          value={stats.requests_today}
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          label="Success Rate"
          value={`${stats.success_rate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <MetricCard
          label="Active Sessions"
          value={stats.active_sessions}
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Activity (24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorAllowed)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="denied"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorDenied)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval Breakdown */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Approval Breakdown</h3>
          <div className="h-48">
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
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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

      {/* Recent Denials */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Recent Denials</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Agent</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Tool</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Resource</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Reason</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {stats.recent_denials.map((denial) => (
                <tr key={denial.id}>
                  <td className="py-3 text-gray-300 font-mono text-xs">{denial.agent_name}</td>
                  <td className="py-3 text-gray-300 text-xs">{denial.tool_name}</td>
                  <td className="py-3 text-gray-300 font-mono text-xs">{denial.resource}</td>
                  <td className="py-3 text-gray-400">{denial.reason}</td>
                  <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(denial.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Agents */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Top Agents by Activity</h3>
        <div className="space-y-3">
          {stats.top_agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-200">{agent.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{agent.type}</span>
                </div>
              </div>
              <span className="text-sm text-gray-400 tabular-nums">{agent.event_count} events</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
