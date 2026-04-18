import React from 'react';
import { Search, X } from 'lucide-react';

const DeckSearchInput = ({ value, onChange, placeholder = 'Search deck name...', className = '' }) => {
    return (
        <div className={`relative ${className}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
                type="text"
                value={value}
                onChange={(event) => onChange?.(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-[#5227FF]/70"
            />
            {value ? (
                <button
                    type="button"
                    onClick={() => onChange?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Clear deck search"
                >
                    <X className="w-4 h-4" />
                </button>
            ) : null}
        </div>
    );
};

export default DeckSearchInput;
