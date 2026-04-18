import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Eye, X, LineChart, ArrowLeft, Zap, Check, Loader2 } from 'lucide-react';
import { useDecks, useGradeMutation } from '../hooks/queries';

const PurpleSparks = () => {
    const sparks = Array.from({ length: 40 });
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-50">
            {sparks.map((_, i) => {
                const angle = (i * 360) / sparks.length;
                const distance = 150 + Math.random() * 200;
                const delay = Math.random() * 0.2;
                const duration = 0.6 + Math.random() * 0.4;

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: 0,
                            scale: Math.random() * 1.5 + 0.5,
                            x: Math.cos(angle * Math.PI / 180) * distance,
                            y: Math.sin(angle * Math.PI / 180) * distance
                        }}
                        transition={{ duration, delay, ease: "easeOut" }}
                        className="absolute w-2 h-2 rounded-full bg-[#5227FF] shadow-[0_0_15px_#5227FF]"
                    />
                );
            })}
        </div>
    );
};

export default function PracticePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: decksData = [], isLoading } = useDecks();
    const { mutate: gradeCard } = useGradeMutation();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showSource, setShowSource] = useState(false);
    const [direction, setDirection] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);

    const selectedDeckId = location.state?.deckId;

    // Prefer selected deck. If not provided, pick the first deck that has cards.
    const currentDeck = useMemo(() => {
        if (!Array.isArray(decksData) || decksData.length === 0) return null;

        if (selectedDeckId) {
            return decksData.find((deck) => deck._id === selectedDeckId) || decksData[0];
        }

        return decksData.find((deck) => Array.isArray(deck.cards) && deck.cards.length > 0) || decksData[0];
    }, [decksData, selectedDeckId]);

    const items = currentDeck?.cards || [];

    const handleGrade = useCallback((grade) => {
        setDirection(1);
        setShowSource(false);
        setIsFlipped(false);

        if (items.length > 0 && items[currentIndex]) {
            gradeCard({ cardId: items[currentIndex]._id, q: grade });
        }

        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsCompleted(true);
        }
    }, [currentIndex, items, gradeCard]);

    const card = items[currentIndex];
    const progress = items.length ? (currentIndex / items.length) * 100 : 0;

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isCompleted) return;

            if (e.code === 'Space') {
                e.preventDefault();
                handleFlip();
            }

            if (isFlipped) {
                switch (e.key) {
                    case '1': handleGrade(1); break;
                    case '2': handleGrade(2); break;
                    case '3': handleGrade(3); break;
                    case '4': handleGrade(4); break;
                    default: break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, isCompleted, handleFlip, handleGrade]);

    const gradeButtons = [
        { label: 'Again', key: '1', interval: '< 1m', color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500 hover:bg-red-500/30' },
        { label: 'Hard', key: '2', interval: '12m', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/30' },
        { label: 'Good', key: '3', interval: '1d', color: 'bg-[#5227FF]/20 text-[#5227FF] border-[#5227FF]/30 hover:border-[#5227FF] hover:bg-[#5227FF]/40 shadow-[0_0_15px_rgba(82,39,255,0.2)] hover:shadow-[0_0_20px_rgba(82,39,255,0.5)]' },
        { label: 'Easy', key: '4', interval: '4d', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/30' }
    ];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#5227FF] animate-spin" />
            </div>
        );
    }

    if (!currentDeck || items.length === 0) {
        return (
            <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-zinc-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Cards Available</h2>
                <p className="text-zinc-400 max-w-md mb-8">You need to upload some study material and generate a deck before you can practice.</p>
                <button
                    onClick={() => navigate('/lab')}
                    className="bg-[#5227FF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5227FF]/90 transition-colors shadow-[0_0_20px_rgba(82,39,255,0.3)]"
                >
                    Go to Refinement Lab
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden flex flex-col">
            {/* Background Aura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <motion.div
                    animate={{
                        scale: isFlipped ? 1.1 : 1,
                        opacity: isFlipped ? 0.3 : 0.15
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                    className="w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#5227FF] rounded-full blur-[150px]"
                />
            </div>

            {/* Top Progress Bar & Nav */}
            <header className="relative z-40 flex flex-col pt-6 px-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Exit Theater
                    </button>

                    {/* Retention Curve Mini-Graph Hover */}
                    <div className="relative group cursor-help">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium">
                            <LineChart className="w-4 h-4 text-[#5227FF]" />
                            Session Mastery
                        </div>
                        <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-48 shadow-2xl pointer-events-none">
                            <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Card Strength</p>
                            <div className="h-12 flex items-end gap-1">
                                {[20, 35, 25, 45, 60, 50, 80, 95].map((h, i) => (
                                    <div key={i} className="flex-1 bg-[#5227FF]/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Line */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[#5227FF] shadow-[0_0_15px_#5227FF]"
                        initial={{ width: 0 }}
                        animate={{ width: `${isCompleted ? 100 : progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6">
                <AnimatePresence mode="popLayout" custom={direction}>
                    {!isCompleted ? (
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            initial={{ x: -200, y: 200, opacity: 0, rotate: -10, scale: 0.9 }}
                            animate={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ x: 300, y: -300, opacity: 0, rotate: 15, scale: 0.9 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="w-full max-w-3xl perspective-[1200px]"
                        >
                            <motion.div
                                animate={{ rotateX: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                                className="relative w-full aspect-[4/3] md:aspect-[2/1] transform-style-3d cursor-pointer"
                                onClick={handleFlip}
                            >
                                {/* FRONT FACE */}
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-[#5227FF]/20 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center backface-hidden shadow-2xl hover:border-[#5227FF]/40 transition-colors">
                                    <div className="absolute top-6 left-6 text-xs font-semibold text-[#5227FF] tracking-widest uppercase opacity-60">Question</div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-center leading-tight tracking-tight text-white mb-8">
                                        {card.front}
                                    </h2>
                                    <div className="absolute bottom-6 text-zinc-500 text-sm flex items-center gap-2 animate-pulse">
                                        Press <kbd className="px-2 py-1 bg-white/10 rounded-md font-mono text-xs text-white">Space</kbd> to reveal
                                    </div>
                                </div>

                                {/* BACK FACE */}
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-[#5227FF]/20 rounded-3xl p-8 md:p-12 flex flex-col justify-center rotate-x-180 backface-hidden shadow-2xl">
                                    <div className="absolute top-6 left-6 text-xs font-semibold text-emerald-400 tracking-widest uppercase opacity-60">Answer</div>

                                    <div className="flex-1 flex flex-col justify-center">
                                        <p className="text-xl md:text-2xl text-zinc-200 leading-relaxed mb-8">
                                            {card.back}
                                        </p>

                                        <div className="bg-[#5227FF]/10 border border-[#5227FF]/30 rounded-xl p-4 flex gap-4 items-start">
                                            <div className="p-2 bg-[#5227FF]/20 rounded-lg mt-1">
                                                <Zap className="w-5 h-5 text-[#5227FF]" />
                                            </div>
                                            <div>
                                                <h4 className="text-[#5227FF] font-semibold text-sm mb-1 uppercase tracking-wider">Key Takeaway</h4>
                                                <p className="text-zinc-300 text-sm leading-relaxed">{card.keyTakeaway}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Dashboard - Only shows when flipped */}
                            <AnimatePresence>
                                {isFlipped && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute -bottom-24 left-0 w-full flex justify-center gap-3 md:gap-4"
                                    >
                                        {gradeButtons.map((btn) => (
                                            <button
                                                key={btn.key}
                                                onClick={(e) => { e.stopPropagation(); handleGrade(parseInt(btn.key)); }}
                                                className={`flex flex-col items-center justify-center w-20 md:w-28 py-3 rounded-2xl border backdrop-blur-md transition-all ${btn.color} group`}
                                            >
                                                <span className="font-semibold text-sm md:text-base mb-1">{btn.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">{btn.interval}</span>
                                                    <span className="hidden md:inline-flex px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                                                        {btn.key}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="complete"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center bg-white/5 backdrop-blur-2xl border border-[#5227FF]/30 rounded-3xl p-12 shadow-[0_0_40px_rgba(82,39,255,0.2)]"
                        >
                            <PurpleSparks />
                            <div className="w-20 h-20 bg-[#5227FF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_#5227FF]">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-4xl font-bold text-white mb-4">Deck Mastered</h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                                Excellent work. You've reviewed all pending cards. The engine will schedule them for optimal retention.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-xl font-bold transition-colors"
                            >
                                Return to Command Center
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Context Pull Drawer Component */}
            <AnimatePresence>
                {isFlipped && !isCompleted && !showSource && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <button
                            onClick={() => setShowSource(true)}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-xl group"
                            title="View Source Context"
                        >
                            <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Context Pull Drawer itself */}
            <AnimatePresence>
                {showSource && (
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 w-full md:w-96 h-full bg-black/80 backdrop-blur-3xl border-l border-[#5227FF]/30 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-zinc-900/30">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#5227FF]" />
                                <h3 className="font-semibold text-white tracking-tight">Source Context</h3>
                            </div>
                            <button
                                onClick={() => setShowSource(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="p-5 rounded-xl border-l-4 border-[#5227FF] bg-[#5227FF]/10 text-zinc-200 font-serif leading-relaxed text-sm md:text-base">
                                "{card?.source}"
                            </div>
                            <p className="mt-4 text-xs font-mono text-zinc-500 uppercase">
                                Excerpt from: Neuroscience_Chapter4.pdf
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .perspective-\\[1200px\\] { perspective: 1200px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
      `}} />
        </div>
    );
}