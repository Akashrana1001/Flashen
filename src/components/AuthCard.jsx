import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import api from '../api';
import { toast } from 'sonner';
import { setAuthSession } from '../utils/authStorage';

const getPasswordStrength = (password) => {
    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;

    return score;
};

const getStrengthLabel = (score) => {
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
};

const AuthCard = ({ onBack, onLogin, defaultTab = 'login' }) => {
    const [isLogin, setIsLogin] = useState(defaultTab === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = getPasswordStrength(password);
    const strengthLabel = getStrengthLabel(passwordStrength);

    useEffect(() => {
        setError(null);
    }, [isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin && !name.trim()) return triggerShake('Please enter your name');
        if (!email || !email.includes('@')) return triggerShake('Please enter a valid email address');
        if (!password || password.length < 8) return triggerShake('Password must be at least 8 characters');

        setError(null);
        setIsLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin ? { email, password } : { name, email, password };

            const { data } = await api.post(endpoint, payload);

            if (!data?.token || !data?.user) {
                throw new Error('Invalid authentication response');
            }

            setAuthSession({ token: data.token, user: data.user });

            toast.success(isLogin ? 'Welcome back!' : 'Account created!');
            if (onLogin) {
                onLogin({
                    token: data.token,
                    user: data.user,
                    mode: isLogin ? 'login' : 'register'
                });
            }

        } catch (err) {
            triggerShake(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const triggerShake = (errMsg) => {
        if (errMsg) setError(errMsg);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const switchMode = () => setIsLogin(!isLogin);

    const shakeVariants = {
        shake: { x: [-8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.4 } },
        idle: { x: 0 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="relative w-full rounded-2xl overflow-hidden p-8 text-zinc-300"
            style={{
                backgroundColor: 'rgba(9, 9, 11, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(82, 39, 255, 0.2)',
                boxShadow: '0 0 60px rgba(82, 39, 255, 0.15), inset 0 0 20px rgba(82, 39, 255, 0.05)',
            }}
            layout
        >
            <motion.div layout className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={onBack}>
                    <span className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
                        The Flashcard Engine
                        <span className="w-2 h-2 rounded-full bg-[#5227FF]"></span>
                    </span>
                </div>

                <div className="relative w-full text-center overflow-hidden h-8">
                    <AnimatePresence mode="popLayout">
                        <motion.h2
                            key={isLogin ? 'login' : 'register'}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-2xl font-semibold text-white absolute w-full"
                        >
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </motion.h2>
                    </AnimatePresence>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout" initial={false}>
                    {!isLogin && (
                        <motion.div
                            layout
                            key="nameField"
                            initial={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: 16 }}
                            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <User className="h-5 w-5 text-zinc-500 group-focus-within:text-[#5227FF] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#09090b] border border-[#27272A] text-white pl-10 pr-4 py-3 rounded-lg outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]/50 transition-all font-sans"
                                />
                            </div>
                        </motion.div>
                    )}

                    <motion.div layout key="emailField" className="relative group mb-4">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-[#5227FF] transition-colors" />
                        </div>
                        <motion.input
                            variants={shakeVariants}
                            animate={isShaking && (!email || !email.includes('@')) ? "shake" : "idle"}
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#09090b] border border-[#27272A] text-white pl-10 pr-4 py-3 rounded-lg outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]/50 transition-all font-sans"
                        />
                    </motion.div>

                    <motion.div layout key="passwordField" className="relative group mb-4">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-[#5227FF] transition-colors" />
                        </div>
                        <motion.input
                            variants={shakeVariants}
                            animate={isShaking && (!password || password.length < 8) ? "shake" : "idle"}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#09090b] border border-[#27272A] text-white pl-10 pr-4 py-3 rounded-lg outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]/50 transition-all font-sans"
                        />

                        {!isLogin && (
                            <div className="mt-2">
                                <div className="grid grid-cols-4 gap-1">
                                    {Array.from({ length: 4 }).map((_, idx) => (
                                        <div key={idx} className="h-1 rounded-full bg-[#27272A] overflow-hidden">
                                            <motion.div
                                                initial={false}
                                                animate={{ scaleX: passwordStrength > idx ? 1 : 0 }}
                                                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                                className="h-full bg-[#5227FF] origin-left"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">{strengthLabel}</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"
                        >
                            <span className="block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    layout
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(82,39,255,0.4)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                </motion.button>
            </form>

            <motion.p layout className="text-center text-sm text-zinc-500 mt-6">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={switchMode} className="text-white hover:text-[#5227FF] font-medium transition-colors">
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </motion.p>
        </motion.div>
    );
};

export default AuthCard;