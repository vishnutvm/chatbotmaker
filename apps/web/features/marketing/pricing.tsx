"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

const PLANS = [
    {
        name: "Free",
        price: "Free",
        description: "Perfect for experimentation and small personal projects.",
        features: [
            "1 Chatbot",
            "50 Messages / month",
            "Upload 1 PDF (up to 5MB)",
            "Standard Support",
        ],
        cta: "Start Free",
        popular: false,
    },
    {
        name: "Starter",
        price: "$15",
        period: "/month",
        description: "Built for developers and early-stage projects.",
        features: [
            "1 Chatbot",
            "1,000 Messages / month",
            "PDF & URL uploads",
            "Basic usage analytics",
            "Standard Support",
        ],
        cta: "Get Started",
        popular: false,
    },
    {
        name: "Pro",
        price: "$49",
        period: "/month",
        description: "Designed for startups and growing businesses that need scale and reliability.",
        features: [
            "3 Chatbots",
            "5,000 Messages / month",
            "Unlimited PDF & URL uploads",
            "Remove branding",
            "Advanced analytics & usage tracking",
            "Priority Support",
        ],
        cta: "Get Started",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom Pricing",
        description: "For high-volume teams and mission-critical workflows.",
        features: [],
        cta: "Contact Sales",
        popular: false,
    },
];

export function Pricing() {
    const { user } = useAuth();
    const signedIn = Boolean(user);

    return (
        <section id="pricing" className="py-32 bg-white dark:bg-black relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-4 tracking-tighter"
                    >
                        Plans for Every Team
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 mb-2"
                    >
                        Choose a plan that fits your stage — from experimenting with your first chatbot to running AI at production scale.
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-zinc-500 dark:text-zinc-500"
                    >
                        Simple pricing. No hidden costs. Upgrade or downgrade anytime.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {PLANS.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-8 rounded-3xl border flex flex-col transition-all duration-300 ${plan.popular
                                ? "bg-indigo-50 dark:bg-zinc-900/40 border-indigo-200 dark:border-white/20 shadow-2xl shadow-indigo-100 dark:shadow-white/5 scale-105 z-10"
                                : "bg-slate-50 dark:bg-zinc-900/10 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold shadow-lg flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {plan.price}
                                    </span>
                                    {plan.period && <span className="text-zinc-500 dark:text-zinc-500">{plan.period}</span>}
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">{plan.description}</p>
                            </div>

                            {plan.features.length > 0 && (
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-slate-700 dark:text-zinc-300 text-sm">
                                            <Check className={`w-5 h-5 shrink-0 ${plan.popular ? "text-slate-900 dark:text-white" : "text-zinc-400 dark:text-zinc-600"}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <Link
                                href={signedIn ? "/dashboard" : "/signup"}
                                className={`w-full py-4 rounded-xl font-semibold text-center transition-all ${plan.popular
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200"
                                    : "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {signedIn ? "Go to Dashboard" : plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
