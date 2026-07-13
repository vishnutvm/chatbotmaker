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
    <div className="mx-auto max-w-[720px] px-8 py-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Create your AI assistant</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Let's start with the basics. You can change everything later.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">Assistant name</Label>
          <Input
            id="name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Acme Support"
            className="mt-2 h-11"
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
                    "group flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected
                      ? "border-primary bg-primary-subtle/40 ring-1 ring-primary"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-muted/40",
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                    selected ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground",
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
