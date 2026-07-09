'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@genie/ui';

const ACTION_TEMPLATES = [
  { id: '1', name: 'Check Order Status', description: 'Look up order details by order ID' },
  { id: '2', name: 'Create Support Ticket', description: 'Open a new support ticket' },
  { id: '3', name: 'Schedule Appointment', description: 'Book a meeting or call' },
  { id: '4', name: 'Fetch Customer Info', description: 'Retrieve customer profile data' },
];

export default function ActionsPage() {
  const params = useParams();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <PageHeader
        title="AI Actions"
        description="Let your assistant perform operations like checking orders or creating tickets."
        action={<Button onClick={() => setShowCreate(true)}>Create Action</Button>}
      />

      {showCreate ? (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 font-semibold">Choose a template or create custom</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACTION_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4 text-left hover:border-[var(--primary)]"
              >
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button>Configure API →</Button>
          </div>
        </Card>
      ) : null}

      <EmptyState
        title="No actions configured"
        description="Create actions to let your assistant check orders, create tickets, and more."
        action={<Button onClick={() => setShowCreate(true)}>Create Action</Button>}
      />
    </div>
  );
}
