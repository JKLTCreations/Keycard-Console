"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getTools, Tool } from "@/lib/api";
import { Wrench, Bot } from "lucide-react";

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
    <div className="max-w-7xl mx-auto animate-fade-in">
      <PageHeader title="Tools & Services" description="Connected integrations and service catalog" />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState icon={Wrench} title="No tools registered" description="Tools will appear here once connected." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="group rounded-xl border border-border bg-surface-1 p-5 hover:border-border-hover hover:bg-surface-2/50 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent text-sm font-bold">
                  {tool.name.charAt(0)}
                </div>
                <span className="text-[10px] font-semibold font-mono text-text-faint bg-surface-2 px-2 py-1 rounded-md uppercase tracking-wide">
                  {tool.category}
                </span>
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary mb-1">{tool.name}</h3>
              <p className="text-[12px] text-text-muted mb-4 line-clamp-2 leading-relaxed">{tool.description}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-text-faint">
                <Bot className="w-3 h-3" />
                <span>{tool.connected_agents ?? 0} agents connected</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
