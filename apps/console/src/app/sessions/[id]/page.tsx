"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { LiveIndicator } from "@/components/live-indicator";
import { getSession, getSessionEvents, Session, SessionEvent } from "@/lib/api";
import { ArrowLeft, Clock, Terminal, User, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

export default function SessionDetailPage() {
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    Promise.all([
      getSession(id).catch(() => null),
      getSessionEvents(id).catch(() => []),
    ]).then(([s, e]) => {
      setSession(s);
      setEvents(e);
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

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16 text-gray-400">
        Session not found.
      </div>
    );
  }

  const nodeColor = (outcome: string) => {
    switch (outcome) {
      case "allow": return "bg-emerald-400 shadow-emerald-400/20";
      case "deny": return "bg-red-400 shadow-red-400/20";
      case "escalate": return "bg-amber-400 shadow-amber-400/20";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sessions
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-100 font-mono">{(params.id as string).slice(0, 12)}</h1>
        {session.status === "running" && <LiveIndicator size="md" />}
        <StatusBadge status={session.status} />
      </div>
      <p className="text-sm text-gray-400 mb-8">{session.task_description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Agent", value: session.agent_name || session.agent_id.slice(0, 8), icon: Bot },
          { label: "User", value: session.user_name || session.user_id.slice(0, 8), icon: User },
          { label: "Started", value: formatDistanceToNow(new Date(session.started_at), { addSuffix: true }), icon: Clock },
          { label: "Tool Calls", value: String(session.tool_call_count), icon: Terminal },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-800/60 bg-gray-900/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            </div>
            <p className="text-sm text-gray-200">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Event Timeline with connecting line */}
      <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-6">Event Timeline</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No events recorded for this session.</p>
        ) : (
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[83px] top-3 bottom-3 w-px bg-gray-800" />

            <div className="space-y-0">
              {events.map((event, i) => (
                <div key={event.id} className="flex items-start gap-4 relative animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <span className="text-xs text-gray-600 font-mono w-16 pt-3 flex-shrink-0 text-right">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>

                  {/* Timeline node */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-2.5">
                    <div className={clsx("w-3 h-3 rounded-full shadow-lg z-10 ring-2 ring-[#06080f]", nodeColor(event.outcome))} />
                  </div>

                  {/* Event card */}
                  <div className={clsx(
                    "flex-1 rounded-lg border p-3 mb-2 transition-colors hover:bg-gray-800/20",
                    event.outcome === "deny" ? "border-red-500/15 bg-red-500/5" :
                    event.outcome === "escalate" ? "border-amber-500/15 bg-amber-500/5" :
                    "border-gray-800/40 bg-gray-800/10"
                  )}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.tool_name && (
                        <span className="text-[11px] font-medium text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                          {event.tool_name}
                        </span>
                      )}
                      <span className="text-sm text-gray-300">{event.action}</span>
                      <span className="text-xs text-gray-600">on</span>
                      <span className="font-mono text-xs text-gray-400">{event.resource}</span>
                      <StatusBadge status={event.outcome} className="ml-auto" />
                    </div>
                    {event.reason && (
                      <p className="text-xs text-gray-500 mt-1.5">{event.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
