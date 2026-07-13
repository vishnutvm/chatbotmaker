'use client';


import { TopHeader } from "@/components/shell/TopHeader";
import { PageHeader } from "@/components/common/PageHeader";
import { teamMembers } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";



const roleTone = { Owner: "primary", Admin: "info", Member: "neutral", Viewer: "neutral" } as const;

export default function Team() {
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Team</span>} />
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6">
        <PageHeader
          title="Team"
          description="Manage who has access to this workspace and what they can do."
          actions={<Button><Plus className="mr-1.5 h-4 w-4" /> Invite member</Button>}
        />

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-2.5">Member</th>
                <th className="px-5 py-2.5">Role</th>
                <th className="hidden md:table-cell px-5 py-2.5">Email</th>
                <th className="px-5 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamMembers.map((m) => (
                <tr key={m.id} className="hover:bg-surface-muted/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary">{m.initials}</div>
                      <span className="text-sm font-medium text-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge tone={roleTone[m.role as keyof typeof roleTone]}>{m.role}</StatusBadge></td>
                  <td className="hidden md:table-cell px-5 py-3.5 text-sm text-muted-foreground">{m.email}</td>
                  <td className="px-5 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
