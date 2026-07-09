import { Suspense } from 'react';
import ConversationsContent from './conversations-content';

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--muted-foreground)]">Loading…</div>}>
      <ConversationsContent />
    </Suspense>
  );
}
