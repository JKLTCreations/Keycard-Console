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
    <div className="max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Tools & Services" description="Connected integrations and service catalog" />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-surface-3 border-t-text-muted rounded-full animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState icon={Wrench} title="No tools registered" description="Tools will appear here once connected." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="border border-border rounded-lg p-4 hover:bg-surface-1 transition-colors duration-100 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-2 text-[13px] font-semibold text-text-muted">
                  {tool.name.charAt(0)}
                </div>
                <span className="text-[10px] font-mono text-text-faint bg-surface-2 px-1.5 py-0.5 rounded">
                  {tool.category}
                </span>
              </div>
              <h3 className="text-[13px] font-medium text-text-primary mb-1">{tool.name}</h3>
              <p className="text-[12px] text-text-muted mb-3 line-clamp-2">{tool.description}</p>
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
