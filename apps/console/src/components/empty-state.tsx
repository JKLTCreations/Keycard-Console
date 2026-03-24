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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-10 h-10 bg-surface-2 mb-4">
        <Icon className="w-5 h-5 text-text-muted" />
      </div>
      <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
      <p className="mt-1 text-[13px] text-text-muted max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 px-4 py-2 text-[13px] font-medium bg-surface-3 text-text-primary hover:bg-[#ffffff10] transition-colors border border-border"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
