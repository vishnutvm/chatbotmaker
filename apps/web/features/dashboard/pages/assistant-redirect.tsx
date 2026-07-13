import { redirect } from 'next/navigation';

export default async function AssistantIndexRedirect({
  params,
}: {
  params: Promise<{ assistantId: string }>;
}) {
  const { assistantId } = await params;
  redirect(`/dashboard/assistants/${assistantId}/overview`);
}
