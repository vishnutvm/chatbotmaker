import { AssistantWorkspace } from '@/features/dashboard/pages/assistant-layout';

export default function AssistantDetailLayout({ children }: { children: React.ReactNode }) {
  return <AssistantWorkspace>{children}</AssistantWorkspace>;
}
