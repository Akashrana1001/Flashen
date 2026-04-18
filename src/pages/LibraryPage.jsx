import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Timer,
    TrendingUp,
    Play,
    CalendarClock,
    Filter,
    BookCopy,
    RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import InfoTooltip from '../components/InfoTooltip';
import DeckSearchInput from '../components/DeckSearchInput';
import DarkVeil from '../components/DarkVeil';
import { useCurrentUser, useDecks, useMasteryStats } from '../hooks/queries';

const MAX_REFRESHES_PER_WINDOW = 8;
const REFRESH_WINDOW_MS = 10 * 60 * 1000;

const getEndOfToday = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now.getTime();
};

const getDisplaySource = (value) => {
    if (!value) return 'Manual deck';
    const normalized = String(value).trim();
    if (!normalized) return 'Manual deck';
    const parts = normalized.split(/[\\/]/);
    return parts[parts.length - 1] || normalized;
};

const buildDeckRoadmap = (cards) => {
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;
    const in3d = now + 3 * 24 * 60 * 60 * 1000;
    const in7d = now + 7 * 24 * 60 * 60 * 1000;

    const slots = [
        { id: 'now', label: 'Now', count: 0 },
        { id: '24h', label: '24h', count: 0 },
        { id: '3d', label: '3d', count: 0 },
        { id: '7d', label: '7d', count: 0 },
    ];

    cards.forEach((card) => {
        if (!card?.nextReview) return;

        const reviewTime = new Date(card.nextReview).getTime();
        if (Number.isNaN(reviewTime)) return;

        if (reviewTime <= now) {
            slots[0].count += 1;
            return;
        }

        if (reviewTime <= in24h) {
            slots[1].count += 1;
            return;
        }

        if (reviewTime <= in3d) {
            slots[2].count += 1;
            return;
        }

        if (reviewTime <= in7d) {
            slots[3].count += 1;
        }
    });

    return slots;
};

const normalizeSearchText = (value) => {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const matchesDeckNameKeywords = (deckTitle, query) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;

    const title = normalizeSearchText(deckTitle);
    const keywords = normalizedQuery.split(' ').filter(Boolean);

    return keywords.every((keyword) => title.includes(keyword));
};

const LibraryDeckSkeleton = () => {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="mb-5 flex items-center justify-between">
                <div className="h-5 w-40 rounded-md bg-zinc-800/80" />
                <div className="h-8 w-24 rounded-lg bg-zinc-800/80" />
            </div>
            <div className="mb-4 h-4 w-28 rounded bg-zinc-800/70" />
            <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-11 rounded-lg bg-zinc-800/70" />
                ))}
            </div>
            <div className="mt-5 h-2 w-full rounded-full bg-zinc-800/80" />
        </div>
    );
};

const LibraryPage = () => {
    const navigate = useNavigate();

    const [searchValue, setSearchValue] = useState('');
    const [refreshEvents, setRefreshEvents] = useState([]);

    const { data: user } = useCurrentUser();
    const {
        data: decks = [],
        isLoading: isDecksLoading,
        isFetching: isDecksFetching,
        refetch: refetchDecks,
    } = useDecks();
    const {
        data: masteryStats,
        isFetching: isMasteryFetching,
        refetch: refetchMasteryStats,
    } = useMasteryStats();

    const normalizedSearch = searchValue;

    const activeRefreshCount = useMemo(() => {
        const now = Date.now();
        return refreshEvents.filter((timestamp) => now - timestamp < REFRESH_WINDOW_MS).length;
    }, [refreshEvents]);

    const remainingRefreshes = Math.max(0, MAX_REFRESHES_PER_WINDOW - activeRefreshCount);
    const isRefreshing = isDecksFetching || isMasteryFetching;

    const roadmapPreview = useMemo(() => {
        return (masteryStats?.forecastData || []).slice(0, 7).map((point) => ({
            date: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            cards: Number(point.cards || 0),
        }));
    }, [masteryStats?.forecastData]);

    const maxRoadmapCards = useMemo(() => {
        return Math.max(1, ...roadmapPreview.map((point) => point.cards || 0));
    }, [roadmapPreview]);

    const computedDecks = useMemo(() => {
        const endOfToday = getEndOfToday();

        return decks.map((deck) => {
            const cards = deck.cards || [];
            const dueToday = cards.filter((card) => {
                if (!card?.nextReview) return false;
                const nextReviewTime = new Date(card.nextReview).getTime();
                if (Number.isNaN(nextReviewTime)) return false;
                return nextReviewTime <= endOfToday;
            }).length;

            const averageInterval = cards.length
                ? cards.reduce((acc, card) => acc + Number(card.interval || 0), 0) / cards.length
                : 0;

            const masteryScore = cards.length
                ? Math.round(
                    cards.reduce((acc, card) => {
                        const repetitions = Number(card.repetitions || 0);
                        const interval = Number(card.interval || 0);
                        const cardScore = Math.min(100, repetitions * 20 + interval * 4);
                        return acc + cardScore;
                    }, 0) / cards.length
                )
                : 0;

            const subject = deck.description || user?.college || 'General Studies';
            const roadmap = buildDeckRoadmap(cards);
            const roadmapMax = Math.max(1, ...roadmap.map((slot) => slot.count));

            return {
                id: deck._id,
                title: deck.title || deck.name || 'Untitled Deck',
                source: getDisplaySource(deck.sourcePdf),
                subject,
                cardsCount: cards.length,
                dueToday,
                mastery: masteryScore,
                avgRecallTime: `${averageInterval.toFixed(1)}d`,
                hasDueToday: dueToday > 0,
                roadmap,
                roadmapMax,
            };
        });
    }, [decks, user?.college]);

    const filteredDecks = useMemo(() => {
        if (!normalizedSearch) return computedDecks;

        return computedDecks.filter((deck) => {
            return matchesDeckNameKeywords(deck.title, normalizedSearch);
        });
    }, [computedDecks, normalizedSearch]);

    const handleNavChange = (tabId) => {
        if (tabId === 'home') navigate('/dashboard');
        if (tabId === 'library') navigate('/library');
        if (tabId === 'analytics') navigate('/analytics');
        if (tabId === 'settings') navigate('/settings');
    };

    const handleManualRefresh = async () => {
        const now = Date.now();
        const activeWindowEvents = refreshEvents.filter((timestamp) => now - timestamp < REFRESH_WINDOW_MS);

        if (activeWindowEvents.length >= MAX_REFRESHES_PER_WINDOW) {
            toast.error('Refresh limit reached. Please wait a few minutes before syncing again.');
            setRefreshEvents(activeWindowEvents);
            return;
        }

        setRefreshEvents([...activeWindowEvents, now]);

        try {
            await Promise.all([refetchDecks(), refetchMasteryStats()]);
            toast.success('Library data refreshed.');
        } catch (error) {
            toast.error('Unable to refresh right now. Please try again shortly.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative selection:bg-[#5227FF]/40">
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

            <Sidebar activeTab="library" onChange={handleNavChange} />

            <main className="relative z-10 lg:ml-20 min-h-screen px-6 lg:px-10 py-8">
                <div className="max-w-7xl mx-auto space-y-7">
                    <header className="space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Knowledge Library</h1>
                                <p className="text-zinc-400 mt-2">
                                    Browse decks, prioritize due reviews, and launch focused practice sessions.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#5227FF]/40 bg-[#5227FF]/10 px-4 py-1.5 text-xs text-zinc-200">
                                <BookCopy className="h-3.5 w-3.5 text-[#7f62ff]" />
                                <span>{computedDecks.length} total decks</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 lg:p-5">
                            <div className="flex flex-col gap-3 lg:flex-row">
                                <DeckSearchInput
                                    className="flex-1"
                                    value={searchValue}
                                    onChange={setSearchValue}
                                    placeholder="Type any keyword from deck name..."
                                />
                                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-400">
                                    <Filter className="w-4 h-4" />
                                    Instant filter
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300">
                                    <span className="font-medium">SM-2</span>
                                    <InfoTooltip text="SM-2 schedules cards for review right before you are likely to forget them." />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleManualRefresh}
                                    disabled={remainingRefreshes === 0 || isRefreshing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5227FF]/45 bg-[#5227FF]/15 px-4 py-3 text-sm text-white hover:bg-[#5227FF]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    Refresh {remainingRefreshes}/{MAX_REFRESHES_PER_WINDOW}
                                </button>
                            </div>
                            <p className="mt-3 text-[11px] uppercase tracking-wider text-zinc-500">
                                Refresh policy: max {MAX_REFRESHES_PER_WINDOW} manual syncs every 10 minutes.
                            </p>
                        </div>
                    </header>

                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 lg:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Retention Roadmap</h2>
                                <p className="text-sm text-zinc-400">Next 7 days of projected due cards from your current mastery data.</p>
                            </div>
                            <InfoTooltip text="This roadmap updates with study activity and predicts upcoming review load across your decks." />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                            {(roadmapPreview.length ? roadmapPreview : Array.from({ length: 7 }).map((_, idx) => ({
                                date: `Day ${idx + 1}`,
                                cards: 0,
                            }))).map((point) => (
                                <div key={point.date} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{point.date}</p>
                                    <div className="h-12 rounded-lg bg-zinc-800/80 p-2 flex items-end">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(8, (point.cards / maxRoadmapCards) * 100)}%` }}
                                            transition={{ duration: 0.45, ease: 'easeOut' }}
                                            className="w-full rounded bg-[#5227FF] shadow-[0_0_12px_rgba(82,39,255,0.65)]"
                                        />
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-zinc-100">{point.cards} due</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {isDecksLoading
                            ? Array.from({ length: 4 }).map((_, idx) => <LibraryDeckSkeleton key={`skeleton-${idx}`} />)
                            : null}

                        {!isDecksLoading && filteredDecks.length === 0 ? (
                            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                                <p className="text-zinc-300 text-lg font-medium">No decks match your search.</p>
                                <p className="text-zinc-500 mt-2 text-sm">Try another keyword or clear the filter to see everything.</p>
                            </div>
                        ) : null}

                        {!isDecksLoading
                            ? filteredDecks.map((deck, index) => (
                                <motion.article
                                    key={deck.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: index * 0.03, ease: 'easeOut' }}
                                    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[#5227FF]/55 ${deck.hasDueToday ? 'border-l-4 border-l-[#5227FF]' : ''
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5227FF]/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                    <div className="relative z-10">
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-xl font-semibold text-white leading-tight">{deck.title}</h3>
                                                <p className="text-sm text-zinc-400 mt-1">{deck.subject}</p>
                                            </div>
                                            {deck.hasDueToday ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-[#5227FF]/50 bg-[#5227FF]/15 px-2.5 py-1 text-xs text-[#c8bbff]">
                                                    <CalendarClock className="w-3 h-3" />
                                                    {deck.dueToday} due today
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-zinc-500">
                                                    On track
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-5">
                                            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    PDF Source
                                                </div>
                                                <p className="text-xs text-zinc-200 truncate">{deck.source}</p>
                                            </div>

                                            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                                                    <Timer className="w-3.5 h-3.5" />
                                                    Avg. Recall Time
                                                </div>
                                                <p className="text-sm text-zinc-100 font-medium">{deck.avgRecallTime}</p>
                                            </div>

                                            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    Mastery
                                                </div>
                                                <p className="text-sm text-zinc-100 font-medium">{deck.mastery}%</p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
                                                <span>{deck.cardsCount} cards</span>
                                                <span className="text-[#7f62ff]">{deck.mastery}% confidence</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max(5, deck.mastery)}%` }}
                                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                                    className="h-full bg-[#5227FF] shadow-[0_0_12px_rgba(82,39,255,0.7)]"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
                                                <span>Retention roadmap</span>
                                                <span className="text-zinc-400">Deck-level next 7d</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {deck.roadmap.map((slot) => (
                                                    <div key={slot.id} className="rounded-lg border border-white/10 bg-black/35 backdrop-blur-md p-2">
                                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{slot.label}</p>
                                                        <div className="mt-1.5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.max(6, (slot.count / deck.roadmapMax) * 100)}%` }}
                                                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                                                className="h-full bg-[#7f62ff]"
                                                            />
                                                        </div>
                                                        <p className="mt-1.5 text-xs font-semibold text-zinc-200">{slot.count}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/practice', { state: { deckId: deck.id } })}
                                                className="inline-flex items-center gap-2 rounded-lg border border-[#5227FF]/45 bg-[#5227FF]/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5227FF]/35 hover:shadow-[0_0_18px_rgba(82,39,255,0.5)]"
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                                Practice
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            ))
                            : null}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default LibraryPage;
