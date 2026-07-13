"use client";

import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { FileText, Settings, Code2, Upload, Globe, Sparkles, Copy, CheckCircle2, ArrowRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const STEPS = [
    {
        id: "01",
        title: "Connect Your Content",
        description: "Upload PDF files, connect Google Drive or Notion, or provide your website URL. We ingest your existing docs so you don't have to start from scratch.",
        icon: FileText,
        color: "from-blue-500 to-cyan-500",
        visual: ImportVisual,
    },
    {
        id: "02",
        title: "Customize Behavior",
        description: "Define tone, brand personality, response style, and instructions. Create an assistant that feels uniquely yours and speaks your language.",
        icon: Settings,
        color: "from-violet-500 to-fuchsia-500",
        visual: CustomizeVisual,
    },
    {
        id: "03",
        title: "Embed & Launch",
        description: "Copy-paste the snippet into your existing site's HTML. Instantly upgrade your user experience without rewriting code.",
        icon: Code2,
        color: "from-orange-500 to-amber-500",
        visual: EmbedVisual,
    },
];

export function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeStep, setActiveStep] = useState(0);

    return (
        <section ref={containerRef} className="relative bg-white dark:bg-black py-24 md:py-32">
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-200/20 dark:bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative">
                <div className="mb-20 md:mb-32 text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 text-sm text-indigo-600 dark:text-zinc-400 mb-6"
                    >

                        <span>Simple 3-Step Process</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight"
                    >
                        Add AI Superpowers to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-slate-900 to-indigo-600 dark:from-indigo-400 dark:via-white dark:to-indigo-400 animate-gradient">
                            Your Existing Stack
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed"
                    >
                        We've streamlined the entire process so you can focus on your business while we handle the technical heavy lifting.
                    </motion.p>
                </div>

                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
                    {/* Sticky Visual Side (Desktop) */}
                    <div className="hidden lg:block sticky top-32 h-[600px] w-full">
                        <div className="relative w-full h-full rounded-3xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-black/50">
                            {/* Dynamic Background based on step */}
                            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-colors duration-700 ${activeStep === 0 ? "from-blue-500/20 to-cyan-500/20" :
                                activeStep === 1 ? "from-violet-500/20 to-fuchsia-500/20" :
                                    "from-orange-500/20 to-amber-500/20"
                                }`} />

                            {/* Visual Content */}
                            <div className="relative w-full h-full p-8 flex items-center justify-center">
                                {STEPS.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`absolute inset-0 p-8 transition-all duration-700 ease-in-out transform ${activeStep === index
                                            ? "opacity-100 translate-y-0 scale-100 blur-0"
                                            : activeStep > index
                                                ? "opacity-0 -translate-y-10 scale-95 blur-sm"
                                                : "opacity-0 translate-y-10 scale-95 blur-sm"
                                            }`}
                                    >
                                        <step.visual isActive={activeStep === index} />
                                    </div>
                                ))}
                            </div>

                            {/* Progress Dots */}
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
                                {STEPS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const element = document.getElementById(`step-${idx}`);
                                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeStep === idx ? "bg-slate-900 dark:bg-white w-8" : "bg-slate-400 dark:bg-white/20 hover:bg-slate-600 dark:hover:bg-white/40"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Scrolling Text Side */}
                    <div className="space-y-24 lg:space-y-0">
                        {STEPS.map((step, index) => (
                            <StepContent
                                key={step.id}
                                step={step}
                                index={index}
                                onInView={() => setActiveStep(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function StepContent({ step, index, onInView }: { step: typeof STEPS[0], index: number, onInView: () => void }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" });

    useEffect(() => {
        if (isInView) onInView();
    }, [isInView, onInView]);

    return (
        <div
            id={`step-${index}`}
            ref={ref}
            className="lg:min-h-[80vh] flex flex-col justify-center py-12 lg:py-0"
        >
            {/* Mobile Visual (visible only on small screens) */}
            <div className="lg:hidden mb-8 h-[400px] w-full rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${step.color}`} />
                <div className="relative w-full h-full p-6">
                    <step.visual isActive={true} />
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative pl-8 border-l border-slate-200 dark:border-white/10"
            >
                {/* Active Indicator Line - Consistent Indigo */}
                <motion.div
                    className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-indigo-600 dark:bg-indigo-500"
                    initial={{ height: "0%" }}
                    whileInView={{ height: "100%" }}
                    transition={{ duration: 0.5 }}
                />

                {/* Icon - Consistent Pro Styling */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 dark:shadow-indigo-500/10">
                    <step.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-500 mb-2 tracking-wider">STEP {step.id}</div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{step.title}</h3>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
                    {step.description}
                </p>
            </motion.div>
        </div>
    );
}

// --- Visual Components ---

function ImportVisual({ isActive }: { isActive: boolean }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            {/* Floating Files */}
            <div className="relative w-full max-w-xs aspect-square">
                <motion.div
                    animate={isActive ? { y: [0, -10, 0], rotate: [0, -2, 0] } : {}}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-32 h-40 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-2xl rotate-6 z-10"
                >
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mb-3">
                        <FileText className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                        <div className="h-2 w-full bg-white/5 rounded-full" />
                        <div className="h-2 w-20 bg-white/5 rounded-full" />
                    </div>
                </motion.div>

                <motion.div
                    animate={isActive ? { y: [0, -15, 0], rotate: [0, 2, 0] } : {}}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-8 left-4 w-32 h-40 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-2xl -rotate-6 z-20"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                        <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                        <div className="h-2 w-full bg-white/5 rounded-full" />
                        <div className="h-2 w-20 bg-white/5 rounded-full" />
                    </div>
                </motion.div>

                {/* Central Upload Zone */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 m-auto w-48 h-48 rounded-full border-2 border-dashed border-indigo-500/30 dark:border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/5 flex flex-col items-center justify-center z-30 backdrop-blur-sm"
                >
                    <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Processing...</span>
                </motion.div>
            </div>
        </div>
    );
}

function CustomizeVisual({ isActive }: { isActive: boolean }) {
    return (
        <div className="w-full h-full flex flex-col justify-center px-8 gap-6">
            {/* Chat Preview */}
            <div className="space-y-4">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={isActive ? { x: 0, opacity: 1 } : {}}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none p-4 border border-slate-200 dark:border-white/5 max-w-[80%]">
                        <p className="text-sm text-slate-700 dark:text-zinc-300">Hello! How can I help you today?</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={isActive ? { x: 0, opacity: 1 } : {}}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 flex-row-reverse"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-zinc-700 flex-shrink-0" />
                    <div className="bg-indigo-100 dark:bg-indigo-600/20 rounded-2xl rounded-tr-none p-4 border border-indigo-200 dark:border-indigo-500/20 max-w-[80%]">
                        <p className="text-sm text-indigo-900 dark:text-indigo-200">I'd like to customize my AI assistant.</p>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={isActive ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-4"
            >
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                        <span>Creativity</span>
                        <span>85%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={isActive ? { width: "85%" } : {}}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="h-full bg-indigo-600 dark:bg-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {['Professional', 'Friendly', 'Witty'].map((tag, i) => (
                        <span key={tag} className={`px-2 py-1 rounded text-[10px] border ${i === 1 ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500 text-indigo-900 dark:text-indigo-300' : 'bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-white/5 text-slate-600 dark:text-zinc-500'}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function EmbedVisual({ isActive }: { isActive: boolean }) {
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={isActive ? { scale: 1, opacity: 1 } : {}}
                className="w-full bg-slate-100 dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-white/5">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-500 font-mono">embed-snippet.js</div>
                </div>
                <div className="p-4 font-mono text-xs space-y-1">
                    <div className="flex">
                        <span className="text-zinc-400 dark:text-zinc-600 w-6 select-none">1</span>
                        <span className="text-purple-400">const</span> <span className="mx-1 text-blue-400 ">chatbot</span> = <span className="ml-1 text-yellow-400">new</span> <span className="ml-1 text-green-400">ChatBot</span>({'{'}
                    </div>
                    <div className="flex">
                        <span className="text-zinc-400 dark:text-zinc-600 w-6 select-none">2</span>
                        <span className="pl-4 text-blue-300">apiKey</span>: <span className="text-orange-400">'pk_live_8392...'</span>,
                    </div>
                    <div className="flex">
                        <span className="text-zinc-400 dark:text-zinc-600 w-6 select-none">3</span>
                        <span className="pl-4 text-blue-300">theme</span>: <span className="text-orange-400">'dark'</span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-400 dark:text-zinc-600 w-6 select-none">4</span>
                        {'}'});
                    </div>
                </div>

                {/* Copy Button Animation */}
                <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-white/5 flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                    >
                        <Copy className="w-3 h-3" />
                        Copy Snippet
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
