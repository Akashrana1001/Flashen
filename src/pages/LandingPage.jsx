import React, { Suspense, lazy, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    BrainCircuit,
    BarChart3,
    Upload,
    Layers,
    BookOpen,
    Activity,
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import ParallaxBackground from '../components/ParallaxBackground';

const LightPillar = lazy(() => import('../components/LightPillar'));

const headlineContainer = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.2,
        },
    },
};

const headlineWord = {
    hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
    show: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.45, ease: 'easeOut' },
    },
};

const LandingPage = () => {
    const navigate = useNavigate();
    const pageRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: pageRef,
        offset: ['start start', 'end end'],
    });

    const glowYPrimary = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const glowYSecondary = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);

    const socialLinks = [
        { id: 'x', label: 'X', glyph: 'X', href: '#' },
        { id: 'github', label: 'GitHub', glyph: 'GH', href: '#' },
        { id: 'linkedin', label: 'LinkedIn', glyph: 'IN', href: '#' },
    ];

    const productLinks = ['Dashboard', 'Study Mode', 'AI Ingestion'];
    const resourceLinks = ['Documentation', 'SM-2 Whitepaper', 'Community'];

    const headlineTop = ['Long-term', 'retention', 'beats'];
    const headlineBottom = ['short-term', 'cramming.'];

    return (
        <motion.div
            ref={pageRef}
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-[#5227FF] selection:text-white"
        >
            <ParallaxBackground />

            <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-black/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-lg tracking-tight flex items-center gap-2">
                            The Flashcard Engine
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5227FF]"></span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#5227FF] hover:bg-[#5227FF]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(82,39,255,0.3)]"
                        >
                            Start Studying
                        </button>
                    </div>
                </div>
            </nav>

            <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <motion.div
                        style={{ y: glowYPrimary }}
                        className="absolute top-[10%] left-[6%] w-[34vw] h-[34vw] rounded-full bg-[#5227FF]/10 blur-[130px]"
                    />
                    <motion.div
                        style={{ y: glowYSecondary }}
                        className="absolute bottom-[-12%] right-[2%] w-[36vw] h-[36vw] rounded-full bg-cyan-400/8 blur-[150px]"
                    />

                    <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
                        <Suspense fallback={null}>
                            <LightPillar
                                topColor="#5227FF"
                                bottomColor="#af40ac"
                                intensity={0.8}
                                rotationSpeed={0.25}
                                glowAmount={0.003}
                                pillarWidth={3}
                                pillarHeight={0.4}
                                noiseIntensity={0.45}
                                pillarRotation={25}
                                interactive={false}
                                mixBlendMode="screen"
                                quality="high"
                            />
                        </Suspense>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black pointer-events-none" />
                </div>

                <ScrollReveal delay={0.08} className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-xs font-medium text-zinc-300 mb-6 mx-auto">
                        <BrainCircuit className="w-4 h-4 text-[#5227FF]" />
                        <span>Powered by cognitive science</span>
                    </div>

                    <motion.h1
                        variants={headlineContainer}
                        initial="hidden"
                        animate="show"
                        className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1]"
                    >
                        <span className="block">
                            {headlineTop.map((word) => (
                                <motion.span key={word} variants={headlineWord} className="inline-block mr-3">
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                            {headlineBottom.map((word) => (
                                <motion.span key={word} variants={headlineWord} className="inline-block mr-3">
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.5, ease: 'easeOut' }}
                        className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        Upload any PDF-class notes, textbooks, or papers-and instantly generate a smart,
                        practice-ready deck powered by spaced repetition.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.65, ease: 'easeOut' }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5227FF] hover:bg-[#5227FF]/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(82,39,255,0.4)]"
                        >
                            <Upload className="w-4 h-4" />
                            Upload your first PDF
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 text-white px-6 py-3 rounded-lg font-medium transition-all">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                            View a Sample Deck
                        </button>
                    </motion.div>
                </ScrollReveal>
            </section>

            <ScrollReveal delay={0.12}>
                <section className="py-24 bg-black relative z-10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold text-white mb-4">The Engine</h2>
                            <p className="text-zinc-400 max-w-xl">
                                Purpose-built tools designed to extract, structure, and cement knowledge into your long-term memory.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="md:col-span-2 group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 overflow-hidden hover:border-[#5227FF]/50 transition-colors"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#5227FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="flex-1">
                                        <div className="w-12 h-12 rounded-lg bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 group-hover:border-[#5227FF]/50 transition-colors">
                                            <FileText className="w-6 h-6 text-[#5227FF]" />
                                        </div>
                                        <h3 className="text-2xl font-semibold text-white mb-3">High-Fidelity Ingestion</h3>
                                        <p className="text-zinc-400 leading-relaxed">
                                            Comprehensive extraction, not bot-scraped garbage. Captures relationships, edge cases, and worked examples from complex academic texts.
                                        </p>
                                    </div>

                                    <div className="flex-1 w-full bg-black/60 rounded-xl border border-zinc-800 p-4 shadow-2xl overflow-hidden">
                                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                        </div>
                                        <div className="space-y-3 font-mono text-xs">
                                            <div className="text-zinc-500">{"{"}</div>
                                            <div className="pl-4">
                                                <span className="text-blue-400">"type"</span>: <span className="text-green-400">"concept_relation"</span>,
                                            </div>
                                            <div className="pl-4">
                                                <span className="text-blue-400">"front"</span>: <span className="text-green-400">"How does synaptic plasticity relate to LTP?"</span>,
                                            </div>
                                            <div className="pl-4">
                                                <span className="text-blue-400">"back"</span>: <span className="text-green-400">"LTP is a persistent strengthening..."</span>
                                            </div>
                                            <div className="text-zinc-500">{"}"}</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.62, delay: 0.07, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 overflow-hidden hover:border-[#5227FF]/50 transition-colors"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#5227FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-12 h-12 rounded-lg bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 group-hover:border-[#5227FF]/50 transition-colors">
                                        <Layers className="w-6 h-6 text-[#5227FF]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">Spaced Repetition Engine</h3>
                                    <p className="text-zinc-400 leading-relaxed mb-8 flex-grow">
                                        Smart fading. Cards you know intuitively fade away; cards you struggle with return precisely when you're about to forget them.
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-zinc-800/50">
                                        <div className="flex items-end gap-2 h-24">
                                            {[30, 45, 25, 60, 40, 75, 50, 90].map((h, i) => (
                                                <div key={i} className="flex-1 bg-zinc-800 rounded-t-sm relative group-hover:bg-zinc-700 transition-colors" style={{ height: `${h}%` }}>
                                                    {i === 7 && <div className="absolute top-0 inset-x-0 h-full bg-[#5227FF]/40 rounded-t-sm" />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-zinc-500 mt-2 uppercase tracking-wider font-semibold">
                                            <span>Day 1</span>
                                            <span className="text-[#5227FF]">Review Today</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.62, delay: 0.11, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 overflow-hidden hover:border-[#5227FF]/50 transition-colors"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#5227FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-12 h-12 rounded-lg bg-zinc-800/80 flex items-center justify-center mb-6 border border-zinc-700 group-hover:border-[#5227FF]/50 transition-colors">
                                        <BarChart3 className="w-6 h-6 text-[#5227FF]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">Mastery Analytics</h3>
                                    <p className="text-zinc-400 leading-relaxed mb-8 flex-grow">
                                        Track what's solid, what's shaky, and what's due for review. Visualize your journey from cramming to genuine comprehension.
                                    </p>

                                    <div className="mt-auto space-y-4 pt-6 border-t border-zinc-800/50">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Neuroscience 101</span>
                                                <span className="text-[#5227FF] font-mono">82%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="w-[82%] h-full bg-[#5227FF]" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Cellular Biology</span>
                                                <span className="text-zinc-400 font-mono">45%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="w-[45%] h-full bg-zinc-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal delay={0.16}>
                <section className="py-24 border-t border-zinc-900 bg-black relative z-10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-white mb-4">Pipeline to Mastery</h2>
                            <p className="text-zinc-400 max-w-xl mx-auto">A seamless workflow from raw documents to deeply ingrained knowledge.</p>
                        </div>

                        <div className="flex flex-col md:flex-row relative gap-8 md:gap-4">
                            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 z-0" />

                            {[
                                { num: '01', title: 'Drop a PDF', desc: 'Upload dense textbooks, lecture slides, or specialized papers.' },
                                { num: '02', title: 'AI Structures Knowledge', desc: 'The engine extracts core concepts and builds a structured deck.' },
                                { num: '03', title: 'Practice & Recall', desc: 'Review dynamically. The algorithm handles your scheduling.' },
                            ].map((step, i) => (
                                <motion.div
                                    key={step.num}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.45, delay: i * 0.12, ease: 'easeOut' }}
                                    className="flex-1 relative z-10 flex flex-col items-center text-center group"
                                >
                                    <div className="w-14 h-14 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center text-white font-mono font-bold mb-6 group-hover:border-[#5227FF] group-hover:text-[#5227FF] transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-zinc-900/80">
                                        {step.num}
                                    </div>
                                    <h4 className="text-lg font-semibold text-white mb-2">{step.title}</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-[250px]">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
                <footer className="relative z-10 bg-black pt-16 pb-8 mt-20 border-t border-white/10">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#5227FF]/50 to-transparent" />

                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-6 h-6 rounded-sm bg-[#5227FF] shadow-[0_0_15px_rgba(82,39,255,0.5)]" />
                                <span className="text-white text-xl font-bold tracking-tight">Flashcard Engine</span>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-5 max-w-xs">
                                Harnessing SM-2 spaced repetition and neural extraction to turn deep reading into permanent knowledge.
                            </p>
                            <div className="flex items-center gap-3">
                                {socialLinks.map((social) => {
                                    return (
                                        <a
                                            key={social.id}
                                            href={social.href}
                                            aria-label={social.label}
                                            className="w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#5227FF]/60 hover:bg-[#5227FF]/15 transition-all"
                                        >
                                            <span className="text-[11px] font-semibold tracking-wide">{social.glyph}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                {productLinks.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="hover:text-[#5227FF] transition-colors">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                {resourceLinks.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="hover:text-[#5227FF] transition-colors">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-white mb-4">Stay Updated</h4>
                            <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-1.5">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 pr-20 pl-3 py-2 outline-none"
                                />
                                <button className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-sm font-semibold transition-colors">
                                    Join
                                </button>
                            </div>
                            <p className="text-xs text-zinc-500 mt-3">
                                Product updates, release notes, and memory-science insights.
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
                        <div className="text-zinc-600">
                            (c) {new Date().getFullYear()} Flashcard Engine. Built for Mastery.
                        </div>

                        <div className="flex items-center gap-6 text-zinc-500">
                            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
                        </div>

                        <div className="inline-flex items-center gap-2 text-zinc-400">
                            <span className="relative inline-flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                Systems Operational
                            </span>
                        </div>
                    </div>
                </footer>
            </ScrollReveal>
        </motion.div>
    );
};

export default LandingPage;
