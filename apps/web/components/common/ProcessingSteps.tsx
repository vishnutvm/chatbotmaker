import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProcessStep {
  label: string;
  status: "done" | "active" | "pending";
}

export function ProcessingSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, idx) => (
        <li key={idx} className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
              s.status === "done" && "bg-success text-success-foreground",
              s.status === "active" && "bg-primary-subtle text-primary",
              s.status === "pending" && "bg-surface-muted text-muted-foreground",
            )}
          >
            {s.status === "done" ? (
              <Check className="h-3.5 w-3.5" />
            ) : s.status === "active" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              idx + 1
            )}
          </div>
          <span
            className={cn(
              "text-sm",
              s.status === "pending" ? "text-muted-foreground" : "text-foreground font-medium",
            )}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
