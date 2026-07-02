import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  children?: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}
