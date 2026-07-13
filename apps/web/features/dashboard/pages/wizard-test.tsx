'use client';


import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { WizardFooter } from "@/features/dashboard/wizard-footer";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, BookOpen, Wand2, FileText } from "lucide-react";



interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string }[];
}

const seed: Msg[] = [
  { role: "assistant", content: "Hi! I'm here to help. What can I answer for you today?" },
];

const suggestions = [
  "What are your business hours?",
  "How do I upgrade my plan?",
  "Do you offer refunds?",
];

export default function Step() {
  const { draft } = useWizard();
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Great question. Based on your knowledge base, here's what I can tell you: our team is available 24/7 through this chat, and human agents are online Monday–Friday, 9am–6pm PT.",
          sources: [
            { title: "Contact & support hours", url: "/help/hours" },
            { title: "Response time SLAs", url: "/help/sla" },
          ],
        },
      ]);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Test your assistant</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Ask real questions to see how {draft.name || "your assistant"} responds.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col min-h-[560px]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Playground</span>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={m.role === "user" ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground" : "max-w-[80%]"}>
                  {m.role === "assistant" ? (
                    <div>
                      <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
                        {m.content}
                      </div>
                      {m.sources && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.sources.map((s) => (
                            <span key={s.url} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              <FileText className="h-3 w-3" /> {s.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
          </div>
          {messages.length === 1 && (
            <div className="border-t border-border px-4 py-3">
              <div className="mb-2 text-xs text-muted-foreground">Try asking</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:bg-surface-muted">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask a question…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" className="h-8 w-8" onClick={() => send()} aria-label="Send">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-sm font-semibold text-foreground">Improve as you go</div>
            <div className="mt-3 space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-start"><Wand2 className="mr-2 h-3.5 w-3.5" /> Improve instructions</Button>
              <Button variant="outline" size="sm" className="w-full justify-start"><BookOpen className="mr-2 h-3.5 w-3.5" /> Add more knowledge</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-primary-subtle/40 p-4">
            <div className="text-sm font-semibold text-primary">Looking good?</div>
            <p className="mt-1 text-xs text-muted-foreground">Once you're happy, deploy it to your site or share a link.</p>
          </div>
        </div>
      </div>

      <WizardFooter backTo="/dashboard/assistants/new/customize" nextTo="/dashboard/assistants/new/deploy" nextLabel="Continue to deploy" />
    </div>
  );
}
