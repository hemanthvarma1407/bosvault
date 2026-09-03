import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, CheckSquare, Users, Check, AlertCircle } from 'lucide-react';

interface AddLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => Promise<boolean>;
    companies: any[];
    applications: any[];
    employees: any[];
    initialLicense?: any;
}

export const AddLicenseModal: React.FC<AddLicenseModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    companies,
    applications,
    employees,
    initialLicense
}: AddLicenseModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        applicationId: '',
        companyId: '',
        licenseKey: '',
        assignedDate: '',
        remarks: '',
        assignedEmployeeId: '',
        totalSeats: '1',
        costPerSeat: '0',
        billingCycle: 'MONTHLY',
        role: 'Member',
        subscriptionPlan: 'Standard',
        isPaid: true
    });

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');

    useEffect(() => {
        if (isOpen && initialLicense) {
            setFormData({
                applicationId: initialLicense.applicationId?.toString() || '',
                companyId: initialLicense.companyId?.toString() || '',
                licenseKey: initialLicense.licenseKey || '',
                assignedDate: initialLicense.assignedDate ? new Date(initialLicense.assignedDate).toISOString().split('T')[0] : '',
                remarks: initialLicense.remarks || '',
                assignedEmployeeId: initialLicense.assignedEmployeeId?.toString() || '',
                totalSeats: initialLicense.totalSeats?.toString() || initialLicense.seats?.toString() || '1',
                costPerSeat: initialLicense.costPerSeat?.toString() || '0',
                billingCycle: initialLicense.billingCycle || 'MONTHLY',
                role: initialLicense.role || 'Member',
                subscriptionPlan: initialLicense.subscriptionPlan || 'Standard',
                isPaid: initialLicense.isPaid !== undefined ? Boolean(initialLicense.isPaid) : true
            });
            if (initialLicense.assignedEmployeeId) {
                setSelectedEmployeeIds([Number(initialLicense.assignedEmployeeId)]);
            } else {
                setSelectedEmployeeIds([]);
            }
        } else if (!isOpen) {
            setFormData({
                applicationId: '',
                companyId: '',
                licenseKey: '',
                assignedDate: '',
                remarks: '',
                assignedEmployeeId: '',
                totalSeats: '1',
                costPerSeat: '0',
                billingCycle: 'MONTHLY',
                role: 'Member',
                subscriptionPlan: 'Standard',
                isPaid: true
            });
            setSelectedEmployeeIds([]);
            setEmployeeSearch('');
        }
    }, [isOpen, initialLicense]);

    const selectedApp = useMemo(() => {
        return applications.find(a => Number(a.id) === Number(formData.applicationId));
    }, [applications, formData.applicationId]);

    const totalAppSeats = Number(selectedApp?.totalQuantity || 0);
    const usedAppSeats = Number(selectedApp?.usedCount ?? selectedApp?.usedQuantity ?? 0);
    const availableAppSeats = totalAppSeats > 0 ? Math.max(0, totalAppSeats - usedAppSeats) : 999999;

    // Filter employees by search term
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
            const email = (emp.email || '').toLowerCase();
            const dept = (emp.departmentName || '').toLowerCase();
            const query = employeeSearch.toLowerCase();
            return !query || fullName.includes(query) || email.includes(query) || dept.includes(query);
        });
    }, [employees, employeeSearch]);

    const isExceedingCapacity = selectedEmployeeIds.length > availableAppSeats && totalAppSeats > 0 && !initialLicense;

    const handleToggleEmployee = (id: number) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredEmployees.map(e => Number(e.id));
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedEmployeeIds.includes(id));
        if (allSelected) {
            setSelectedEmployeeIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isExceedingCapacity) return;

        setIsSubmitting(true);
        try {
            let resolvedCompanyId = Number(formData.companyId || 0);
            if (!resolvedCompanyId && selectedEmployeeIds.length > 0) {
                const firstEmp = employees.find(e => Number(e.id) === selectedEmployeeIds[0]);
                if (firstEmp?.companyId) {
                    resolvedCompanyId = Number(firstEmp.companyId);
                }
            }
            if (!resolvedCompanyId && initialLicense?.companyId) {
                resolvedCompanyId = Number(initialLicense.companyId);
            }

            const success = await onSuccess({
                ...formData,
                companyId: resolvedCompanyId,
                applicationId: Number(formData.applicationId),
                licenseKey: formData.licenseKey || null,
                assignedDate: formData.assignedDate || null,
                remarks: formData.remarks || null,
                assignedEmployeeId: selectedEmployeeIds.length === 1 ? selectedEmployeeIds[0] : (selectedEmployeeIds.length === 0 ? null : selectedEmployeeIds[0]),
                assignedEmployeeIds: selectedEmployeeIds,
                totalSeats: selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : (Number(formData.totalSeats) || 1),
                costPerSeat: Number(formData.costPerSeat),
                billingCycle: formData.billingCycle,
                role: formData.role,
                subscriptionPlan: formData.subscriptionPlan,
                isPaid: formData.isPaid
            });

            if (success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialLicense ? "Update Tool Assignment" : "Assign Tool / Software Subscription"}
            size="2xl"
            footer={
                <div className="flex gap-2 w-full justify-between items-center">
                    <div className="text-xs font-semibold text-slate-500">
                        {selectedEmployeeIds.length} user(s) selected
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            disabled={isExceedingCapacity || !formData.applicationId}
                        >
                            {initialLicense ? 'Update Assignment' : `Assign to ${selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : 1} User(s)`}
                        </Button>
                    </div>
                </div>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Row 1: Software Product */}
                <div>
                    <div className="space-y-1">
                        <Select
                            label="Tool / Software Product"
                            value={formData.applicationId}
                            onChange={e => {
                                const appId = e.target.value;
                                const selected = applications.find(a => Number(a.id) === Number(appId));
                                const appPrice = selected?.price ? selected.price.toString() : '0';
                                setFormData({
                                    ...formData,
                                    applicationId: appId,
                                    costPerSeat: appPrice !== '0' ? appPrice : (formData.costPerSeat === '0' ? '0' : formData.costPerSeat),
                                    subscriptionPlan: selected?.subscriptionPlan || formData.subscriptionPlan,
                                    billingCycle: selected?.billingCycle || formData.billingCycle
                                });
                            }}
                            required
                            options={[
                                { label: 'Select Tool / Application', value: '' },
                                ...applications.map(app => ({ label: `${app.name} (${app.subscriptionPlan || 'Standard'})`, value: app.id }))
                            ]}
                        />
                        {selectedApp && totalAppSeats > 0 && (
                            <div className="text-[11px] font-bold px-1">
                                {availableAppSeats <= 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" /> Limit Reached: All {totalAppSeats} seat(s) assigned ({usedAppSeats}/{totalAppSeats})
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Check className="h-3.5 w-3.5" /> {availableAppSeats} of {totalAppSeats} seat(s) available
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Multi-Select Checkbox License Assignment (Requirement 8) */}
                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Assign Users ({selectedEmployeeIds.length} selected)
                            </label>
                        </div>
                        {filteredEmployees.length > 0 && (
                            <button
                                type="button"
                                onClick={handleSelectAllFiltered}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                <CheckSquare className="h-3.5 w-3.5" />
                                {filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmployeeIds.includes(Number(e.id))) ? 'Deselect All' : 'Select All Filtered'}
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or department..."
                            value={employeeSearch}
                            onChange={e => setEmployeeSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {filteredEmployees.length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center">No matching employees found</p>
                        ) : (
                            filteredEmployees.map(emp => {
                                const isSelected = selectedEmployeeIds.includes(Number(emp.id));
                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleToggleEmployee(Number(emp.id))}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                                            }`}>
                                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                            </div>
                                            <div className="truncate">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                                    {emp.firstName} {emp.lastName}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate">
                                                    {emp.email}
                                                </div>
                                            </div>
                                        </div>
                                        {emp.departmentName && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-2 whitespace-nowrap">
                                                {emp.departmentName}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {isExceedingCapacity && (
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            Cannot assign {selectedEmployeeIds.length} users. Only {availableAppSeats} seat(s) available in this tool.
                        </div>
                    )}
                </div>

                {/* Row 3: Product Key & Allocation Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="License / Product Key (Optional)"
                        placeholder="XXXXX-XXXXX-XXXXX"
                        value={formData.licenseKey}
                        onChange={e => setFormData({ ...formData, licenseKey: e.target.value })}
                    />
                    <Input
                        label="Allocation Date"
                        type="date"
                        value={formData.assignedDate}
                        onChange={e => setFormData({ ...formData, assignedDate: e.target.value })}
                    />
                </div>

                {/* Row 4: Billing Cycle, Role, Cost */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Billing Cycle"
                        value={formData.billingCycle}
                        onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                        options={[
                            { label: 'Monthly', value: 'MONTHLY' },
                            { label: 'Yearly / Annual', value: 'YEARLY' },
                            { label: 'One-Time / Perpetual', value: 'ONE_TIME' },
                            { label: 'Free', value: 'FREE' }
                        ]}
                    />

                    <Select
                        label="Role / Permission"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        options={[
                            { label: 'Member', value: 'Member' },
                            { label: 'Admin / Owner', value: 'Owner' },
                            { label: 'Viewer / Guest', value: 'Viewer' },
                            { label: 'Other', value: 'Other' }
                        ]}
                    />

                    <Input
                        label="Cost per Seat ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPerSeat}
                        onChange={e => setFormData({ ...formData, costPerSeat: e.target.value })}
                    />
                </div>

                {/* Calculated Total Price */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                        Calculated Total {formData.billingCycle === 'YEARLY' ? 'Annual' : 'Monthly'} Cost:
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                        ${((Number(formData.costPerSeat) || 0) * (selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : 1)).toLocaleString()}
                    </span>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
                    <textarea
                        placeholder="Add onboarding notes, workspace details, or subscription notes..."
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        value={formData.remarks}
                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    />
                </div>
            </form>
        </Modal>
    );
};
