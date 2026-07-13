"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, ArrowRight } from "lucide-react";
import { useState } from "react";

export function ContactSection() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        message: ""
    });

    return (
        <section id="contact" className="py-24 bg-white dark:bg-black relative overflow-hidden">
            {/* Background Gradients - Subtle White/Zinc */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-100/20 dark:bg-white/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-100 dark:bg-zinc-800/20 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                    {/* Left Side: Info */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                                Let's Build Something <br />
                                <span className="text-slate-900 dark:text-white">
                                    Extraordinary
                                </span>
                            </h2>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed max-w-lg">
                                Ready to transform your approach? Give your application AI-powered capabilities with our intelligent chatbot solutions.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { icon: Mail, title: "Email Us", value: "hello@chatbotmaker.com", link: "mailto:hello@chatbotmaker.com" },
                                    { icon: Phone, title: "Call Us", value: "+91 7306162979", link: "tel:+917306162979" },
                                    // { icon: MapPin, title: "Visit Us", value: "123 AI Boulevard, San Francisco, CA", link: "#" }
                                ].map((item, i) => (
                                    <motion.a
                                        href={item.link}
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        className="flex items-start gap-4 group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-slate-300 dark:group-hover:border-white/30 group-hover:bg-slate-200 dark:group-hover:bg-white/5 transition-all duration-300">
                                            <item.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.title}</h3>
                                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">{item.value}</p>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-indigo-100/20 dark:bg-white/5 rounded-3xl blur-2xl opacity-10" />
                        <div className="relative bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl">
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30 focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                        placeholder="John Doe"
                                        value={formState.name}
                                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30 focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                        placeholder="john@company.com"
                                        value={formState.email}
                                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30 focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 resize-none"
                                        placeholder="Tell us about your project..."
                                        value={formState.message}
                                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="w-full group relative overflow-hidden rounded-xl bg-slate-900 dark:bg-white px-8 py-4 text-white dark:text-black font-bold transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        <span>Send Message</span>
                                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
