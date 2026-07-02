"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const themes = [
        { value: "dark" as const, icon: Moon, label: "Dark" },
        { value: "light" as const, icon: Sun, label: "Light" },
        { value: "system" as const, icon: Monitor, label: "System" },
    ];

    const currentIndex = themes.findIndex((t) => t.value === theme);

    const handleToggle = () => {
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex].value);
    };

    const CurrentIcon = themes[currentIndex].icon;

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Theme</span>
            <button
                onClick={handleToggle}
                className="relative group flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
                aria-label={`Switch theme (current: ${themes[currentIndex].label})`}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={theme}
                        initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                    >
                        <CurrentIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    </motion.div>
                </AnimatePresence>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {themes[currentIndex].label}
                </span>

                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Click to switch theme
                </div>
            </button>
        </div>
    );
}
