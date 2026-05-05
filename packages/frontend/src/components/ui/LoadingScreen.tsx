'use client';

import React from 'react';

/**
 * Global Loading Component for BosVault
 * Provides a smooth transition between pages and consistent visual feedback
 */
interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl transition-all duration-700">
            <div className="relative flex flex-col items-center">
                {/* Visual Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full animate-pulse"></div>

                {/* Logo Section */}
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                    <div className="relative flex flex-col items-center gap-3">
                        <img src="/logo.jpeg" alt="Logo" className="h-16 w-16 object-contain animate-float" />
                        <div className="flex flex-col items-center">
                            <h1 className="text-2xl font-black tracking-tighter text-white italic leading-none">
                                BOS Vault
                            </h1>
                            <div className="h-1 w-32 bg-slate-800 mt-4 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-1/3 animate-[loading-bar_1.5s_infinite_ease-in-out]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    50% { transform: translateX(0) scaleX(0.5); }
                    100% { transform: translateX(100%) scaleX(0.2); }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
