import React from 'react';
import { Plus, User } from 'lucide-react';

const Header = ({ title = "Good Morning, Alex", subtitle = "You have 42 cards due for review." }) => {
    return (
        <header className="w-full flex items-center justify-between py-6 px-8 bg-transparent">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
            </div>
            <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-lg text-sm font-medium text-white transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                    Quick Upload
                </button>
                <div className="w-10 h-10 rounded-full border-2 border-[#5227FF] bg-zinc-800 flex items-center justify-center shadow-[0_0_15px_rgba(82,39,255,0.3)] overflow-hidden cursor-pointer hover:border-white transition-colors">
                    <User className="w-5 h-5 text-zinc-300" />
                </div>
            </div>
        </header>
    );
};

export default Header;