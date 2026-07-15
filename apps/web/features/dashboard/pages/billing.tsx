'use client';


import { TopHeader } from "@/components/shell/TopHeader";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Check } from "lucide-react";



const usage = [
  { label: "Conversations", used: 1713, limit: 5000 },
  { label: "AI usage (tokens)", used: 1_900_000, limit: 3_000_000 },
  { label: "Knowledge storage", used: 420, limit: 2000, unit: "MB" },
  { label: "Assistants", used: 4, limit: 10 },
];

export default function Billing() {
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Billing</span>} />
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6 animate-in fade-in duration-300">
        <PageHeader title="Billing & usage" description="Manage your plan and AI usage." />

        <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground tracking-tight">Growth</span>
                <StatusBadge tone="primary">Current plan</StatusBadge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Next invoice on Aug 15 · $199 / month</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl">Manage plan</Button>
              <Button className="rounded-xl shadow-md shadow-primary/10">Upgrade</Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Usage this month</h2>
          <div className="mt-5 space-y-5">
            {usage.map((u) => {
              const pct = Math.round((u.used / u.limit) * 100);
              return (
                <div key={u.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-foreground">{u.label}</span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{u.used.toLocaleString()}</span> / {u.limit.toLocaleString()} {u.unit ?? ""}
                    </span>
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-muted/70">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? "bg-warning shadow-[0_0_8px_-2px] shadow-warning/40" : "bg-primary shadow-[0_0_8px_-2px] shadow-primary/30"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Compare plans</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { name: "Starter", price: "$0", features: ["1 assistant", "500 conversations", "Community support"] },
              { name: "Growth", price: "$199", features: ["10 assistants", "5,000 conversations", "Email + chat support"], current: true },
              { name: "Scale", price: "Contact us", features: ["Unlimited assistants", "Custom limits", "SSO + SOC 2"] },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-5 transition-all duration-300 ${
                  p.current
                    ? "border-primary bg-primary-subtle/30 shadow-ambient ring-2 ring-primary/25"
                    : "border-border bg-card shadow-ambient hover:border-primary/20 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{p.name}</div>
                  {p.current ? <StatusBadge tone="primary">Current</StatusBadge> : null}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {p.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    {p.price.startsWith("$") ? "/ month" : ""}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-subtle">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!p.current && (
                  <Button
                    className="mt-5 w-full rounded-xl font-semibold shadow-md shadow-primary/10"
                    variant={p.name === "Scale" ? "outline" : "default"}
                    size="lg"
                  >
                    {p.name === "Scale" ? "Contact sales" : "Upgrade"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
