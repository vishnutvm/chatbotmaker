'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, FileText, CornerDownLeft, Bot, User } from "lucide-react";

export default function Test() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; sources?: any[] }[]>([
    { role: "assistant", content: "Hi! I'm Genie, your assistant. I'm trained on your custom knowledge base and ready to help. What can I answer for you today?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    
    // Simulating natural assistant delay with a streaming/indicator feel
    setTimeout(() => {
      setMessages((m) => [...m, { 
        role: "assistant", 
        content: "Based on the uploaded help documentation, here is the solution to your request. Let me know if you need any additional citations.", 
        sources: [{ title: "Acme FAQ - Getting Started", url: "#" }] 
      }]);
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[550px] shadow-ambient animate-in fade-in duration-300">
      {/* Playground Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15">
            <Sparkles className="h-3 w-3 stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">Interactive Playground</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Agent Online</span>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 space-y-5 overflow-y-auto p-6 bg-muted/5 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3.5 items-start max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
            {/* Avatar block */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${m.role === "user" ? "bg-primary text-primary-foreground border-primary/20" : "bg-card text-muted-foreground border-border"}`}>
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            
            {/* Message contents */}
            <div className="space-y-2">
              <div className={`rounded-2xl px-4.5 py-3 text-[13px] leading-relaxed font-medium shadow-2xs border ${m.role === "user" ? "bg-primary text-primary-foreground border-primary/10 rounded-tr-sm" : "bg-card text-foreground border-border/80 rounded-tl-sm"}`}>
                {m.content}
              </div>
              {m.sources && (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {m.sources.map((s: any, idx: number) => (
                    <a
                      key={idx}
                      href={s.url}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all shadow-2xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Area */}
      <div className="border-t border-border bg-card p-4.5">
        <div className="relative flex items-center rounded-2xl border border-border bg-muted/15 focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/8 transition-all p-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything about your business..."
            className="flex-1 bg-transparent py-2.5 px-4.5 text-[13px] font-medium outline-none placeholder:text-muted-foreground/60 leading-normal text-foreground"
          />
          <div className="flex items-center gap-2 pr-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground/50 border border-border/60 bg-card rounded px-1.5 py-0.5 leading-none mr-1 shadow-3xs"><CornerDownLeft className="h-2.5 w-2.5" /> Enter</span>
            <Button
              size="icon"
              className="h-8.5 w-8.5 rounded-xl shadow-md shadow-primary/10 transition-transform active:scale-95"
              onClick={send}
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5 stroke-[2.5]" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] text-muted-foreground/60 font-semibold tracking-wide">
          Testing Genie sandbox environment. Conversations are simulated and not saved to production log histories.
        </div>
      </div>
    </div>
  );
}
