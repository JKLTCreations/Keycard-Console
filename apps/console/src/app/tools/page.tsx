"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LiveIndicator } from "@/components/live-indicator";
import { getTools, Tool } from "@/lib/api";
import { Wrench, Bot } from "lucide-react";
import { clsx } from "clsx";

const toolLetters: Record<string, { letter: string; color: string }> = {
  GitHub: { letter: "G", color: "bg-gray-600/20 text-gray-300 border-gray-500/30" },
  Linear: { letter: "L", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  Datadog: { letter: "D", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  AWS: { letter: "A", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  Slack: { letter: "S", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  PagerDuty: { letter: "P", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  Vercel: { letter: "V", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTools()
      .then(setTools)
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Tools & Services" description="Connected integrations and service catalog" />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tools registered"
          description="Tools will appear here once connected."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool, i) => {
            const style = toolLetters[tool.name] || { letter: tool.name.charAt(0).toUpperCase(), color: "bg-brand-500/15 text-brand-400 border-brand-500/30" };
            return (
              <div
                key={tool.id}
                className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5 hover:border-brand-500/30 hover:shadow-glow-sm transition-all cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx(
                    "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold border",
                    style.color
                  )}>
                    {style.letter}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LiveIndicator />
                    <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-200 mb-1">{tool.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Bot className="w-3.5 h-3.5" />
                    <span>{tool.connected_agents ?? 0} agents</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">
                    {tool.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
