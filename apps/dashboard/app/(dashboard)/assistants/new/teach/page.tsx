'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  ErrorState,
  Input,
  PageHeader,
  ProcessingState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@genie/ui';
import {
  MOCK_CRAWL_PAGES,
  simulateKnowledgeImport,
  simulateWebsiteScan,
} from '@/lib/mocks/knowledge.mock';
import type { CrawlPage, ProcessingStep } from '@genie/types';
import { useWizardStore } from '@/lib/stores/wizard-store';

type TeachView = 'input' | 'scanning' | 'select' | 'importing' | 'ready' | 'error';

export default function TeachStepPage() {
  const router = useRouter();
  const { addKnowledgeSource, completeStep } = useWizardStore();
  const [url, setUrl] = useState('https://example.com');
  const [view, setView] = useState<TeachView>('input');
  const [scanSteps, setScanSteps] = useState<ProcessingStep[]>([]);
  const [pages, setPages] = useState<CrawlPage[]>([]);

  async function handleScan() {
    setView('scanning');
    try {
      const result = await simulateWebsiteScan(setScanSteps);
      setPages(result);
      setView('select');
    } catch {
      setView('error');
    }
  }

  async function handleImport() {
    setView('importing');
    await simulateKnowledgeImport();
    addKnowledgeSource({
      id: `ks-${Date.now()}`,
      type: 'website',
      name: url.replace(/^https?:\/\//, ''),
      status: 'ready',
      pageCount: pages.filter((p) => p.selected).length,
    });
    setView('ready');
  }

  function handleContinue() {
    completeStep('teach');
    router.push('/assistants/new/customize');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Teach your assistant"
        description="Add information your assistant can use to answer questions."
      />

      <Tabs defaultValue="website">
        <TabsList>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="files">Upload Files</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="text">Add Text</TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="mt-6 space-y-6">
          {view === 'input' && (
            <>
              <div>
                <label htmlFor="url" className="mb-1.5 block text-sm font-medium">
                  Enter your website URL
                </label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                  <Button onClick={handleScan}>Scan Website</Button>
                </div>
                <p className="mt-2 text-xs text-[var(--subtle-foreground)]">
                  Recommended — the easiest way to get started.
                </p>
              </div>
            </>
          )}

          {view === 'scanning' && (
            <ProcessingState
              title="Scanning your website"
              description="This usually takes less than a minute."
              steps={scanSteps.map((s) => ({
                label: s.label,
                status: s.status as 'pending' | 'active' | 'complete' | 'error',
              }))}
            />
          )}

          {view === 'select' && (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                We found {pages.length} pages on your website.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPages(pages.map((p) => ({ ...p, selected: true })))}
                >
                  Import All Pages
                </Button>
                <Button size="sm" onClick={handleImport}>
                  Import Knowledge
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto rounded-md border border-[var(--border)]">
                {pages.slice(0, 10).map((page) => (
                  <label
                    key={page.id}
                    className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 text-sm last:border-0"
                  >
                    <input type="checkbox" checked={page.selected} readOnly className="rounded" />
                    <span className="truncate">{page.title}</span>
                  </label>
                ))}
                {pages.length > 10 ? (
                  <p className="px-4 py-2 text-xs text-[var(--subtle-foreground)]">
                    + {pages.length - 10} more pages
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {view === 'importing' && (
            <ProcessingState
              title="Preparing Knowledge"
              description="We're organizing your website content so your assistant can use it."
              steps={[
                { label: 'Processing pages', status: 'active' },
                { label: 'Organizing content', status: 'pending' },
                { label: 'Ready', status: 'pending' },
              ]}
            />
          )}

          {view === 'ready' && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--success)]/30 bg-[var(--success-subtle)] p-6">
              <p className="font-medium text-[var(--success)]">Knowledge ready!</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Your assistant can now use {pages.filter((p) => p.selected).length} pages from your website.
              </p>
              <Button className="mt-4" onClick={handleContinue}>
                Continue to Customize →
              </Button>
            </div>
          )}

          {view === 'error' && (
            <ErrorState
              title="We couldn't finish scanning your website"
              description="Please check the URL and try again."
              onRetry={() => setView('input')}
              technicalDetails="Crawler timeout after 30s"
            />
          )}
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] p-12 text-center">
            <p className="text-sm font-medium">Drag and drop files here</p>
            <p className="mt-1 text-xs text-[var(--subtle-foreground)]">PDF, DOCX, TXT up to 10MB</p>
            <Button variant="secondary" className="mt-4" size="sm">
              Choose Files
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sitemap" className="mt-6">
          <div>
            <label htmlFor="sitemap" className="mb-1.5 block text-sm font-medium">
              Sitemap URL
            </label>
            <Input id="sitemap" placeholder="https://example.com/sitemap.xml" />
            <Button className="mt-3" variant="secondary">
              Import Sitemap
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="text" className="mt-6">
          <div>
            <label htmlFor="text" className="mb-1.5 block text-sm font-medium">
              Paste your content
            </label>
            <Textarea id="text" placeholder="Enter text content for your assistant…" rows={8} />
            <Button className="mt-3" variant="secondary">
              Add Text
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {view === 'input' && (
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => router.push('/assistants/new/create')}>
            ← Back
          </Button>
          <Button variant="secondary" onClick={handleContinue}>
            Skip for now →
          </Button>
        </div>
      )}
    </div>
  );
}
