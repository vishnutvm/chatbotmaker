"use client";

import { motion } from "framer-motion";

const LOGOS = [
    { name: "TechCorp", width: 120 },
    { name: "FinGroup", width: 110 },
    { name: "EduSmart", width: 130 },
    { name: "HealthAI", width: 115 },
    { name: "GlobalTech", width: 125 },
    { name: "NextGen", width: 110 },
    { name: "CyberSys", width: 120 },
    { name: "DataFlow", width: 115 },
];

export function SocialProof() {
    return (
        <section className="py-10 border-y border-slate-200 dark:border-white/5 bg-white dark:bg-black overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 text-center mb-8">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    {/* Trusted by forward-thinking teams worldwide (10,000+ and growing) */}
                    Trusted by forward-thinking teams worldwide
                </p>
            </div>

            <div className="relative flex overflow-x-hidden group">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-black to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-black to-transparent z-10" />

                {/* Marquee Container */}
                <motion.div
                    className="flex gap-20 items-center whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30,
                    }}
                >
                    {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, index) => (
                        <div
                            key={`${logo.name}-${index}`}
                            className="text-xl font-bold text-zinc-400 dark:text-zinc-700 flex items-center gap-3 grayscale hover:grayscale-0 hover:text-slate-900 dark:hover:text-white transition-all duration-500 cursor-default"
                        >
                            <div className="w-6 h-6 rounded bg-slate-200 dark:bg-zinc-800" />
                            {logo.name}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
