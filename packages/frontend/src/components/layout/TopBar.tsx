'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, LogOut, Moon, Sun, Bell, Globe, Terminal, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getSocket } from '@/lib/socket';
import { notificationsService } from '@/lib/api/services';

interface TopBarProps {
    onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

    // Fetch initial notifications and listen to socket
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const response = await notificationsService.getNotifications();
                if (Array.isArray(response)) {
                    setNotifications(response);
                } else if (response && Array.isArray((response as any).data)) {
                    setNotifications((response as any).data);
                }
            } catch (error) {
                console.error('[TopBar] Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();

        const socket = getSocket();
        socket.emit('joinUser', { userId: user.id });

        socket.on('notification', (notif: any) => {
            setNotifications(prev => {
                // Prevent duplicate notifications in stream
                if (prev.some(n => n.id === notif.id)) return prev;
                const newNotif = {
                    ...notif,
                    read: notif.read || false,
                    isRead: notif.isRead || false
                };
                return [newNotif, ...prev].slice(0, 15);
            });
        });

        return () => {
            socket.off('notification');
        };
    }, [user]);

    const toggleNotifications = async () => {
        const nextShow = !showNotifications;
        setShowNotifications(nextShow);
        if (nextShow && unreadCount > 0) {
            try {
                await notificationsService.markAllAsRead();
                setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
            } catch (error) {
                console.error('Failed to mark notifications as read:', error);
            }
        }
    };

    const handleFlushAll = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to flush notifications:', error);
            setNotifications([]);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowUserMenu(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all duration-300">
            {/* Left: Section Title / Global Context */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="hidden md:flex items-center gap-4 px-4 lg:px-6 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md min-w-[200px] lg:min-w-[280px]">
                    <Globe className="h-4 w-4 text-blue-500 animate-pulse shrink-0" />
                    <div className="flex items-center gap-3 whitespace-nowrap">
                        {mounted ? (
                            <>
                                <span className="hidden lg:inline text-[11px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                                    {currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <div className="hidden lg:block w-px h-3 bg-slate-200 dark:bg-slate-800" />
                                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-widest uppercase">
                                    {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </>
                        ) : (
                            <span className="text-[11px] font-black text-slate-400 tabular-nums tracking-tight animate-pulse">
                                INITIALIZING...
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Tools & Identity */}
            <div className="flex items-center gap-2">

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={toggleNotifications}
                        className={`relative p-2 rounded-lg transition-all ${showNotifications ? 'bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border border-white dark:border-slate-950 animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stream</h3>
                                <button onClick={handleFlushAll} className="text-[10px] font-black text-blue-500 hover:text-blue-600">Flush All</button>
                            </div>
                            <div className="max-h-[360px] overflow-y-auto scrollbar-hide">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center opacity-30">
                                        <Terminal className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Incoming Streams</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 cursor-pointer">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{notif.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => {
                        const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
                        const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
                        setTheme(modes[nextIndex]);
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-2 group relative"
                    title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
                >
                    {theme === 'light' && <Sun className="h-4 w-4 text-amber-500" />}
                    {theme === 'dark' && <Moon className="h-4 w-4 text-indigo-400" />}
                    {theme === 'system' && (
                        <div className="relative">
                            <Monitor className="h-4 w-4 text-slate-400" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-950 bg-blue-500" />
                        </div>
                    )}
                    <span className="hidden lg:block text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">
                        {theme}
                    </span>
                </button>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

                {/* Identity */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg transition-all ${showUserMenu ? 'bg-slate-100 dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                    >
                        <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-blue-600/10">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{user?.fullName || 'User'}</p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-1">{user?.email}</p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export { TopBar };
