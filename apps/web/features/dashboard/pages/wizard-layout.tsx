'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { WizardProvider, useWizard, WIZARD_STEPS } from '@/lib/wizard-context';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GenieLogo } from '@/components/brand/GenieLogo';

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
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <GenieLogo className="h-8 w-8 text-[#5A5CE6]" />
            <div>
              <div className="text-sm font-semibold text-foreground leading-none tracking-tight">Create a new assistant</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Step {currentIdx + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[currentIdx]?.label}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => router.push("/dashboard/assistants")}>
            <X className="mr-1.5 h-4 w-4" /> Save & exit
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Step rail */}
          <aside className="hidden lg:flex w-[268px] shrink-0 flex-col border-r border-border bg-card px-5 py-8">
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
                        "flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-all",
                        active && "bg-primary-subtle text-primary shadow-xs",
                        !active && "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                          done && "bg-success text-success-foreground shadow-[0_0_12px_-2px] shadow-success/50",
                          active && "bg-primary text-primary-foreground shadow-[0_0_12px_-2px] shadow-primary/50 ring-2 ring-primary/20",
                          !done && !active && "bg-muted text-muted-foreground",
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
            <div className="mt-auto rounded-2xl border border-border bg-muted/40 p-3.5 shadow-ambient">
              <div className="text-xs font-medium text-foreground">Need help?</div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">You can change anything later. Nothing is deployed until step 5.</p>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
  );
}
