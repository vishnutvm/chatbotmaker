'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createOrganizationsClient } from '@genie/api-client';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { ensureOnboarded, mapAuthError } from '@/lib/auth-flow';
import { getAccessToken, getApiBaseUrl, getSession } from '@/lib/supabase';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'working' | 'need-auth' | 'done'>('working');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setError('Invalid invitation link');
        setStatus('need-auth');
        return;
      }

      const session = await getSession();
      if (!session) {
        if (!cancelled) {
          setStatus('need-auth');
        }
        return;
      }

      try {
        await ensureOnboarded(session.access_token);
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error('Not signed in');
        const client = createOrganizationsClient(getApiBaseUrl());
        await client.acceptInvitation(accessToken, { token });
        if (!cancelled) {
          setStatus('done');
          router.replace('/dashboard/team');
        }
      } catch (err) {
        if (!cancelled) {
          setError(mapAuthError(err, 'Could not accept invitation'));
          setStatus('need-auth');
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === 'done') {
    return (
      <AuthShell title="Joined company" subtitle="Redirecting to Team…" footer={<span>Please wait</span>}>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthShell>
    );
  }

  if (status === 'need-auth') {
    const signupHref = `/signup?invite=${encodeURIComponent(token ?? '')}`;
    const loginHref = `/login?invite=${encodeURIComponent(token ?? '')}`;
    return (
      <AuthShell
        title="Accept invitation"
        subtitle="Sign in or create an account with the invited email to join this company."
        footer={
          <>
            Already have an account? <AuthLink href={loginHref}>Sign in</AuthLink>
          </>
        }
      >
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        <Button asChild className="w-full h-11">
          <a href={signupHref}>Create account &amp; join</a>
        </Button>
        <Button asChild variant="outline" className="mt-3 w-full h-11">
          <a href={loginHref}>Sign in &amp; join</a>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Accepting invitation" subtitle="Please wait…" footer={<span>Joining company</span>}>
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </AuthShell>
  );
}
