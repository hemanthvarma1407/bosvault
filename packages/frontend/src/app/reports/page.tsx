'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, Users, Package, TrendingUp, BarChart3, FileSpreadsheet, Clock, AlertCircle, ArrowLeft, Search } from 'lucide-react';
import { reportsService } from '@/lib/api/services';
import { useToast } from '@/contexts/ToastContext';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum } from '@bosvault/shared-models';
import { PageHeader } from '@/components/ui/PageHeader';

interface ReportItem {
    name: string;
    description: string;
    icon: any;
    stats: string;
}

interface ReportCategory {
    id: string;
    title: string;
    description: string;
    icon: any;
    reports: ReportItem[];
}

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const toast = useToast();

    const reportCategories: ReportCategory[] = [
        {
            id: 'assets',
            title: 'Asset Reports',
            description: 'Comprehensive asset inventory and allocation analytics',
            icon: Package,
            reports: [
                { name: 'Asset Inventory Report', description: 'Complete inventory of all assets with device details and assignment status', icon: BarChart3, stats: 'Full Audit' },
                { name: 'Asset Allocation Report', description: 'Assets currently assigned to employees with department information', icon: Users, stats: 'Assigned' },
                { name: 'Asset Warranty Expiry Report', description: 'Assets with warranty information and days until expiry', icon: Clock, stats: 'Active' },
                { name: 'Asset by Department Report', description: 'Asset distribution and count by department', icon: TrendingUp, stats: 'Distribution' },
                { name: 'Asset by Device Type Report', description: 'Assets grouped by device type, brand, and model with assignment statistics', icon: Package, stats: 'Categories' },
                { name: 'Unassigned Assets Report', description: 'Available assets not currently assigned to any employee', icon: AlertCircle, stats: 'Available' },
            ]
        },
        {
            id: 'employees',
            title: 'Employee Reports',
            description: 'Workforce directory and departmental analytics',
            icon: Users,
            reports: [
                { name: 'Employee Directory', description: 'Complete employee list with contact information and department details', icon: Users, stats: 'Directory' },
                { name: 'Employees by Department Report', description: 'Employee count and listing grouped by department', icon: TrendingUp, stats: 'Distribution' },
            ]
        },
        {
            id: 'licenses',
            title: 'License Reports',
            description: 'Software license allocation and expiry tracking',
            icon: FileText,
            reports: [
                { name: 'License Assignment Report', description: 'Complete list of software licenses assigned to employees with expiry tracking', icon: BarChart3, stats: 'Assignments' },
            ]
        }
    ];

    const generateReport = async () => {
        if (!selectedReport) return;
        setIsLoading(true);
        try {
            // Backend expects: /reports/generate?type=ReportName&format=detailed&startDate=...&endDate=...
            const response = await reportsService.generateReport(selectedReport, {
                format: 'detailed',
                startDate,
                endDate
            });
            setReportData(response);
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate report');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedReport) {
            generateReport();
        }
    }, [selectedReport]);

    const downloadFullReport = async (format: 'excel' | 'pdf') => {
        if (!selectedReport) return;
        setIsExporting(true);
        try {
            // Backend expects: /reports/generate?type=ReportName&format=excel|pdf
            // Backend returns file buffer with proper headers
            const response = await reportsService.generateReport(selectedReport, { format });

            // Response is already a Blob from the backend
            const mimeType = format === 'excel'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/pdf';
            const extension = format === 'excel' ? 'xlsx' : 'pdf';

            const blob = response instanceof Blob ? response : new Blob([response], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Report exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    const allReports: ReportItem[] = reportCategories.flatMap(c => c.reports);
    const activeCategory = activeTab === 'all'
        ? { id: 'all', title: 'All Reports', description: 'Comprehensive overview of all available operational reports across all categories', icon: FileText, reports: allReports }
        : reportCategories.find(c => c.id === activeTab);

    const activeCategoryReports = activeCategory?.reports.filter(report =>
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SUPER_ADMIN]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950/50 space-y-8">
                {selectedReport ? (
                    // Detailed Report View
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <h1 className="text-[14px] font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">{selectedReport}</h1>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                                    {reportCategories.find(c => c.reports.some(r => r.name === selectedReport))?.reports.find(r => r.name === selectedReport)?.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setSelectedReport(null); setReportData(null); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all bg-white dark:bg-slate-900 shadow-sm"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back To Reports
                                </button>

                                <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 focus:outline-none uppercase"
                                    />
                                    <span className="text-slate-300 text-[10px] font-bold">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 focus:outline-none uppercase"
                                    />
                                    <button
                                        onClick={generateReport}
                                        disabled={isLoading}
                                        className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                        title="Apply Filter"
                                    >
                                        <Search className={`h-3 w-3 ${isLoading ? 'animate-spin text-indigo-500' : 'text-indigo-600'}`} />
                                    </button>
                                </div>

                                <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadFullReport('excel')}
                                        disabled={!reportData || isExporting}
                                        leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
                                        className="h-8 px-3 text-[9px] font-black uppercase tracking-widest shadow-sm border"
                                    >
                                        XLSX
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Content Processing Area */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden min-h-[300px]">
                            {!reportData ? (
                                <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center space-y-3">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center">
                                        <FileText className={`h-5 w-5 ${isLoading ? 'animate-pulse text-indigo-400' : 'text-slate-300'}`} />
                                    </div>
                                    <div className="max-w-xs space-y-1">
                                        <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                            {isLoading ? 'Synthesizing Data...' : 'Protocol Staged'}
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-[9px] leading-relaxed">
                                            {isLoading ? 'Analyzing environmental data strings for real-time intelligence.' : 'Operational intelligence ready for generation.'}
                                        </p>
                                    </div>
                                    {!isLoading && (
                                        <Button
                                            variant="primary"
                                            onClick={generateReport}
                                            isLoading={isLoading}
                                            className="h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                        >
                                            Force Generation
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="p-0">
                                    {Array.isArray(reportData) && reportData.length > 0 ? (
                                        <div className="p-4">
                                            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-white/[0.01]">
                                                <div className="overflow-x-auto custom-scrollbar">
                                                    <table className="w-full text-center border-collapse min-w-full">
                                                        <thead className="bg-slate-100/50 dark:bg-white/[0.03]">
                                                            <tr>
                                                                {Object.keys(reportData[0]).map((header, hIdx) => (
                                                                    <th
                                                                        key={header}
                                                                        className={`px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-200 dark:border-white/10 ${hIdx === Object.keys(reportData[0]).length - 1 ? 'border-r-0' : ''}`}
                                                                    >
                                                                        {header.replace(/_/g, ' ')}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reportData.slice(0, 500).map((row: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group border-b border-slate-200 dark:border-white/[0.02] last:border-0">
                                                                    {Object.values(row).map((cell: any, cellIdx: number) => (
                                                                        <td
                                                                            key={cellIdx}
                                                                            className={`px-6 py-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 min-w-[150px] max-w-[400px] break-words group-hover:text-indigo-600 transition-colors leading-normal uppercase border-r border-slate-200 dark:border-white/5 ${cellIdx === Object.values(row).length - 1 ? 'border-r-0' : ''}`}
                                                                        >
                                                                            {cell === null || cell === undefined ? <span className="opacity-20">---</span> : String(cell)}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 space-y-4">
                                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-full">
                                                <Search className="h-10 w-10 opacity-20" />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-xs">No Data Strings Detected</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Reports Hub List View
                    <div className="space-y-6">
                        <PageHeader
                            title="Reports"
                            description="Real-time operational reporting and data synthesis"
                            icon={<BarChart3 />}
                            gradient="from-indigo-600 via-indigo-700 to-violet-800"
                        >
                            <div className="relative max-w-xs ml-auto group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Report Matrix..."
                                    className="pl-10 pr-4 h-9 w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </PageHeader>

                        {/* Hub Navigation and Content */}
                        <div className="space-y-8 pt-4">
                            {/* Unified Tab Navigation */}
                            <div className="flex gap-3 border-b border-slate-200 dark:border-white/10 pb-1 flex-wrap">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-tight transition-all border-b-2 ${activeTab === 'all'
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-500'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border-transparent'
                                        }`}
                                >
                                    <FileText className="h-4 w-4" />
                                    All Reports
                                </button>
                                {reportCategories.map((category) => {
                                    const CategoryIcon = category.icon;
                                    const isActive = activeTab === category.id;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveTab(category.id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-tight transition-all border-b-2 ${isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-500'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border-transparent'
                                                }`}
                                        >
                                            <CategoryIcon className="h-4 w-4" />
                                            {category.title}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Category Context & Grid */}
                            {activeCategory && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                        {activeCategoryReports.length > 0 ? (
                                            activeCategoryReports.map((report, idx) => {
                                                const ReportIcon = report.icon;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedReport(report.name)}
                                                        className="group p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-left relative overflow-hidden"
                                                    >
                                                        <div className="flex items-center justify-between mb-2.5 relative z-10">
                                                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-sm">
                                                                <ReportIcon className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
                                                                {report.stats}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white mb-1 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight relative z-10">
                                                            {report.name}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight line-clamp-2 relative z-10">
                                                            {report.description}
                                                        </p>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center gap-4">
                                                <div className="p-6 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                                                    <Search className="h-10 w-10 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white">Empty Signal Matrix</p>
                                                    <p className="text-xs text-slate-500 font-medium">No intelligence matches your search parameters.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RouteGuard >
    );
}

export default ReportsPage;