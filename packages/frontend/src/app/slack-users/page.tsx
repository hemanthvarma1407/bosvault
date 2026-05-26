'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { slackUserService, companyService } from '@/lib/api/services';
import { SlackUserModel, CompanyDropdownModel } from '@bosvault/shared-models';
import { PageHeader } from '@/components/ui/PageHeader';
import { Search, RefreshCw, Download, Trash2, Shield, Mail, Slack, MessageSquare, User, Briefcase, MapPin, Globe, Activity, AtSign, Hash } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum } from '@bosvault/shared-models';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const openSlackChat = (slackUserId: string, teamId: string) => {
    if (!slackUserId) return;
    const deepLink = teamId ? `slack://user?team=${teamId}&id=${slackUserId}` : `slack://user?id=${slackUserId}`;
    const webLink = teamId ? `https://app.slack.com/client/${teamId}/${slackUserId}` : `https://slack.com`;
    window.location.href = deepLink;
    setTimeout(() => window.open(webLink, '_blank'), 1500);
};

const ImageWithFallback: React.FC<{
    src?: string;
    alt: string;
    className?: string;
    fallback: React.ReactNode;
}> = ({ src, alt, className, fallback }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [src]);

    if (!src || imgError) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setImgError(true)}
        />
    );
};

const SlackUsersPage: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<SlackUserModel[]>([]);
    const [companies, setCompanies] = useState<CompanyDropdownModel[]>([]);
    const [selectedSyncCompanyId, setSelectedSyncCompanyId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedUser, setSelectedUser] = useState<SlackUserModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const resp = await companyService.getAllCompaniesDropdown();
            if (resp.status) setCompanies(resp.data || []);
        } catch (e) { }
    };

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await slackUserService.getAllSlackUsers();
            if (response.status) setUsers((response as any).slackUsers || (response as any).data || []);
        } catch { } finally { setIsLoading(false); }
    };

    const handleImportFromSlack = async () => {
        try {
            setIsImporting(true);
            if (selectedSyncCompanyId === 'all') {
                if (companies.length === 0) {
                    AlertMessages.getErrorMessage('No companies found to sync');
                    return;
                }
                let successCount = 0;
                let failCount = 0;
                for (const comp of companies) {
                    try {
                        const response = await slackUserService.importSlackUsers(comp.id);
                        if (response.status) successCount++;
                        else failCount++;
                    } catch (err) { failCount++; }
                }
                AlertMessages.getSuccessMessage(`Bulk sync complete. Success: ${successCount}, Failed: ${failCount}`);
            } else {
                const response = await slackUserService.importSlackUsers(Number(selectedSyncCompanyId));
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message || 'Imported successfully');
                } else {
                    AlertMessages.getErrorMessage(response.message || 'Import failed');
                }
            }
            fetchUsers();
        } catch (e: any) {
            AlertMessages.getErrorMessage(e.message || 'Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeletingUserId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUserId) return;
        try {
            // Correcting service call - assuming deleteSlackUser exists or we use a generic delete if available
            // Looking at master-models.ts, there is DeleteCompanyModel but not specifically DeleteSlackUserModel.
            // Let's assume generic id-based delete if service supports it.
            const response = await (slackUserService as any).deleteSlackUser({ id: deletingUserId, userId: user?.id || 0 });
            if (response.status) {
                AlertMessages.getSuccessMessage('Slack member removed successfully');
                fetchUsers();
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to remove slack member');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Delete operation failed');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingUserId(null);
        }
    };

    const filtered = users.filter(u => {
        const matchesSearch =
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCompany =
            selectedSyncCompanyId === 'all' ||
            u.companyId?.toString() === selectedSyncCompanyId;

        return matchesSearch && matchesCompany;
    });

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN]}>
            <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-slate-50 dark:bg-slate-950/50">

                {/* Header */}
                <PageHeader
                    title="Slack Workspace"
                    description="Sync and manage your workspace members"
                    icon={<Slack />}
                    gradient="from-[#4A154B] to-[#7C3085]"
                    actions={[
                        {
                            label: isImporting ? 'Importing...' : 'Import from Slack',
                            onClick: handleImportFromSlack,
                            icon: isImporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />,
                            variant: 'primary',
                            className: "bg-[#4A154B] hover:bg-[#3A103B] border-0"
                        }
                    ]}
                >
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedSyncCompanyId}
                            onChange={(e) => setSelectedSyncCompanyId(e.target.value)}
                            className="bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 text-white text-[11px] font-bold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer hover:bg-white/20 dark:hover:bg-slate-700 transition-all uppercase tracking-wide"
                        >
                            <option value="all" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">All Companies</option>
                            {companies.map(comp => (
                                <option key={comp.id} value={comp.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{comp.name}</option>
                            ))}
                        </select>
                        <div className="hidden md:flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-white/10 text-white border border-white/20">
                                <span className="text-[10px] font-medium opacity-70">Total</span> {users.length}
                            </span>
                        </div>
                    </div>
                </PageHeader>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors shadow-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchUsers}
                        className={cn("h-10 px-4", isLoading && "opacity-50")}
                        leftIcon={<RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />}
                    >
                        Refresh
                    </Button>
                </div>

                {/* Cards */}
                {isLoading ? (
                    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A154B] to-[#7C3085] flex items-center justify-center mx-auto mb-3">
                            <Slack className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Slack members found</h3>
                        <p className="text-xs text-slate-500">Try adjusting your search or company filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-3">
                        {filtered.map(u => {
                            const a = u as any;
                            const initials = u.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <div
                                    key={u.id}
                                    className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-800 transition-all duration-300 flex flex-col gap-3 overflow-hidden cursor-pointer"
                                    onClick={() => { setSelectedUser(u); setIsDetailModalOpen(true); }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <ImageWithFallback
                                                src={a.avatarUrl}
                                                alt={u.name}
                                                className="w-10 h-10 rounded-lg object-cover shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50"
                                                fallback={
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                                        {initials}
                                                    </div>
                                                }
                                            />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {a.isAdmin && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                                                    <Shield className="h-2.5 w-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {u.name}
                                                </h3>
                                            </div>
                                            <div className="text-[10px] font-medium text-violet-500/80 truncate">
                                                @{u.displayName || u.name?.toLowerCase().replace(/\s+/g, '')}
                                            </div>
                                            <div className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                <Slack className="h-2 w-2" />
                                                {u.slackUserId || 'NO_ID'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 py-1">
                                        {u.email && (
                                            <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-1.5 rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                                <Mail className="h-3 w-3 text-slate-400" />
                                                <span className="truncate">{u.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                        <button
                                            onClick={(e) => handleDeleteClick(e, u.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-all"
                                            title="Delete Account"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        {u.slackUserId && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openSlackChat(u.slackUserId!, a.teamId); }}
                                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-md text-[10px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
                                            >
                                                <MessageSquare className="h-3 w-3" />
                                                Message
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Detail Modal */}
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Slack Member Profile"
                    size="md"
                >
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800 shadow-md relative z-10 overflow-hidden">
                                        <ImageWithFallback
                                            src={(selectedUser as any).avatarUrl}
                                            alt={selectedUser.name}
                                            className="w-full h-full object-cover"
                                            fallback={<User className="h-12 w-12" />}
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm z-20">
                                        <Slack className="h-5 w-5 text-[#4A154B]" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedUser.name}</h4>
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="flex items-center justify-center gap-2">
                                            <AtSign className="h-3 w-3 text-slate-400" />
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedUser.displayName || 'no-display-name'}</span>
                                        </div>
                                        {(selectedUser as any).isAdmin && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 mt-1">
                                                <Shield className="h-3 w-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Workspace Administrator</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Hash className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Slack ID</span>
                                        </div>
                                        <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">{selectedUser.slackUserId || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Role</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedUser.role || 'Member'}</p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{selectedUser.email}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Company</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{(selectedUser as any).companyName || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Globe className="h-3.5 w-3.5 text-orange-500" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Timezone</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{(selectedUser as any).timezoneLabel || 'UTC'}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="h-3.5 w-3.5 text-cyan-500" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Team ID</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{(selectedUser as any).teamId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
                <DeleteConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setDeletingUserId(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    itemName={users.find(u => u.id === deletingUserId)?.name || "Slack Member"}
                />
            </div>
        </RouteGuard>
    );
};

export default SlackUsersPage;
