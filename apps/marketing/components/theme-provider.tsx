"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    actualTheme: "dark" | "light";
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
    children,
    defaultTheme = "dark",
    storageKey = "chatbot-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [actualTheme, setActualTheme] = useState<"dark" | "light">("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load theme from localStorage on mount
        const stored = localStorage.getItem(storageKey) as Theme | null;
        if (stored) {
            setTheme(stored);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;

        // Remove existing theme classes
        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            root.classList.add(systemTheme);
            setActualTheme(systemTheme);
        } else {
            root.classList.add(theme);
            setActualTheme(theme);
        }
    }, [theme, mounted]);

    useEffect(() => {
        // Listen for system theme changes when in system mode
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (theme === "system") {
                const systemTheme = mediaQuery.matches ? "dark" : "light";
                const root = window.document.documentElement;
                root.classList.remove("light", "dark");
                root.classList.add(systemTheme);
                setActualTheme(systemTheme);
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme);
            setTheme(newTheme);
        },
        actualTheme,
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};
