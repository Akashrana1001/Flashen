import React from 'react';
import { Home, Library, BarChart2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeTab = 'home', onChange }) => {
    const items = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'library', icon: Library, label: 'Library' },
        { id: 'analytics', icon: BarChart2, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-8 bg-black/50 backdrop-blur-md border-r border-[#5227FF]/15 z-50">
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
                            onClick={() => onChange?.(item.id)}
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
    );
};

export default Sidebar;