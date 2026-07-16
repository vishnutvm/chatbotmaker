'use client';


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAssistantsClient } from "@genie/api-client";
import type { UpdateAssistantRequest } from "@genie/types";
import { getAccessToken, getApiBaseUrl } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useWizard, type Tone } from "@/lib/wizard-context";
import { WizardFooter } from "@/features/dashboard/wizard-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AssistantPreview } from "@/components/common/AssistantPreview";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";



const tones: { id: Tone; label: string; description: string }[] = [
  { id: "friendly", label: "Friendly", description: "Warm and conversational" },
  { id: "professional", label: "Professional", description: "Formal and precise" },
  { id: "helpful", label: "Helpful", description: "Detailed and thorough" },
  { id: "concise", label: "Concise", description: "Short, no fluff" },
  { id: "custom", label: "Custom", description: "Define your own" },
];

export default function Step() {
  const { draft, update, hydrated } = useWizard();
  const { activeOrg } = useAuth();
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && !draft.assistantId) {
      toast.error('Create your assistant first.');
      router.replace('/dashboard/assistants/new/create');
    }
  }, [hydrated, draft.assistantId, router]);

  async function persist(patch: UpdateAssistantRequest) {
    if (!draft.assistantId || !activeOrg) return;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      await client.update(token, activeOrg.id, draft.assistantId, patch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save changes');
    }
  }

  function selectTone(tone: Tone) {
    update({ tone });
    void persist({ tone });
  }

  async function handleContinue() {
    if (!draft.assistantId) {
      toast.error('Create your assistant first.');
      router.push('/dashboard/assistants/new/create');
      return;
    }
    setSubmitting(true);
    await persist({
      name: draft.name,
      welcomeMessage: draft.welcomeMessage,
      tone: draft.tone,
      instructions: draft.instructions,
    });
    setSubmitting(false);
    router.push('/dashboard/assistants/new/test');
  }

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Customize your assistant</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Set the voice and behavior. Changes appear instantly in the preview.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Assistant name</Label>
            <Input
              id="name"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={() => void persist({ name: draft.name })}
              className="mt-2 h-11"
            />
          </div>

          <div>
            <Label htmlFor="welcome" className="text-sm font-medium">Welcome message</Label>
            <Input
              id="welcome"
              value={draft.welcomeMessage}
              onChange={(e) => update({ welcomeMessage: e.target.value })}
              onBlur={() => void persist({ welcomeMessage: draft.welcomeMessage })}
              className="mt-2 h-11"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">The first thing visitors see when they open the chat.</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Tone</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {tones.map((t) => {
                const selected = draft.tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTone(t.id)}
                    className={cn(
                      "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected ? "border-primary bg-primary-subtle/40 ring-1 ring-primary" : "border-border bg-surface hover:bg-surface-muted",
                    )}
                  >
                    <div className="text-sm font-medium text-foreground">{t.label}</div>
                    <div className="text-[11px] text-muted-foreground">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="instructions" className="text-sm font-medium">Primary instructions</Label>
            <Textarea
              id="instructions"
              value={draft.instructions}
              onChange={(e) => update({ instructions: e.target.value })}
              onBlur={() => void persist({ instructions: draft.instructions })}
              className="mt-2 min-h-[140px]"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Guide the assistant's behavior. Keep it short and specific.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
            Advanced settings
          </button>

          {showAdvanced && (
            <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium">Model</Label>
                <Input defaultValue="Cohere Balanced (recommended)" className="mt-2 h-10" />
              </div>
              <div>
                <Label className="text-sm font-medium">Temperature</Label>
                <Input type="number" defaultValue={0.4} step={0.1} min={0} max={1} className="mt-2 h-10 w-32" />
              </div>
              <div>
                <Label className="text-sm font-medium">Fallback message</Label>
                <Input defaultValue="I'm not sure — let me connect you with a human." className="mt-2 h-10" />
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Live preview</div>
          <AssistantPreview />
        </div>
      </div>

      <WizardFooter
        backTo="/dashboard/assistants/new/teach"
        nextLabel={submitting ? 'Saving…' : 'Continue to test'}
        nextDisabled={submitting}
        onNext={handleContinue}
      />
    </div>
  );
}
