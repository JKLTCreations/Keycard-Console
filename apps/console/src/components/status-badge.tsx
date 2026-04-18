import { clsx } from "clsx";

const variants = {
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  danger: "text-red-500 bg-red-500/10",
  info: "text-blue-400 bg-blue-400/10",
  neutral: "text-text-muted bg-surface-2",
};

const dotColors = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-400",
  neutral: "bg-text-muted",
};

const statusToVariant: Record<string, keyof typeof variants> = {
  active: "success",
  running: "success",
  allow: "success",
  approved: "success",
  enabled: "success",
  completed: "info",
  revoked: "danger",
  denied: "danger",
  deny: "danger",
  error: "danger",
  disabled: "danger",
  failed: "danger",
  warning: "warning",
  escalate: "warning",
  escalated: "warning",
  pending: "warning",
  observe: "info",
  draft: "info",
  idle: "neutral",
  archived: "neutral",
};

interface StatusBadgeProps {
  status: string;
  variant?: keyof typeof variants;
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const v = variant || statusToVariant[status.toLowerCase()] || "neutral";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded capitalize",
        variants[v],
        className
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[v])} />
      {status}
    </span>
  );
}
