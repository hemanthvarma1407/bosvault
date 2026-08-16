'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService, employeeService } from '@/lib/api/services';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { 
    UserRoleEnum, 
    GetAllEmployeesRequestModel, 
    TicketStatusEnum, 
    TicketPriorityEnum 
} from '@bosvault/shared-models';
import {
    UserCircle, Clock, AlertCircle, CheckCircle, Star, 
    Search, ShieldAlert, Award, FileText
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6B7280']; // Open, In Progress, Resolved, Closed

export default function UserInsightsPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);

    // Is the current user allowed to switch context to other employees?
    const canSwitchUser = useMemo(() => {
        if (!user?.role) return false;
        return [
            UserRoleEnum.ADMIN, 
            UserRoleEnum.SUPER_ADMIN, 
            UserRoleEnum.MANAGER, 
            UserRoleEnum.SUPPORT_ADMIN, 
            UserRoleEnum.SITE_ADMIN
        ].includes(user.role as UserRoleEnum);
    }, [user?.role]);

    // Load employees list if permitted
    useEffect(() => {
        const fetchEmployees = async () => {
            if (!canSwitchUser || !user?.companyId) return;
            setIsEmployeesLoading(true);
            try {
                const req = new GetAllEmployeesRequestModel(user.companyId);
                const response = await employeeService.getAllEmployees(req);
                if (response && response.status !== false) {
                    const rawList = response.data || response;
                    const listArray = Array.isArray(rawList) ? rawList : [];
                    const sortedList = [...listArray].sort((a: any, b: any) => 
                        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                    );
                    setEmployees(sortedList);
                }
            } catch (err) {
                console.error('Failed to fetch employees list for analytics:', err);
            } finally {
                setIsEmployeesLoading(false);
            }
        };
        fetchEmployees();
    }, [canSwitchUser, user?.companyId]);

    // Set initial selected email on mount
    useEffect(() => {
        if (user?.email) {
            setSelectedEmail(user.email);
        }
    }, [user?.email]);

    // Fetch tickets whenever selected email changes
    const fetchUserTickets = useCallback(async () => {
        if (!selectedEmail) return;
        setIsLoading(true);
        try {
            const response = await ticketService.getUserTickets({ email: selectedEmail });
            if (response && response.status !== false) {
                setTickets(response.tickets || []);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error('Failed to fetch user-specific tickets:', err);
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedEmail]);

    useEffect(() => {
        fetchUserTickets();
    }, [fetchUserTickets]);

    // Filter employees for searchable dropdown
    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return employees;
        const q = searchQuery.toLowerCase();
        return employees.filter(emp => 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
            emp.email.toLowerCase().includes(q)
        );
    }, [employees, searchQuery]);

    // Find full metadata for selected employee
    const selectedEmployeeMeta = useMemo(() => {
        if (!selectedEmail) return null;
        const matched = employees.find(emp => emp.email === selectedEmail);
        if (matched) return matched;
        
        // Fallback for self context
        return {
            firstName: user?.fullName?.split(' ')[0] || 'My',
            lastName: user?.fullName?.split(' ')[1] || 'Workspace',
            email: selectedEmail,
            departmentName: 'General Workspace'
        };
    }, [selectedEmail, employees, user]);

    // Compute stats from tickets
    const stats = useMemo(() => {
        const total = tickets.length;
        const open = tickets.filter(t => t.ticketStatus === TicketStatusEnum.OPEN).length;
        const inProgress = tickets.filter(t => t.ticketStatus === TicketStatusEnum.IN_PROGRESS).length;
        const resolved = tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED).length;
        const closed = tickets.filter(t => t.ticketStatus === TicketStatusEnum.CLOSED).length;

        // Pending = Open + In Progress
        const pending = open + inProgress;
        
        // CSAT calculation
        const rated = tickets.filter(t => t.userRating && t.userRating > 0);
        const avgCSAT = rated.length > 0
            ? Number((rated.reduce((acc, t) => acc + t.userRating, 0) / rated.length).toFixed(1))
            : 0.0;

        // Resolution Time Speed (Avg days)
        const resolvedOrClosed = tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED || t.ticketStatus === TicketStatusEnum.CLOSED);
        const resolvedWithDates = resolvedOrClosed.filter(t => t.createdAt && t.resolvedAt);
        const avgDaysToResolve = resolvedWithDates.length > 0
            ? Number((resolvedWithDates.reduce((acc, t) => {
                const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
                return acc + (diffMs / (1000 * 60 * 60 * 24));
              }, 0) / resolvedWithDates.length).toFixed(1))
            : 0;

        // Categories Map
        const categoryMap: Record<string, number> = {};
        tickets.forEach(t => {
            const cat = t.categoryEnum || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const categoryData = Object.entries(categoryMap).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
            count
        })).sort((a, b) => b.count - a.count);

        // Priority Map
        const priorityMap: Record<string, number> = {};
        tickets.forEach(t => {
            const prio = t.priorityEnum || 'Medium';
            priorityMap[prio] = (priorityMap[prio] || 0) + 1;
        });
        const priorityData = Object.entries(priorityMap).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
            count
        }));

        // Status Pie Data
        const statusData = [
            { name: 'Open', value: open },
            { name: 'In Progress', value: inProgress },
            { name: 'Resolved', value: resolved },
            { name: 'Closed', value: closed }
        ].filter(item => item.value > 0);

        return {
            total,
            pending,
            avgCSAT,
            avgDaysToResolve,
            categoryData,
            priorityData,
            statusData
        };
    }, [tickets]);

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER, UserRoleEnum.VIEWER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                
                {/* Header */}
                <PageHeader
                    icon={<UserCircle />}
                    title={canSwitchUser ? "User-Wise Insights" : "My Helpdesk Space"}
                    description={canSwitchUser ? "Select any employee to view their ticket history, issues density, and satisfaction log." : "Personal statistics and history of all support tickets you have created."}
                    gradient="from-slate-900 to-cyan-500"
                />

                {/* Dropdown Selector for Admin/Manager */}
                {canSwitchUser && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-slate-900 dark:text-white" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Search & Select Employee</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    placeholder="Filter by name or email..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <select
                                value={selectedEmail}
                                onChange={(e) => setSelectedEmail(e.target.value)}
                                className="sm:w-80 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isEmployeesLoading}
                            >
                                <option value="">Select Employee...</option>
                                {filteredEmployees.map((emp) => (
                                    <option key={emp.id} value={emp.email}>
                                        {emp.firstName} {emp.lastName} ({emp.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Profile Footprint Card */}
                {selectedEmployeeMeta && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
                                    {selectedEmployeeMeta.firstName?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">{selectedEmployeeMeta.firstName} {selectedEmployeeMeta.lastName}</h2>
                                    <p className="text-xs text-blue-100 font-medium">{selectedEmployeeMeta.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 md:border-l border-white/25 md:pl-6 shrink-0">
                            <div>
                                <span className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wider block">Department</span>
                                <span className="text-sm font-extrabold bg-white/10 px-3 py-1 rounded-full">{selectedEmployeeMeta.departmentName || 'General Workspace'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wider block">Role Status</span>
                                <span className="text-sm font-extrabold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">Active</span>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-24 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
                        <p className="text-slate-400 text-sm font-semibold">Gathering user support logs...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center items-center">
                        <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">No Tickets Found</h3>
                        <p className="text-sm text-slate-400 max-w-sm mt-1">
                            This user has not raised any support tickets in the system yet.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* KPI Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Tickets Raised"
                                value={stats.total}
                                icon={FileText}
                                gradient="from-slate-900 to-slate-900"
                                iconBg="bg-slate-100 dark:bg-slate-800/60 dark:bg-blue-950/20"
                                iconColor="text-slate-900 dark:text-white dark:text-slate-300"
                                isLoading={false}
                            />
                            
                            <StatCard
                                title="Pending Resolution"
                                value={stats.pending}
                                icon={Clock}
                                gradient="from-amber-500 to-orange-600"
                                iconBg="bg-amber-50 dark:bg-amber-900/20"
                                iconColor="text-amber-600 dark:text-amber-400"
                                isLoading={false}
                            />

                            <StatCard
                                title="Satisfaction Rating"
                                value={stats.avgCSAT > 0 ? `${stats.avgCSAT} / 5.0` : 'N/A'}
                                icon={Award}
                                gradient="from-yellow-500 to-amber-600"
                                iconBg="bg-yellow-50 dark:bg-yellow-950/20"
                                iconColor="text-yellow-600 dark:text-yellow-450"
                                isLoading={false}
                                subText={
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                                key={star} 
                                                className={`h-2.5 w-2.5 ${star <= Math.round(stats.avgCSAT) 
                                                    ? 'text-yellow-500 fill-yellow-500' 
                                                    : 'text-slate-200 dark:text-slate-700'}`} 
                                            />
                                        ))}
                                    </div>
                                }
                            />

                            <StatCard
                                title="Avg Resolution Speed"
                                value={stats.avgDaysToResolve > 0 ? `${stats.avgDaysToResolve} Days` : 'N/A'}
                                icon={CheckCircle}
                                gradient="from-emerald-500 to-teal-600"
                                iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                                iconColor="text-emerald-600 dark:text-emerald-400"
                                isLoading={false}
                            />
                        </div>

                        {/* Visual Charts Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Ticket Status Pie */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-slate-900 dark:text-white" />
                                    Support Status Breakdown
                                </h3>
                                <div className="h-52 relative flex items-center justify-center">
                                    <ResponsiveContainer minWidth={0} width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {stats.statusData.map((entry, index) => (
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
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
                                        <span className="text-xl font-black text-slate-800 dark:text-white">{stats.total}</span>
                                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                                        <span>Open: {tickets.filter(t => t.ticketStatus === TicketStatusEnum.OPEN).length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        <span>In Progress: {tickets.filter(t => t.ticketStatus === TicketStatusEnum.IN_PROGRESS).length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span>Resolved: {tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED).length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                                        <span>Closed: {tickets.filter(t => t.ticketStatus === TicketStatusEnum.CLOSED).length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Category Distribution */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-slate-900 dark:text-white" />
                                    Ticket Density by Category
                                </h3>
                                <div className="h-64 flex-1">
                                    <ResponsiveContainer minWidth={0} width="100%" height="100%">
                                        <BarChart data={stats.categoryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.15} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '11px'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={25} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Priority Distribution */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                                    Tickets by Priority Level
                                </h3>
                                <div className="h-64 flex-1">
                                    <ResponsiveContainer minWidth={0} width="100%" height="100%">
                                        <BarChart data={stats.priorityData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.15} />
                                            <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} width={60} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '11px'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Tickets List Details Grid */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
                                <h3 className="text-base font-black text-slate-800 dark:text-white">
                                    Complete Support Logs
                                </h3>
                                <span className="text-xs bg-slate-100 dark:bg-slate-800/60 dark:bg-blue-950 text-slate-900 dark:text-white dark:text-slate-300 font-extrabold px-3 py-1 rounded-full">
                                    {tickets.length} Registered Logs
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-850">
                                            <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 text-center">Ticket Code</th>
                                            <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 text-left">Subject</th>
                                            <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 text-center">Category</th>
                                            <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 text-center">Priority</th>
                                            <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 text-center">Status</th>
                                            <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 text-center">SLA Compliance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                        {tickets.map((t) => {
                                            // Calculate SLA on-the-fly
                                            let slaStatusText = "Met";
                                            let slaColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                                            if (t.slaDeadline) {
                                                const resTime = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date().getTime();
                                                if (resTime > new Date(t.slaDeadline).getTime()) {
                                                    slaStatusText = "Breached";
                                                    slaColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
                                                }
                                            } else {
                                                slaStatusText = "N/A";
                                                slaColor = "bg-slate-100 dark:bg-slate-800 text-slate-500";
                                            }

                                            // Status and Priority Badges
                                            const statusClass = 
                                                t.ticketStatus === TicketStatusEnum.OPEN ? 'bg-slate-900/10 text-slate-900 dark:text-white dark:text-slate-300' :
                                                t.ticketStatus === TicketStatusEnum.IN_PROGRESS ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                t.ticketStatus === TicketStatusEnum.RESOLVED ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                'bg-gray-500/10 text-gray-600 dark:text-gray-400';

                                            const priorityClass = 
                                                t.priorityEnum === TicketPriorityEnum.HIGH ? 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 bg-rose-500/5' :
                                                t.priorityEnum === TicketPriorityEnum.MEDIUM ? 'text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 bg-amber-500/5' :
                                                'text-slate-900 dark:text-white dark:text-slate-300 border border-blue-200 dark:border-blue-900/30 bg-slate-900/5';

                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                                                    <td className="py-4 px-6 text-center font-mono text-xs font-black text-slate-800 dark:text-slate-300">
                                                        {t.ticketCode}
                                                    </td>
                                                    <td className="py-4 px-6 text-left max-w-xs truncate font-bold text-slate-800 dark:text-slate-200">
                                                        {t.subject}
                                                    </td>
                                                    <td className="py-4 px-6 text-center text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                                        {t.categoryEnum}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${priorityClass}`}>
                                                            {t.priorityEnum}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${statusClass}`}>
                                                            {t.ticketStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${slaColor}`}>
                                                            {slaStatusText}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </RouteGuard>
    );
}
