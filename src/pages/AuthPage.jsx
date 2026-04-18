import React from 'react';
import AuthCard from '../components/AuthCard';
import Hyperspeed from '../components/Hyperspeed';

const AuthPage = ({ onBack, onLogin, defaultTab = 'login' }) => {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center font-sans selection:bg-[#5227FF] selection:text-white">
            {/* Hyperspeed Background */}
            <div className="absolute inset-0 z-0">
                <Hyperspeed
                    effectOptions={{
                        distortion: 'turbulentDistortion',
                        length: 400,
                        roadWidth: 10,
                        islandWidth: 2,
                        lanesPerRoad: 4,
                        fov: 90,
                        fovSpeedUp: 150,
                        speedUp: 2,
                        carLightsFade: 0.4,
                        totalSideLightSticks: 20,
                        lightPairsPerRoadWay: 40,
                        shoulderLinesWidthPercentage: 0.05,
                        brokenLinesWidthPercentage: 0.1,
                        brokenLinesLengthPercentage: 0.5,
                        lightStickWidth: [0.12, 0.5],
                        lightStickHeight: [1.3, 1.7],
                        movingAwaySpeed: [60, 80],
                        movingCloserSpeed: [-120, -160],
                        carLightsLength: [12, 80],
                        carLightsRadius: [0.05, 0.14],
                        carWidthPercentage: [0.3, 0.5],
                        carShiftX: [-0.8, 0.8],
                        carFloorSeparation: [0, 5],
                        colors: {
                            roadColor: 0x080808,
                            islandColor: 0x0a0a0a,
                            background: 0x000000,
                            shoulderLines: 0xffffff,
                            brokenLines: 0xffffff,
                            leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
                            rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
                            sticks: 0x03b3c3,
                        }
                    }}
                />
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