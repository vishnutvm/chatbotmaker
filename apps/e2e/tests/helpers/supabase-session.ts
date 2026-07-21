import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readEnv } from './env';

const MAX_SIGNUP_ATTEMPTS = 3;

function getSupabaseClientConfig(): { url: string; anonKey: string } {
  const url = readEnv('E2E_SUPABASE_URL');
  const anonKey = readEnv('E2E_SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    throw new Error('E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY are required for Supabase-backed auth');
  }
  return { url, anonKey };
}

function getServiceRoleKey(): string | undefined {
  return readEnv('E2E_SUPABASE_SERVICE_ROLE_KEY') ?? readEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function hasServiceRoleForE2E(): boolean {
  return Boolean(getServiceRoleKey() && readEnv('E2E_SUPABASE_URL'));
}

function createAdminClient(): SupabaseClient {
  const { url } = getSupabaseClientConfig();
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) {
    throw new Error(
      'E2E_SUPABASE_SERVICE_ROLE_KEY is required to confirm users when email confirmation is enabled',
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Confirm email for a Supabase Auth user (no inbox required). */
export async function confirmUserEmailById(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) {
    throw new Error(`Failed to confirm Supabase user ${userId}: ${error.message}`);
  }
}

/** Real Supabase access token — used when the API verifies JWTs via JWKS (hosted Supabase). */
export async function createSupabaseAccessToken(
  email: string,
  password: string,
): Promise<{ token: string; supabaseUserId: string }> {
  const { url, anonKey } = getSupabaseClientConfig();
  const supabase = createClient(url, anonKey);
  const serviceKey = getServiceRoleKey();

  if (serviceKey) {
    const admin = createAdminClient();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'API E2E User' },
    });
    if (created.error) {
      throw new Error(`Supabase admin createUser failed: ${created.error.message}`);
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.access_token || !data.user?.id) {
      throw new Error(`Supabase signIn after admin create failed: ${error?.message ?? 'no session'}`);
    }
    return { token: data.session.access_token, supabaseUserId: data.user.id };
  }

  let lastError = 'unknown';

  for (let attempt = 1; attempt <= MAX_SIGNUP_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: 'API E2E User' } },
    });

    if (error) {
      lastError = error.message;
      if (/rate limit|too many requests|over_email_send_rate_limit/i.test(error.message) && attempt < MAX_SIGNUP_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
        continue;
      }
      throw new Error(`Supabase signUp failed: ${error.message}`);
    }

    const token = data.session?.access_token;
    const supabaseUserId = data.user?.id;
    if (!token || !supabaseUserId) {
      throw new Error(
        `Supabase signUp returned no session (email confirmation may be required). ` +
          `Set E2E_SUPABASE_SERVICE_ROLE_KEY or disable Confirm email in Supabase Auth. ` +
          `user=${data.user?.id ?? 'null'} session=${data.session ? 'present' : 'missing'}`,
      );
    }

    return { token, supabaseUserId };
  }

  throw new Error(`Supabase signUp failed after retries: ${lastError}`);
}

export async function signOutSupabase(): Promise<void> {
  const url = readEnv('E2E_SUPABASE_URL');
  const anonKey = readEnv('E2E_SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    return;
  }
  const supabase = createClient(url, anonKey);
  await supabase.auth.signOut();
}
