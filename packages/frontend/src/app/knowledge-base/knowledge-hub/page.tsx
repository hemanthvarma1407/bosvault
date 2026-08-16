'use client';

import React, { useState } from 'react';
import {
    BookOpen,
    Search,
    ChevronRight,
    HelpCircle,
    Terminal,
    ShieldCheck,
    Zap,
    Clock,
    Star,
    Bookmark,
    Share2,
    Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

export default function KnowledgeHubPage() {
    const { isDarkMode } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('All');

    const categories = [
        { name: 'SOPs', icon: Zap, count: 12, color: 'blue' },
        { name: 'Troubleshooting', icon: HelpCircle, count: 24, color: 'rose' },
        { name: 'Security', icon: ShieldCheck, count: 8, color: 'emerald' },
        { name: 'Infrastructure', icon: Terminal, count: 15, color: 'amber' }
    ];

    const popularArticles = [
        { id: 1, title: 'Network VPN Configuration Guide', category: 'Infrastructure', author: 'IT System Admin', date: '2d ago', reads: '1.2k', rating: 4.8 },
        { id: 2, title: 'Standard Incident Response SOP', category: 'Security', author: 'Security Lead', date: '5d ago', reads: '850', rating: 4.9 },
        { id: 3, title: 'Windows 11 Deployment Procedure', category: 'SOPs', author: 'IT Support', date: '1w ago', reads: '540', rating: 4.7 },
        { id: 4, title: 'Database Backup & Recovery', category: 'Infrastructure', author: 'DBA Team', date: '2w ago', reads: '320', rating: 4.5 },
    ];

    return (
        <div className="p-6 space-y-10 animate-fade-in max-w-7xl mx-auto pb-20">
            {/* Hero Section */}
            <div className={`relative p-8 md:p-12 rounded-[3.5rem] overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-indigo-950 shadow-2xl shadow-indigo-500/10 border-indigo-900'}`}>
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-slate-900 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-slate-900 rounded-full blur-[120px] opacity-10 animate-pulse delay-75"></div>

                <div className="relative z-10 max-w-3xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/20 border border-slate-700/30 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                        <BookOpen className="h-3 w-3" />
                        BosVault Academy
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                        Knowledge is power. <br />
                        <span className="text-slate-300">Share your expertise.</span>
                    </h1>
                    <p className="text-indigo-100/60 text-lg font-medium max-w-xl">
                        A collaborative hub for technical documentation, system architecture boards, and standard operating procedures.
                    </p>

                    {/* Hero Search */}
                    <div className="pt-4 max-w-2xl">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:scale-110 transition-transform" />
                            <input
                                type="text"
                                placeholder="Search by documentation, topic, or system..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-indigo-900/40 border border-white/10 text-white placeholder-indigo-300/50 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-slate-700/50 transition-all text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Categories</h3>
                    <div className="space-y-2">
                        {categories.map((cat, i) => (
                            <button key={i} className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all border ${isDarkMode ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg shadow-indigo-500/5'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl bg-${cat.color}-500/10 text-${cat.color}-500`}>
                                        <cat.icon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{cat.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 bg-slate-800/20 px-2 py-0.5 rounded-md">{cat.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* New Doc Button */}
                    <Button className="w-full h-14 rounded-3xl bg-slate-900 hover:bg-slate-900 text-white font-black tracking-tight shadow-xl shadow-indigo-600/20">
                        <Edit3 className="h-5 w-5 mr-3" />
                        Create Document
                    </Button>

                    {/* Contributors Highlight */}
                    <div className={`p-6 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Top Contributors</h4>
                        <div className="flex -space-x-3 mb-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    JD
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">Join 240+ contributors sharing knowledge daily.</p>
                    </div>
                </div>

                {/* Articles Feed */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-6 border-b border-slate-800/10 pb-1">
                            {['All', 'Recent', 'Most Viewed', 'Favorites'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`relative pb-3 text-sm font-black transition-all ${selectedTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab}
                                    {selectedTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-800"><Bookmark className="h-4 w-4 text-slate-500" /></Button>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-800"><Share2 className="h-4 w-4 text-slate-500" /></Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {popularArticles.map((article) => (
                            <div key={article.id} className={`group p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${isDarkMode
                                ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700/30'
                                : 'bg-white border-slate-200 hover:shadow-2xl shadow-indigo-500/5'}`}>
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-900/10 text-slate-300' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white'}`}>
                                            {article.category}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-500">
                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                            {article.rating}
                                        </div>
                                    </div>
                                    <h3 className={`text-xl font-black tracking-tight leading-snug ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{article.title}</h3>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-700">
                                                {article.author.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{article.author}</span>
                                                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">{article.date}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <Clock className="h-3 w-3" />
                                            {article.reads} Reads
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Guide Card */}
                    <div className={`p-8 rounded-[3rem] border relative overflow-hidden group ${isDarkMode ? 'bg-slate-900/5 border-slate-700/20' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="absolute top-0 right-0 p-8 text-slate-900 dark:text-white/10 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-32 w-32" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Missing a guide?</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-lg">
                                If you can't find what you're looking for, or notice a technical guide is outdated, please request a documentation update or start drafting one yourself!
                            </p>
                            <div className="pt-2">
                                <Button className={`rounded-xl px-6 font-bold ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>
                                    Request Content Update
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
