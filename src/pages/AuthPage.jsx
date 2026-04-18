import React from 'react';
import LightRays from '../components/LightRays';
import AuthCard from '../components/AuthCard';

const AuthPage = ({ onBack, onLogin, defaultTab = 'login' }) => {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center font-sans selection:bg-[#5227FF] selection:text-white">
            {/* Cinematic WebGL Lighting Background */}
            <div className="absolute inset-0 z-0">
                <LightRays
                    raysOrigin="top-right"
                    raysColor="#5227FF"
                    raysSpeed={1.5}
                    lightSpread={0.8}
                    rayLength={3}
                    followMouse={true}
                    mouseInfluence={0.15}
                    noiseAmount={0.03}
                    distortion={0.05}
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                />
                {/* Subtle mask over the rays for better reading contrast */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/40 to-black/80 pointer-events-none"></div>
            </div>

            {/* Auth Card Container */}
            <div className="relative z-10 w-full max-w-md px-6">
                <AuthCard onBack={onBack} onLogin={onLogin} defaultTab={defaultTab} />
            </div>
        </div>
    );
};

export default AuthPage;