'use client';


import { useWizard } from "@/lib/wizard-context";
import { WizardFooter } from "@/features/dashboard/wizard-footer";
import { purposes } from "@/lib/mock/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";



export default function Step() {
  const { draft, update } = useWizard();
  return (
    <div className="mx-auto max-w-[720px] px-8 py-10 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Create your AI assistant</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Let&apos;s start with the basics. You can change everything later.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">Assistant name</Label>
          <Input
            id="name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Acme Support"
            className="mt-2 h-11 rounded-xl"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Shown in the chat header and analytics.</p>
        </div>

        <div>
          <Label className="text-sm font-medium">What should your assistant help with?</Label>
          <p className="mt-1 text-xs text-muted-foreground">Choose a template to get smart defaults.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {purposes.map((p) => {
              const Icon = (Icons as any)[p.icon] as Icons.LucideIcon;
              const selected = draft.purpose === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => update({ purpose: p.id })}
                  className={cn(
                    "group flex items-start gap-3 rounded-2xl border p-4 text-left shadow-ambient transition-all duration-200",
                    "focus-ring",
                    selected
                      ? "border-primary bg-primary-subtle/40 ring-2 ring-primary/25"
                      : "border-border bg-card hover:border-primary/20 hover:bg-muted/20 hover:shadow-md",
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    selected ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-muted text-foreground group-hover:bg-primary-subtle group-hover:text-primary",
                  )}>
                    {Icon && <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{p.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <WizardFooter
        nextTo="/dashboard/assistants/new/teach"
        nextLabel="Continue to teach"
        nextDisabled={!draft.name.trim()}
      />
    </div>
  );
}
