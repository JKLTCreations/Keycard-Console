import { clsx } from "clsx";

interface LiveIndicatorProps {
  status?: "live" | "running" | "active";
  size?: "sm" | "md";
  className?: string;
}

export function LiveIndicator({ size = "sm", className }: LiveIndicatorProps) {
  return (
    <span className={clsx("relative inline-flex", className)}>
      <span
        className={clsx(
          "animate-ping absolute inline-flex rounded-full bg-emerald-400 opacity-75",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
        )}
      />
      <span
        className={clsx(
          "relative inline-flex rounded-full bg-emerald-400",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
        )}
      />
    </span>
  );
}
