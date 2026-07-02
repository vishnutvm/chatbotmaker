"use client";

import { Bot, Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SiteHeader() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-lg border-b border-zinc-200 dark:border-white/5">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                {/* Brand - Removed */}
                <div />

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/#features" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
                    <Link href="/#pricing" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>

                    <Link href="/#contact" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="#"
                        className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-600 dark:text-zinc-400"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-black"
                    >
                        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                            <Link href="/#features" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Features</Link>
                            <Link href="/#pricing" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Pricing</Link>

                            <Link href="/#contact" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Contact</Link>
                            <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                                <ThemeToggle />
                                <Link
                                    href="#"
                                    className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
