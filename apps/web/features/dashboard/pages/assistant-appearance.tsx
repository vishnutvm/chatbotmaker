'use client';


import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AssistantPreview } from "@/components/common/AssistantPreview";
import { WizardProvider } from "@/lib/wizard-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";



const positions = ["Bottom right", "Bottom left", "Top right", "Top left"] as const;

export default function Appearance() {
  const [color, setColor] = useState("#6366F1");
  const [position, setPosition] = useState<(typeof positions)[number]>("Bottom right");
  const [welcome, setWelcome] = useState("Hi! I'm here to help. What can I answer?");

  return (
    <WizardProvider>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            <p className="text-sm text-muted-foreground">Match the assistant to your brand.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
            <div>
              <Label className="text-sm font-medium">Brand color</Label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border"
                  aria-label="Brand color"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 max-w-[140px] font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Widget position</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {positions.map((p) => {
                  const selected = position === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPosition(p)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        selected
                          ? "border-primary bg-primary-subtle text-primary"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-muted",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Welcome message</Label>
              <Input value={welcome} onChange={(e) => setWelcome(e.target.value)} className="mt-2 h-10" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setColor("#6366F1"); setPosition("Bottom right"); }}>Discard</Button>
              <Button onClick={() => toast.success("Appearance saved")}>Save changes</Button>
            </div>
          </div>
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Live preview</div>
          <AssistantPreview brandColor={color} />
        </div>
      </div>
    </WizardProvider>
  );
}
