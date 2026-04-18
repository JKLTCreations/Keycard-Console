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
        "border border-border rounded-lg p-4 transition-colors duration-100 hover:bg-surface-1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-text-muted">{label}</p>
        {icon && (
          <div className="text-text-faint">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-text-primary tabular-nums tracking-tight">
        {formatValue(value)}
      </p>
      {trend && (
        <div className="mt-1.5 flex items-center gap-1">
          {trend.direction === "up" ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span
            className={clsx(
              "text-[12px] tabular-nums",
              trend.direction === "up" ? "text-emerald-500" : "text-red-500"
            )}
          >
            {trend.value}%
          </span>
          <span className="text-[12px] text-text-faint">vs last week</span>
        </div>
      )}
    </div>
  );
}
