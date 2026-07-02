import { AppShell } from '@genie/ui';

export default function DashboardPage() {
  return (
    <AppShell title="ChatbotMaker Dashboard">
      <p style={{ color: '#666' }}>
        Auth shell placeholder — Sprint 1 foundation. Authentication ships in Phase 2.
      </p>
      <ul style={{ marginTop: '1rem', lineHeight: 1.8 }}>
        <li>Loading state — N/A (static shell)</li>
        <li>Error state — N/A (static shell)</li>
        <li>Empty state — shown above</li>
      </ul>
    </AppShell>
  );
}
