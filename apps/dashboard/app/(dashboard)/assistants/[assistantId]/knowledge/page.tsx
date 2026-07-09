'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Button,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@genie/ui';
import { MOCK_KNOWLEDGE_SOURCES } from '@/lib/mocks/knowledge.mock';

export default function KnowledgePage() {
  const params = useParams();
  const assistantId = params.assistantId as string;
  const sources = MOCK_KNOWLEDGE_SOURCES.filter((k) => k.assistantId === assistantId);

  return (
    <div>
      <PageHeader
        title="Knowledge"
        description="Give your assistant information it can use to answer questions."
        action={
          <Button asChild>
            <Link href={`/assistants/${assistantId}/knowledge/add`}>Add Knowledge</Link>
          </Button>
        }
      />

      {sources.length === 0 ? (
        <EmptyState
          title="No knowledge sources yet"
          description="Add your website, documents, or text content so your assistant can answer questions."
          action={
            <Button asChild>
              <Link href={`/assistants/${assistantId}/knowledge/add`}>Add Knowledge</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pages / Docs</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="capitalize">{s.type}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>{s.pageCount || s.documentCount}</TableCell>
                  <TableCell className="text-[var(--subtle-foreground)]">
                    {new Date(s.lastUpdatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
