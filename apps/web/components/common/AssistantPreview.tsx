import { Sparkles, Send } from 'lucide-react';
import { useWizard } from '@/lib/wizard-context';

export function AssistantPreview({ brandColor }: { brandColor?: string }) {
  const { draft } = useWizard();
  const name = draft.name || 'Your Assistant';
  const headerStyle = brandColor ? { backgroundColor: brandColor } : undefined;
  const userBubbleStyle = brandColor ? { backgroundColor: brandColor } : undefined;
  const sendStyle = brandColor ? { backgroundColor: brandColor } : undefined;

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Widget header */}
      <div
        className="flex items-center gap-2.5 border-b border-border bg-primary px-4 py-3 text-primary-foreground"
        style={headerStyle}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="text-[11px] text-white/80">Usually replies instantly</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-surface-muted/50 px-4 py-4">
        <Bubble role="assistant">{draft.welcomeMessage}</Bubble>
        <Bubble role="user" style={userBubbleStyle}>
          What are your business hours?
        </Bubble>
        <Bubble role="assistant">
          We&apos;re available 24/7 through this chat. Our human team is online Monday–Friday,
          9am–6pm PT.
        </Bubble>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface p-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Ask a question…"
            disabled
          />
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground"
            style={sendStyle}
            disabled
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] text-muted-foreground">Powered by Genie</div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  children,
  style,
}: {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
          style={style}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-surface px-3 py-2 text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}
