'use client';


import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";



export default function Instructions() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
        <p className="text-sm text-muted-foreground">Shape how your assistant thinks and responds.</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
        <div>
          <Label className="text-sm font-medium">System instructions</Label>
          <Textarea defaultValue="You are Acme Support. Be warm, concise and always cite the relevant help doc. Escalate to a human when the user asks for a refund." className="mt-2 min-h-[180px]" />
        </div>
        <div>
          <Label className="text-sm font-medium">Fallback message</Label>
          <Textarea defaultValue="I'm not sure — let me connect you with a human." className="mt-2 min-h-[60px]" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Discard</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
