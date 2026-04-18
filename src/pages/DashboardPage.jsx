import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Upload, FileText, Play, Clock, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DarkVeil from '../components/DarkVeil';
import { useCurrentUser, useDecks, useMasteryStats } from '../hooks/queries';
import { getStoredUser } from '../utils/authStorage';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

export default function DashboardPage() {
    const navigate = useNavigate();

    const { data: decksData = [], isLoading } = useDecks();
    const { data: masteryStats } = useMasteryStats();
    const { data: currentUser } = useCurrentUser();

    const storedUser = getStoredUser();
    const rawName = (currentUser?.name || storedUser?.name || '').trim();
    const firstName = rawName ? rawName.split(/\s+/)[0] : 'Learner';

    const dueCardCount = decksData.reduce((count, deck) => {
        const cards = Array.isArray(deck.cards) ? deck.cards : [];
        const dueForReview = cards.filter((card) => {
            if (!card?.nextReview) return false;
            const reviewTime = new Date(card.nextReview).getTime();
            if (Number.isNaN(reviewTime)) return false;
            return reviewTime <= Date.now();
        }).length;

        return count + dueForReview;
    }, 0);

    const cardNoun = dueCardCount === 1 ? 'card' : 'cards';

    const retentionChartData = (masteryStats?.forecastData || []).map((point) => ({
        name: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        ret: point.cards,
    }));

    const knowledgeStrength = Number(masteryStats?.knowledgeStrength || 0);

    const upNextDecks = decksData
        .map((deck) => {
            const dueCards = (deck.cards || []).filter((card) => {
                if (!card?.nextReview) return false;
                const reviewTime = new Date(card.nextReview).getTime();
                if (Number.isNaN(reviewTime)) return false;
                return reviewTime <= Date.now() + 24 * 60 * 60 * 1000;
            }).length;

            return {
                id: deck._id,
                title: deck.title || deck.name || 'Untitled Deck',
                due: dueCards,
                urgency: dueCards >= 8 ? 'high' : 'medium',
            };
        })
        .filter((deck) => deck.due > 0)
        .sort((a, b) => b.due - a.due)
        .slice(0, 3);

    const libraryDecks = decksData.map(deck => ({
        id: deck._id,
        title: deck.title || deck.name || 'Untitled Deck',
        mastery: deck.masteryLevel || 0,
        new: deck.cards?.filter(c => (c.repetitions ?? 0) === 0)?.length || 0,
        learning: deck.cards?.filter(c => (c.repetitions ?? 0) > 0 && (c.interval ?? 0) < 7)?.length || 0,
        review: deck.cards?.filter(c => (c.interval ?? 0) >= 7)?.length || 0
    }));

    const handleTabChange = (tabId) => {
        if (tabId === 'home') navigate('/dashboard');
        if (tabId === 'library') navigate('/library');
        if (tabId === 'analytics') navigate('/analytics');
        if (tabId === 'settings') navigate('/settings');
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-[#5227FF]/50 relative">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <DarkVeil
                    hueShift={0}
                    noiseIntensity={0}
                    scanlineIntensity={0}
                    speed={0.5}
                    scanlineFrequency={0}
                    warpAmount={0}
                />
            </div>

            <Sidebar activeTab="home" onChange={handleTabChange} />

            <main className="lg:ml-20 min-h-screen flex flex-col relative z-10">
                <div className="px-8 pt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>
                </div>

                <Header
                    title={`Good Morning, ${firstName}`}
                    subtitle={`You have ${dueCardCount} ${cardNoun} due for review.`}
                />

                <div className="flex-1 p-6 lg:p-10 pt-2 lg:pt-4">
                    <motion.div
                        className="max-w-7xl mx-auto space-y-6 lg:space-y-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        {/* Top Row: Retention Chart + Up Next */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                            {/* Retention Health Card */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-[#5227FF]/15 rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:border-[#5227FF]/30 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">Retention Health</h3>
                                        <p className="text-sm text-zinc-400 mt-1">Overall memory strength past 30 days</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#5227FF]/10 px-4 py-2 rounded-lg border border-[#5227FF]/30 shadow-[0_0_15px_rgba(82,39,255,0.1)] w-fit">
                                        <Zap className="w-4 h-4 text-[#5227FF]" />
                                        <span className="text-sm font-medium text-[#5227FF]">{knowledgeStrength.toFixed(1)}% Knowledge Strength</span>
                                    </div>
                                </div>
                                <div className="h-[220px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={retentionChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#5227FF" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#5227FF" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(82, 39, 255, 0.3)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#white', fontWeight: 500 }}
                                                labelStyle={{ display: 'none' }}
                                                formatter={(value) => [`${value}% Strength`, '']}
                                            />
                                            <Area type="monotone" dataKey="ret" stroke="#5227FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRet)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Up Next Queue */}
                            <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-md border border-[#5227FF]/15 rounded-2xl p-6 lg:p-8 flex flex-col group hover:border-[#5227FF]/30 transition-colors h-full">
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-zinc-400" />
                                        Up Next
                                    </h3>
                                    <p className="text-sm text-zinc-400 mt-1">Based on SM-2 spacing algorithm</p>
                                </div>
                                <div className="flex-1 flex flex-col gap-3 justify-start">
                                    {upNextDecks.length > 0 ? (
                                        upNextDecks.map(deck => (
                                            <div key={deck.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${deck.urgency === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]'}`}></div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-white">{deck.title}</h4>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{deck.due} items due</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate('/practice', { state: { deckId: deck.id } })}
                                                    className="flex items-center justify-center p-2.5 bg-[#5227FF]/20 hover:bg-[#5227FF]/30 border border-[#5227FF]/40 rounded-lg transition-all group-hover/item:border-[#5227FF] group-hover/item:shadow-[0_0_15px_rgba(82,39,255,0.4)]"
                                                >
                                                    <Play className="w-3.5 h-3.5 text-white ml-[2px]" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-400">
                                            No cards are due right now.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Second Row: Deck Library Header */}
                        <motion.div variants={itemVariants} className="flex justify-between items-end pt-6 pb-2 border-b border-white/10">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Deck Library</h2>
                                <p className="text-sm text-zinc-400 mt-1">Manage and study your knowledge bases</p>
                            </div>
                        </motion.div>

                        {/* Decks Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-white/5 backdrop-blur-md border border-[#5227FF]/15 rounded-2xl p-6 relative overflow-hidden flex flex-col animate-pulse">
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700"></div>
                                            <div className="w-20 h-8 rounded-lg bg-zinc-800"></div>
                                        </div>
                                        <div className="h-6 w-3/4 bg-zinc-800 rounded mb-4"></div>
                                        <div className="mb-6 mt-auto">
                                            <div className="flex justify-between text-xs mb-2">
                                                <div className="h-3 w-16 bg-zinc-800 rounded"></div>
                                                <div className="h-3 w-8 bg-zinc-800 rounded"></div>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full"></div>
                                        </div>
                                    </div>
                                ))
                            ) : libraryDecks.length > 0 ? (
                                libraryDecks.map((deck) => (
                                    <motion.div
                                        key={deck.id}
                                        variants={itemVariants}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        onClick={() => navigate('/practice', { state: { deckId: deck.id } })}
                                        className="bg-white/5 backdrop-blur-md border border-[#5227FF]/15 hover:border-[#5227FF]/50 rounded-2xl p-6 cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#5227FF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative z-10 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center group-hover:border-[#5227FF]/40 group-hover:bg-[#5227FF]/10 transition-colors">
                                                    <FileText className="w-6 h-6 text-zinc-400 group-hover:text-[#5227FF] transition-colors" />
                                                </div>
                                                <button className="text-xs font-medium px-4 py-1.5 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/15 transition-colors text-white hover:border-white/30 hover:shadow-sm">
                                                    Study Now
                                                </button>
                                            </div>

                                            <h4 className="text-lg font-semibold text-white mb-4 line-clamp-1">{deck.title}</h4>

                                            {/* Mastery Bar */}
                                            <div className="mb-6 mt-auto">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">Mastery %</span>
                                                    <span className="text-[#5227FF] font-mono font-medium">{deck.mastery}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${deck.mastery}%` }}
                                                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                        className="h-full bg-[#5227FF] shadow-[0_0_10px_rgba(82,39,255,0.6)]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="flex gap-6 border-t border-white/5 pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">New</span>
                                                    <span className="text-sm font-mono text-zinc-300">{deck.new}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Learning</span>
                                                    <span className="text-sm font-mono text-orange-400">{deck.learning}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Review</span>
                                                    <span className="text-sm font-mono text-emerald-400">{deck.review}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))) : null}

                            {/* The Dropzone */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => navigate('/lab')}
                                className="border-2 border-dashed border-[#5227FF]/30 bg-[#5227FF]/5 hover:bg-[#5227FF]/10 hover:border-[#5227FF]/60 rounded-2xl min-h-[240px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group backdrop-blur-md"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#5227FF]/20 group-hover:border-[#5227FF]/50 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    <Upload className="w-8 h-8 text-zinc-400 group-hover:text-[#5227FF] transition-colors" />
                                </div>
                                <h4 className="text-white font-medium mb-1.5 text-lg">Drop PDF to Generate New Deck</h4>
                                <p className="text-sm text-zinc-400 max-w-[200px]">Drag and drop your syllabus or chapter here</p>
                            </motion.div>

                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}