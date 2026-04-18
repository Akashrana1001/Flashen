import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, FileText, CheckCircle, RefreshCw, Layers, Edit2, BrainCircuit, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIngestPDF } from '../hooks/queries';

const processingSteps = [
    "Parsing document structure...",
    "Extracting key concepts...",
    "Optimizing for Spaced Repetition...",
    "Generating edge-case questions..."
];

const DraftCard = ({ card, onHighlightSource }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [frontText, setFrontText] = useState(card.front);
    const [backText, setBackText] = useState(card.back);

    // Determine badge color based on type
    const badgeColor =
        card.type === "Definition" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" :
            card.type === "Concept" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" :
                "text-amber-400 bg-amber-400/10 border-amber-400/30";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{
                boxShadow: "0px 0px 15px rgba(82, 39, 255, 0.4)",
                borderColor: "rgba(82, 39, 255, 0.6)"
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-black/40 backdrop-blur-md border border-[#5227FF]/15 rounded-2xl p-5 relative group overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${badgeColor}`}>
                    {card.type}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onHighlightSource(card.sourceSection)}
                        className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-[#5227FF] transition-colors border border-white/5"
                        title="View Source in PDF"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors border border-white/5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Flip
                    </button>
                </div>
            </div>

            <div className="min-h-[100px]" onClick={() => !isEditing && setIsEditing(true)}>
                {!isEditing ? (
                    <div className="relative group/edit cursor-text">
                        <h4 className="text-lg font-medium text-white mb-2 leading-snug">
                            {isFlipped ? "A:" : "Q:"}
                        </h4>
                        <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                            {isFlipped ? backText : frontText}
                        </p>
                        <div className="absolute top-0 right-0 opacity-0 group-hover/edit:opacity-100 transition-opacity p-1 bg-black/60 rounded border border-white/10">
                            <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-semibold mb-1 block">Front (Question)</label>
                            <textarea
                                value={frontText}
                                onChange={(e) => setFrontText(e.target.value)}
                                className="w-full bg-black/50 border border-[#5227FF]/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF] resize-none"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-semibold mb-1 block">Back (Answer)</label>
                            <textarea
                                value={backText}
                                onChange={(e) => setBackText(e.target.value)}
                                className="w-full bg-black/50 border border-[#5227FF]/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF] resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                                className="px-4 py-1.5 bg-[#5227FF]/20 hover:bg-[#5227FF]/30 text-[#5227FF] text-xs font-medium rounded-lg border border-[#5227FF]/30 transition-colors"
                            >
                                Save Edits
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default function RefinementLabPage() {
    const [stepIndex, setStepIndex] = useState(0);
    const [activeHighlight, setActiveHighlight] = useState(null);
    const navigate = useNavigate();

    const pdfScrollRef = useRef(null);

    const { mutate: ingestPDF, isPending: isProcessing, isSuccess } = useIngestPDF();

    // Use a custom dropzone state
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileUpload = (file) => {
        if (!file || file.type !== 'application/pdf') return;
        const formData = new FormData();
        formData.append('file', file);
        ingestPDF(formData, {
            onSuccess: () => {
                navigate('/dashboard');
            }
        });
    };

    // Simulate Processing Steps
    useEffect(() => {
        if (!isProcessing) return;

        const interval = setInterval(() => {
            setStepIndex((prev) => {
                if (prev < processingSteps.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 1200);

        return () => clearInterval(interval);
    }, [isProcessing]);

    const handleHighlightSource = (sectionId) => {
        setActiveHighlight(sectionId);
        // Simulate auto-scrolling to the highlighted section in the PDF pane
        const element = document.getElementById(sectionId);
        if (element && pdfScrollRef.current) {
            pdfScrollRef.current.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-hidden selection:bg-[#5227FF]/50 relative flex flex-col">

            {/* Background ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#5227FF]/5 rounded-full blur-[120px]"></div>
            </div>

            <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
                    >
                        <div className="relative mb-12">
                            <div className="w-24 h-24 rounded-full border border-[#5227FF]/30 flex items-center justify-center relative z-10 bg-black/50">
                                <BrainCircuit className="w-10 h-10 text-[#5227FF] animate-pulse" />
                            </div>
                            <div className="absolute inset-0 rounded-full border border-[#5227FF] animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
                            <div className="absolute -inset-4 rounded-full border border-[#5227FF]/50 animate-ping opacity-10" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }}></div>
                        </div>

                        <div className="h-8 relative flex items-center justify-center w-full max-w-md">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={stepIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute text-xl font-medium text-zinc-300 tracking-wide text-center w-full"
                                >
                                    {processingSteps[stepIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Progress bar */}
                        <div className="w-64 h-1 bg-zinc-800 rounded-full mt-8 overflow-hidden">
                            <motion.div
                                className="h-full bg-[#5227FF] shadow-[0_0_10px_rgba(82,39,255,0.8)]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((stepIndex + 1) / processingSteps.length) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 flex flex-col h-screen relative z-10 items-center justify-center p-6"
                    >
                        <div className="max-w-2xl w-full">
                            <button onClick={() => navigate('/dashboard')} className="mb-8 p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                Back to Dashboard
                            </button>

                            <h1 className="text-3xl font-bold text-white mb-2">Refinement Lab</h1>
                            <p className="text-zinc-400 mb-8">Upload a syllabus, chapter, or notes to automatically generate a study deck.</p>

                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-[#5227FF] bg-[#5227FF]/10' : 'border-[#5227FF]/30 bg-[#5227FF]/5 hover:bg-[#5227FF]/10 hover:border-[#5227FF]/60'}`}
                            >
                                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                    <Upload className={`w-10 h-10 transition-colors ${isDragging ? 'text-[#5227FF]' : 'text-zinc-400'}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                                <p className="text-zinc-400">or click to browse your files</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="application/pdf"
                                    onChange={(e) => {
                                        if (e.target.files?.length) {
                                            handleFileUpload(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}