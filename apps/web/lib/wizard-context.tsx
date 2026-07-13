import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { K_WIZARD } from "@/lib/store";

export type Tone = "friendly" | "professional" | "helpful" | "concise" | "custom";

export interface AssistantDraft {
  name: string;
  purpose: string;
  welcomeMessage: string;
  tone: Tone;
  instructions: string;
  knowledgeUrl: string;
  importedPages: number;
  lastStep: string;
}

interface WizardCtx {
  draft: AssistantDraft;
  update: (patch: Partial<AssistantDraft>) => void;
  reset: () => void;
  hydrated: boolean;
}

const initialDraft: AssistantDraft = {
  name: "",
  purpose: "support",
  welcomeMessage: "Hi! I'm here to help. What can I answer for you today?",
  tone: "friendly",
  instructions: "Be concise, warm and always link to a source when possible. If you don't know the answer, offer to connect a human.",
  knowledgeUrl: "",
  importedPages: 0,
  lastStep: "/dashboard/assistants/new/create",
};

const Ctx = createContext<WizardCtx | null>(null);

const isBrowser = typeof window !== "undefined";

function loadDraft(): AssistantDraft {
  if (!isBrowser) return initialDraft;
  try {
    const raw = window.localStorage.getItem(K_WIZARD);
    if (!raw) return initialDraft;
    return { ...initialDraft, ...JSON.parse(raw) };
  } catch {
    return initialDraft;
  }
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<AssistantDraft>(initialDraft);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);

  const skipPersist = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(K_WIZARD, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, hydrated]);

  const value = useMemo<WizardCtx>(
    () => ({
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      reset: () => {
        setDraft(initialDraft);
        if (isBrowser) {
          try { window.localStorage.removeItem(K_WIZARD); } catch { /* ignore */ }
        }
      },
      hydrated,
    }),
    [draft, hydrated],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWizard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}

export const WIZARD_STEPS = [
  { id: "create", label: "Create", path: "/dashboard/assistants/new/create", description: "Name and purpose" },
  { id: "teach", label: "Teach", path: "/dashboard/assistants/new/teach", description: "Add knowledge" },
  { id: "customize", label: "Customize", path: "/dashboard/assistants/new/customize", description: "Voice and tone" },
  { id: "test", label: "Test", path: "/dashboard/assistants/new/test", description: "Try it out" },
  { id: "deploy", label: "Deploy", path: "/dashboard/assistants/new/deploy", description: "Go live" },
] as const;
