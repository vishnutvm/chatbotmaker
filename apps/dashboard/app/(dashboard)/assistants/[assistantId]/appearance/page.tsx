'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AssistantPreview, Button, Input, PageHeader } from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';
import { toast } from 'sonner';

export default function AppearancePage() {
  const params = useParams();
  const assistant = getAssistantById(params.assistantId as string);
  const [color, setColor] = useState(assistant?.appearance.primaryColor ?? '#6366F1');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(
    assistant?.appearance.position ?? 'bottom-right',
  );

  if (!assistant) return null;

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <PageHeader title="Appearance" description="Customize how your assistant looks on your website." />

        <div className="space-y-6">
          <div>
            <label htmlFor="color" className="mb-1.5 block text-sm font-medium">Primary Color</label>
            <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Widget Position</label>
            <div className="flex gap-2">
              {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`rounded-md border px-4 py-2 text-sm capitalize ${
                    position === pos
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'border-[var(--border)]'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Welcome Bubble</label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={assistant.appearance.showWelcomeBubble} />
              Show welcome message bubble
            </label>
          </div>

          <Button onClick={() => toast.success('Appearance saved')}>Save Changes</Button>
        </div>
      </div>

      <aside className="hidden w-[280px] shrink-0 lg:block">
        <AssistantPreview
          name={assistant.name}
          welcomeMessage={assistant.welcomeMessage}
          primaryColor={color}
          position={position}
        />
      </aside>
    </div>
  );
}
