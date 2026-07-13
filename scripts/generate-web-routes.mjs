import fs from 'node:fs';
import path from 'node:path';

const APP = path.resolve('c:/Users/USER/Desktop/My WORLD/MVP_ai_chatbot/apps/web/app/(dashboard)/dashboard');

const pages = [
  ['page.tsx', '@/features/dashboard/pages/dashboard-home'],
  ['assistants/page.tsx', '@/features/dashboard/pages/assistants-list'],
  ['assistants/new/create/page.tsx', '@/features/dashboard/pages/wizard-create'],
  ['assistants/new/teach/page.tsx', '@/features/dashboard/pages/wizard-teach'],
  ['assistants/new/customize/page.tsx', '@/features/dashboard/pages/wizard-customize'],
  ['assistants/new/test/page.tsx', '@/features/dashboard/pages/wizard-test'],
  ['assistants/new/deploy/page.tsx', '@/features/dashboard/pages/wizard-deploy'],
  ['assistants/[assistantId]/page.tsx', '@/features/dashboard/pages/assistant-redirect'],
  ['assistants/[assistantId]/overview/page.tsx', '@/features/dashboard/pages/assistant-overview'],
  ['assistants/[assistantId]/knowledge/page.tsx', '@/features/dashboard/pages/assistant-knowledge'],
  ['assistants/[assistantId]/instructions/page.tsx', '@/features/dashboard/pages/assistant-instructions'],
  ['assistants/[assistantId]/appearance/page.tsx', '@/features/dashboard/pages/assistant-appearance'],
  ['assistants/[assistantId]/actions/page.tsx', '@/features/dashboard/pages/assistant-actions'],
  ['assistants/[assistantId]/conversations/page.tsx', '@/features/dashboard/pages/assistant-conversations'],
  ['assistants/[assistantId]/analytics/page.tsx', '@/features/dashboard/pages/assistant-analytics'],
  ['assistants/[assistantId]/test/page.tsx', '@/features/dashboard/pages/assistant-test'],
  ['assistants/[assistantId]/deploy/page.tsx', '@/features/dashboard/pages/assistant-deploy'],
  ['assistants/[assistantId]/settings/page.tsx', '@/features/dashboard/pages/assistant-settings'],
  ['conversations/page.tsx', '@/features/dashboard/pages/conversations-list'],
  ['conversations/[conversationId]/page.tsx', '@/features/dashboard/pages/conversation-detail'],
  ['analytics/page.tsx', '@/features/dashboard/pages/analytics'],
  ['integrations/page.tsx', '@/features/dashboard/pages/integrations'],
  ['billing/page.tsx', '@/features/dashboard/pages/billing'],
  ['settings/page.tsx', '@/features/dashboard/pages/settings'],
  ['team/page.tsx', '@/features/dashboard/pages/team'],
  ['help/page.tsx', '@/features/dashboard/pages/settings'],
];

for (const [rel, mod] of pages) {
  const file = path.join(APP, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const content = `export { default } from '${mod}';\n`;
  fs.writeFileSync(file, content);
  console.log('Created', rel);
}
