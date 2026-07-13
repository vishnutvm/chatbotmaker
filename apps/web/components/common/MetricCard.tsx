import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function MetricCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">
          {value}
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta.direction === "up" && "text-success",
              delta.direction === "down" && "text-destructive",
              delta.direction === "flat" && "text-muted-foreground",
            )}
          >
            {delta.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
            {delta.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
