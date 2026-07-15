'use client';

import { MetricCard } from "@/components/common/MetricCard";
import { analyticsSeries, topTopics, unansweredQuestions } from "@/lib/mock/data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

export default function Analytics() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="Conversations" value="1,284" delta={{ value: "+12%", direction: "up" }} />
        <MetricCard label="Messages" value="8,421" delta={{ value: "+8%", direction: "up" }} />
        <MetricCard label="Unique users" value="642" delta={{ value: "+4%", direction: "up" }} />
        <MetricCard label="Resolution rate" value="82%" delta={{ value: "+3pt", direction: "up" }} />
        <MetricCard label="AI usage" value="1.2M tok" hint="63% of monthly limit" />
      </div>

      {/* Main Trends Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
        <h2 className="text-base font-bold text-foreground tracking-tight">Conversation trends</h2>
        <div className="mt-6 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsSeries} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 500 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 500 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.04)", fontSize: 12 }} />
              <Area type="monotone" dataKey="conversations" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#ga)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Topics Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
          <h2 className="text-base font-bold text-foreground tracking-tight">Top topics</h2>
          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTopics} layout="vertical" margin={{ left: -10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="topic" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-foreground)", fontWeight: 500 }} width={120} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unanswered Questions List */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
          <h2 className="text-base font-bold text-foreground tracking-tight">Unanswered questions</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Add knowledge to close these gaps.</p>
          <ul className="mt-4 divide-y divide-border/60">
            {unansweredQuestions.map((q, i) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm">
                <span className="text-foreground font-medium">{q}</span>
                <button className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Add knowledge</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
