import { clsx } from "clsx";

const variants = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  neutral: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const statusToVariant: Record<string, keyof typeof variants> = {
  active: "success",
  running: "success",
  allow: "success",
  approved: "success",
  enabled: "success",
  completed: "success",
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
  draft: "info",
  idle: "neutral",
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
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variants[v],
        className
      )}
    >
      {status}
    </span>
  );
}
