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
  className?: string;
}

function formatValue(value: string | number): string {
  if (typeof value === "number" && value >= 1000) {
    return value.toLocaleString();
  }
  return String(value);
}

export function MetricCard({ label, value, trend, icon, className }: MetricCardProps) {
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-xl border border-border bg-surface-1 p-5 transition-all duration-300 hover:border-border-hover hover:bg-surface-2/80",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary tabular-nums tracking-tight">
            {formatValue(value)}
          </p>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.direction === "up" ? (
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-danger" />
          )}
          <span
            className={clsx(
              "text-xs font-semibold",
              trend.direction === "up" ? "text-accent" : "text-danger"
            )}
          >
            {trend.value}%
          </span>
          <span className="text-[11px] text-text-faint">vs last week</span>
        </div>
      )}
    </div>
  );
}
