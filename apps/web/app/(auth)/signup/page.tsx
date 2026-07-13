import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
