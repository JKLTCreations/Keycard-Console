import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tint = "default" | "green" | "blue" | "amber";

const tints: Record<Tint, { bg: string }> = {
  default: { bg: "bg-surface-1" },
  green:   { bg: "bg-[#30a46c06]" },
  blue:    { bg: "bg-[#3b82f606]" },
  amber:   { bg: "bg-[#f5a62306]" },
};

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: React.ReactNode;
  tint?: Tint;
  className?: string;
}

function formatValue(value: string | number): string {
  if (typeof value === "number" && value >= 1000) {
    return value.toLocaleString();
  }
  return String(value);
}

export function MetricCard({ label, value, trend, icon, tint = "default", className }: MetricCardProps) {
  const t = tints[tint];

  return (
    <div
      className={clsx(
        "border border-border-subtle p-5 transition-colors hover:bg-surface-2",
        t.bg,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-text-muted font-medium">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">
            {formatValue(value)}
          </p>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-2 text-text-muted">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.direction === "up" ? (
            <TrendingUp className="w-3 h-3 text-[#30a46c]" />
          ) : (
            <TrendingDown className="w-3 h-3 text-[#ec5d5e]" />
          )}
          <span
            className={clsx(
              "text-xs font-medium",
              trend.direction === "up" ? "text-[#30a46c]" : "text-[#ec5d5e]"
            )}
          >
            {trend.value}%
          </span>
          <span className="text-xs text-text-faint">vs last week</span>
        </div>
      )}
    </div>
  );
}
