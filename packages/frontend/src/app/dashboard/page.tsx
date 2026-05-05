'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { dashboardService, companyService } from '@/lib/api/services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Users, Package, Ticket, Lock, RefreshCcw, TrendingUp, Activity, PieChart as PieChartIcon, BarChart2, Mail, Clock, AlertTriangle, CheckCircle, ArrowUpRight, Zap, Key, LayoutGrid, Settings2 } from 'lucide-react';
import { DashboardCustomizer, WidgetConfig, WidgetSettings } from './components/DashboardCustomizer';
import { formatNumber } from '@/lib/utils';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { UserRoleEnum, TicketStatusEnum, TicketPriorityEnum, IdRequestModel } from '@bosvault/shared-models';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load chart components
const AssetDistributionChart = dynamic(() => import('./components/AssetDistributionChart').then(mod => mod.AssetDistributionChart), {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse bg-white/50 dark:bg-slate-800/50 rounded-lg"></div>
});
const TicketPriorityChart = dynamic(() => import('./components/TicketPriorityChart'), {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse bg-white/50 dark:bg-slate-800/50 rounded-lg"></div>
});
const EmployeeDeptChart = dynamic(() => import('./components/EmployeeDeptChart').then(mod => mod.EmployeeDeptChart), {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse bg-white/50 dark:bg-slate-800/50 rounded-lg"></div>
});

// Lazy load Enterprise Widgets
const ProcurementWidget = dynamic(() => import('./components/ProcurementWidget').then(mod => mod.ProcurementWidget), {
    ssr: false,
    loading: () => <div className="h-full animate-pulse bg-white/50 dark:bg-slate-800/50 rounded-lg p-4"></div>
});

export interface DashboardStats {
    assets: {
        total: number;
        byStatus: { status: string; count: string }[];
    };
    tickets: {
        total: number;
        byStatus: { status: string; count: string }[];
        byPriority: { priority: string; count: string }[];
        recent: any[];
    };
    employees: {
        total: number;
        byDepartment: { department: string; count: string }[];
    };
    licenses: {
        total: number;
        expiringSoon: {
            id: number;
            applicationName: string;
            expiryDate: Date | string;
            assignedTo: string;
        }[];
    };
}

const DashboardPage: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({});
    const hasFetched = useRef(false);

    // Widget Definitions
    const AVAILABLE_WIDGETS: WidgetConfig[] = [
        { id: 'kpi_it_assets', label: 'KPI: IT Assets', category: 'KPI', description: 'Total assets count' },
        { id: 'kpi_support_tickets', label: 'KPI: Support Tickets', category: 'KPI', description: 'Active tickets count' },
        { id: 'kpi_employees', label: 'KPI: Employees', category: 'KPI', description: 'Global registry count' },
        { id: 'kpi_licenses', label: 'KPI: Licenses', category: 'KPI', description: 'Software subscriptions count' },
        { id: 'support_criticality_matrix', label: 'Support Criticality', category: 'Analytics', description: 'Ticket priority distribution' },
        { id: 'procurement_pulse', label: 'Procurement Pulse', category: 'Operations', description: 'Real-time spend and orders' },
        { id: 'asset_lifecycle', label: 'Asset Lifecycle', category: 'Analytics', description: 'Asset status distribution' },
        { id: 'workforce_architecture', label: 'Workforce Depts', category: 'Analytics', description: 'Department distribution' },
        { id: 'quick_launch', label: 'Quick Launch', category: 'Operations', description: 'Common actions links' },
        { id: 'intelligence_pulse', label: 'Intelligence Pulse', category: 'Operations', description: 'Recent activity feed' }
    ];

    useEffect(() => {
        const saved = localStorage.getItem('dashboard_widget_settings');
        if (saved) {
            try {
                setWidgetSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse dashboard settings');
            }
        }
    }, []);

    const handleUpdateSettings = (newSettings: WidgetSettings) => {
        setWidgetSettings(newSettings);
        localStorage.setItem('dashboard_widget_settings', JSON.stringify(newSettings));
    };

    const handleResetSettings = () => {
        setWidgetSettings({});
        localStorage.removeItem('dashboard_widget_settings');
    };

    const fetchStats = async (companyId?: number) => {
        try {
            setIsLoading(true);
            const id = (companyId !== undefined) ? companyId : (selectedCompanyId !== null ? selectedCompanyId : user?.companyId);

            if (id === undefined || id === null) {
                AlertMessages.getErrorMessage('No company selected');
                return;
            }
            const req = new IdRequestModel(id);
            const response = await dashboardService.getDashboardStats(req);
            if (response && response.status && response.data) {
                setStats(response.data as any);
                setLastUpdated(new Date());
            } else {
                AlertMessages.getErrorMessage(response?.message || 'Failed to fetch dashboard data');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    // Consolidated initialization
    useEffect(() => {
        const initializeDashboard = async () => {
            if (!isAuthenticated) return;

            try {
                // 1. Load companies first
                const response = await companyService.getAllCompaniesDropdown();
                let companiesList: any[] = [];
                if (response && response.status && response.data) {
                    companiesList = response.data;
                    setCompanies(companiesList);
                }

                // 2. Resolve which company to select
                let targetCompanyId = null;
                if (companiesList.length > 0) {
                    targetCompanyId = Number(companiesList[0].id);
                } else if (user?.companyId) {
                    targetCompanyId = Number(user.companyId);
                }

                if (targetCompanyId !== null) {
                    setSelectedCompanyId(targetCompanyId);
                    // 3. Fetch stats for the resolved company
                    if (!hasFetched.current) {
                        hasFetched.current = true;
                        fetchStats(targetCompanyId);
                    }
                }
            } catch (error) {
                console.error('Dashboard initialization failed:', error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        if (isAuthenticated && isInitialLoading) {
            initializeDashboard();
        }
    }, [isAuthenticated, user, isInitialLoading]);

    const assetData = useMemo(() =>
        stats?.assets.byStatus.map(item => ({
            name: item.status,
            value: parseInt(item.count)
        })) || []
        , [stats?.assets.byStatus]);

    const ticketPriorityData = useMemo(() =>
        stats?.tickets.byPriority.map(item => ({
            name: item.priority,
            value: parseInt(item.count)
        })) || []
        , [stats?.tickets.byPriority]);

    const employeeDeptData = useMemo(() =>
        stats?.employees.byDepartment.map(item => ({
            name: item.department,
            value: parseInt(item.count)
        })) || []
        , [stats?.employees.byDepartment]);

    const kpiCards = useMemo(() => [
        {
            title: 'IT Assets',
            value: stats?.assets.total || 0,
            icon: Package,
            gradient: 'from-emerald-500 to-teal-600',
            link: '/assets',
            subtitle: 'Hardware Inventory'
        },
        {
            title: 'Support Tickets',
            value: stats?.tickets.total || 0,
            icon: Ticket,
            gradient: 'from-amber-500 to-orange-600',
            link: '/tickets',
            subtitle: 'Active Requests'
        },
        {
            title: 'Employees',
            value: stats?.employees.total || 0,
            icon: Users,
            gradient: 'from-violet-500 to-fuchsia-600',
            link: '/employees',
            subtitle: 'Global Registry'
        },
        {
            title: 'Licenses',
            value: stats?.licenses.total || 0,
            icon: Lock,
            gradient: 'from-blue-500 to-cyan-600',
            link: '/licenses',
            subtitle: 'Software Subscriptions'
        }
    ], [stats]);

    const quickActions = [
        { label: 'Assets', icon: Package, link: '/assets', color: 'emerald' },
        { label: 'Support Tickets', icon: Ticket, link: '/tickets', color: 'amber' },
        { label: 'Employees', icon: Users, link: '/employees', color: 'violet' },
        { label: 'Licenses', icon: Key, link: '/licenses', color: 'blue' },
        { label: 'Reports', icon: BarChart2, link: '/reports', color: 'rose' },
        { label: 'Emails', icon: Mail, link: '/emails', color: 'cyan' },
    ];

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 20 } as any
        }
    };

    if (!isAuthenticated || isInitialLoading) {
        return <LoadingScreen />;
    }

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-6"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-800">
                            <LayoutGrid className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-0.5">
                                Operational Dashboard
                            </h1>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Sync: {lastUpdated.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-48">
                            <Select
                                value={selectedCompanyId?.toString() || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const newCompanyId = parseInt(value);
                                    setSelectedCompanyId(newCompanyId);
                                    hasFetched.current = false;
                                    fetchStats(newCompanyId);
                                }}
                                options={companies.map((company) => ({
                                    value: company.id.toString(),
                                    label: company.name
                                }))}
                                className="h-8 text-[10px] font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => fetchStats()}
                            disabled={isLoading}
                            leftIcon={<RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />}
                            className="rounded-lg h-8 px-3 text-[10px] font-bold"
                        >
                            Sync Data
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsCustomizerOpen(true)}
                            leftIcon={<Settings2 className="h-3 w-3" />}
                            className="rounded-lg h-8 px-3 text-[10px] font-bold"
                        >
                            Customize
                        </Button>
                        <Link href="/reports">
                            <Button
                                variant="primary"
                                leftIcon={<BarChart2 className="h-3 w-3" />}
                                className="rounded-lg h-8 px-3 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/25"
                            >
                                Generate Report
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card, idx) => {
                        const widgetId = `kpi_${card.title.toLowerCase().replace(/\s+/g, '_')}`;
                        if (widgetSettings[widgetId]?.isVisible === false) return null;
                        return (
                            <motion.div key={idx} variants={itemVariants}>
                                <Link href={card.link}>
                                    <Card className="p-2.5 overflow-hidden relative group bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white dark:border-slate-800/50 hover:border-indigo-500/30 transition-all duration-500 shadow-lg shadow-slate-200/50 dark:shadow-none">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -skew-x-12 translate-x-full group-hover:-translate-x-full pointer-events-none" />

                                        <div className="relative z-10 flex items-start justify-between">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{card.title}</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                                        {isLoading ? '---' : formatNumber(card.value)}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 transition-all duration-300">
                                                    {card.subtitle} <ArrowUpRight className="h-2.5 w-2.5" />
                                                </p>
                                            </div>
                                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${card.gradient} shadow-lg shadow-indigo-500/20 rotate-6 group-hover:rotate-0 transition-all duration-500`}>
                                                <card.icon className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Analytics & Priority Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Ticket Priorities */}
                    {widgetSettings['support_criticality_matrix']?.isVisible !== false && (
                        <motion.div variants={itemVariants} className="lg:col-span-8">
                            <Card className="p-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white dark:border-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                                <h3 className="text-[11px] font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 shadow-inner border border-orange-500/10">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                    </div>
                                    Support Criticality Matrix
                                </h3>
                                <div className="flex-1 min-h-[300px]">
                                    <TicketPriorityChart data={ticketPriorityData} />
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Procurement Widget */}
                    {widgetSettings['procurement_pulse']?.isVisible !== false && (
                        <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
                            <ProcurementWidget stats={stats as any} />
                        </motion.div>
                    )}
                </div>

                {/* Distribution Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Asset Distribution */}
                    {widgetSettings['asset_lifecycle']?.isVisible !== false && (
                        <motion.div variants={itemVariants} className="lg:col-span-5">
                            <Card className="p-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white dark:border-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 shadow-inner border border-emerald-500/10">
                                            <PieChartIcon className="h-3.5 w-3.5" />
                                        </div>
                                        Asset Lifecycle Status
                                    </h3>
                                    <Link href="/assets">
                                        <Button variant="outline" className="rounded-lg px-2.5 h-6 text-[8px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800">
                                            Inventory <ArrowUpRight className="h-2.5 w-2.5 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                                {isLoading ? (
                                    <div className="flex-1 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                                ) : (
                                    <div className="flex-1 min-h-[220px]">
                                        <AssetDistributionChart data={assetData} />
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}

                    {/* Employee Distribution */}
                    {widgetSettings['workforce_architecture']?.isVisible !== false && (
                        <motion.div variants={itemVariants} className="lg:col-span-7">
                            <Card className="p-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white dark:border-slate-800/50 shadow-lg shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 shadow-inner border border-violet-500/10">
                                            <Activity className="h-3.5 w-3.5" />
                                        </div>
                                        Workforce Architecture
                                    </h3>
                                    <Link href="/employees">
                                        <Button variant="outline" className="rounded-lg px-2.5 h-6 text-[8px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800">
                                            Directory <ArrowUpRight className="h-2.5 w-2.5 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                                {isLoading ? (
                                    <div className="flex-1 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                                ) : (
                                    <div className="flex-1 min-h-[300px]">
                                        <EmployeeDeptChart data={employeeDeptData} />
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Bottom Section: Operations & Pulse */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Quick Access Grid */}
                    {widgetSettings['quick_launch']?.isVisible !== false && (
                        <motion.div variants={itemVariants} className="lg:col-span-3">
                            <Card className="p-4 bg-white dark:bg-slate-900 border-none shadow-lg shadow-slate-200/50 dark:shadow-none h-full">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    Quick Launch
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {quickActions.map((action, idx) => (
                                        <Link key={idx} href={action.link}>
                                            <button className={`w-full p-2.5 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-${action.color}-500/20 hover:shadow-lg hover:shadow-${action.color}-500/10 transition-all duration-300 group`}>
                                                <action.icon className={`h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-${action.color}-600 dark:group-hover:text-${action.color}-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform`} />
                                                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white">{action.label}</p>
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Support Pulse Table */}
                    {widgetSettings['intelligence_pulse']?.isVisible !== false && (
                        <motion.div variants={itemVariants} className={widgetSettings['quick_launch']?.isVisible === false ? "lg:col-span-12" : "lg:col-span-9"}>
                            <Card className="p-4 bg-white dark:bg-slate-900 border-none shadow-lg shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                                        Intelligence Pulse
                                    </h3>
                                    <Link href="/tickets">
                                        <Button variant="outline" className="rounded-lg px-3 h-7 text-[9px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800">
                                            Center <ArrowUpRight className="h-3 w-3 ml-1.5" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="overflow-x-auto truncate">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <th className="py-2.5 px-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">Subject</th>
                                                <th className="py-2.5 px-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">Status</th>
                                                <th className="py-2.5 px-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">Priority</th>
                                                <th className="py-2.5 px-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Source</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {isLoading ? (
                                                Array.from({ length: 4 }).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="p-2"><div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-40"></div></td>
                                                        <td className="p-2"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-16"></div></td>
                                                        <td className="p-2"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-16"></div></td>
                                                        <td className="p-2"><div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg ml-auto w-24"></div></td>
                                                    </tr>
                                                ))
                                            ) : (stats?.tickets.recent.length || 0) === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                                                                <CheckCircle className="h-6 w-6" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vector Clear</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                (stats?.tickets.recent || []).slice(0, 10).map((ticket: any) => (
                                                    <tr key={ticket.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="p-2">
                                                            <div className="max-w-[180px]">
                                                                <p className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-tight">{ticket.subject}</p>
                                                                <p className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-tighter">ID: {ticket.id.slice(0, 8)}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2">
                                                            <Badge
                                                                variant={ticket.ticketStatus === TicketStatusEnum.OPEN ? 'primary' : ticket.ticketStatus === TicketStatusEnum.CLOSED ? 'neutral' : 'success'}
                                                                className="text-[8px] px-2 py-0.5 font-black uppercase tracking-tighter rounded-md border-none"
                                                            >
                                                                {ticket.ticketStatus}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2">
                                                            <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${ticket.priorityEnum === TicketPriorityEnum.URGENT ? 'text-rose-700 bg-rose-50 dark:bg-rose-900/20' :
                                                                ticket.priorityEnum === TicketPriorityEnum.HIGH ? 'text-orange-700 bg-orange-50 dark:bg-orange-900/20' :
                                                                    'text-slate-600 bg-slate-100 dark:bg-slate-800/50'
                                                                }`}>
                                                                {ticket.priorityEnum}
                                                            </span>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[8px] font-black text-indigo-600 border border-indigo-500/5">
                                                                    {ticket.raisedByEmployee?.firstName?.[0] || '?'}{ticket.raisedByEmployee?.lastName?.[0] || '?'}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                                                                    {ticket.raisedByEmployee?.lastName || 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>

                <DashboardCustomizer
                    isOpen={isCustomizerOpen}
                    onClose={() => setIsCustomizerOpen(false)}
                    widgets={AVAILABLE_WIDGETS}
                    settings={widgetSettings}
                    onUpdateSettings={handleUpdateSettings}
                    onReset={handleResetSettings}
                />
            </motion.div>
        </RouteGuard>
    );
};

export default DashboardPage;