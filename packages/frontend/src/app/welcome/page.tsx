'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ExternalLink, Cloud, Code, Shield, Zap, Rocket } from 'lucide-react';

const WelcomePage: React.FC = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();

    const companies = [
        {
            name: "BOS Framework",
            url: "https://www.bosframework.com/",
            description: "Comprehensive cloud enablement platform automating orchestration, CI/CD, and security.",
            features: [
                { icon: <Zap className="w-4 h-4" />, text: "Cloud Orchestration" },
                { icon: <Rocket className="w-4 h-4" />, text: "Automated CI/CD" },
                { icon: <Shield className="w-4 h-4" />, text: "Security Compliance" }
            ],
            gradient: "from-purple-600/10 to-slate-900/10 dark:from-purple-600/20 dark:to-slate-900/20",
            border: "border-slate-200 dark:border-purple-500/20",
            shadow: "hover:shadow-purple-500/10"
        },
        {
            name: "5Y Business Solutions",
            url: "https://www.5yinc.com/",
            description: "Driving digital transformation through legacy modernization and cloud-native engineering.",
            features: [
                { icon: <Code className="w-4 h-4" />, text: "Legacy Modernization" },
                { icon: <Cloud className="w-4 h-4" />, text: "Cloud Engineering" },
                { icon: <Shield className="w-4 h-4" />, text: "DevSecOps" }
            ],
            gradient: "from-slate-900/10 to-slate-900/10 dark:from-slate-900/20 dark:to-slate-900/20",
            border: "border-slate-200 dark:border-slate-700/20",
            shadow: "hover:shadow-black/20"
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-8 -mt-12 animate-slide-up space-y-10">
            <div className="max-w-2xl text-center space-y-3">
                <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Welcome to <span className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-600 bg-clip-text text-transparent animate-gradient">BOS Vault</span>
                    {user?.fullName && (
                        <span className="text-lg md:text-xl font-bold text-slate-500 dark:text-slate-400 opacity-80 ml-2">
                            / {user.fullName}
                        </span>
                    )}
                </h1>
                <p className={`text-xs md:text-sm leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    Streamlined hardware, software, and human capital management. Built for modern IT teams to operate securely and efficiently. Explore the features below.
                </p>
            </div>

            <div className="w-full max-w-2xl">
                <div className="flex flex-col space-y-8">
                    <div className="flex items-center space-x-4 opacity-50">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-500 to-transparent"></div>
                        <h2 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Our Ecosystem Partners
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-500 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companies.map((company, idx) => (
                            <a
                                key={idx}
                                href={company.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group relative p-4 rounded-lg border ${company.border} bg-white dark:bg-white/5 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${company.shadow} overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${company.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:scale-[1.02] transition-transform origin-left">
                                            {company.name}
                                        </h3>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:rotate-12 transition-all" />
                                    </div>

                                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors`}>
                                        {company.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1">
                                        {company.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 text-[7px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-all">
                                                <span className="text-slate-900 dark:text-white dark:text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-slate-300 transition-colors">{feature.icon}</span>
                                                {feature.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-gradient { background-size: 200% 200%; animation: gradient 4s ease infinite; }
            `}</style>
        </div>
    );
};

export default WelcomePage;
