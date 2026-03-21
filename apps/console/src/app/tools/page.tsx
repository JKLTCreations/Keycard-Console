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
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Tools & Services" description="Connected integrations and service catalog" />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tools registered"
          description="Tools will appear here once connected."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 text-2xl">
                  {tool.icon || "🔧"}
                </div>
                <span className="text-xs font-mono text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                  {tool.category}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-200 mb-1">{tool.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Bot className="w-3.5 h-3.5" />
                <span>{tool.connected_agents ?? 0} agents connected</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
