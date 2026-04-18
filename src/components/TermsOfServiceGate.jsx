import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { useAcceptTermsMutation } from '../hooks/queries';

const TermsOfServiceGate = ({ isOpen, onAccepted }) => {
    const [isChecked, setIsChecked] = useState(false);
    const { mutate: acceptTerms, isPending } = useAcceptTermsMutation();

    const legalParagraphs = useMemo(() => ([
        'By using The Flashcard Engine, you agree to use the platform for lawful educational purposes only. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
        'You retain ownership of the documents and notes you upload. By uploading content, you grant us a limited license to process that content strictly for deck generation, retrieval, and study analytics.',
        'We do not sell your personal data. We use account information to provide core functionality, maintain service security, and improve feature reliability. We may store usage metadata to optimize performance and prevent abuse.',
        'AI-generated outputs can contain mistakes. You are responsible for reviewing generated cards before relying on them for critical decisions or academic submissions.',
        'You may request account deletion at any time. Deletion removes account-linked data from active systems, subject to reasonable retention periods required for security, fraud prevention, and legal obligations.',
        'Continued use of the platform constitutes acceptance of these terms and our privacy practices. If you do not agree, please discontinue use of the service.',
    ]), []);

    const handleAccept = () => {
        if (!isChecked || isPending) return;

        acceptTerms(undefined, {
            onSuccess: (updatedUser) => {
                if (onAccepted) onAccepted(updatedUser);
            },
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 12 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                        className="w-full max-w-2xl rounded-3xl border border-[#5227FF]/30 bg-white/5 backdrop-blur-2xl shadow-[0_0_50px_rgba(82,39,255,0.22)] p-6 md:p-8"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-xl bg-[#5227FF]/20 border border-[#5227FF]/30">
                                <ShieldCheck className="w-5 h-5 text-[#5227FF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Terms of Service &amp; Privacy</h2>
                                <p className="text-sm text-zinc-400">Please review and accept to continue.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 max-h-64 overflow-y-auto space-y-4">
                            {legalParagraphs.map((paragraph, idx) => (
                                <p key={idx} className="text-sm leading-6 text-zinc-300">
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={() => setIsChecked((prev) => !prev)}
                                className="flex items-start gap-3 text-left"
                            >
                                <span
                                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked
                                        ? 'bg-[#5227FF]/20 border-[#5227FF] shadow-[0_0_14px_rgba(82,39,255,0.6)]'
                                        : 'bg-[#09090b] border-[#27272A]'
                                        }`}
                                >
                                    <Check className={`w-3.5 h-3.5 transition-opacity ${isChecked ? 'opacity-100 text-[#5227FF]' : 'opacity-0'}`} />
                                </span>
                                <span className="text-sm text-zinc-300 leading-6">
                                    I have read and agree to the Terms of Service and Privacy Policy.
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleAccept}
                                disabled={!isChecked || isPending}
                                className="w-full md:w-auto md:self-end px-6 py-3 rounded-xl bg-[#5227FF] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#5227FF]/90 transition-colors shadow-[0_0_18px_rgba(82,39,255,0.35)] flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isPending ? 'Syncing...' : 'Enter Dashboard'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TermsOfServiceGate;
