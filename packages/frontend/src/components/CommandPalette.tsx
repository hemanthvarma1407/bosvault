'use client';

import React, { useState, useEffect } from 'react';
import { Command, Search, ArrowRight, Activity, BookOpen, Plus, LayoutGrid, Users, Package, Key, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Action {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    shortcut?: string;
    category: 'Navigation' | 'Security' | 'AI' | 'Support';
    href: string;
}

const ACTIONS: Action[] = [
    { id: 'dashboard', title: 'Dashboard', description: 'System overview', icon: LayoutGrid, shortcut: 'D', category: 'Navigation', href: '/dashboard' },
    { id: 'assets', title: 'Assets', description: 'Manage hardware & assets', icon: Package, shortcut: 'A', category: 'Navigation', href: '/assets' },
    { id: 'tickets', title: 'Tickets', description: 'Support tickets', icon: Activity, shortcut: 'T', category: 'Navigation', href: '/tickets' },
    { id: 'raise-ticket', title: 'Create Ticket', description: 'Create new support ticket', icon: Plus, shortcut: 'P', category: 'Support', href: '/create-ticket' },
    { id: 'network', title: 'Network', description: 'Network monitoring', icon: Network, shortcut: 'N', category: 'Navigation', href: '/network' },
    { id: 'employees', title: 'Employees', description: 'Manage employees', icon: Users, shortcut: 'E', category: 'Navigation', href: '/employees' },
    { id: 'licenses', title: 'Licenses', description: 'Software licenses', icon: Key, shortcut: 'K', category: 'Security', href: '/licenses' },
    { id: 'kb', title: 'Help Center', description: 'Documentation & guides', icon: BookOpen, shortcut: 'H', category: 'Support', href: '/knowledge-base' },
];

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAction = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setSearch('');
    };

    const filteredActions = ACTIONS.filter(action =>
        action.title.toLowerCase().includes(search.toLowerCase()) ||
        action.category.toLowerCase().includes(search.toLowerCase()) ||
        action.description.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                {/* Search Header */}
                <div className="flex items-center gap-4 p-6 border-b border-slate-200 dark:border-white/5">
                    <Search className="w-5 h-5 text-blue-500" />
                    <input
                        autoFocus
                        placeholder="Type a command or search actions..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-lg font-bold selection:bg-blue-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ESC to quit</span>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
                    {filteredActions.length > 0 ? (
                        <div className="space-y-6">
                            {['Navigation', 'Security', 'Support'].map(category => {
                                const catActions = filteredActions.filter(a => a.category === category);
                                if (catActions.length === 0) return null;
                                return (
                                    <div key={category} className="space-y-2">
                                        <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{category}</h3>
                                        <div className="space-y-1">
                                            {catActions.map(action => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => handleAction(action.href)}
                                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">
                                                            <action.icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{action.title}</h4>
                                                            <p className="text-[11px] text-slate-500 font-bold group-hover:text-slate-400 transition-colors tabular-nums">{action.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {action.shortcut && (
                                                            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 group-hover:text-blue-500 transition-colors">
                                                                {action.shortcut}
                                                            </span>
                                                        )}
                                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-black tracking-tight uppercase">Protocol Not Found</h3>
                            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-tighter">No intelligence matching "{search}"</p>
                        </div>
                    )}
                </div>

                {/* Footer Readout */}
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex items-center justify-between px-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Command className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Intelligence Hub v1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
