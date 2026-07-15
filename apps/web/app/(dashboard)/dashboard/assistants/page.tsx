import { redirect } from 'next/navigation';

/** Assistants list lives at `/dashboard` for MVP; keep nested routes under `/dashboard/assistants/*`. */
export default function AssistantsIndexRedirect() {
  redirect('/dashboard');
}
