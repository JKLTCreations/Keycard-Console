import { clsx } from "clsx";

const variants = {
  success: "text-[#30a46c] bg-[#30a46c0a] border-[#30a46c20]",
  warning: "text-[#f5a623] bg-[#f5a6230a] border-[#f5a62320]",
  danger: "text-[#ec5d5e] bg-[#ec5d5e0a] border-[#ec5d5e20]",
  info: "text-text-secondary bg-[#ffffff05] border-border",
  neutral: "text-text-muted bg-[#ffffff05] border-border",
};

const dotColors = {
  success: "bg-[#30a46c]",
  warning: "bg-[#f5a623]",
  danger: "bg-[#ec5d5e]",
  info: "bg-text-secondary",
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
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium border",
        variants[v],
        className
      )}
    >
      <span className={clsx("w-1 h-1 rounded-full", dotColors[v])} />
      {status}
    </span>
  );
}
