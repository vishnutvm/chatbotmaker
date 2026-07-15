import { redirect } from 'next/navigation';

/**
 * MVP: org Analytics UI deferred (Phase 9). Source kept at `features/dashboard/pages/analytics.tsx`.
 */
export default function AnalyticsRedirect() {
  redirect('/dashboard');
}
