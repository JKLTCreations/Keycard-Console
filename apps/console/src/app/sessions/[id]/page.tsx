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
        <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16 text-text-muted">
        Session not found.
      </div>
    );
  }

  const nodeColor = (outcome: string) => {
    switch (outcome) {
      case "allow": return "bg-emerald-400";
      case "deny": return "bg-red-400";
      case "escalate": return "bg-amber-400";
      default: return "bg-text-faint";
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <Link href="/sessions" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-secondary mb-4 transition-colors cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Sessions
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-bold text-text-primary font-mono tracking-tight">{(params.id as string).slice(0, 12)}</h1>
        {session.status === "running" && <LiveIndicator />}
        <StatusBadge status={session.status} />
      </div>
      <p className="text-[13px] text-text-muted mb-8">{session.task_description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Agent", value: session.agent_name || session.agent_id.slice(0, 8), icon: Bot },
          { label: "User", value: session.user_name || session.user_id.slice(0, 8), icon: User },
          { label: "Started", value: formatDistanceToNow(new Date(session.started_at), { addSuffix: true }), icon: Clock },
          { label: "Tool Calls", value: String(session.tool_call_count), icon: Terminal },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <item.icon className="w-3.5 h-3.5 text-text-faint" />
              <p className="text-[11px] text-text-faint font-semibold uppercase tracking-wide">{item.label}</p>
            </div>
            <p className="text-[13px] text-text-secondary font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <h3 className="text-[13px] font-semibold text-text-muted mb-5 uppercase tracking-wide">Event Timeline</h3>
        {events.length === 0 ? (
          <p className="text-[13px] text-text-muted">No events recorded for this session.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[72px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-0">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 relative">
                  <span className="text-[11px] text-text-faint font-mono w-14 pt-3 flex-shrink-0 text-right tabular-nums">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex flex-col items-center flex-shrink-0 pt-2.5">
                    <div className={clsx("w-2.5 h-2.5 rounded-full z-10 ring-[3px] ring-surface-1", nodeColor(event.outcome))} />
                  </div>
                  <div className="flex-1 border border-border-subtle rounded-lg p-3.5 mb-2 hover:bg-surface-2/30 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.tool_name && (
                        <span className="text-[11px] font-semibold text-text-muted bg-surface-2 px-2 py-0.5 rounded-md">
                          {event.tool_name}
                        </span>
                      )}
                      <span className="text-[13px] text-text-secondary font-medium">{event.action}</span>
                      <span className="text-[12px] text-text-faint font-mono">{event.resource}</span>
                      <StatusBadge status={event.outcome} className="ml-auto" />
                    </div>
                    {event.reason && (
                      <p className="text-[12px] text-text-faint mt-1.5">{event.reason}</p>
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
