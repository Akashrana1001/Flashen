import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import api from '../api';

const starterMessage = {
    id: 'starter-assistant',
    role: 'assistant',
    content: 'Hi, I am your Flashcard Assistant. Ask me about decks, study strategy, or memory techniques.',
};

const ChatbotWidget = ({ isEnabled = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState([starterMessage]);

    const messagesRef = useRef(null);

    const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

    useEffect(() => {
        if (!messagesRef.current) return;
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, [messages, isOpen, isSending]);

    if (!isEnabled) return null;

    const sendMessage = async () => {
        const prompt = input.trim();
        if (!prompt || isSending) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
        };

        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput('');
        setIsSending(true);

        try {
            const history = nextMessages.slice(-8).map((item) => ({
                role: item.role,
                content: item.content,
            }));

            const { data } = await api.post('/chat', {
                message: prompt,
                history,
            });

            setMessages((prev) => [
                ...prev,
                {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: data?.reply || 'I was unable to generate a response this time.',
                },
            ]);
        } catch (error) {
            const fallback = error?.response?.data?.message || 'Assistant is unavailable right now. Please try again.';
            setMessages((prev) => [
                ...prev,
                {
                    id: `assistant-error-${Date.now()}`,
                    role: 'assistant',
                    content: fallback,
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 z-[95]">
            <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                    <motion.section
                        key="chat-open"
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ml-auto w-full sm:w-[390px] max-h-[72vh] rounded-2xl border border-[#5227FF]/35 bg-[#0b0b12]/95 backdrop-blur-xl shadow-[0_0_32px_rgba(82,39,255,0.28)] overflow-hidden"
                    >
                        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#5227FF]/20 border border-[#5227FF]/40 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-[#bfb1ff]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">AI Study Assistant</p>
                                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">Powered by your configured model</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Close assistant"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </header>

                        <div ref={messagesRef} className="px-4 py-4 space-y-3 overflow-y-auto max-h-[50vh]">
                            {hasMessages ? (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user'
                                            ? 'ml-auto bg-[#5227FF] text-white'
                                            : 'bg-white/5 border border-white/10 text-zinc-200'
                                            }`}
                                    >
                                        {message.content}
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-zinc-500">Start a conversation...</div>
                            )}

                            {isSending ? (
                                <div className="max-w-[88%] rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-zinc-300">
                                    Thinking...
                                </div>
                            ) : null}
                        </div>

                        <div className="p-3 border-t border-white/10 bg-black/20">
                            <div className="flex items-center gap-2">
                                <input
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about your decks or study plan..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#5227FF]/70"
                                />
                                <button
                                    type="button"
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isSending}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#5227FF] text-white hover:bg-[#633aff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Send message"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="mt-2 text-[11px] text-zinc-500">Optimized for mobile and desktop chat flow.</p>
                        </div>
                    </motion.section>
                ) : (
                    <motion.button
                        key="chat-closed"
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#5227FF]/45 bg-black/75 backdrop-blur-lg px-4 py-2.5 text-sm text-white shadow-[0_0_18px_rgba(82,39,255,0.35)] hover:bg-[#5227FF]/20 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4 text-[#bfb1ff]" />
                        Ask AI
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatbotWidget;
