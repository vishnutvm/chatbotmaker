'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { WizardProvider, useWizard, WIZARD_STEPS } from '@/lib/wizard-context';
import { Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function WizardLayout({ children }: { children: ReactNode }) {
  return (
    <WizardProvider>
      <WizardInner>{children}</WizardInner>
    </WizardProvider>
  );
}

function WizardInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { update } = useWizard();
  const currentIdx = Math.max(0, WIZARD_STEPS.findIndex((s) => pathname.startsWith(s.path)));

  useEffect(() => {
    const step = WIZARD_STEPS[currentIdx];
    if (step) update({ lastStep: step.path });
  }, [currentIdx, update]);


  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">

        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground leading-none">Create a new assistant</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Step {currentIdx + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[currentIdx]?.label}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/assistants" )}>
            <X className="mr-1.5 h-4 w-4" /> Save & exit
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Step rail */}
          <aside className="hidden lg:flex w-[268px] shrink-0 flex-col border-r border-border bg-surface px-5 py-8">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Setup
            </div>
            <ol className="mt-4 space-y-1">
              {WIZARD_STEPS.map((s, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                  <li key={s.id}>
                    <Link
                      href={s.path}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors",
                        active && "bg-primary-subtle text-primary",
                        !active && "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          done && "bg-success text-success-foreground",
                          active && "bg-primary text-primary-foreground",
                          !done && !active && "bg-surface-muted text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </span>
                      <span className="flex-1">
                        <span className={cn("block font-medium", active && "text-primary", done && "text-foreground")}>{s.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{s.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <div className="mt-auto rounded-lg border border-border bg-surface-muted p-3">
              <div className="text-xs font-medium text-foreground">Need help?</div>
              <p className="mt-1 text-[11px] text-muted-foreground">You can change anything later. Nothing is deployed until step 5.</p>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
  );
}
