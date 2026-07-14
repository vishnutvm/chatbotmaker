'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { mapAuthError } from '@/lib/auth-flow';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw resetError;
      setSuccess('Check your email for a password reset link.');
    } catch (err) {
      setError(mapAuthError(err, 'Could not send reset email. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a link to reset your password."
      footer={
        <>
          Remembered it? <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" data-testid="forgot-password-form">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="forgot-email">
            Email
          </label>
          <Input
            id="forgot-email"
            data-testid="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}
        <Button type="submit" data-testid="forgot-submit" disabled={loading} className="w-full h-11">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
