'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AssistantDraft, AssistantPurpose, AssistantTone } from '@genie/types';
import type { WizardStepId } from '@genie/ui';
import { DEFAULT_DRAFT } from '../mocks/assistants.mock';

interface WizardState {
  draft: AssistantDraft;
  completedSteps: WizardStepId[];
  setName: (name: string) => void;
  setPurpose: (purpose: AssistantPurpose) => void;
  setDescription: (description: string) => void;
  setWelcomeMessage: (message: string) => void;
  setTone: (tone: AssistantTone) => void;
  setInstructions: (instructions: string) => void;
  setAppearance: (appearance: Partial<AssistantDraft['appearance']>) => void;
  addKnowledgeSource: (source: AssistantDraft['knowledgeSources'][0]) => void;
  completeStep: (step: WizardStepId) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      draft: DEFAULT_DRAFT,
      completedSteps: [],
      setName: (name) => set((s) => ({ draft: { ...s.draft, name } })),
      setPurpose: (purpose) => set((s) => ({ draft: { ...s.draft, purpose } })),
      setDescription: (description) => set((s) => ({ draft: { ...s.draft, description } })),
      setWelcomeMessage: (welcomeMessage) => set((s) => ({ draft: { ...s.draft, welcomeMessage } })),
      setTone: (tone) => set((s) => ({ draft: { ...s.draft, tone } })),
      setInstructions: (instructions) => set((s) => ({ draft: { ...s.draft, instructions } })),
      setAppearance: (appearance) =>
        set((s) => ({ draft: { ...s.draft, appearance: { ...s.draft.appearance, ...appearance } } })),
      addKnowledgeSource: (source) =>
        set((s) => ({
          draft: { ...s.draft, knowledgeSources: [...s.draft.knowledgeSources, source] },
        })),
      completeStep: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(step)
            ? s.completedSteps
            : [...s.completedSteps, step],
        })),
      reset: () => set({ draft: DEFAULT_DRAFT, completedSteps: [] }),
    }),
    { name: 'genie-wizard-draft' },
  ),
);
