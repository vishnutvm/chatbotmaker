'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ChatPlayground, PageHeader, type ChatMessage } from '@genie/ui';
import { simulateChatResponse } from '@/lib/mocks/conversations.mock';
import { useWizardStore } from '@/lib/stores/wizard-store';

const TEST_CHECKLIST = [
  'Ask a question about your product',
  'Verify the response uses your knowledge',
  'Try an edge case question',
  'Check the tone feels right',
];

export default function TestStepPage() {
  const router = useRouter();
  const { draft, completeStep } = useWizardStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  async function handleSend(content: string) {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const response = await simulateChatResponse(content);
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: response.content,
      sources: response.sources,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  function handleContinue() {
    completeStep('test');
    router.push('/assistants/new/deploy');
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <PageHeader
          title="Test your assistant"
          description="Ask questions to make sure your assistant responds correctly."
        />
        <ChatPlayground
          messages={messages}
          onSend={handleSend}
          loading={loading}
          welcomeMessage={draft.welcomeMessage}
          className="h-[500px]"
        />
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => router.push('/assistants/new/customize')}>
            ← Back
          </Button>
          <Button onClick={handleContinue}>Continue to Deploy →</Button>
        </div>
      </div>

      <aside className="hidden w-[260px] shrink-0 lg:block">
        <h3 className="mb-4 text-sm font-semibold">Test Checklist</h3>
        <ul className="space-y-3">
          {TEST_CHECKLIST.map((item, i) => (
            <li key={item}>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked.has(i)}
                  onChange={() => {
                    const next = new Set(checked);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    setChecked(next);
                  }}
                  className="mt-0.5 rounded"
                />
                <span className="text-[var(--muted-foreground)]">{item}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => router.push('/assistants/new/customize')}>
            Improve Instructions
          </Button>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => router.push('/assistants/new/teach')}>
            Add More Knowledge
          </Button>
        </div>
      </aside>
    </div>
  );
}
