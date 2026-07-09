'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Button,
  EmptyState,
  Input,
  PageHeader,
  PageToolbar,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@genie/ui';
import { getAssistants } from '@/lib/mocks/assistants.mock';

export default function AssistantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const assistants = getAssistants();

  const filtered = useMemo(() => {
    return assistants.filter((a) => {
      const matchesSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assistants, search, statusFilter]);

  if (assistants.length === 0) {
    return (
      <div>
        <PageHeader title="Assistants" description="Create, configure, test, and deploy your AI assistants." />
        <EmptyState
          title="No assistants yet"
          description="Create your first AI assistant, teach it about your business, and deploy it in minutes."
          action={
            <Button asChild>
              <Link href="/assistants/new/create">Create Assistant</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Assistants"
        description="Create, configure, test, and deploy your AI assistants."
        action={
          <Button asChild>
            <Link href="/assistants/new/create">Create Assistant</Link>
          </Button>
        }
      />

      <PageToolbar>
        <Input
          placeholder="Search assistants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="live">Live</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
        </select>
      </PageToolbar>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assistant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Knowledge</TableHead>
              <TableHead>Conversations</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow
                key={a.id}
                className="cursor-pointer"
                onClick={() => router.push(`/assistants/${a.id}`)}
              >
                <TableCell>
                  <p className="font-medium text-[var(--foreground)]">{a.name}</p>
                  <p className="text-xs text-[var(--subtle-foreground)]">{a.description}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell>{a.knowledgeSourceCount}</TableCell>
                <TableCell>{a.conversationCount}</TableCell>
                <TableCell className="text-[var(--subtle-foreground)]">
                  {new Date(a.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/assistants/${a.id}`); }}>
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
