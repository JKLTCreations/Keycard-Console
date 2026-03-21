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

export function MetricCard({ label, value, trend, icon, className }: MetricCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-800 bg-gray-900 p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-100 tabular-nums">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 text-gray-400">
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
          <span className="text-xs text-gray-600">vs last period</span>
        </div>
      )}
    </div>
  );
}
