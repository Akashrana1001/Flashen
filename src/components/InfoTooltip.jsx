import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';

const InfoTooltip = ({ text, label = 'More information', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <span
            className={`relative inline-flex items-center ${className}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
        >
            <button
                type="button"
                aria-label={label}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-[#5227FF]/50 transition-colors"
            >
                <Info className="w-3 h-3" />
            </button>

            <AnimatePresence>
                {isOpen ? (
                    <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute left-1/2 top-[calc(100%+8px)] z-40 w-56 -translate-x-1/2 rounded-lg border border-[#5227FF]/40 bg-black/90 px-3 py-2 text-[11px] leading-relaxed text-zinc-200 shadow-[0_0_25px_rgba(82,39,255,0.25)] backdrop-blur-lg"
                    >
                        {text}
                    </motion.span>
                ) : null}
            </AnimatePresence>
        </span>
    );
};

export default InfoTooltip;
