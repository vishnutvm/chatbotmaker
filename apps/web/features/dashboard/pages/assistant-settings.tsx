'use client';

import { useParams } from 'next/navigation';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";



export default function AsstSettings() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground">General</h2>
        <div>
          <Label className="text-sm font-medium">Assistant ID</Label>
          <Input readOnly defaultValue={id} className="mt-2 h-10 font-mono text-sm" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <div className="text-sm font-medium text-foreground">Human handoff</div>
            <div className="text-xs text-muted-foreground">Route to a human when the assistant can't help.</div>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <div className="text-sm font-medium text-foreground">Collect visitor email</div>
            <div className="text-xs text-muted-foreground">Ask for email before starting a conversation.</div>
          </div>
          <Switch />
        </div>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-surface p-6">
        <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">Deleting this assistant is permanent.</p>
        <Button variant="destructive" className="mt-4">Delete assistant</Button>
      </div>
    </div>
  );
}
