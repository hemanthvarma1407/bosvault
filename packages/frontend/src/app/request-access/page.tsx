'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Mail, User, ArrowLeft, Send } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { authService } from '@/lib/api/services';
import Link from 'next/link';

const RequestAccessPage: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isDarkMode] = useState(true);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await authService.requestAccess({
                name: formData.name,
                email: formData.email,
                status: 'pending'
            } as any);

            if (response && response.status) {
                AlertMessages.getSuccessMessage('Access request sent to admin successfully.');
                setTimeout(() => router.push('/login'), 3000);
            } else {
                AlertMessages.getErrorMessage(response?.message || 'Failed to send access request.');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error?.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [formData, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={`min-h-screen relative flex items-center justify-center overflow-hidden transition-colors duration-700 ${isDarkMode
            ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'
            : 'bg-[#F8FAFC]'
            }`}>
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float ${isDarkMode ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30' : 'bg-gradient-to-r from-blue-400/20 to-cyan-300/20 opacity-70'}`}></div>
                <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float-delayed ${isDarkMode ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30' : 'bg-gradient-to-r from-indigo-400/20 to-purple-300/20 opacity-70'}`}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-[340px] mx-auto px-4 py-6 animate-fade-in">
                <div className="relative group">
                    {/* Glow Effect */}
                    <div className={`absolute -inset-1 rounded-3xl blur-2xl transition-all duration-1000 ${isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-40 group-hover:opacity-60 group-hover:blur-3xl'
                        : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-20 group-hover:opacity-40 group-hover:blur-3xl'
                        }`}></div>

                    {/* Form Container */}
                    <div className={`relative backdrop-blur-3xl rounded-2xl p-5 transition-all duration-700 border shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] ${isDarkMode
                        ? 'bg-slate-900/90 border-slate-700/50'
                        : 'bg-white/95 border-white/50 shadow-blue-900/10'
                        }`}>

                        <div className="mb-4 text-center">
                            <Link href="/login" className={`inline-flex items-center gap-2 mb-3 text-xs font-bold transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Login
                            </Link>
                            <h2 className={`text-xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Request Access</h2>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Send your details to the administrator</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1.5">
                                <label className={`block text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Full Name
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-3.5 w-3.5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        required
                                        disabled={isLoading}
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50 ${isDarkMode
                                            ? 'bg-slate-800/50 border border-slate-600 text-white placeholder-gray-500 hover:border-slate-500'
                                            : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={`block text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Email Address
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-3.5 w-3.5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="you@company.com"
                                        required
                                        disabled={isLoading}
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50 ${isDarkMode
                                            ? 'bg-slate-800/50 border border-slate-600 text-white placeholder-gray-500 hover:border-slate-500'
                                            : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400'
                                            }`}
                                    />
                                </div>
                            </div>


                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 group/btn relative overflow-hidden text-sm uppercase"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2 relative z-10">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span>Sending Request...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 relative z-10">
                                        <span>Request Access</span>
                                        <Send className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(20px) translateX(-20px); }
                }
                .animate-fade-in { animation: fade-in 0.8s ease-out; }
                .animate-float { animation: float 8s ease-in-out infinite; }
                .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default RequestAccessPage;
