"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
    {
        question: "Do I need to know how to code?",
        answer: "Not at all. The entire platform is no-code. Build, train, and deploy an AI chatbot visually.",
    },
    {
        question: "Is my data secure?",
        answer: "Yes. Your content is encrypted at rest and in transit, and never used to train public models.",
    },
    {
        question: "Can I bring my own OpenAI API key?",
        answer: "Yes — available in Pro & Business plans for full cost control.",
    },
    {
        question: "How do I train the chatbot?",
        answer: "Upload PDFs, Word files, or connect your website. Our indexer handles everything automatically.",
    },
    {
        question: "Can I customize the UI?",
        answer: "Absolutely. Modify colors, icons, welcome messages, and even the assistant’s tone to match your brand.",
    },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-32 bg-white dark:bg-black relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 tracking-tighter"
                    >
                        Frequently asked <br />
                        <span className="text-zinc-500 dark:text-zinc-500">questions</span>
                    </motion.h2>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index
                                ? "bg-indigo-50 dark:bg-zinc-900/40 border-indigo-200 dark:border-white/20"
                                : "bg-slate-50 dark:bg-zinc-900/10 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className={`text-lg font-medium transition-colors ${openIndex === index ? "text-slate-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}>
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-slate-900 dark:text-white" : "text-zinc-400 dark:text-zinc-600"
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-slate-200 dark:border-white/5 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
