"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Brain, Database, Lock, MessageSquare, Zap, BarChart3, MousePointer2 } from "lucide-react";
import { MouseEvent } from "react";

const FEATURES = [
    {
        title: "Train on Your Content",
        description: "Upload PDFs, docs, or auto-crawl your website. Your AI learns exclusively from your data.",
        icon: Database,
        colSpan: "lg:col-span-2",
    },
    {
        title: "Custom Personality & Tone",
        description: "Fine-tune voice, style, and behavior. Make the assistant feel exactly like your brand.",
        icon: Brain,
        colSpan: "lg:col-span-1",
    },
    // {
    //     title: "Built-In Lead Capture",
    //     description: "Collect names, emails, and inquiries directly inside the chatbot",
    //     icon: MessageSquare,
    //     colSpan: "lg:col-span-1",
    // },
    {
        title: "Advanced Analytics",
        description: "Monitor conversations, identify gaps, and track sentiment. Improve your knowledge base continuously.",
        icon: BarChart3,
        colSpan: "lg:col-span-2",
    },
    {
        title: "One-Line Installation",
        description: "Copy a single code snippet to your website. Your AI assistant goes live in seconds.",
        icon: Zap,
        colSpan: "lg:col-span-1",
    },
    // {
    //     title: "Enterprise-Grade Security",
    //     description: "Your training data remains private, encrypted, and isolated. We never train our models on your content.",
    //     icon: Lock,
    //     colSpan: "lg:col-span-2",
    // },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0], index: number }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onMouseMove={handleMouseMove}
            className={`group relative rounded-3xl bg-slate-50 dark:bg-zinc-900/20 border border-slate-200 dark:border-white/5 overflow-hidden ${feature.colSpan} hover:border-slate-300 dark:hover:border-white/10 transition-colors`}
        >
            {/* Spotlight Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.1),
              transparent 80%
            )
          `,
                }}
            />

            <div className="relative h-full p-8 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-indigo-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-indigo-600 dark:text-white" />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed flex-grow">{feature.description}</p>

                <div className="mt-6 flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <span>Learn more</span>
                    <MousePointer2 className="ml-2 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
            </div>
        </motion.div>
    );
}

export function Features() {
    return (
        <section className="py-32 bg-white dark:bg-black relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 tracking-tighter"
                    >
                        Powerful Features for Every Use Case
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-600 dark:text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed"
                    >
                        Everything you need to build, train, and deploy intelligent chatbots

                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((feature, index) => (
                        <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
