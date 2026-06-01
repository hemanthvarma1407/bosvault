'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService, companyService } from '@/lib/api/services';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Select';
import { UserRoleEnum, GetTicketStatisticsRequestModel } from '@bosvault/shared-models';
import {
    BarChart3, Clock, AlertTriangle, Star, 
    ThumbsUp, Award, TrendingUp, ShieldCheck, Users, RefreshCcw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
    ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

const EmptyStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    byPriority: {
        high: 0,
        medium: 0,
        low: 0,
    },
    byCategory: {
        hardware: 0,
        software: 0,
        network: 0,
        email: 0,
        access: 0,
        other: 0,
    },
    slaStats: {
        complianceRate: 100,
        met: 0,
        breached: 0,
        openOverdue: 0
    },
    csatStats: {
        average: 0,
        distribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        },
        totalRated: 0
    },
    resolutionStats: {
        averageTimeHours: 0
    },
    monthlyTrends: [],
    adminPerformance: []
};

export default function TicketInsightsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(EmptyStats);
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

    const fetchAnalytics = useCallback(async (companyId?: number) => {
        const targetId = companyId || selectedCompanyId || user?.companyId;
        if (!targetId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const req = new GetTicketStatisticsRequestModel(targetId);
            const response = await ticketService.getStatistics(req);
            
            if (response && response.status !== false) {
                const fetchedData = response.data || response;
                setStats(fetchedData || EmptyStats);
            } else {
                setStats(EmptyStats);
            }
        } catch (error) {
            console.error('Failed to fetch ticket analytics:', error);
            setStats(EmptyStats);
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId, selectedCompanyId]);

    useEffect(() => {
        const init = async () => {
            try {
                const response = await companyService.getAllCompaniesDropdown();
                if (response && response.status && response.data) {
                    setCompanies(response.data);
                    const initialId = user?.companyId ? Number(user.companyId) : (response.data.length > 0 ? Number(response.data[0].id) : null);
                    if (initialId) {
                        setSelectedCompanyId(initialId);
                        
                        // Fetch real statistics
                        const req = new GetTicketStatisticsRequestModel(initialId);
                        const statsRes = await ticketService.getStatistics(req);
                        if (statsRes && statsRes.status !== false) {
                            setStats(statsRes.data || statsRes);
                        } else {
                            setStats(EmptyStats);
                        }
                    } else {
                        setStats(EmptyStats);
                    }
                } else {
                    setStats(EmptyStats);
                }
            } catch (error) {
                console.error('Initialization of insights failed:', error);
                setStats(EmptyStats);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [user?.companyId]);

    if (isLoading) {
        return (
            <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN]}>
                <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8 flex flex-col justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold">Generating Helpdesk Insights...</p>
                </div>
            </RouteGuard>
        );
    }

    const currentStats = stats || EmptyStats;

    // Prepare SLA Pie Data
    const slaData = [
        { name: 'SLA Met', value: currentStats.slaStats?.met || 0 },
        { name: 'SLA Breached', value: currentStats.slaStats?.breached || 0 },
        { name: 'Open & Overdue', value: currentStats.slaStats?.openOverdue || 0 }
    ].filter(item => item.value > 0);

    if (slaData.length === 0) {
        slaData.push({ name: 'No SLA Tickets', value: 0 });
    }

    // Prepare CSAT Bar Data
    const csatDistributionData = Object.entries(currentStats.csatStats?.distribution || {}).map(([rating, count]) => ({
        rating: `${rating} Star${Number(rating) > 1 ? 's' : ''}`,
        count: count as number,
    })).reverse();

    // Prepare Category Bar Data
    const categoryData = Object.entries(currentStats.byCategory || {}).map(([category, count]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: count as number,
    })).sort((a, b) => b.count - a.count);

    // SLA Rating Level Text & Accent
    const complianceRate = currentStats.slaStats?.complianceRate ?? 100;
    let complianceRatingText = "Outstanding";
    let complianceColor = "text-emerald-500 dark:text-emerald-400";
    if (complianceRate < 80) {
        complianceRatingText = "Needs Attention";
        complianceColor = "text-rose-500 dark:text-rose-400";
    } else if (complianceRate < 95) {
        complianceRatingText = "Healthy";
        complianceColor = "text-amber-500 dark:text-amber-400";
    }

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                
                {/* Page Header */}
                <PageHeader
                    icon={<BarChart3 />}
                    title="Helpdesk Analytics"
                    description="Real-time insights on SLA compliance, CSAT scores, and technical team performance."
                    gradient="from-indigo-600 to-violet-750"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        {companies.length > 0 && (
                            <div className="w-56">
                                <Select
                                    value={selectedCompanyId?.toString() || ''}
                                    onChange={(e) => {
                                        const newId = Number(e.target.value);
                                        setSelectedCompanyId(newId);
                                        fetchAnalytics(newId);
                                    }}
                                    options={companies.map((c) => ({
                                        value: c.id.toString(),
                                        label: c.name
                                    }))}
                                    className="h-9 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        )}
                        <button
                            onClick={() => fetchAnalytics()}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            title="Refresh Data"
                        >
                            <RefreshCcw className="h-4 w-4 text-slate-500" />
                        </button>
                    </div>
                </PageHeader>

                {/* Top Metrics Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Tickets Handled"
                        value={currentStats.total || 0}
                        icon={Users}
                        gradient="from-indigo-500 to-purple-600"
                        iconBg="bg-indigo-50 dark:bg-indigo-950/20"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        isLoading={false}
                    />
                    
                    <StatCard
                        title="SLA Compliance Rate"
                        value={`${complianceRate}%`}
                        icon={Award}
                        gradient="from-emerald-500 to-teal-600"
                        iconBg="bg-emerald-50 dark:bg-emerald-950/20"
                        iconColor="text-emerald-600 dark:text-emerald-450"
                        isLoading={false}
                        subText={
                            <div className="flex items-center gap-1 mt-0.5 text-[8px] font-bold text-slate-500">
                                <ShieldCheck className="h-3 w-3 text-indigo-500" />
                                <span>Status: <strong className={complianceColor}>{complianceRatingText}</strong></span>
                            </div>
                        }
                    />
 
                    <StatCard
                        title="Avg Resolution Time"
                        value={currentStats.resolutionStats?.averageTimeHours ? `${currentStats.resolutionStats.averageTimeHours} hrs` : '0 hrs'}
                        icon={Clock}
                        gradient="from-amber-500 to-orange-600"
                        iconBg="bg-amber-50 dark:bg-amber-900/20"
                        iconColor="text-amber-600 dark:text-amber-400"
                        isLoading={false}
                    />

                    <StatCard
                        title="Customer Satisfaction"
                        value={currentStats.csatStats?.average ? `${currentStats.csatStats.average} / 5.0` : '0.0 / 5.0'}
                        icon={ThumbsUp}
                        gradient="from-yellow-500 to-amber-600"
                        iconBg="bg-yellow-50 dark:bg-yellow-950/20"
                        iconColor="text-yellow-600 dark:text-yellow-400"
                        isLoading={false}
                        subText={
                            <div className="flex items-center gap-0.5 mt-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                        key={star} 
                                        className={`h-2.5 w-2.5 ${star <= Math.round(currentStats.csatStats?.average || 0) 
                                            ? 'text-yellow-500 fill-yellow-500' 
                                            : 'text-slate-200 dark:text-slate-700'}`} 
                                    />
                                ))}
                                <span className="text-[8px] text-slate-400 font-bold ml-1">({currentStats.csatStats?.totalRated || 0} rated)</span>
                            </div>
                        }
                    />
                </div>

                {/* First Row Charts: SLA and CSAT Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* SLA Pie Chart */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            SLA Compliance Status
                        </h3>
                        <div className="h-64 relative flex items-center justify-center">
                            {currentStats.total === 0 ? (
                                <div className="text-slate-400 text-xs font-bold text-center">No SLA tickets created yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={slaData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {slaData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36} 
                                            iconType="circle"
                                            formatter={(value) => <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                            
                            {/* Inner SLA Summary Text */}
                            {currentStats.total > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pb-8">
                                    <span className="text-2xl font-black text-slate-800 dark:text-white">{complianceRate}%</span>
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Compliant</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CSAT Distribution Chart */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            CSAT Rating Breakdown
                        </h3>
                        <div className="h-64 flex flex-col justify-center items-center">
                            {currentStats.csatStats?.totalRated === 0 ? (
                                <div className="text-slate-400 text-xs font-bold text-center">
                                    No customer ratings collected yet.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={csatDistributionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.15} />
                                        <XAxis dataKey="rating" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(234, 179, 8, 0.05)' }}
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={35} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Second Row Charts: Ticket Trends (Created vs Resolved) & Category Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Line Chart: Trends */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Ticket Volume Trends (Last 6 Months)
                        </h3>
                        <div className="h-64 flex flex-col justify-center items-center">
                            {(!currentStats.monthlyTrends || currentStats.monthlyTrends.length === 0) ? (
                                <div className="text-slate-400 text-xs font-bold text-center">No volume logs recorded yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={currentStats.monthlyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.15} />
                                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend formatter={(value) => <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{value.toUpperCase()}</span>} />
                                        <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Raised" />
                                        <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Resolved" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Bar Chart: Categories */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-500" />
                            Tickets by Category
                        </h3>
                        <div className="h-64 flex flex-col justify-center items-center">
                            {currentStats.total === 0 ? (
                                <div className="text-slate-400 text-xs font-bold text-center">No category classifications yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.15} />
                                        <XAxis type="number" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                                        <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} width={80} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Third Row: Technician Performance Leaderboard */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Award className="h-5 w-5 text-indigo-500" />
                            IT Support Technicians Performance
                        </h3>
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-850">
                            Leaderboard
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-850">
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Rank</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-400 text-left">Technician Name</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Assigned</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Resolved</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Resolution Rate</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Average rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                {(!currentStats.adminPerformance || currentStats.adminPerformance.length === 0) ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-slate-400 font-bold text-xs text-center">
                                            No technician assignments or performance logs recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    currentStats.adminPerformance.map((perf: any, index: number) => {
                                        const resRate = perf.assigned > 0 ? Math.round((perf.resolved / perf.assigned) * 100) : 0;
                                        
                                        return (
                                            <tr key={perf.adminId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                                <td className="py-4 px-6 text-center font-mono text-sm font-black text-slate-600 dark:text-slate-400">
                                                    {index === 0 ? '🏆 1' : index + 1}
                                                </td>
                                                <td className="py-4 px-6 text-left">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                                                            {perf.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800 dark:text-white">{perf.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {perf.assigned}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    {perf.resolved}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden shrink-0">
                                                            <div 
                                                                className="bg-emerald-500 h-full rounded-full" 
                                                                style={{ width: `${resRate}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-extrabold text-slate-500">{resRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                                                        <Star className="h-4 w-4 fill-yellow-500 shrink-0" />
                                                        <span className="text-sm font-black">{perf.avgRating > 0 ? perf.avgRating : 'N/A'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </RouteGuard>
    );
}
