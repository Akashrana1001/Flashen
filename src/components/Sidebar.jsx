import React, { useEffect, useState } from 'react';
import { Home, Library, BarChart2, Settings, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Sidebar = ({ activeTab = 'home', onChange }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [activeTab]);

    const items = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'library', icon: Library, label: 'Library' },
        { id: 'analytics', icon: BarChart2, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    const handleItemSelect = (itemId) => {
        onChange?.(itemId);
        setIsMobileOpen(false);
    };

    return (
        <>
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-black/50 backdrop-blur-md border-r border-[#5227FF]/15 z-50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5227FF] to-[#af40ac] flex items-center justify-center mb-12 shadow-[0_0_15px_rgba(82,39,255,0.4)]">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                <nav className="flex flex-col gap-6">
                    {items.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemSelect(item.id)}
                                className="relative p-3 rounded-xl transition-all group"
                                title={item.label}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabOutline"
                                        className="absolute inset-0 bg-[#5227FF]/10 rounded-xl shadow-[0_0_20px_rgba(82,39,255,0.2)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#5227FF] rounded-r-md shadow-[0_0_10px_rgba(82,39,255,0.8)]"
                                    />
                                )}
                                <Icon className={`w-6 h-6 relative z-10 transition-colors ${isActive ? 'text-[#5227FF]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-[70] inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/10 bg-black/65 backdrop-blur-md text-zinc-200"
                aria-label="Open navigation menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isMobileOpen ? (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="lg:hidden fixed inset-0 z-[70] bg-black/60"
                            aria-label="Close navigation menu overlay"
                        />

                        <motion.aside
                            initial={{ x: -280, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -280, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                            className="lg:hidden fixed left-0 top-0 h-screen w-64 z-[80] border-r border-[#5227FF]/25 bg-black/95 backdrop-blur-xl p-5"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5227FF] to-[#af40ac] flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                                    </div>
                                    <span className="text-sm font-semibold text-white">Navigation</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsMobileOpen(false)}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 text-zinc-300"
                                    aria-label="Close navigation menu"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-2">
                                {items.map((item) => {
                                    const isActive = activeTab === item.id;
                                    const Icon = item.icon;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleItemSelect(item.id)}
                                            className={`w-full inline-flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${isActive
                                                ? 'border-[#5227FF]/60 bg-[#5227FF]/20 text-white'
                                                : 'border-white/10 bg-black/30 text-zinc-300'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#c8bbff]' : 'text-zinc-500'}`} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </motion.aside>
                    </>
                ) : null}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;