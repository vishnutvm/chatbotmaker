import { createClient } from '@supabase/supabase-js';
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

/** Real Supabase access token — used when the API verifies JWTs via JWKS (hosted Supabase). */
export async function createSupabaseAccessToken(
  email: string,
  password: string,
): Promise<{ token: string; supabaseUserId: string }> {
  const { url, anonKey } = getSupabaseClientConfig();
  const supabase = createClient(url, anonKey);

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
