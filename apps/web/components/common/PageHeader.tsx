import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
