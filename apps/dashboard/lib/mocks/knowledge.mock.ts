import type { CrawlPage, KnowledgeSource, ProcessingStep } from '@genie/types';

export const MOCK_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'ks-1',
    assistantId: 'asst-1',
    name: 'example.com',
    type: 'website',
    status: 'ready',
    pageCount: 47,
    documentCount: 0,
    lastUpdatedAt: '2026-07-08T14:20:00Z',
    url: 'https://example.com',
  },
  {
    id: 'ks-2',
    assistantId: 'asst-1',
    name: 'Product Guide.pdf',
    type: 'file',
    status: 'ready',
    pageCount: 0,
    documentCount: 1,
    lastUpdatedAt: '2026-07-05T10:00:00Z',
  },
  {
    id: 'ks-3',
    assistantId: 'asst-1',
    name: 'FAQ Content',
    type: 'text',
    status: 'ready',
    pageCount: 0,
    documentCount: 1,
    lastUpdatedAt: '2026-06-20T08:00:00Z',
  },
];

export const MOCK_CRAWL_PAGES: CrawlPage[] = Array.from({ length: 47 }, (_, i) => ({
  id: `page-${i + 1}`,
  url: `https://example.com/${['about', 'pricing', 'features', 'docs', 'blog'][i % 5]}${i > 4 ? `/${i}` : ''}`,
  title: `Page ${i + 1} - Example.com`,
  selected: true,
}));

export const SCAN_STEPS: ProcessingStep[] = [
  { id: '1', label: 'Discovering Pages', status: 'pending' },
  { id: '2', label: 'Reading Content', status: 'pending' },
  { id: '3', label: 'Preparing Knowledge', status: 'pending' },
  { id: '4', label: 'Ready', status: 'pending' },
];

export async function simulateWebsiteScan(
  onStepUpdate: (steps: ProcessingStep[]) => void,
): Promise<CrawlPage[]> {
  const steps = SCAN_STEPS.map((s) => ({ ...s }));
  for (let i = 0; i < steps.length; i++) {
    steps[i] = { ...steps[i], status: 'active' };
    onStepUpdate([...steps]);
    await delay(800 + Math.random() * 700);
    steps[i] = { ...steps[i], status: 'complete' };
    onStepUpdate([...steps]);
  }
  return MOCK_CRAWL_PAGES;
}

export async function simulateKnowledgeImport(): Promise<void> {
  await delay(2000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
