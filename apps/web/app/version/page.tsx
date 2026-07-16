import type { VersionResponse } from '@genie/types';

function shortSha(sha: string): string {
  if (!sha || sha === 'unknown') return 'unknown';
  return sha.slice(0, 7);
}

function webVersionPayload(): VersionResponse {
  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    'unknown';

  return {
    service: 'genie-web',
    version: process.env.npm_package_version || '0.2.0',
    gitSha,
    gitShaShort: shortSha(gitSha),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

async function fetchApiVersion(apiBaseUrl: string): Promise<VersionResponse | { error: string }> {
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/version`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    return (await response.json()) as VersionResponse;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'fetch failed' };
  }
}

export const dynamic = 'force-dynamic';

export default async function VersionPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const web = webVersionPayload();
  const api = await fetchApiVersion(apiBaseUrl);

  const apiSha = 'gitShaShort' in api ? api.gitShaShort : null;
  const match =
    apiSha && web.gitShaShort !== 'unknown' && apiSha !== 'unknown'
      ? web.gitShaShort === apiSha
      : null;

  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Genie</p>
          <h1 className="text-3xl font-semibold tracking-tight">Build version</h1>
          <p className="text-sm text-muted-foreground">
            Use this page to confirm which frontend and API builds are live.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cross-check
          </h2>
          {match === null ? (
            <p className="text-sm text-muted-foreground">
              Cannot compare SHAs yet (one side is <code>unknown</code> or API unreachable).
            </p>
          ) : match ? (
            <p className="text-sm font-medium text-emerald-700">
              Web and API short SHAs match ({web.gitShaShort}).
            </p>
          ) : (
            <p className="text-sm font-medium text-amber-700">
              Web ({web.gitShaShort}) and API ({apiSha}) differ — deploys may be out of sync.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            API URL: <code>{apiBaseUrl}</code>
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-base font-semibold">Frontend (Vercel)</h2>
          <VersionTable data={web} />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-base font-semibold">Backend (Railway)</h2>
          {'error' in api ? (
            <p className="text-sm text-destructive">Failed to load API /version: {api.error}</p>
          ) : (
            <VersionTable data={api} />
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Endpoints: <code>/version</code> (this page) · <code>{apiBaseUrl}/version</code> (API JSON)
        </p>
      </div>
    </main>
  );
}

function VersionTable({ data }: { data: VersionResponse }) {
  const rows: Array<[string, string]> = [
    ['Service', data.service],
    ['Version', data.version],
    ['Git SHA', data.gitSha],
    ['Short SHA', data.gitShaShort],
    ['Environment', data.environment],
    ['NODE_ENV', data.nodeEnv],
    ['Checked at', data.timestamp],
  ];

  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-mono break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
