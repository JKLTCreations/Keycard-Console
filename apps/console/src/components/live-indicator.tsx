import { clsx } from "clsx";

interface LiveIndicatorProps {
  className?: string;
}

export function LiveIndicator({ className }: LiveIndicatorProps) {
  return (
    <span className={clsx("relative inline-flex h-1.5 w-1.5", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30a46c] opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#30a46c]" />
    </span>
  );
}
