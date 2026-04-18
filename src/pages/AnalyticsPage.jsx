import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Database,
    Layers,
    Calendar,
    Search,
    Merge,
    Network,
    ArrowLeft,
    Activity,
    AlertTriangle,
    Sparkles,
    RefreshCw,
    Flame,
    Trash2,
    Loader2,
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { useDecks, useDeleteDeckMutation, useMasteryStats } from '../hooks/queries';

const parseDateValue = (value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const formatShortDate = (value) => {
    const date = parseDateValue(value);
    if (!date) return '--';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getHeatmapColor = (level) => {
    switch (level) {
        case 1:
            return 'bg-[#5227FF]/20 border-[#5227FF]/10';
        case 2:
            return 'bg-[#5227FF]/50 border-[#5227FF]/30';
        case 3:
            return 'bg-[#5227FF]/80 border-[#5227FF]/50 shadow-[0_0_8px_rgba(82,39,255,0.4)]';
        case 4:
            return 'bg-[#5227FF] border-[#5227FF] shadow-[0_0_12px_rgba(82,39,255,0.8)]';
        default:
            return 'bg-zinc-900 border-zinc-800';
    }
};

const getCardMastery = (card) => {
    const ease = Number(card?.easeFactor ?? 2.5);
    const repetitions = Number(card?.repetitions ?? 0);
    const interval = Number(card?.interval ?? 0);
    return Math.min(100, Math.round((ease / 2.5) * 45 + Math.min(repetitions, 12) * 3 + Math.min(interval, 30) * 1.3));
};

const formatReviewTime = (value) => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';

    const now = new Date();
    const sameDay =
        now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();

    if (sameDay) {
        return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ShimmerTile = ({ className = '' }) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${className}`}>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '150%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
        </div>
    );
};

const AnalyticsSkeleton = () => {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">
                <ShimmerTile className="h-28" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ShimmerTile className="lg:col-span-2 h-[370px]" />
                    <ShimmerTile className="h-[370px]" />
                </div>
                <ShimmerTile className="h-[240px]" />
                <ShimmerTile className="h-[320px]" />
            </div>
        </div>
    );
};

export default function AnalyticsPage() {
    const navigate = useNavigate();
    const [totalConcepts, setTotalConcepts] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDecks, setSelectedDecks] = useState([]);
    const [heatmapRange, setHeatmapRange] = useState(90);
    const [deckFilter, setDeckFilter] = useState('all');
    const [pendingDeleteDeckId, setPendingDeleteDeckId] = useState(null);

    const { data: rawDecks = [], isLoading: isDecksLoading } = useDecks();
    const { mutate: deleteDeck } = useDeleteDeckMutation();
    const {
        data: masteryStats,
        isLoading: isMasteryLoading,
        isError,
        error,
        refetch,
    } = useMasteryStats();

    const isLoading = isDecksLoading || isMasteryLoading;

    const forecastData = useMemo(() => {
        return (masteryStats?.forecastData || []).map((point) => ({
            ...point,
            label: formatShortDate(point.date),
        }));
    }, [masteryStats?.forecastData]);

    const heatmapData = useMemo(() => {
        return (masteryStats?.heatmapData || []).map((cell, idx) => ({
            id: cell.id ?? idx,
            level: cell.level ?? 0,
            cards: cell.cards ?? 0,
            date: cell.dateKey || cell.date,
            dateKey: cell.dateKey || cell.date,
            isToday: Boolean(cell.isToday),
            label: formatShortDate(cell.dateKey || cell.date),
        }));
    }, [masteryStats?.heatmapData]);

    const analyticsMeta = masteryStats?.meta || {};
    const reviewedToday = Number(analyticsMeta.reviewedToday || 0);
    const dueToday = Number(analyticsMeta.dueToday || 0);
    const consistencyScore = Number(analyticsMeta.consistencyScore || 0);
    const streakDays = Number(analyticsMeta.streakDays || 0);

    const visibleHeatmapData = useMemo(() => {
        return heatmapData.slice(-heatmapRange);
    }, [heatmapData, heatmapRange]);

    const activeHeatmapDays = useMemo(() => {
        return visibleHeatmapData.filter((cell) => cell.cards > 0).length;
    }, [visibleHeatmapData]);

    const peakReviewDayLabel = analyticsMeta?.peakReviewDay?.date
        ? formatShortDate(analyticsMeta.peakReviewDay.date)
        : '--';
    const peakReviewCards = Number(analyticsMeta?.peakReviewDay?.cards || 0);

    const isNewUserNoData =
        !isLoading &&
        !isError &&
        Number(masteryStats?.totalConcepts || 0) === 0;

    const actualDecks = useMemo(() => {
        return rawDecks.map((deck) => {
            const cards = Array.isArray(deck.cards) ? deck.cards : [];
            const now = Date.now();
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const mastery = cards.length
                ? Math.round(cards.reduce((acc, card) => acc + getCardMastery(card), 0) / cards.length)
                : 0;

            const lastStudiedDate = cards.reduce((latest, card) => {
                const updated = card?.updatedAt ? new Date(card.updatedAt) : null;
                if (!updated || Number.isNaN(updated.getTime())) return latest;
                if (!latest) return updated;
                return updated > latest ? updated : latest;
            }, null);

            const nextReviewDate = cards.reduce((next, card) => {
                const review = card?.nextReview ? new Date(card.nextReview) : null;
                if (!review || Number.isNaN(review.getTime())) return next;
                if (!next) return review;
                return review < next ? review : next;
            }, null);

            const dueTodayCount = cards.filter((card) => {
                if (!card?.nextReview) return false;
                const reviewTime = new Date(card.nextReview).getTime();
                if (Number.isNaN(reviewTime)) return false;
                return reviewTime <= endOfDay.getTime();
            }).length;

            const overdueCount = cards.filter((card) => {
                if (!card?.nextReview) return false;
                const reviewTime = new Date(card.nextReview).getTime();
                if (Number.isNaN(reviewTime)) return false;
                return reviewTime <= now;
            }).length;

            return {
                id: deck._id,
                name: deck.title || deck.name || 'Untitled Deck',
                lastStudied: lastStudiedDate
                    ? lastStudiedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : 'Never',
                mastery,
                nextReview: formatReviewTime(nextReviewDate),
                dueTodayCount,
                overdueCount,
            };
        });
    }, [rawDecks]);

    useEffect(() => {
        const targetNumber = masteryStats?.totalConcepts ?? 0;
        const controls = animate(0, targetNumber, {
            duration: 0.8,
            ease: 'easeOut',
            onUpdate(value) {
                setTotalConcepts(Math.floor(value));
            },
        });
        return () => controls.stop();
    }, [masteryStats?.totalConcepts]);

    const filteredDecks = useMemo(() => {
        return actualDecks
            .filter((deck) => deck.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter((deck) => {
                if (deckFilter === 'review') return deck.dueTodayCount > 0;
                if (deckFilter === 'strong') return deck.mastery >= 75;
                if (deckFilter === 'risky') return deck.mastery < 45 || deck.overdueCount > 0;
                return true;
            })
            .sort((a, b) => {
                if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
                if (a.mastery !== b.mastery) return a.mastery - b.mastery;
                return a.name.localeCompare(b.name);
            });
    }, [actualDecks, searchQuery, deckFilter]);

    const toggleDeckSelection = (e, id) => {
        e.stopPropagation();
        setSelectedDecks((prev) =>
            prev.includes(id) ? prev.filter((deckId) => deckId !== id) : [...prev, id]
        );
    };

    const handleDeleteDeck = (e, deck) => {
        e.stopPropagation();

        if (pendingDeleteDeckId) return;

        const shouldDelete = window.confirm(
            `Delete deck "${deck.name}"? This will permanently remove the deck and all associated cards.`
        );

        if (!shouldDelete) return;

        setPendingDeleteDeckId(deck.id);
        deleteDeck(deck.id, {
            onSuccess: () => {
                setSelectedDecks((prev) => prev.filter((deckId) => deckId !== deck.id));
            },
            onSettled: () => {
                setPendingDeleteDeckId(null);
            },
        });
    };

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-black text-white p-6 md:p-10 flex items-center justify-center">
                <div className="max-w-xl w-full rounded-3xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-3">Could not load analytics</h2>
                    <p className="text-zinc-300 mb-6">
                        {error?.response?.data?.message || error?.message || 'Unexpected analytics API error.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="px-5 py-2.5 rounded-xl bg-[#5227FF] hover:bg-[#5227FF]/90 text-white font-semibold transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#5227FF]/30 selection:text-white p-6 md:p-10 pb-24 relative overflow-x-hidden">
            <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#5227FF]/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

            <header className="max-w-7xl mx-auto mb-12 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium mb-6 group"
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Command Center
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-8 h-8 text-[#5227FF]" />
                        <h1 className="text-4xl font-bold tracking-tight text-white">Mastery Analytics</h1>
                    </div>
                    <p className="text-zinc-400">Live performance from your MongoDB study data.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-w-[260px]">
                    <span className="text-sm text-zinc-400 font-medium uppercase tracking-wider mb-1 block">Total Concepts Mastered</span>
                    <div className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                        {totalConcepts.toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm text-[#5227FF] font-medium">
                        Knowledge Strength: {Number(masteryStats?.knowledgeStrength || 0).toFixed(1)}%
                    </div>
                </div>
            </header>

            {isNewUserNoData ? (
                <main className="max-w-7xl mx-auto relative z-10">
                    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#5227FF]/20 border border-[#5227FF]/40 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-[#5227FF]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">No Data Yet</h2>
                        <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                            Start your first study session to see your mastery growth.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/practice')}
                            className="px-6 py-3 rounded-xl bg-[#5227FF] hover:bg-[#5227FF]/90 text-white font-semibold transition-colors"
                        >
                            Start First Study Session
                        </button>
                    </div>
                </main>
            ) : (
                <main className="max-w-7xl mx-auto space-y-6 relative z-10">
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
                    >
                        {[
                            { id: 'reviewedToday', label: 'Reviewed Today', value: reviewedToday, tone: 'text-[#9c85ff]', icon: Activity },
                            { id: 'dueToday', label: 'Due Today', value: dueToday, tone: 'text-cyan-300', icon: Calendar },
                            { id: 'streak', label: 'Current Streak', value: `${streakDays}d`, tone: 'text-orange-300', icon: Flame },
                            { id: 'consistency', label: 'Consistency', value: `${consistencyScore.toFixed(1)}%`, tone: 'text-emerald-300', icon: Network },
                            { id: 'peak', label: 'Peak Review Day', value: peakReviewCards > 0 ? `${peakReviewCards} (${peakReviewDayLabel})` : '--', tone: 'text-zinc-200', icon: BarChart3 },
                        ].map((metric, index) => {
                            const Icon = metric.icon;
                            return (
                                <motion.div
                                    key={metric.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] uppercase tracking-wider text-zinc-500">{metric.label}</span>
                                        <Icon className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <p className={`text-lg font-semibold ${metric.tone}`}>{metric.value}</p>
                                </motion.div>
                            );
                        })}
                    </motion.section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-[#5227FF]/20 rounded-lg">
                                    <Calendar className="w-5 h-5 text-[#5227FF]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">SM-2 Forecast</h2>
                                    <p className="text-sm text-zinc-400">Cards due over the next 7 days.</p>
                                </div>
                            </div>

                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#5227FF" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#5227FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid rgba(82,39,255,0.3)', color: '#fff' }}
                                            itemStyle={{ color: '#5227FF', fontWeight: 'bold' }}
                                            labelFormatter={(label, payload) => {
                                                if (!payload || !payload[0]?.payload) return label;
                                                return formatShortDate(payload[0].payload.dateKey || payload[0].payload.date);
                                            }}
                                        />
                                        <Area type="monotone" dataKey="cards" stroke="#5227FF" strokeWidth={3} fillOpacity={1} fill="url(#colorCards)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden"
                        >
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-2 bg-cyan-500/20 rounded-lg">
                                    <Network className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Knowledge Strength</h2>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-5xl font-bold text-white mb-3">
                                    {Number(masteryStats?.knowledgeStrength || 0).toFixed(1)}
                                    <span className="text-xl text-zinc-400">%</span>
                                </div>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Computed from ease factor and repetitions across your private card library.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors w-fit"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Refresh Metrics
                                </button>
                            </div>

                            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-zinc-500">
                                Owner-scoped analytics powered by MongoDB aggregation.
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#5227FF]/20 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-[#5227FF]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Retention Heatmap</h2>
                                <p className="text-sm text-zinc-400">Your last 90 days of completed review activity.</p>
                            </div>
                        </div>

                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
                                {[30, 90].map((range) => (
                                    <button
                                        key={range}
                                        type="button"
                                        onClick={() => setHeatmapRange(range)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${heatmapRange === range
                                            ? 'bg-[#5227FF] text-white'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                    >
                                        {range}D
                                    </button>
                                ))}
                            </div>

                            <div className="text-xs text-zinc-500 uppercase tracking-wider">
                                Active days: <span className="text-zinc-300">{activeHeatmapDays}/{visibleHeatmapData.length}</span>
                            </div>
                        </div>

                        {visibleHeatmapData.length === 0 ? (
                            <div className="p-6 rounded-2xl border border-white/10 bg-black/30 text-sm text-zinc-400">
                                Heatmap is waiting for review activity. Start practicing to populate your retention grid.
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-[4px] md:gap-1.5 p-4 bg-black/40 rounded-2xl border border-white/5">
                                    {visibleHeatmapData.map((cell) => (
                                        <div
                                            key={`${cell.id}-${cell.date}`}
                                            className={`w-3 h-3 md:w-4 md:h-4 rounded-[3px] border transition-colors group relative ${getHeatmapColor(cell.level)} ${cell.isToday ? 'ring-1 ring-white/70 ring-offset-1 ring-offset-black' : ''} hover:border-white`}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-zinc-700">
                                                {cell.label}{cell.isToday ? ' (Today)' : ''}: {cell.cards} cards reviewed
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {activeHeatmapDays === 0 ? (
                                    <p className="mt-3 text-xs text-zinc-500">
                                        No completed reviews detected in this window yet.
                                    </p>
                                ) : null}
                            </>
                        )}

                        <div className="flex justify-end items-center gap-2 mt-4 text-xs text-zinc-500">
                            <span>Less</span>
                            <div className="w-3 h-3 rounded-[3px] bg-zinc-900 border border-zinc-800"></div>
                            <div className="w-3 h-3 rounded-[3px] bg-[#5227FF]/20 border border-[#5227FF]/10"></div>
                            <div className="w-3 h-3 rounded-[3px] bg-[#5227FF]/50 border border-[#5227FF]/30"></div>
                            <div className="w-3 h-3 rounded-[3px] bg-[#5227FF]/80 border border-[#5227FF]/50"></div>
                            <div className="w-3 h-3 rounded-[3px] bg-[#5227FF] border border-[#5227FF]"></div>
                            <span>More</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 flex flex-col"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#5227FF]/20 rounded-lg">
                                    <Database className="w-5 h-5 text-[#5227FF]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">The Deck Vault</h2>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-[#5227FF] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search deck name..."
                                        className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF] transition-all w-full md:w-64"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="inline-flex items-center rounded-xl border border-white/10 bg-black/30 p-1 text-xs">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'review', label: 'Needs Review' },
                                        { id: 'strong', label: 'Strong' },
                                        { id: 'risky', label: 'At Risk' },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setDeckFilter(option.id)}
                                            className={`px-2.5 py-1.5 rounded-lg transition-colors ${deckFilter === option.id
                                                ? 'bg-[#5227FF] text-white'
                                                : 'text-zinc-400 hover:text-zinc-100'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {selectedDecks.length > 1 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-[#5227FF] hover:bg-[#5227FF]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(82,39,255,0.4)]"
                                        >
                                            <Merge className="w-4 h-4" />
                                            Merge ({selectedDecks.length})
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
                                        <th className="pb-4 pl-4 font-semibold w-12"></th>
                                        <th className="pb-4 font-semibold">Deck Name</th>
                                        <th className="pb-4 font-semibold">Last Studied</th>
                                        <th className="pb-4 font-semibold">Mastery</th>
                                        <th className="pb-4 font-semibold">Next Review</th>
                                        <th className="pb-4 font-semibold text-right pr-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDecks.map((deck) => (
                                        <motion.tr
                                            key={deck.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 pl-4" onClick={(e) => e.stopPropagation()}>
                                                <div
                                                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${selectedDecks.includes(deck.id)
                                                        ? 'bg-[#5227FF] border-[#5227FF]'
                                                        : 'border-zinc-600 hover:border-[#5227FF]'
                                                        }`}
                                                    onClick={(e) => toggleDeckSelection(e, deck.id)}
                                                >
                                                    {selectedDecks.includes(deck.id) && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-sm" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 font-medium text-white flex items-center gap-3">
                                                <Layers className="w-4 h-4 text-zinc-500 group-hover:text-[#5227FF] transition-colors" />
                                                <span>{deck.name}</span>
                                                {deck.dueTodayCount > 0 ? (
                                                    <span className="inline-flex items-center rounded-full border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-orange-300">
                                                        {deck.dueTodayCount} due
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="py-4 text-sm text-zinc-400">{deck.lastStudied}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${deck.mastery}%` }}
                                                            viewport={{ once: true }}
                                                            className="h-full bg-[#5227FF]"
                                                        />
                                                    </div>
                                                    <span className="text-sm font-mono text-zinc-300">{deck.mastery}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-zinc-300">{deck.nextReview}</td>
                                            <td className="py-4 pr-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteDeck(e, deck)}
                                                    disabled={pendingDeleteDeckId === deck.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {pendingDeleteDeckId === deck.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    )}
                                                    <span className="text-xs font-medium">Delete</span>
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredDecks.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-20 flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#5227FF]/30 flex items-center justify-center mb-6 relative animate-[pulse_2s_ease-in-out_infinite]">
                                        <div className="absolute inset-0 bg-[#5227FF]/10 rounded-full blur-xl"></div>
                                        <Database className="w-8 h-8 text-[#5227FF]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Vault is Empty</h3>
                                    <p className="text-zinc-500 max-w-sm">
                                        Upload a PDF in the Command Center to synthesize your first deck and start mastering it.
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </main>
            )}
        </div>
    );
}
