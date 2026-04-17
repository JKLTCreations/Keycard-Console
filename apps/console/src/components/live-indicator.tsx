import { clsx } from "clsx";

interface LiveIndicatorProps {
  className?: string;
}

export function LiveIndicator({ className }: LiveIndicatorProps) {
  return (
    <span className={clsx("relative inline-flex h-2 w-2", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
    </span>
  );
}
