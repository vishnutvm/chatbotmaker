import fs from 'node:fs';
import path from 'node:path';

const SOURCE = path.resolve(
  'c:/Users/USER/Desktop/My WORLD/agentbloom-io/src/routes',
);
const OUT = path.resolve(
  'c:/Users/USER/Desktop/My WORLD/MVP_ai_chatbot/apps/web/features/dashboard/pages',
);

const ROUTE_MAP = [
  ['_app.dashboard.tsx', 'dashboard-home.tsx'],
  ['_app.assistants.index.tsx', 'assistants-list.tsx'],
  ['_app.assistants.new.tsx', 'wizard-layout.tsx'],
  ['_app.assistants.new.create.tsx', 'wizard-create.tsx'],
  ['_app.assistants.new.teach.tsx', 'wizard-teach.tsx'],
  ['_app.assistants.new.customize.tsx', 'wizard-customize.tsx'],
  ['_app.assistants.new.test.tsx', 'wizard-test.tsx'],
  ['_app.assistants.new.deploy.tsx', 'wizard-deploy.tsx'],
  ['_app.assistants.$id.tsx', 'assistant-layout.tsx'],
  ['_app.assistants.$id.index.tsx', 'assistant-redirect.tsx'],
  ['_app.assistants.$id.overview.tsx', 'assistant-overview.tsx'],
  ['_app.assistants.$id.knowledge.tsx', 'assistant-knowledge.tsx'],
  ['_app.assistants.$id.instructions.tsx', 'assistant-instructions.tsx'],
  ['_app.assistants.$id.appearance.tsx', 'assistant-appearance.tsx'],
  ['_app.assistants.$id.actions.tsx', 'assistant-actions.tsx'],
  ['_app.assistants.$id.conversations.tsx', 'assistant-conversations.tsx'],
  ['_app.assistants.$id.analytics.tsx', 'assistant-analytics.tsx'],
  ['_app.assistants.$id.test.tsx', 'assistant-test.tsx'],
  ['_app.assistants.$id.deploy.tsx', 'assistant-deploy.tsx'],
  ['_app.assistants.$id.settings.tsx', 'assistant-settings.tsx'],
  ['_app.conversations.index.tsx', 'conversations-list.tsx'],
  ['_app.conversations.$id.tsx', 'conversation-detail.tsx'],
  ['_app.analytics.tsx', 'analytics.tsx'],
  ['_app.integrations.tsx', 'integrations.tsx'],
  ['_app.billing.tsx', 'billing.tsx'],
  ['_app.settings.tsx', 'settings.tsx'],
  ['_app.team.tsx', 'team.tsx'],
];

function convert(content, fileName) {
  let out = content;

  // Remove TanStack route boilerplate
  out = out.replace(/import\s*\{[^}]*createFileRoute[^}]*\}\s*from\s*"@tanstack\/react-router";\n?/g, '');
  out = out.replace(/export const Route = createFileRoute\([^)]*\)\(\{[\s\S]*?\}\);\n?/g, '');
  out = out.replace(/head:\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\),?\n?/g, '');

  // Imports
  if (!out.includes("'use client'")) {
    out = `'use client';\n\n${out}`;
  }

  out = out.replace(
    /import\s*\{([^}]*)\}\s*from\s*"@tanstack\/react-router";/g,
    (_, imports) => {
      const parts = imports.split(',').map((s) => s.trim());
      const nextImports = [];
      const routerImports = [];

      for (const p of parts) {
        if (p === 'Link') nextImports.push('Link');
        if (p === 'Outlet') routerImports.push('children');
        if (p === 'useRouterState' || p === 'useNavigate') routerImports.push(p);
        if (p === 'useParams') routerImports.push('useParams');
      }

      let result = '';
      if (nextImports.length) result += `import Link from 'next/link';\n`;
      if (routerImports.length) {
        const hooks = new Set();
        if (parts.includes('useRouterState')) hooks.add('usePathname');
        if (parts.includes('useNavigate')) hooks.add('useRouter');
        if (parts.includes('useParams')) hooks.add('useParams');
        if (hooks.size) result += `import { ${[...hooks].join(', ')} } from 'next/navigation';\n`;
      }
      return result;
    },
  );

  out = out.replace(/import\s*Link\s*from\s*"@tanstack\/react-router";\n?/g, `import Link from 'next/link';\n`);
  out = out.replace(/import\s*\{[^}]*Link[^}]*\}\s*from\s*"@tanstack\/react-router";\n?/g, `import Link from 'next/link';\n`);

  // Link API
  out = out.replace(/\bto="/g, 'href="');
  out = out.replace(/\bto=\{/g, 'href={');
  out = out.replace(/<Link([^>]*)\s+params=\{[^}]+\}/g, '<Link$1');

  // Path prefix for dashboard routes
  const pathReplacements = [
    [/\/assistants\/new\//g, '/dashboard/assistants/new/'],
    [/\/assistants\/new"/g, '/dashboard/assistants/new"'],
    [/\/assistants\/\$id\//g, '/dashboard/assistants/'],
    [/\/assistants\/\$id"/g, '/dashboard/assistants/'],
    [/"\/assistants"/g, '"/dashboard/assistants"'],
    [/'\/assistants'/g, "'/dashboard/assistants'"],
    [/\/assistants\//g, '/dashboard/assistants/'],
    [/"\/dashboard"/g, '"/dashboard"'],
    [/"\/conversations"/g, '"/dashboard/conversations"'],
    [/\/conversations\//g, '/dashboard/conversations/'],
    [/"\/analytics"/g, '"/dashboard/analytics"'],
    [/"\/integrations"/g, '"/dashboard/integrations"'],
    [/"\/billing"/g, '"/dashboard/billing"'],
    [/"\/settings"/g, '"/dashboard/settings"'],
    [/"\/team"/g, '"/dashboard/team"'],
    [/"\/dashboard"/g, '"/dashboard"'],
  ];

  for (const [from, to] of pathReplacements) {
    out = out.replace(from, to);
  }

  // Router hooks
  out = out.replace(
    /const pathname = useRouterState\(\{\s*select:\s*\(s\)\s*=>\s*s\.location\.pathname\s*\}\);/g,
    'const pathname = usePathname();',
  );
  out = out.replace(/const navigate = useNavigate\(\);/g, 'const router = useRouter();');
  out = out.replace(/navigate\(\{\s*to:\s*([^}]+)\s*\}\)/g, 'router.push($1)');

  // Params - TanStack $id -> Next.js assistantId
  out = out.replace(/params=\{\{\s*id:\s*([^}]+)\s*\}\}/g, 'href={`/dashboard/assistants/${$1}/overview`}');
  out = out.replace(/\/assistants\/\$id\//g, '/dashboard/assistants/[assistantId]/');
  out = out.replace(/from\s*"\.\/_app\.assistants\.new"/g, 'from "@/features/dashboard/wizard-footer"');

  // Export default component for pages
  if (fileName !== 'wizard-layout.tsx' && fileName !== 'assistant-layout.tsx') {
    out = out.replace(/^function (\w+)\(/m, 'export default function $1(');
  } else {
    out = out.replace(/^function (\w+)\(/m, 'export function $1(');
  }

  // Outlet -> children
  out = out.replace(/<Outlet\s*\/>/g, '{children}');
  out = out.replace(/function WizardInner\(\)/g, 'function WizardInner({ children })');
  out = out.replace(/function AppLayout\(\)/g, 'function AppLayout({ children })');

  return out;
}

fs.mkdirSync(OUT, { recursive: true });

for (const [srcName, outName] of ROUTE_MAP) {
  const srcPath = path.join(SOURCE, srcName);
  if (!fs.existsSync(srcPath)) {
    console.warn('Missing', srcName);
    continue;
  }
  const raw = fs.readFileSync(srcPath, 'utf8');
  const converted = convert(raw, outName);
  fs.writeFileSync(path.join(OUT, outName), converted);
  console.log('Converted', outName);
}
