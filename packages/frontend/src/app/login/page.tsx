'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Users, Package, Key } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { LoginUserModel } from '@bosvault/shared-models';
import Link from 'next/link';
import { configVariables } from '@bosvault/shared-services';
import { hashPassword } from '@/lib/utils';

const LoginPage: React.FC = () => {
    const router = useRouter();
    const { login, isLoading, isAuthenticated } = useAuth();
    // Force dark mode for login page as per requirement
    const isDarkMode = true;
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            const params = new URLSearchParams(window.location.search);
            const redirectTo = params.get('redirectTo');
            router.push(redirectTo || '/welcome');
        }
        // Load saved email on mount
        const savedEmail = localStorage.getItem('last_login_email');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
        }
    }, [isAuthenticated, router]);

    const handleGoogleLogin = useCallback(() => {
        setIsGoogleLoading(true);
        const baseUrl = configVariables.APP_AVS_SERVICE_URL || 'http://localhost:3001';
        window.location.href = `${baseUrl}/auth-users/google`;
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Hash the password on frontend before sending to backend to satisfy "payload showing like this i wnat password showi hash"
            const hashedPassword = await hashPassword(formData.password);
            const req = new LoginUserModel(formData.email, hashedPassword);
            const user = await login(req);
            if (user) {
                // Save email for next time
                localStorage.setItem('last_login_email', formData.email);
                AlertMessages.getSuccessMessage('Logged in successfully!');
                const params = new URLSearchParams(window.location.search);
                const redirectTo = params.get('redirectTo');
                router.push(redirectTo || '/welcome');
            } else {
                AlertMessages.getErrorMessage('Login Failed: Unable to retrieve user details.');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error?.message || 'Invalid credentials');
        }
    }, [login, formData, router]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    return (
        <div className={`min-h-screen relative flex items-center justify-center overflow-hidden transition-colors duration-700 ${isDarkMode
            ? 'bg-black'
            : 'bg-[#F8FAFC]'
            }`}>
            {/* Theme Toggle Button */}
            {/* <button
                onClick={toggleDarkMode}
                className={`absolute top-8 right-8 z-50 p-3 rounded-2xl backdrop-blur-xl border transition-all duration-500 group ${isDarkMode
                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                    : 'bg-white shadow-lg shadow-slate-200/50 border-slate-200 hover:border-slate-300 hover:scale-105'
                    }`}
                aria-label="Toggle theme"
            >
                {isDarkMode ? (
                    <Sun className="h-5 w-5 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                    <Moon className="h-5 w-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-500" />
                )}
            </button> */}

            {/* Enhanced Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Vibrant Gradient Orbs */}
                <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-float ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/10'}`}></div>
                <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-float-delayed ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-400/10'}`}></div>

                {/* Animated Grid */}
                <div className={`absolute inset-0 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] ${isDarkMode
                    ? 'bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]'
                    : 'bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)]'
                    }`}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-[1000px] mx-auto px-8 py-4 h-full">
                <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-center min-h-[85vh]">
                    {/* Left Side - Enhanced Branding */}
                    <div className={`space-y-4 hidden lg:block transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        <div className="space-y-4 animate-slide-up">

                            {/* Title */}
                            <div>
                                <h1 className="text-4xl font-black leading-tight mb-3 tracking-tight">
                                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Welcome to </span>
                                    <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent animate-gradient">
                                        BOS Vault
                                    </span>
                                </h1>
                                <p className={`text-base leading-relaxed max-w-none font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                    The most advanced admin management platform. Secure, scalable, and built for the future.
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Features Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2 animate-slide-up animation-delay-400">
                            {[
                                {
                                    icon: Package,
                                    title: 'Asset Inventory',
                                    desc: 'Track & manage company assets',
                                    darkContainer:
                                        'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-400/40',
                                    lightContainerBorder:
                                        'hover:shadow-blue-500/10 hover:border-blue-200',
                                    darkIcon:
                                        'bg-gradient-to-br from-blue-500/30 to-cyan-500/30',
                                    lightIcon:
                                        'bg-blue-50 text-blue-600',
                                    darkIconColor:
                                        'text-cyan-300',
                                    hoverGradient:
                                        'from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10',
                                },
                                {
                                    icon: Users,
                                    title: 'Employee Info',
                                    desc: 'Centralized employee records',
                                    darkContainer:
                                        'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 hover:border-emerald-400/40',
                                    lightContainerBorder:
                                        'hover:shadow-emerald-500/10 hover:border-emerald-200',
                                    darkIcon:
                                        'bg-gradient-to-br from-emerald-500/30 to-green-500/30',
                                    lightIcon:
                                        'bg-emerald-50 text-emerald-600',
                                    darkIconColor:
                                        'text-green-300',
                                    hoverGradient:
                                        'from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/10 group-hover:to-green-500/10',
                                },
                                {
                                    icon: Mail,
                                    title: 'Email Info',
                                    desc: 'Secure client communication',
                                    darkContainer:
                                        'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-400/40',
                                    lightContainerBorder:
                                        'hover:shadow-indigo-500/10 hover:border-indigo-200',
                                    darkIcon:
                                        'bg-gradient-to-br from-indigo-500/30 to-purple-500/30',
                                    lightIcon:
                                        'bg-indigo-50 text-indigo-600',
                                    darkIconColor:
                                        'text-purple-300',
                                    hoverGradient:
                                        'from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10',
                                },
                                {
                                    icon: Key,
                                    title: 'Credential Vault',
                                    desc: 'Securely store and manage passwords',
                                    darkContainer:
                                        'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-400/40',
                                    lightContainerBorder:
                                        'hover:shadow-amber-500/10 hover:border-amber-200',
                                    darkIcon:
                                        'bg-gradient-to-br from-amber-500/30 to-orange-500/30',
                                    lightIcon:
                                        'bg-amber-50 text-amber-600',
                                    darkIconColor:
                                        'text-amber-300',
                                    hoverGradient:
                                        'from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/10 group-hover:to-orange-500/10',
                                },
                            ]
                                .map((feat, i) => (
                                    <div key={i} className={`group relative overflow-hidden rounded-xl p-3.5 transition-all hover:scale-105 border h-full flex flex-col justify-center ${isDarkMode
                                        ? feat.darkContainer
                                        : `bg-white border-slate-100 shadow-sm hover:shadow-md ${feat.lightContainerBorder}`
                                        }`}>
                                        <div className={`absolute inset-0 transition-all bg-gradient-to-br ${isDarkMode
                                            ? feat.hoverGradient
                                            : 'opacity-0 group-hover:opacity-100 bg-slate-50/50'
                                            }`}></div>
                                        <div className="relative flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${isDarkMode
                                                ? feat.darkIcon
                                                : feat.lightIcon
                                                }`}>
                                                <feat.icon className={`h-4 w-4 ${isDarkMode ? feat.darkIconColor : 'text-current'}`} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-xs mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{feat.title}</h3>
                                                <p className={`text-[10px] leading-snug ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{feat.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Right Side - Ultra-Compact Login Card */}
                    <div className="w-full max-w-[280px] mx-auto lg:mx-0 animate-fade-in relative z-20">
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className={`absolute -inset-1 rounded-3xl blur-2xl transition-all duration-1000 ${isDarkMode
                                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-30 group-hover:opacity-50'
                                : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-10 group-hover:opacity-30'
                                }`}></div>

                            {/* Form Container */}
                            <div className={`relative backdrop-blur-3xl rounded-3xl p-5 lg:p-6 transition-all duration-700 border shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] ${isDarkMode
                                ? 'bg-slate-900/95 border-slate-800/50'
                                : 'bg-white/98 border-white/50 shadow-blue-900/5'
                                }`}>

                                {/* Refined Branding - Minimal Height */}
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center gap-2 mb-2">
                                        <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                                            <img src="/logo.jpeg" alt="Logo" className="h-8 w-8 object-contain" />
                                        </div>
                                        <h1 className={`text-lg font-black bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent`}>BOS Vault</h1>
                                    </div>
                                    <p className={`text-[10px] font-medium transition-colors duration-700 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Sign in to your account</p>
                                </div>

                                {/* Login Form - Ultra Tight */}
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    {/* Email */}
                                    <div className="space-y-1">
                                        <label className={`block text-[9px] font-black uppercase tracking-widest transition-colors duration-700 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Email
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-3 w-3 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="you@company.com"
                                                required
                                                disabled={isLoading}
                                                className={`w-full pl-8 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 ${isDarkMode
                                                    ? 'bg-slate-800/50 border border-slate-700 text-white placeholder-gray-500'
                                                    : 'bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1">
                                        <label className={`block text-[9px] font-black uppercase tracking-widest transition-colors duration-700 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Password
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-3 w-3 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                required
                                                disabled={isLoading}
                                                className={`w-full pl-8 pr-9 py-2 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 ${isDarkMode
                                                    ? 'bg-slate-800/50 border border-slate-700 text-white placeholder-gray-500'
                                                    : 'bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-blue-500 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={isLoading || isGoogleLoading}
                                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-lg shadow-lg shadow-blue-500/20 transition-all group/btn relative overflow-hidden"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                <span>Signing in...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span>Sign In</span>
                                                <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </Button>

                                    <div className="relative py-0.5">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className={`w-full border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}></div>
                                        </div>
                                        <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
                                            <span className={`px-2 backdrop-blur-xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Or continue with</span>
                                        </div>
                                    </div>

                                    {/* Google Login Button */}
                                    <Button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading || isGoogleLoading}
                                        className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg border text-[10px] font-bold transition-all duration-300 ${isDarkMode
                                            ? 'bg-white/5 border-white/5 text-white hover:bg-white/10'
                                            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 shadow-sm'
                                            }`}
                                    >
                                        {isGoogleLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                                                <span>Connecting...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                                    <path
                                                        fill="#4285F4"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="#34A853"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="#FBBC05"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                                    />
                                                    <path
                                                        fill="#EA4335"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    />
                                                </svg>
                                                <span>Google</span>
                                            </>
                                        )}
                                    </Button>

                                    {/* Additional Links */}
                                    <div className="flex items-center justify-center gap-4 pt-1">
                                        <Link
                                            href="/request-access"
                                            className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 hover:text-blue-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                                        >
                                            Request Access
                                        </Link>
                                        <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                                        <Link
                                            href="/forgot-password"
                                            className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 hover:text-blue-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                                        >
                                            Forgot?
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 left-0 right-0 z-20 text-center">
                    <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-700 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        © 2026 BOS Vault • Secure Access
                    </p>
                </div>

                <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    50% {
                        transform: translateY(-20px) translateX(20px);
                    }
                }
                @keyframes float-delayed {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    50% {
                        transform: translateY(20px) translateX(-20px);
                    }
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
                    }
                }
                @keyframes gradient {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 1s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }
                .animate-float {
                    animation: float 8s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 10s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-shimmer {
                    animation: shimmer 3s linear infinite;
                }
                .animate-shimmer-delayed {
                    animation: shimmer 3s linear infinite 1.5s;
                }
                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
            `}</style>
            </div>
        </div>
    );
};

export default LoginPage;