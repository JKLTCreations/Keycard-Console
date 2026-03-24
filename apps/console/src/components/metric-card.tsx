import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: React.ReactNode;
  accentColor?: "violet" | "green" | "blue" | "amber" | "cyan";
  className?: string;
}

const accentColors = {
  violet: "border-l-brand-500",
  green: "border-l-emerald-500",
  blue: "border-l-blue-500",
  amber: "border-l-amber-500",
  cyan: "border-l-cyan-500",
};

const iconBg = {
  violet: "bg-brand-500/10 text-brand-400",
  green: "bg-emerald-500/10 text-emerald-400",
  blue: "bg-blue-500/10 text-blue-400",
  amber: "bg-amber-500/10 text-amber-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
};

function formatValue(value: string | number): string {
  if (typeof value === "number" && value >= 1000) {
    return value.toLocaleString();
  }
  return String(value);
}

export function MetricCard({ label, value, trend, icon, accentColor = "violet", className }: MetricCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-800/60 bg-gray-900/50 p-5 border-l-2 transition-all hover:shadow-glow-sm hover:border-gray-700/60 animate-fade-in",
        accentColors[accentColor],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-100 tabular-nums">
            {formatValue(value)}
          </p>
        </div>
        {icon && (
          <div className={clsx("flex items-center justify-center w-10 h-10 rounded-lg", iconBg[accentColor])}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.direction === "up" ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span
            className={clsx(
              "text-xs font-medium",
              trend.direction === "up" ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend.value}%
          </span>
          <span className="text-xs text-gray-600">vs last week</span>
        </div>
      )}
    </div>
  );
}
