"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getSession, getSessionEvents, Session, SessionEvent } from "@/lib/api";
import { ArrowLeft, Clock, Terminal, User, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
        <div className="w-6 h-6 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
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
        <h1 className="text-2xl font-semibold text-gray-100 font-mono">{(params.id as string).slice(0, 12)}</h1>
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
          <div key={item.label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            </div>
            <p className="text-sm text-gray-200">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Event Timeline</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No events recorded for this session.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4">
                <span className="text-xs text-gray-600 font-mono w-20 pt-0.5 flex-shrink-0">
                  {new Date(event.created_at).toLocaleTimeString()}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      event.outcome === "allow"
                        ? "bg-emerald-400"
                        : event.outcome === "deny"
                        ? "bg-red-400"
                        : "bg-amber-400"
                    }`}
                  />
                  <div>
                    <span className="text-sm text-gray-300">
                      {event.tool_name && <span className="text-gray-500">[{event.tool_name}] </span>}
                      {event.action} <span className="text-gray-500">on</span>{" "}
                      <span className="font-mono text-xs">{event.resource}</span>
                    </span>
                    <span className="ml-2">
                      <StatusBadge status={event.outcome} />
                    </span>
                    {event.reason && (
                      <p className="text-xs text-gray-500 mt-0.5">{event.reason}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
