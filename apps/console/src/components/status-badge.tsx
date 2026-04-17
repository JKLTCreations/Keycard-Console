import { clsx } from "clsx";

const variants = {
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  danger: "text-red-400 bg-red-500/10 border-red-500/20",
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  neutral: "text-text-muted bg-surface-2 border-border",
};

const dotColors = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
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
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold border rounded-full capitalize",
        variants[v],
        className
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[v])} />
      {status}
    </span>
  );
}
