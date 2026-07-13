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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI actions</h2>
          <p className="text-sm text-muted-foreground">Let your assistant do things — call APIs, look up data, book appointments.</p>
        </div>
        <Button><Plus className="mr-1.5 h-4 w-4" /> Create action</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((a) => (
          <div key={a.name} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-subtle text-primary"><a.icon className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              </div>
              <StatusBadge tone={a.status === "enabled" ? "success" : a.status === "draft" ? "neutral" : "warning"}>{a.status}</StatusBadge>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Need something custom?</div>
            <div className="text-xs text-muted-foreground">Connect any REST API in a guided flow. No JSON required.</div>
          </div>
          <Button variant="outline" size="sm">Start from template</Button>
        </div>
      </div>
    </div>
  );
}
