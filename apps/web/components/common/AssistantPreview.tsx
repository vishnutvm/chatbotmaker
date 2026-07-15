import { Sparkles, Send } from "lucide-react";
import { useWizard } from "@/lib/wizard-context";

export function AssistantPreview({ brandColor }: { brandColor?: string }) {
  const { draft } = useWizard();
  const name = draft.name || "Your Assistant";
  const headerStyle = brandColor ? { backgroundColor: brandColor } : undefined;
  const userBubbleStyle = brandColor ? { backgroundColor: brandColor } : undefined;
  const sendStyle = brandColor ? { backgroundColor: brandColor } : undefined;

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-ambient animate-in fade-in duration-300">
      {/* Widget Header Mockup */}
      <div
        className="flex items-center gap-3 border-b border-border bg-primary px-4.5 py-3.5 text-primary-foreground shadow-2xs"
        style={headerStyle}
      >
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-white/15 border border-white/10 shadow-3xs">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight">{name}</div>
          <div className="text-[10px] font-semibold text-white/80 mt-0.5 tracking-wide uppercase">Usually replies instantly</div>
        </div>
      </div>

      {/* Message Stream Preview */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-muted/10 px-4.5 py-4.5 scrollbar-thin">
        <Bubble role="assistant" welcome>{draft.welcomeMessage}</Bubble>
        <Bubble role="user" style={userBubbleStyle}>What are your business hours?</Bubble>
        <Bubble role="assistant">
          We're available 24/7 through this chat. Our human team is online Monday–Friday, 9am–6pm PT.
        </Bubble>
      </div>

      {/* Input Composer Mockup */}
      <div className="border-t border-border bg-card p-3.5">
        <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/15 px-3 py-2 shadow-3xs">
          <input
            className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground/60"
            placeholder="Ask a question…"
            disabled
          />
          <button
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95 cursor-not-allowed"
            style={sendStyle}
            disabled
          >
            <Send className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>
        <div className="mt-2.5 text-center text-[10px] text-muted-foreground/60 font-semibold tracking-wide">
          Powered by Genie Platform
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  children,
  style,
  welcome,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  style?: React.CSSProperties;
  welcome?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-primary-foreground shadow-2xs border border-primary/5"
          style={style}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border/80 bg-card px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-foreground shadow-2xs">
        {children}
      </div>
    </div>
  );
}
