'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/features/marketing/theme-provider';

const CYCLE = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
];

/** Compact theme control for dashboard chrome (shares chatbot-theme with marketing). */
export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const index = Math.max(
    0,
    CYCLE.findIndex((t) => t.value === theme),
  );
  const current = CYCLE[index] ?? CYCLE[0];
  const Icon = current.icon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-testid="dashboard-theme-toggle"
      className="h-9 w-9 text-muted-foreground/80 hover:text-foreground"
      aria-label={`Theme: ${current.label}. Click to switch.`}
      title={`Theme: ${current.label}`}
      onClick={() => {
        const next = CYCLE[(index + 1) % CYCLE.length];
        setTheme(next.value);
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
