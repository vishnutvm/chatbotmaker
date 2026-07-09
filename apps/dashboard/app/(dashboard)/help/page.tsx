import { PageHeader } from '@genie/ui';

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Help & Support"
        description="Get help with Genie and your AI assistants."
      />

      <div className="space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="font-semibold">Documentation</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Browse guides, tutorials, and API reference.
          </p>
          <a href="#" className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
            View Documentation →
          </a>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="font-semibold">Contact Support</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Our team typically responds within 24 hours.
          </p>
          <a href="mailto:support@genie.ai" className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
            support@genie.ai
          </a>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="font-semibold">Quick Start Guide</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted-foreground)]">
            <li>Create your first assistant</li>
            <li>Teach it about your business</li>
            <li>Customize its personality</li>
            <li>Test with sample questions</li>
            <li>Deploy to your website</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
