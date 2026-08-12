import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface AddLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => Promise<boolean>;
    companies: any[];
    applications: any[];
    employees: any[];
    initialLicense?: any;
}

export const AddLicenseModal: React.FC<AddLicenseModalProps> = ({ isOpen, onClose, onSuccess, companies, applications, employees, initialLicense }: AddLicenseModalProps) => {
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
        role: 'Member'
    });

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
                role: initialLicense.role || 'Member'
            });
        } else if (!isOpen) {
            setFormData({
                applicationId: '', companyId: '', licenseKey: '',
                assignedDate: '',
                remarks: '', assignedEmployeeId: '',
                totalSeats: '1',
                costPerSeat: '0', billingCycle: 'MONTHLY',
                role: 'Member'
            });
        }
    }, [isOpen, initialLicense]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const success = await onSuccess({
                ...formData,
                companyId: Number(formData.companyId),
                applicationId: Number(formData.applicationId),
                licenseKey: formData.licenseKey || null,
                assignedDate: formData.assignedDate || null,
                remarks: formData.remarks || null,
                assignedEmployeeId: formData.assignedEmployeeId ? Number(formData.assignedEmployeeId) : null,
                totalSeats: Number(formData.totalSeats) || 1,
                costPerSeat: Number(formData.costPerSeat),
                billingCycle: formData.billingCycle,
                role: formData.role
            });

            if (success) {
                setFormData({
                    applicationId: '', companyId: '', licenseKey: '',
                    assignedDate: '',
                    remarks: '', assignedEmployeeId: '',
                    totalSeats: '1',
                    costPerSeat: '0', billingCycle: 'MONTHLY',
                    role: 'Member'
                });
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
            title={initialLicense ? "Update Software License" : "Add Software License"}
            size="2xl"
            footer={
                <div className="flex gap-2 w-full justify-end">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                        {initialLicense ? 'Update License' : 'Save License'}
                    </Button>
                </div>
            }
        >
            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Company"
                        value={formData.companyId}
                        onChange={e => setFormData({ ...formData, companyId: e.target.value, assignedEmployeeId: '' })}
                        required
                        options={[
                            { label: 'Select Company', value: '' },
                            ...companies.map(c => ({ label: c.companyName, value: c.id }))
                        ]}
                    />

                    <div className="space-y-1">
                        <Select
                            label="Software Product"
                            value={formData.applicationId}
                            onChange={e => {
                                const appId = e.target.value;
                                const selectedApp = applications.find(a => Number(a.id) === Number(appId));
                                const appPrice = selectedApp?.price ? selectedApp.price.toString() : '0';
                                setFormData({
                                    ...formData,
                                    applicationId: appId,
                                    costPerSeat: appPrice !== '0' ? appPrice : (formData.costPerSeat === '0' ? '0' : formData.costPerSeat)
                                });
                            }}
                            required
                            options={[
                                { label: 'Select Software Product', value: '' },
                                ...applications.map(app => ({ label: app.name, value: app.id }))
                            ]}
                        />
                        {(() => {
                            const selectedApp = applications.find(a => Number(a.id) === Number(formData.applicationId));
                            if (!selectedApp) return null;
                            const total = Number(selectedApp.totalQuantity || 0);
                            const used = Number(selectedApp.usedCount ?? selectedApp.usedQuantity ?? 0);
                            const available = Math.max(0, total - used);
                            if (total <= 0) return null;

                            return (
                                <div className="text-[10px] font-bold px-1">
                                    {used >= total ? (
                                        <span className="text-rose-600 dark:text-rose-400">
                                            ⚠️ Limit Reached: All {total} seat(s) assigned ({used}/{total})
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            ✓ {available} of {total} seat(s) available
                                        </span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <Select
                        label="Assign To Employee"
                        value={formData.assignedEmployeeId}
                        onChange={e => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
                        disabled={!formData.companyId}
                        options={[
                            { label: formData.companyId ? 'Select Employee' : 'Select a company first', value: '' },
                            ...employees
                                .filter(emp => !formData.companyId || Number(emp.companyId) === Number(formData.companyId))
                                .map(emp => ({ label: `${emp.firstName} ${emp.lastName}`, value: emp.id }))
                        ]}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="License / Product Key"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Billing Cycle"
                        value={formData.billingCycle}
                        onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                        options={[
                            { label: 'Monthly', value: 'MONTHLY' },
                            { label: 'Yearly', value: 'YEARLY' },
                            { label: 'One-time', value: 'ONE_TIME' }
                        ]}
                    />
                    <Input
                        label="Cost per Seat ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPerSeat}
                        onChange={e => setFormData({ ...formData, costPerSeat: e.target.value })}
                        disabled
                    />

                    <Input
                        label="Seats / Quantity"
                        type="number"
                        min="1"
                        value={formData.totalSeats}
                        onChange={e => setFormData({ ...formData, totalSeats: e.target.value })}
                        disabled
                    />

                    <Select
                        label="Role"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        options={[
                            { label: 'Owner', value: 'Owner' },
                            { label: 'Member', value: 'Member' },
                            { label: 'Others', value: 'Others' }
                        ]}
                    />
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                        Calculated Total Price:
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                        ${((Number(formData.costPerSeat) || 0) * (Number(formData.totalSeats) || 1)).toLocaleString()}
                    </span>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Notes / Remarks</label>
                    <textarea
                        placeholder="Add notes, serial numbers, or license keys here..."
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        value={formData.remarks}
                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    />
                </div>
            </form>
        </Modal>
    );
};
