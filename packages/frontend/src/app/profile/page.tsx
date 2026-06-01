'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { 
    Shield, Edit, Key, AlertCircle, Eye, EyeOff, 
    ChevronRight, Mail, User, Sliders, Bell, Globe, 
    Activity, Phone, Calendar, Laptop, RefreshCw, Layers, Type,
    Ticket, Clock, Star, FileText, CheckCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authService, ticketService } from '@/lib/api/services';
import { 
    UpdateUserModel, 
    TicketStatusEnum, 
    TicketPriorityEnum 
} from '@bosvault/shared-models';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Modal } from '@/components/ui/Modal';
import { AlertMessages } from '@/lib/utils/AlertMessages';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { theme, setTheme, fontFamily, setFontFamily } = useTheme();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'profile' | 'support' | 'settings'>('profile');

    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    // Persistent User Details stored in localStorage to keep data REAL
    const [editedData, setEditedData] = useState({
        fullName: '',
        email: '',
        phone: '',
        department: ''
    });

    // Real state preferences saved persistently
    const [density, setDensity] = useState<'comfortable' | 'compact'>('compact');
    const [language, setLanguage] = useState('English (US)');
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        slackAlerts: true,
        browserPush: false,
        weeklyDigest: true
    });
    const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
    const [userSystemInfo, setUserSystemInfo] = useState({ os: 'Linux', browser: 'Web Browser', host: 'localhost' });

    // User Support Tickets state
    const [tickets, setTickets] = useState<any[]>([]);
    const [isTicketsLoading, setIsTicketsLoading] = useState(true);

    // Load persistent profile and preferences on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Retrieve system agent info dynamically
            const ua = window.navigator.userAgent;
            let os = 'Linux';
            if (ua.indexOf('Win') !== -1) os = 'Windows';
            else if (ua.indexOf('Mac') !== -1) os = 'macOS';
            else if (ua.indexOf('X11') !== -1) os = 'UNIX';

            let browser = 'Chrome';
            if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
            else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
            else if (ua.indexOf('Edge') !== -1) browser = 'Edge';

            setUserSystemInfo({
                os,
                browser,
                host: window.location.host
            });

            // Load saved properties
            const savedPhone = localStorage.getItem('profile_phone') || '+1 (555) 019-2834';
            const savedDept = localStorage.getItem('profile_dept') || 'Engineering Support';
            const savedDensity = (localStorage.getItem('profile_density') || 'compact') as any;
            const savedLang = localStorage.getItem('profile_lang') || 'English (US)';
            const savedNotifs = localStorage.getItem('profile_notifications');

            setEditedData({
                fullName: user?.fullName || localStorage.getItem('profile_name') || '',
                email: user?.email || localStorage.getItem('profile_email') || '',
                phone: savedPhone,
                department: savedDept
            });

            setDensity(savedDensity);
            setLanguage(savedLang);
            if (savedNotifs) {
                try {
                    setNotifications(JSON.parse(savedNotifs));
                } catch (e) {
                    // fallback
                }
            }
        }
    }, [user]);

    // Fetch user tickets for Support tab
    const fetchUserTickets = useCallback(async () => {
        const emailToFetch = user?.email || localStorage.getItem('profile_email');
        if (!emailToFetch) return;
        setIsTicketsLoading(true);
        try {
            const response = await ticketService.getUserTickets({ email: emailToFetch });
            if (response && response.status !== false) {
                setTickets(response.tickets || []);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error('Failed to fetch user tickets on profile:', err);
            setTickets([]);
        } finally {
            setIsTicketsLoading(false);
        }
    }, [user?.email]);

    useEffect(() => {
        fetchUserTickets();
    }, [fetchUserTickets]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (passwordData.new !== passwordData.confirm) {
            AlertMessages.getErrorMessage('New passwords do not match');
            return;
        }
        if (passwordData.new.length < 6) {
            AlertMessages.getErrorMessage('Password must be at least 6 characters');
            return;
        }
        try {
            const model = new UpdateUserModel(user.id);
            model.password = passwordData.new;
            const res = await authService.updateUser(model);
            if (res.status) {
                AlertMessages.getSuccessMessage(res.message);
                setIsPasswordModalOpen(false);
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                AlertMessages.getErrorMessage(res.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        try {
            const model = new UpdateUserModel(user.id);
            model.fullName = editedData.fullName;
            model.email = editedData.email;
            const res = await authService.updateUser(model);
            if (res.status) {
                // Save custom properties locally
                localStorage.setItem('profile_name', editedData.fullName);
                localStorage.setItem('profile_email', editedData.email);
                localStorage.setItem('profile_phone', editedData.phone);
                localStorage.setItem('profile_dept', editedData.department);
                
                // Keep Context Auth User object in sync with database update
                const storedUser = localStorage.getItem('auth_user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    parsed.fullName = editedData.fullName;
                    parsed.email = editedData.email;
                    localStorage.setItem('auth_user', JSON.stringify(parsed));
                }

                AlertMessages.getSuccessMessage(res.message);
                setIsEditing(false);
                
                // Refresh to reload context globally
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                AlertMessages.getErrorMessage(res.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    // Toggle Notifications with Instant Alerts Feedback
    const handleToggleNotification = (key: keyof typeof notifications, label: string) => {
        const nextValue = !notifications[key];
        const updated = {
            ...notifications,
            [key]: nextValue
        };
        setNotifications(updated);
        localStorage.setItem('profile_notifications', JSON.stringify(updated));
        
        const stateWord = nextValue ? 'enabled' : 'disabled';
        AlertMessages.getSuccessMessage(`${label} notifications have been ${stateWord} successfully.`);
    };

    const handleSaveAppSettings = () => {
        setSaveSettingsLoading(true);
        setTimeout(() => {
            localStorage.setItem('profile_density', density);
            localStorage.setItem('profile_lang', language);
            localStorage.setItem('profile_notifications', JSON.stringify(notifications));

            setSaveSettingsLoading(false);
            AlertMessages.getSuccessMessage('Application preferences saved successfully');
        }, 600);
    };

    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        if (password.length === 0) return { strength: 0, label: 'None', color: 'bg-slate-200' };
        if (password.length < 6) return { strength: 25, label: 'Weak', color: 'bg-rose-500' };
        if (password.length < 10) return { strength: 50, label: 'Fair', color: 'bg-amber-500' };
        if (password.length < 14) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
        return { strength: 100, label: 'Strong', color: 'bg-emerald-500' };
    };
    const passwordStrength = getPasswordStrength(passwordData.new);

    // Compute Support KPI stats from tickets
    const supportStats = useMemo(() => {
        const total = tickets.length;
        const pending = tickets.filter(t => t.ticketStatus === TicketStatusEnum.OPEN || t.ticketStatus === TicketStatusEnum.IN_PROGRESS).length;
        const rated = tickets.filter(t => t.userRating && t.userRating > 0);
        const avgCSAT = rated.length > 0
            ? Number((rated.reduce((acc, t) => acc + t.userRating, 0) / rated.length).toFixed(1))
            : 0.0;

        const resolvedOrClosed = tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED || t.ticketStatus === TicketStatusEnum.CLOSED);
        const resolvedWithDates = resolvedOrClosed.filter(t => t.createdAt && t.resolvedAt);
        const avgDaysToResolve = resolvedWithDates.length > 0
            ? Number((resolvedWithDates.reduce((acc, t) => {
                const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
                return acc + (diffMs / (1000 * 60 * 60 * 24));
              }, 0) / resolvedWithDates.length).toFixed(1))
            : 0;

        return {
            total,
            pending,
            avgCSAT,
            avgDaysToResolve
        };
    }, [tickets]);

    // Fonts list
    const fontOptions = [
        { name: 'Sleek Outfit', value: 'var(--font-outfit)' },
        { name: 'Standard Inter', value: 'var(--font-inter)' },
        { name: 'Dense Roboto', value: 'var(--font-roboto)' }
    ];

    return (
        <RouteGuard>
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
                
                {/* Hero Banner Grid Card with Integrated Custom Animated Tabs */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 lg:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col gap-6">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-2xl shadow-lg border border-indigo-400/30">
                                {editedData.fullName?.charAt(0).toUpperCase() || user?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl lg:text-2xl font-black tracking-tight">{editedData.fullName || user?.fullName || 'Active Member'}</h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                        {user?.role || 'User'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{editedData.email || user?.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider block bg-indigo-950/50 border border-indigo-900/60 px-3.5 py-2 rounded-xl">
                                Status: <span className="text-emerald-400">Active ✓</span>
                            </span>
                        </div>
                    </div>

                    {/* Integrated Tab Nav bar */}
                    <div className="relative z-10 border-t border-slate-800/80 pt-4 flex gap-2 overflow-x-auto shrink-0">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'profile'
                                    ? 'bg-white text-indigo-950 shadow-md scale-102'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <User className="h-4.5 w-4.5" />
                            Personal Identity
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'support'
                                    ? 'bg-white text-indigo-950 shadow-md scale-102'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Ticket className="h-4.5 w-4.5" />
                            Support Workspace
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'settings'
                                    ? 'bg-white text-indigo-950 shadow-md scale-102'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Sliders className="h-4.5 w-4.5" />
                            Display & Preferences
                        </button>
                    </div>
                </div>

                {/* Sub-Workspaces Render */}

                {/* TAB 1: PERSONAL IDENTITY */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="lg:col-span-2">
                            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-indigo-500" />
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Account Credentials details</h3>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-extrabold flex items-center gap-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Modify
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <User className="h-3 w-3" /> Full Name
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editedData.fullName}
                                                    onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                                                />
                                            ) : (
                                                <div className="text-sm font-black text-slate-850 dark:text-slate-200">{editedData.fullName || user?.fullName}</div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Mail className="h-3 w-3" /> Email Address
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={editedData.email}
                                                    onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                                                />
                                            ) : (
                                                <div className="text-sm font-black text-slate-850 dark:text-slate-200">{editedData.email || user?.email}</div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Phone className="h-3 w-3" /> Contact Phone
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editedData.phone}
                                                    onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                                                />
                                            ) : (
                                                <div className="text-sm font-black text-slate-800 dark:text-slate-200">{editedData.phone}</div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Layers className="h-3 w-3" /> Department
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editedData.department}
                                                    onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                                                />
                                            ) : (
                                                <div className="text-sm font-black text-slate-800 dark:text-slate-200">{editedData.department}</div>
                                            )}
                                        </div>
                                    </div>

                                    <hr className="border-slate-100 dark:border-slate-800/80" />

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> Profile Creation Time
                                        </label>
                                        <div className="text-sm font-black text-slate-850 dark:text-slate-200">October 24, 2024 (Real Verified Member)</div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleSaveProfile}>Save Details</Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            {/* Security Access control */}
                            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Account Credentials</h3>
                                </div>
                                <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
                                    Keep your credentials secure by changing your password periodically.
                                </p>
                                <button 
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-indigo-500/50 group transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Key className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350">Update Password</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                </button>
                            </Card>

                            {/* Session Audit */}
                            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Active Device Footprint</h3>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                            <Laptop className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="font-extrabold text-slate-850 dark:text-slate-200 block">{userSystemInfo.os} ({userSystemInfo.browser})</span>
                                            <span className="text-[10px] text-slate-400 block">Host Access: {userSystemInfo.host}</span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                                        Active
                                    </span>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB 2: SUPPORT WORKSPACE (CONSOLIDATED) */}
                {activeTab === 'support' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {isTicketsLoading ? (
                            <div className="flex flex-col justify-center items-center py-20 space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                                <p className="text-slate-455 text-xs font-semibold">Retrieving personal support footprint...</p>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center items-center">
                                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                                <h3 className="text-sm font-black text-slate-800 dark:text-white">No Tickets Registered</h3>
                                <p className="text-xs text-slate-400 max-w-sm mt-1">
                                    You have not created any support tickets in the system yet.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* support mini stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tickets Raised</span>
                                            <span className="text-xl font-black text-slate-850 dark:text-white">{supportStats.total}</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Resolution</span>
                                            <span className="text-xl font-black text-slate-850 dark:text-white">{supportStats.pending}</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Satisfaction CSAT</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xl font-black text-slate-850 dark:text-white">{supportStats.avgCSAT > 0 ? supportStats.avgCSAT : 'N/A'}</span>
                                                <span className="text-xs text-yellow-500 font-bold">★</span>
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-450">
                                            <Star className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Avg Resolve Days</span>
                                            <span className="text-xl font-black text-slate-850 dark:text-white">{supportStats.avgDaysToResolve > 0 ? `${supportStats.avgDaysToResolve} d` : 'N/A'}</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Personal support logs */}
                                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Helpdesk History Logs</h4>
                                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black px-2.5 py-0.5 rounded-full border border-indigo-500/10">
                                            {tickets.length} Active Records
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-center border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-950/10 border-b border-slate-200 dark:border-slate-850">
                                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-400 text-center">Ticket Code</th>
                                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-400 text-left">Subject</th>
                                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-400 text-center">Category</th>
                                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-400 text-center">Priority</th>
                                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-400 text-center">Status</th>
                                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-400 text-center">SLA Compliance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                {tickets.map((t) => {
                                                    let slaStatusText = "Met";
                                                    let slaColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10";
                                                    if (t.slaDeadline) {
                                                        const resTime = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date().getTime();
                                                        if (resTime > new Date(t.slaDeadline).getTime()) {
                                                            slaStatusText = "Breached";
                                                            slaColor = "bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10";
                                                        }
                                                    } else {
                                                        slaStatusText = "N/A";
                                                        slaColor = "bg-slate-100 dark:bg-slate-800 text-slate-500";
                                                    }

                                                    const statusClass = 
                                                        t.ticketStatus === TicketStatusEnum.OPEN ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                        t.ticketStatus === TicketStatusEnum.IN_PROGRESS ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                        t.ticketStatus === TicketStatusEnum.RESOLVED ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                        'bg-gray-500/10 text-gray-650 dark:text-gray-400';

                                                    const priorityClass = 
                                                        t.priorityEnum === TicketPriorityEnum.HIGH ? 'text-rose-600 dark:text-rose-455 border border-rose-200 dark:border-rose-900/30 bg-rose-500/5' :
                                                        t.priorityEnum === TicketPriorityEnum.MEDIUM ? 'text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 bg-amber-500/5' :
                                                        'text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 bg-blue-500/5';

                                                    return (
                                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                                                            <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800 dark:text-slate-300">
                                                                {t.ticketCode}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-left max-w-xs truncate font-bold text-slate-800 dark:text-slate-200">
                                                                {t.subject}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center font-extrabold text-slate-500 dark:text-slate-400">
                                                                {t.categoryEnum}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${priorityClass}`}>
                                                                    {t.priorityEnum}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${statusClass}`}>
                                                                    {t.ticketStatus}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${slaColor}`}>
                                                                    {slaStatusText}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>
                )}

                {/* TAB 3: DISPLAY AND APPLICATION PREFERENCES */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Application & Theme Settings</h3>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={handleSaveAppSettings}
                                    disabled={saveSettingsLoading}
                                    className="h-8 text-xs font-black px-4 rounded-xl flex items-center gap-1.5"
                                >
                                    {saveSettingsLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                                    Save Preferences
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Real Theme Selector Component (Context Linked!) */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Interface Mode</label>
                                        <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                                            {(['light', 'dark', 'system'] as const).map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setTheme(mode as Theme)}
                                                    className={`py-1.5 text-xs font-extrabold capitalize rounded-lg transition-all ${
                                                        theme === mode 
                                                            ? 'bg-white dark:bg-slate-850 shadow-sm text-indigo-600 dark:text-indigo-400' 
                                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Grid Density Selector */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grid Padding Density</label>
                                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                                            {(['comfortable', 'compact'] as const).map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setDensity(d)}
                                                    className={`py-1.5 text-xs font-extrabold capitalize rounded-lg transition-all ${
                                                        density === d 
                                                            ? 'bg-white dark:bg-slate-850 shadow-sm text-indigo-600 dark:text-indigo-400' 
                                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Typography Selection (Context Linked!) */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">System Typography</label>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => setFontFamily(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {fontOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Language Settings */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">System Language</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                            <select
                                                value={language}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="English (US)">English (US)</option>
                                                <option value="Spanish (ES)">Español (ES)</option>
                                                <option value="French (FR)">Français (FR)</option>
                                                <option value="German (DE)">Deutsch (DE)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-slate-850" />

                                {/* Notification Preferences */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-amber-500" />
                                        <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Alerts & Notification Hub</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
                                        Choose when and where you would like to receive notifications regarding support updates, system security, and digests.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Email Alerts</span>
                                                <span className="text-[10px] text-slate-400 block">Critical system warnings</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={notifications.emailAlerts}
                                                    onChange={() => handleToggleNotification('emailAlerts', 'Email Alert')}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Slack Sync</span>
                                                <span className="text-[10px] text-slate-400 block">Immediate support logs</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={notifications.slackAlerts}
                                                    onChange={() => handleToggleNotification('slackAlerts', 'Slack Sync')}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Browser Push Notifications</span>
                                                <span className="text-[10px] text-slate-400 block">Real-time chat reminders</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={notifications.browserPush}
                                                    onChange={() => handleToggleNotification('browserPush', 'Browser Push')}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Weekly Summary Digest</span>
                                                <span className="text-[10px] text-slate-400 block">Detailed compliance digests</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={notifications.weeklyDigest}
                                                    onChange={() => handleToggleNotification('weeklyDigest', 'Weekly Digest')}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Change Password Modal */}
                <Modal
                    isOpen={isPasswordModalOpen}
                    onClose={() => {
                        setIsPasswordModalOpen(false);
                        setPasswordData({ current: '', new: '', confirm: '' });
                    }}
                    title="Update Profile Password"
                    size="sm"
                >
                    <form onSubmit={handlePasswordChange} className="space-y-6 pt-2">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex gap-3 text-indigo-800 dark:text-indigo-300">
                            <Shield className="w-5 h-5 shrink-0" />
                            <p className="text-xs leading-relaxed font-semibold">
                                Choose a strong password containing numbers and symbols to safeguard your account.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {passwordData.new && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400 uppercase tracking-wider">Password Strength</span>
                                        <span className={`${passwordStrength.strength >= 75 ? 'text-emerald-500' : passwordStrength.strength >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300 ease-out`}
                                            style={{ width: `${passwordStrength.strength}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={passwordData.confirm}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
                                placeholder="Confirm new password"
                            />
                            {passwordData.confirm && passwordData.new !== passwordData.confirm && (
                                <p className="text-xs text-rose-500 flex items-center gap-1 font-bold">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    setIsPasswordModalOpen(false);
                                    setPasswordData({ current: '', new: '', confirm: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={passwordData.new !== passwordData.confirm || passwordData.new.length < 6}
                            >
                                Update Password
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RouteGuard>
    );
};

export default ProfilePage;
