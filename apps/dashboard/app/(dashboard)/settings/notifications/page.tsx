'use client';

import { Button, PageHeader } from '@genie/ui';

export default function NotificationsSettingsPage() {
  const notifications = [
    { id: '1', label: 'New conversations', description: 'When a visitor starts a new conversation', enabled: true },
    { id: '2', label: 'Unresolved conversations', description: 'When a conversation needs attention', enabled: true },
    { id: '3', label: 'Weekly summary', description: 'Weekly performance report', enabled: false },
    { id: '4', label: 'Knowledge sync alerts', description: 'When knowledge sources need attention', enabled: true },
  ];

  return (
    <div>
      <PageHeader title="Notifications" description="Choose what updates you receive." />
      <div className="max-w-lg space-y-4">
        {notifications.map((n) => (
          <label
            key={n.id}
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] p-4"
          >
            <input type="checkbox" defaultChecked={n.enabled} className="mt-1 rounded" />
            <div>
              <p className="text-sm font-medium">{n.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{n.description}</p>
            </div>
          </label>
        ))}
        <Button>Save Preferences</Button>
      </div>
    </div>
  );
}
