"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-lg border-b border-zinc-200 dark:border-white/5">
      <div className="container mx-auto flex h-16 items-center justify-end gap-4 px-4 md:px-6">
        <ThemeToggle />
        <Link
          href="/signup"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
