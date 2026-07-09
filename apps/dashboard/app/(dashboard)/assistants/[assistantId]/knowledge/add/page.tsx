'use client';

import { useParams, useRouter } from 'next/navigation';
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
} from '@genie/ui';
import { simulateWebsiteScan } from '@/lib/mocks/knowledge.mock';
import type { ProcessingStep } from '@genie/types';

export default function AddKnowledgePage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.assistantId as string;
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState(false);

  async function handleScan() {
    setScanning(true);
    setError(false);
    try {
      await simulateWebsiteScan(setSteps);
      router.push(`/assistants/${assistantId}/knowledge`);
    } catch {
      setError(true);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add Knowledge"
        description="Choose how to add information to your assistant."
      />

      <Tabs defaultValue="website">
        <TabsList>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="mt-6 space-y-4">
          {!scanning && !error && (
            <>
              <div>
                <label htmlFor="url" className="mb-1.5 block text-sm font-medium">Website URL</label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleScan} disabled={!url}>Scan Website</Button>
            </>
          )}
          {scanning && (
            <ProcessingState
              title="Scanning your website"
              steps={steps.map((s) => ({
                label: s.label,
                status: s.status as 'pending' | 'active' | 'complete' | 'error',
              }))}
            />
          )}
          {error && (
            <ErrorState
              title="We couldn't finish scanning your website"
              description="Please check the URL and try again."
              onRetry={() => { setError(false); setSteps([]); }}
              technicalDetails="Connection timeout"
            />
          )}
        </TabsContent>

        <TabsContent value="file" className="mt-6">
          <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] p-12 text-center">
            <p className="text-sm font-medium">Drag and drop files here</p>
            <p className="mt-1 text-xs text-[var(--subtle-foreground)]">PDF, DOCX, TXT up to 10MB</p>
            <Button variant="secondary" className="mt-4" size="sm">Choose Files</Button>
          </div>
        </TabsContent>

        <TabsContent value="sitemap" className="mt-6">
          <Input placeholder="https://example.com/sitemap.xml" />
          <Button className="mt-3" variant="secondary">Import Sitemap</Button>
        </TabsContent>

        <TabsContent value="text" className="mt-6">
          <textarea
            className="w-full rounded-md border border-[var(--border)] p-3 text-sm"
            rows={6}
            placeholder="Paste your content…"
          />
          <Button className="mt-3" variant="secondary">Add Text</Button>
        </TabsContent>
      </Tabs>

      <Button variant="ghost" className="mt-6" onClick={() => router.push(`/assistants/${assistantId}/knowledge`)}>
        ← Back to Knowledge
      </Button>
    </div>
  );
}
