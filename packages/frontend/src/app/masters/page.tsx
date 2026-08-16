'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { Building2, Users, Package, Smartphone, AppWindow, Store, Search, FileText, Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum } from '@bosvault/shared-models';

const CompaniesMasterView = dynamic(() => import('./components/companies-master-view').then(mod => mod.CompaniesMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Companies...</p> });
const DepartmentsMasterView = dynamic(() => import('./components/departments-master-view').then(mod => mod.DepartmentsMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Departments...</p> });
const AssetTypesMasterView = dynamic(() => import('./components/asset-types-master-view').then(mod => mod.AssetTypesMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Asset Types...</p> });
const DeviceConfigsMasterView = dynamic(() => import('./components/device-configs-master-view').then(mod => mod.DeviceConfigsMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading device Configurations...</p> });
const LicensesMasterView = dynamic(() => import('./components/licenses-master-view').then(mod => mod.LicensesMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Licenses...</p> });

const VendorsMasterView = dynamic(() => import('./components/vendors-master-view').then(mod => mod.VendorsMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Vendors...</p> });
const RemoteMasterView = dynamic(() => import('./components/remote-master-view').then(mod => mod.RemoteMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Remote Tools...</p> });
const DocumentsMasterView = dynamic(() => import('./components/documents-master-view').then(mod => mod.DocumentsMasterView), { loading: () => <p className="animate-pulse p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Documents...</p> });


interface MasterItem {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    component?: any;
    href?: string;
}

const MastersPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedMaster = searchParams.get('view');


    const masters: MasterItem[] = [
        {
            id: 'companies',
            title: 'Companies',
            description: 'Manage organization and company details',
            icon: Building2,
            color: 'from-slate-900 to-slate-900',
            component: CompaniesMasterView
        },
        {
            id: 'departments',
            title: 'Departments',
            description: 'Manage departments and organizational structure',
            icon: Users,
            color: 'from-purple-500 to-slate-900',
            component: DepartmentsMasterView
        },
        {
            id: 'asset-types',
            title: 'Asset Types',
            description: 'Define and manage asset categories',
            icon: Package,
            color: 'from-emerald-500 to-teal-600',
            component: AssetTypesMasterView
        },
        {
            id: 'device-configs',
            title: 'Device Configurations',
            description: 'Manage device models, RAM, storage and specifications',
            icon: Smartphone,
            color: 'from-amber-500 to-orange-600',
            component: DeviceConfigsMasterView
        },
        {
            id: 'applications',
            title: 'Licenses',
            description: 'Manage software licenses and subscriptions',
            icon: AppWindow,
            color: 'from-cyan-500 to-slate-900',
            component: LicensesMasterView
        },
        {
            id: 'remote-tools',
            title: 'Remote Tools',
            description: 'Manage remote access tools and credentials',
            icon: Smartphone,
            color: 'from-teal-500 to-emerald-600',
            component: RemoteMasterView
        },

        {
            id: 'vendors',
            title: 'Vendors',
            description: 'Manage suppliers and vendor information',
            icon: Store,
            color: 'from-slate-900 to-violet-700',
            component: VendorsMasterView
        },
        {
            id: 'document-hub',
            title: 'Document Vault',
            description: 'Manage organizational documents and templates',
            icon: FileText,
            color: 'from-slate-900 to-slate-900',
            component: DocumentsMasterView
        },
    ];

    const selectedMasterData = masters.find(m => m.id === selectedMaster);
    const [searchQuery, setSearchQuery] = useState('');


    const filteredMasters = masters.filter(master =>
        master.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        master.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectMaster = (master: any) => {
        if (master.href) {
            router.push(master.href);
        } else {
            router.push(`/masters?view=${master.id}`);
        }
    };

    const handleBack = () => {
        router.push('/masters');
    };

    if (selectedMaster && selectedMasterData && selectedMasterData.component) {
        const MasterComponent = selectedMasterData.component;
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50">
                <div className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MasterComponent onBack={handleBack} />
                </div>
            </div>
        );
    }

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN]}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 p-4 lg:p-8 space-y-8 overflow-y-auto">
                <PageHeader
                    title="System Masters"
                    description="Manage master data and system configuration"
                    icon={<Settings2 />}
                    gradient="from-slate-700 to-slate-900"
                >
                    <div className="flex items-center gap-3 ml-auto">
                        <div className="relative max-w-xs group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-900 dark:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search masters..."
                                className="pl-9 pr-3 py-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all shadow-sm h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </PageHeader>

                {/* Master Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-12">
                    {filteredMasters.length === 0 ? (
                        <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center gap-4">
                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-full shadow-lg">
                                <Search className="h-10 w-10 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white">No masters found</p>
                                <p className="text-xs text-slate-500 font-medium">No master nodes matching your query were detected.</p>
                            </div>
                        </div>
                    ) : (
                        filteredMasters
                            .map((master) => {
                                const Icon = master.icon;
                                return (
                                    <button
                                        key={master.id}
                                        onClick={() => handleSelectMaster(master)}
                                        className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-700 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-left relative overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="absolute bottom-2 right-2 opacity-[0.04] group-hover:opacity-[0.1] transition-all duration-300 pointer-events-none z-0 border border-transparent">
                                            <Icon className="h-10 w-10 text-slate-900 dark:text-white" />
                                        </div>

                                        <div className="flex items-center gap-3 mb-2.5 relative z-10">
                                            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${master.color} text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:text-white dark:group-hover:text-slate-300 transition-colors truncate">
                                                    {master.title}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex-1 mb-1">
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                {master.description}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-2 flex items-center justify-start relative z-10">
                                            <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-900 dark:text-white uppercase tracking-wider transition-colors">
                                                Access &rarr;
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                    )}
                </div>
            </div>
        </RouteGuard>
    );
};

export default MastersPage;