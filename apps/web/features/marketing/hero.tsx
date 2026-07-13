"use client";

import { motion, useSpring } from "framer-motion";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export function Hero() {
    const [typingStep, setTypingStep] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse position for 3D tilt
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Smooth spring animation for tilt
    const springX = useSpring(0, { stiffness: 100, damping: 30 });
    const springY = useSpring(0, { stiffness: 100, damping: 30 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX / innerWidth - 0.5) * 20; // -10 to 10 degrees
            const y = (e.clientY / innerHeight - 0.5) * 20; // -10 to 10 degrees
            springX.set(x);
            springY.set(y);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [springX, springY]);

    // Simulate typing sequence
    useEffect(() => {
        const timers = [
            setTimeout(() => setTypingStep(1), 1000),
            setTimeout(() => setTypingStep(2), 2500),
            setTimeout(() => setTypingStep(3), 4000),
            setTimeout(() => setTypingStep(4), 5500),
            setTimeout(() => setTypingStep(5), 6500),
            setTimeout(() => setTypingStep(6), 8000),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-black dark:to-black selection:bg-indigo-500/30">
            {/* Starfield Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-200/30 via-transparent to-transparent dark:from-indigo-900/20 dark:via-black dark:to-black" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 dark:bg-green-500/10 border border-green-500/30 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium backdrop-blur-md mb-8 hover:bg-green-500/20 transition-colors cursor-pointer"
                >
                    <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>AI-Powered Customer Support</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-slate-900 dark:text-white mb-8 max-w-7xl mx-auto leading-[0.9]"
                >
                    AI Assistant That <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-white dark:to-white/50">
                        Understands Your Business
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                    Train, customize, and deploy intelligent chatbots in minutes. Seamlessly integrate with your website, app, or product.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20"
                >
                    <Link
                        href="#"
                        className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all"
                    >
                        Start Free
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#"
                        className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all backdrop-blur-sm"
                    >
                        Watch Demo
                    </Link>
                </motion.div>

                {/* Transformation Visual */}
                <div className="relative w-full max-w-5xl mx-auto h-[700px] perspective-2000">
                    {/* Layer 1: The Code (Input) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 0.5, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-slate-100 dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-0 blur-[1px]"
                    >
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-white/5">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-500 font-mono ml-2">config.js</div>
                        </div>
                        <div className="p-8 font-mono text-sm text-zinc-700 dark:text-zinc-400 space-y-3">
                            <div className="flex"><span className="text-purple-400">const</span> <span className="text-blue-400 ml-2">genie</span> = <span className="text-yellow-400 ml-2">new</span> <span className="text-green-400 ml-2">Genie</span>({'{'}</div>
                            <div className="pl-6"><span className="text-blue-300">apiKey</span>: <span className="text-orange-400">"pk_live_..."</span>,</div>
                            <div className="pl-6"><span className="text-blue-300">theme</span>: <span className="text-orange-400">"dark"</span>,</div>
                            <div className="pl-6"><span className="text-blue-300">brandVoice</span>: <span className="text-orange-400">"friendly"</span>,</div>
                            <div className="pl-6"><span className="text-blue-300">knowledgeBase</span>: <span className="text-orange-400">"https://docs.acme.com"</span></div>
                            <div>{'}'});</div>
                        </div>
                    </motion.div>

                    {/* Connecting Beam */}
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 100 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="absolute top-40 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-indigo-500/0 via-indigo-500 to-indigo-500/0 z-0"
                    />

                    {/* Layer 2: The Chat (Output) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 60 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                        className="absolute top-12 left-0 right-0 mx-auto w-full max-w-4xl z-10"
                    >
                        <div className="relative bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-white/10">
                            {/* Window Controls */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 backdrop-blur-xl">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-500 flex items-center gap-2">
                                    <Bot className="w-3 h-3" />
                                    Support Agent Preview
                                </div>
                                <div className="w-16" />
                            </div>

                            {/* Chat Area */}
                            <div className="flex h-[500px] bg-slate-50 dark:bg-black/50">
                                {/* Main Chat */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 p-8 space-y-6">
                                        {/* Message 1: Bot Intro */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl rounded-tl-none text-slate-900 dark:text-zinc-200 leading-relaxed max-w-lg">
                                                    Hi! 👋 I’m your AI support assistant. Ask me anything about your account, pricing, or technical setup.
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Message 2: User Query */}
                                        {typingStep >= 2 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-4 flex-row-reverse"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-zinc-400 border border-slate-300 dark:border-white/5">
                                                    You
                                                </div>
                                                <div className="bg-indigo-600 dark:bg-indigo-600 text-white px-6 py-4 rounded-2xl rounded-tr-none leading-relaxed shadow-lg shadow-indigo-500/10 max-w-lg">
                                                    I need to reset my password.
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Message 3: Bot Response */}
                                        {typingStep >= 6 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-4"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                    <Bot className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl rounded-tl-none text-slate-900 dark:text-zinc-200 leading-relaxed max-w-lg">
                                                    <p>No problem! You can reset it by going to <strong>Settings → Security</strong>.</p>
                                                    <div className="mt-4 p-4 rounded-xl bg-slate-200/50 dark:bg-black/40 border border-slate-300 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-indigo-500/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                                <Sparkles className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Reset Password</span>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : typingStep >= 5 && (
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                    <Bot className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl rounded-tl-none text-zinc-600 dark:text-zinc-400">
                                                    <div className="flex gap-1.5">
                                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100" />
                                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/20">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Type your message..."
                                                className="w-full bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-12 py-4 text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                                disabled
                                            />
                                            <button className="absolute right-2 top-2 bottom-2 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Glow behind the interface */}
                        <div className="absolute -inset-4 bg-indigo-500/20 dark:bg-indigo-500/20 blur-3xl -z-10 rounded-[3rem] opacity-50" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
