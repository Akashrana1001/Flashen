import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Camera,
    Loader2,
    UserCircle2,
    ArrowLeft,
    User,
    SlidersHorizontal,
    CreditCard,
    Shield,
    Check,
    Bell,
    Brain,
    Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { useCurrentUser, useUpdateProfileMutation } from '../hooks/queries';
import { getStoredUser } from '../utils/authStorage';

const settingTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
];

const getPasswordStrength = (password) => {
    if (!password) return 0;

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (password.length >= 12) score += 1;

    return score;
};

const strengthMeta = {
    0: { label: 'Very weak', color: 'bg-zinc-700' },
    1: { label: 'Weak', color: 'bg-red-500' },
    2: { label: 'Fair', color: 'bg-orange-500' },
    3: { label: 'Good', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-emerald-500' },
    5: { label: 'Excellent', color: 'bg-[#5227FF]' },
};

const SettingsPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const { data: apiUser, isLoading } = useCurrentUser();
    const { mutate: updateProfile, isPending } = useUpdateProfileMutation();

    const fallbackUser = useMemo(() => getStoredUser(), []);
    const activeUser = apiUser || fallbackUser || {};

    const [activePanel, setActivePanel] = useState('profile');
    const [avatarPreview, setAvatarPreview] = useState('');

    const [form, setForm] = useState({
        name: '',
        college: '',
    });
    const [initialForm, setInitialForm] = useState({
        name: '',
        college: '',
    });

    const [preferences, setPreferences] = useState({
        reviewReminders: true,
        deepFocusMode: false,
        weeklySummary: true,
    });

    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        const normalized = {
            name: activeUser.name || '',
            college: activeUser.college || '',
        };

        setForm(normalized);
        setInitialForm(normalized);
    }, [activeUser.name, activeUser.college]);

    const isDirty =
        form.name.trim() !== initialForm.name.trim() ||
        form.college.trim() !== initialForm.college.trim();

    const statusLabel = (activeUser.totalCardsMastered || 0) >= 100 || (activeUser.streaks || 0) >= 7 ? 'Pro Member' : 'Beta Tester';

    const passwordStrength = getPasswordStrength(securityForm.newPassword);
    const strength = strengthMeta[passwordStrength];

    const handleNavChange = (tabId) => {
        if (tabId === 'analytics') navigate('/analytics');
        if (tabId === 'home') navigate('/dashboard');
        if (tabId === 'library') navigate('/library');
        if (tabId === 'settings') navigate('/settings');
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result?.toString() || '');
        reader.readAsDataURL(file);
    };

    const handleProfileSave = () => {
        if (!isDirty || isPending) return;

        updateProfile(
            {
                name: form.name,
                college: form.college,
            },
            {
                onSuccess: (updatedUser) => {
                    const normalized = {
                        name: updatedUser.name || '',
                        college: updatedUser.college || '',
                    };

                    setInitialForm(normalized);
                    setForm(normalized);
                },
            }
        );
    };

    const updatePreference = (key) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSecuritySave = () => {
        if (!securityForm.currentPassword.trim()) {
            toast.error('Please enter your current password.');
            return;
        }

        if (securityForm.newPassword.length < 8) {
            toast.error('New password must be at least 8 characters.');
            return;
        }

        if (securityForm.newPassword !== securityForm.confirmPassword) {
            toast.error('Password confirmation does not match.');
            return;
        }

        if (passwordStrength < 3) {
            toast.error('Use a stronger password before continuing.');
            return;
        }

        toast.success('Password quality checks passed. Endpoint wiring can be added to persist this change.');

        setSecurityForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-[#5227FF]/40 relative">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-18%] right-[-8%] w-[48%] h-[48%] bg-[#5227FF]/7 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-25%] left-[-12%] w-[45%] h-[45%] bg-cyan-500/5 rounded-full blur-[150px]" />
            </div>

            <Sidebar activeTab="settings" onChange={handleNavChange} />

            <main className="relative z-10 lg:ml-20 min-h-screen pl-20 lg:pl-0 px-6 lg:px-10 py-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-6 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    <header className="mb-8">
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Profile &amp; Settings</h1>
                        <p className="text-zinc-400 mt-2">Tune your account, preferences, and security posture from a single control center.</p>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 lg:gap-8">
                        <aside className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 lg:p-6">
                            <div className="mb-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-[#5227FF] via-[#8e44ff] to-[#af40ac] shadow-[0_0_30px_rgba(82,39,255,0.35)]">
                                            <div className="w-full h-full rounded-full bg-black/80 border border-white/10 overflow-hidden flex items-center justify-center">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle2 className="w-14 h-14 text-zinc-500" />
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#5227FF]/20 border border-[#5227FF]/50 text-[#c8bbff] hover:bg-[#5227FF]/35 transition-colors"
                                            title="Upload avatar"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-lg font-semibold text-white">{activeUser.name || 'New Learner'}</h2>
                                        <span className="inline-flex items-center rounded-full border border-[#5227FF]/50 bg-[#5227FF]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#d3c9ff] shadow-[0_0_14px_rgba(82,39,255,0.4)]">
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{activeUser.email || 'No email available'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {settingTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activePanel === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActivePanel(tab.id)}
                                            className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${isActive
                                                    ? 'border-[#5227FF]/60 bg-[#5227FF]/15 text-white shadow-[0_0_18px_rgba(82,39,255,0.2)]'
                                                    : 'border-white/10 bg-black/30 text-zinc-400 hover:text-zinc-100 hover:border-white/20'
                                                }`}
                                        >
                                            <span className="inline-flex items-center gap-2 text-sm font-medium">
                                                <Icon className="w-4 h-4" />
                                                {tab.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 lg:p-8 min-h-[520px]">
                            <AnimatePresence mode="wait">
                                {activePanel === 'profile' ? (
                                    <motion.div
                                        key="profile"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-2xl font-semibold text-white">Profile Details</h3>
                                                <p className="text-sm text-zinc-400 mt-1">Keep your profile details current for personalized study analytics.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleProfileSave}
                                                disabled={!isDirty || isPending}
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#5227FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5227FF]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                {isPending ? 'Saving...' : 'Save Profile'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-black/50 border border-[#27272A] text-white px-4 py-3 rounded-xl outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]/60 transition-colors"
                                                    placeholder="Enter your full name"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">College / University</label>
                                                <input
                                                    type="text"
                                                    value={form.college}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, college: e.target.value }))}
                                                    className="w-full bg-black/50 border border-[#27272A] text-white px-4 py-3 rounded-xl outline-none focus:border-[#5227FF] focus:ring-1 focus:ring-[#5227FF]/60 transition-colors"
                                                    placeholder="Your institution"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">Email</label>
                                                <input
                                                    type="text"
                                                    value={activeUser.email || ''}
                                                    disabled
                                                    className="w-full bg-black/30 border border-white/10 text-zinc-500 px-4 py-3 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        {isLoading ? (
                                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#5227FF]" />
                                                Syncing account details...
                                            </div>
                                        ) : null}
                                    </motion.div>
                                ) : null}

                                {activePanel === 'preferences' ? (
                                    <motion.div
                                        key="preferences"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h3 className="text-2xl font-semibold text-white">Preferences</h3>
                                            <p className="text-sm text-zinc-400 mt-1">Personalize reminders and focus behavior for daily review sessions.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => updatePreference('reviewReminders')}
                                                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                                            >
                                                <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                                                    <Bell className="w-4 h-4 text-[#b4a3ff]" />
                                                    Review Reminders
                                                </span>
                                                <span className={`h-6 w-11 rounded-full p-1 transition-colors ${preferences.reviewReminders ? 'bg-[#5227FF]' : 'bg-zinc-700'}`}>
                                                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${preferences.reviewReminders ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => updatePreference('deepFocusMode')}
                                                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                                            >
                                                <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                                                    <Brain className="w-4 h-4 text-[#b4a3ff]" />
                                                    Deep Focus Mode
                                                </span>
                                                <span className={`h-6 w-11 rounded-full p-1 transition-colors ${preferences.deepFocusMode ? 'bg-[#5227FF]' : 'bg-zinc-700'}`}>
                                                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${preferences.deepFocusMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => updatePreference('weeklySummary')}
                                                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                                            >
                                                <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                                                    <SlidersHorizontal className="w-4 h-4 text-[#b4a3ff]" />
                                                    Weekly Summary Email
                                                </span>
                                                <span className={`h-6 w-11 rounded-full p-1 transition-colors ${preferences.weeklySummary ? 'bg-[#5227FF]' : 'bg-zinc-700'}`}>
                                                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${preferences.weeklySummary ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : null}

                                {activePanel === 'subscription' ? (
                                    <motion.div
                                        key="subscription"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h3 className="text-2xl font-semibold text-white">Subscription</h3>
                                            <p className="text-sm text-zinc-400 mt-1">Track your plan and unlock richer analytics and generation limits.</p>
                                        </div>

                                        <div className="rounded-2xl border border-[#5227FF]/40 bg-[#5227FF]/10 p-5">
                                            <p className="text-xs uppercase tracking-widest text-[#cabdff]">Current Plan</p>
                                            <p className="mt-2 text-2xl font-semibold text-white">{statusLabel === 'Pro Member' ? 'Pro' : 'Starter'}</p>
                                            <p className="mt-2 text-sm text-zinc-300">Usage scales with your mastery journey. Upgrade when you want deeper learning analytics.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                'Unlimited deck generation',
                                                'Advanced retention forecasts',
                                                'Priority model access',
                                            ].map((feature) => (
                                                <div key={feature} className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : null}

                                {activePanel === 'security' ? (
                                    <motion.div
                                        key="security"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h3 className="text-2xl font-semibold text-white">Security</h3>
                                            <p className="text-sm text-zinc-400 mt-1">Validate password quality in real-time before applying account-level changes.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">Current Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    <input
                                                        type="password"
                                                        value={securityForm.currentPassword}
                                                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                                        className="w-full bg-black/50 border border-[#27272A] text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-[#5227FF]"
                                                        placeholder="Enter current password"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">New Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    <input
                                                        type="password"
                                                        value={securityForm.newPassword}
                                                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                                        className="w-full bg-black/50 border border-[#27272A] text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-[#5227FF]"
                                                        placeholder="Enter new password"
                                                    />
                                                </div>

                                                <div className="mt-3">
                                                    <div className="grid grid-cols-5 gap-1 mb-2">
                                                        {Array.from({ length: 5 }).map((_, idx) => (
                                                            <div key={idx} className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                                                <motion.div
                                                                    initial={false}
                                                                    animate={{ scaleX: passwordStrength > idx ? 1 : 0 }}
                                                                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                                                    className={`h-full origin-left ${strength.color}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-zinc-400">Strength: {strength.label}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">Confirm New Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    <input
                                                        type="password"
                                                        value={securityForm.confirmPassword}
                                                        onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                                        className="w-full bg-black/50 border border-[#27272A] text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-[#5227FF]"
                                                        placeholder="Confirm new password"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-zinc-400 space-y-1">
                                            <p>Use at least 8 characters, include numbers, mixed case, and a special character.</p>
                                            <p>For best security, avoid reused passwords and dictionary patterns.</p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSecuritySave}
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#5227FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5227FF]/90 transition-colors"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Validate Password Change
                                        </button>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
