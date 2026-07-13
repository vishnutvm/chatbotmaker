'use client';


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, FileText } from "lucide-react";



export default function Test() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; sources?: any[] }[]>([
    { role: "assistant", content: "Hi! I'm here to help. What can I answer for you?" },
  ]);
  const [input, setInput] = useState("");
  const send = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: "Sure — here's the answer based on your knowledge base.", sources: [{ title: "Help article", url: "#" }] }]);
    }, 400);
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col h-[calc(100vh-260px)] min-h-[520px]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Playground</span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground" : "max-w-[70%]"}>
              {m.role === "assistant" ? (
                <div>
                  <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground">{m.content}</div>
                  {m.sources && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.sources.map((s: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground">
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
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask a question…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <Button size="icon" className="h-8 w-8" onClick={send} aria-label="Send"><Send className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}
