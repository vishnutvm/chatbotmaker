'use client';

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Instructions() {
  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Instructions</h2>
        <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Shape how your assistant thinks and responds.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-ambient">
        <div>
          <Label className="text-sm font-semibold text-foreground">System instructions</Label>
          <Textarea defaultValue="You are Acme Support. Be warm, concise and always cite the relevant help doc. Escalate to a human when the user asks for a refund." className="mt-2 min-h-[180px] rounded-xl border-border/80 text-sm focus-visible:ring-primary/20 bg-muted/20" />
        </div>
        <div>
          <Label className="text-sm font-semibold text-foreground">Fallback message</Label>
          <Textarea defaultValue="I'm not sure — let me connect you with a human." className="mt-2 min-h-[60px] rounded-xl border-border/80 text-sm focus-visible:ring-primary/20 bg-muted/20" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-xl text-xs font-bold border-border/80 hover:bg-muted/80">Discard</Button>
          <Button className="rounded-xl text-xs font-bold shadow-xs active:scale-98">Save changes</Button>
        </div>
      </div>
    </div>
  );
}
