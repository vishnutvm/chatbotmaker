import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Create your account" subtitle="Loading…" footer={<span>Please wait</span>}>
          <div className="flex justify-center py-8" role="status" aria-label="Loading">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </AuthShell>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
