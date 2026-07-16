import { redirect } from 'next/navigation';

/** Reserved path — must not fall through to `[assistantId]=new`. */
export default function NewAssistantEntryPage() {
  redirect('/dashboard/assistants/new/create');
}
