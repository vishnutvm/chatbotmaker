'use client';


import { useState } from "react";
import { TopHeader } from "@/components/shell/TopHeader";
import { PageHeader } from "@/components/common/PageHeader";
import { integrations } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plug } from "lucide-react";
import { cn } from "@/lib/utils";



const categories = ["All", "Popular", "Communication", "CRM", "Automation", "Developer Tools"];

export default function IntegrationsPage() {
  const [cat, setCat] = useState("All");
  const items = integrations.filter((i) => cat === "All" || i.category === cat);
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Integrations</span>} />
      <div className="mx-auto max-w-[1240px] px-6 py-8 space-y-6">
        <PageHeader title="Integrations" description="Connect Cohere to the tools your team already uses." />

        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                cat === c ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.id} className="rounded-xl border border-border bg-surface p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary"><Plug className="h-4 w-4" /></div>
                {i.connected && <StatusBadge tone="success">Connected</StatusBadge>}
              </div>
              <div className="mt-4 text-sm font-semibold text-foreground">{i.name}</div>
              <div className="mt-1 text-xs text-muted-foreground flex-1">{i.description}</div>
              <div className="mt-4">
                {i.connected ? (
                  <Button variant="outline" size="sm" className="w-full">Manage</Button>
                ) : (
                  <Button size="sm" className="w-full">Connect</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
