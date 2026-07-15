'use client';

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Zap, Plus, Truck, Calendar, User, Ticket } from "lucide-react";

const actions = [
  { name: "Check order status", icon: Truck, status: "enabled", desc: "Look up an order by number and return current status." },
  { name: "Create support ticket", icon: Ticket, status: "enabled", desc: "Open a Zendesk ticket when the assistant can't help." },
  { name: "Schedule appointment", icon: Calendar, status: "draft", desc: "Book a slot with a human agent." },
  { name: "Fetch customer info", icon: User, status: "disabled", desc: "Look up account details from your CRM." },
];

export default function Actions() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">AI actions</h2>
          <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Let your assistant do things — call APIs, look up data, book appointments.</p>
        </div>
        <Button className="rounded-xl font-bold shadow-xs"><Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Create action</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((a) => (
          <div key={a.name} className="group rounded-2xl border border-border bg-card p-5.5 shadow-ambient hover:border-primary/10 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 transition-transform group-hover:scale-105">
                  <a.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{a.name}</div>
                  <div className="text-xs text-muted-foreground/80 mt-1 font-medium leading-normal">{a.desc}</div>
                </div>
              </div>
              <StatusBadge tone={a.status === "enabled" ? "success" : a.status === "draft" ? "neutral" : "warning"}>{a.status}</StatusBadge>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/15 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10"><Zap className="h-4.5 w-4.5" /></div>
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground">Need something custom?</div>
            <div className="text-xs text-muted-foreground/80 mt-0.5 font-medium leading-relaxed">Connect any REST API in a guided flow. No JSON required.</div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold border-border/80 hover:bg-muted/80">Start from template</Button>
        </div>
      </div>
    </div>
  );
}
