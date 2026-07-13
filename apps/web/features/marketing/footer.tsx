"use client";

import { Bot, Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Footer() {
    return (
        <footer className="py-8 bg-white dark:bg-black border-t border-zinc-200 dark:border-white/5">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Brand - Removed */}
                    <div />

                    {/* Navigation */}
                    <nav className="flex flex-wrap justify-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        <Link href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
                        <Link href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>

                        <Link href="#contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
                    </nav>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Socials */}
                    <div className="flex gap-4">
                        <Link href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-1 pt-8 border-t border-zinc-200 dark:border-white/5 text-center text-xs text-zinc-500 dark:text-zinc-600">
                    <p>© {new Date().getFullYear()}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
