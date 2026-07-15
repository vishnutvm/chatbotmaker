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
    <div className="rounded-xl border border-border/80 bg-card p-5.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/15">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-[28px] font-bold tracking-tight text-foreground leading-none">
          {value}
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold leading-none",
              delta.direction === "up" && "bg-success-subtle text-success",
              delta.direction === "down" && "bg-destructive-subtle text-destructive",
              delta.direction === "flat" && "bg-muted text-muted-foreground",
            )}
          >
            {delta.direction === "up" && <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />}
            {delta.direction === "down" && <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />}
            {delta.value}
          </span>
        )}
      </div>
      {hint && <div className="mt-2.5 text-xs text-muted-foreground/80 font-medium">{hint}</div>}
    </div>
  );
}
