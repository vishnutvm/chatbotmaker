import type { VersionResponse } from '@genie/types';

/** Resolve git SHA from common CI/host env vars (Railway, Vercel, local). */
export function resolveGitSha(env: NodeJS.ProcessEnv = process.env): string {
  const raw =
    env.GIT_COMMIT_SHA ||
    env.RAILWAY_GIT_COMMIT_SHA ||
    env.VERCEL_GIT_COMMIT_SHA ||
    env.SOURCE_COMMIT ||
    env.COMMIT_SHA ||
    '';
  const sha = raw.trim();
  return sha || 'unknown';
}

export function shortSha(sha: string): string {
  if (!sha || sha === 'unknown') return 'unknown';
  return sha.slice(0, 7);
}

export function buildVersionPayload(input: {
  service: string;
  version: string;
  env?: NodeJS.ProcessEnv;
}): VersionResponse {
  const env = input.env ?? process.env;
  const gitSha = resolveGitSha(env);
  return {
    service: input.service,
    version: input.version,
    gitSha,
    gitShaShort: shortSha(gitSha),
    environment:
      env.RAILWAY_ENVIRONMENT_NAME ||
      env.VERCEL_ENV ||
      env.APP_ENV ||
      env.NODE_ENV ||
      'unknown',
    nodeEnv: env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  };
}
