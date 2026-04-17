import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-2 ring-1 ring-border mb-5">
        <Icon className="w-5 h-5 text-text-muted" />
      </div>
      <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      <p className="mt-1.5 text-[13px] text-text-muted max-w-sm leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 px-5 py-2.5 text-[13px] font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
