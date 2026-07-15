import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info" | "neutral" | "primary";

const styles: Record<Tone, string> = {
  success: "bg-success-subtle/80 text-success border border-success/15",
  warning: "bg-warning-subtle/80 text-warning border border-warning/15",
  error: "bg-destructive-subtle/10 text-destructive border border-destructive/10",
  info: "bg-info-subtle/80 text-info border border-info/15",
  neutral: "bg-muted/60 text-muted-foreground border border-border",
  primary: "bg-primary-subtle/80 text-primary border border-primary/15",
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none shadow-2xs",
        styles[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.25 w-1.25 rounded-full shadow-2xs",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "error" && "bg-destructive",
            tone === "info" && "bg-info",
            tone === "neutral" && "bg-muted-foreground/60",
            tone === "primary" && "bg-primary",
          )}
        />
      )}
      {children}
    </span>
  );
}
