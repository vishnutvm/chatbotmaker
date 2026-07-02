import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatbotMaker Dashboard',
  description: 'Manage your AI assistants',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
