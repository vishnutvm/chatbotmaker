'use client';

import { useParams } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function AsstSettings() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-ambient">
        <h2 className="text-base font-bold text-foreground tracking-tight border-b border-border/60 pb-3">General Settings</h2>
        <div>
          <Label className="text-sm font-semibold text-foreground">Assistant ID</Label>
          <Input readOnly defaultValue={id} className="mt-2 h-10 font-mono text-sm rounded-xl border-border/80 bg-muted/30 focus-visible:ring-primary/10 select-all" />
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Human handoff</div>
            <div className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Route to a human when the assistant can't help.</div>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Collect visitor email</div>
            <div className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Ask for email before starting a conversation.</div>
          </div>
          <Switch />
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-ambient">
        <h2 className="text-base font-bold text-destructive tracking-tight">Danger zone</h2>
        <p className="mt-1 text-xs text-muted-foreground/85 font-medium">Deleting this assistant is permanent and cannot be undone.</p>
        <Button variant="destructive" className="mt-4 rounded-xl text-xs font-bold shadow-xs active:scale-98">Delete assistant</Button>
      </div>
    </div>
  );
}
