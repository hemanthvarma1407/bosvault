'use client';

import React from 'react';
// Note: In Next.js we use next/link but the sidebar uses next/navigation. 
// Wait, the existing not-found.tsx used next/link.

import LinkNext from 'next/link';
import { Home, ArrowLeft, Construction, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

interface FeatureNotImplementedProps {
    title: string;
    description?: string;
}

export const FeatureNotImplemented: React.FC<FeatureNotImplementedProps> = ({
    title,
    description = "This feature is currently under secure development and will be available in a future vault release."
}) => {
    const { isDarkMode } = useTheme();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            {/* Animated Icon Container */}
            <div className="relative mb-12">
                <div className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-1000 ${isDarkMode
                    ? 'bg-blue-600/30'
                    : 'bg-blue-400/20'}`}></div>
                <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center border shadow-2xl ${isDarkMode
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200'}`}>
                    <Construction className={`w-12 h-12 ${isDarkMode ? 'text-blue-500' : 'text-blue-600'} animate-bounce-slow`} />
                    <div className="absolute -top-2 -right-2">
                        <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-md space-y-6">
                <div className="space-y-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${isDarkMode
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        <Shield className="w-3 h-3 animate-pulse" />
                        Feature Roadmap Item
                    </div>
                    <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                        {title}
                    </h1>
                    <p className={`text-base font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {description}
                    </p>
                </div>

                {/* Status Bar */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Development Status</span>
                        <span className="text-[10px] font-black uppercase text-blue-500">In Progress</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div className="h-full bg-blue-600 w-2/3 animate-shimmer"></div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <LinkNext href="/dashboard">
                        <Button
                            variant="primary"
                            className="w-full sm:min-w-[160px] h-12 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Return Home
                        </Button>
                    </LinkNext>
                    <Button
                        onClick={() => window.history.back()}
                        variant="ghost"
                        className={`w-full sm:min-w-[160px] h-12 rounded-xl font-bold border ${isDarkMode
                            ? 'border-slate-800 hover:bg-slate-900 text-slate-300'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous Page
                    </Button>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s linear infinite;
                }
            `}</style>
        </div>
    );
};
