'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { CreatePOModel, UpdatePOModel, POItemModel, Vendor, GetAllEmployeesRequestModel } from '@bosvault/shared-models';
import { vendorService, procurementService, employeeService, companyService, assetTypeService } from '@/lib/api/services';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';

interface OptionItem {
    id: number | string;
    name?: string;
    companyName?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    companyId?: number | string;
}

interface POFormState {
    vendorId: number;
    vendorName: string;
    currency: string;
    orderDate: string;
    expectedDeliveryDate: string;
    notes: string;
    approverIds: number[];
    companyId: number;
    items: {
        itemName: string;
        quantity: number | string;
        unitPrice: number | string;
        assetTypeId?: number | string;
        assetTypeName?: string;
    }[];
}

interface CreatePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialPO?: Record<string, unknown>;
}

export function CreatePOModal({ isOpen, onClose, onSuccess, initialPO }: CreatePOModalProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [approvers, setApprovers] = useState<OptionItem[]>([]);
    const [companies, setCompanies] = useState<OptionItem[]>([]);
    const [assetTypes, setAssetTypes] = useState<OptionItem[]>([]);
    const defaultForm: POFormState = { vendorId: 0, vendorName: '', currency: 'USD', orderDate: new Date().toISOString().split('T')[0], expectedDeliveryDate: '', notes: '', approverIds: [], companyId: user?.companyId || 0, items: [{ itemName: '', quantity: '', unitPrice: '', assetTypeId: undefined, assetTypeName: '' }] };
    const [formData, setFormData] = useState<POFormState>(defaultForm);

    useEffect(() => {
        if (isOpen) {
            fetchMasters();
            if (initialPO) {
                setFormData({
                    vendorId: (initialPO.vendorId as number) || 0,
                    orderDate: initialPO.orderDate ? new Date(initialPO.orderDate as string).toISOString().split('T')[0] : '',
                    expectedDeliveryDate: initialPO.expectedDeliveryDate ? new Date(initialPO.expectedDeliveryDate as string).toISOString().split('T')[0] : '',
                    notes: (initialPO.notes as string) || '',
                    approverIds: (initialPO.approverIds as number[]) || [],
                    companyId: (initialPO.companyId as number) || user?.companyId || 0,
                    currency: (initialPO.currency as string) || 'USD',
                    vendorName: (initialPO.vendorName as string) || '',
                    items: Array.isArray(initialPO.items) && initialPO.items.length > 0 ? (initialPO.items as Record<string, unknown>[]).map((i) => ({ ...i, itemName: String(i.itemName || ''), quantity: Number(i.quantity || 0), unitPrice: Number(i.unitPrice || 0), assetTypeName: String(i.assetTypeName || '') })) : [{ itemName: '', quantity: '', unitPrice: '', assetTypeId: undefined, assetTypeName: '' }]
                });
            } else {
                setFormData(defaultForm);
            }
        }
    }, [isOpen, initialPO]);

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!isOpen) return;
            try {
                const eRes = await employeeService.getAllEmployees(new GetAllEmployeesRequestModel(0));
                const employeeList = eRes?.data || (eRes as unknown as { employees: OptionItem[] })?.employees || (Array.isArray(eRes) ? eRes : []);
                setApprovers(employeeList);
            } catch (err) {
                console.error('Failed to fetch employees', err);
            }
        };
        fetchEmployees();
    }, [isOpen]);

    const fetchMasters = async () => {
        if (!user?.companyId) return;
        try {
            const [vRes, cRes, atRes] = await Promise.all([
                vendorService.getAllVendors(),
                companyService.getAllCompaniesDropdown(),
                assetTypeService.getAllAssetTypesDropdown()
            ]);
            setVendors(vRes.vendors || []);
            setCompanies((cRes as { data?: OptionItem[]; companies?: OptionItem[] })?.data || (cRes as { data?: OptionItem[]; companies?: OptionItem[] })?.companies || []);
            setAssetTypes((atRes as { data?: OptionItem[]; assetTypes?: OptionItem[] })?.data || (atRes as { data?: OptionItem[]; assetTypes?: OptionItem[] })?.assetTypes || []);
        } catch (err) {
            AlertMessages.getErrorMessage('Error fetching masters');
        }
    };

    const addItem = () => {
        setFormData({ ...formData, items: [...formData.items, { itemName: '', quantity: '', unitPrice: '', assetTypeId: undefined, assetTypeName: '' }] });
    };

    const removeItem = (index: number) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i: number) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index: number, field: keyof POItemModel, value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum: number, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.vendorId === 0 && !formData.vendorName) {
            AlertMessages.getErrorMessage("Please select a vendor or specify other");
            return;
        }

        if (formData.items.some((i) => !i.itemName || Number(i.quantity) <= 0)) {
            AlertMessages.getErrorMessage("Please fill in all item details correctly");
            return;
        }

        setIsSubmitting(true);
        try {
            const items = formData.items.map((i) => new POItemModel(
                i.itemName,
                Number(i.quantity || 0),
                Number(i.unitPrice || 0),
                i.assetTypeId ? Number(i.assetTypeId) : undefined,
                i.assetTypeName as string
            ));

            const orderDate = new Date(formData.orderDate);
            const expectedDeliveryDate = formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : undefined;

            let res;
            if (initialPO) {
                const model = new UpdatePOModel(Number(initialPO.id), user?.fullName || 'User', user?.id || 0, '', formData.companyId, formData.vendorId, orderDate, items, expectedDeliveryDate, formData.notes, undefined, formData.approverIds?.length ? formData.approverIds : undefined, initialPO.invoiceUrl as string, formData.currency, formData.vendorName);
                res = await procurementService.updatePurchaseOrder(model);
            } else {
                const model = new CreatePOModel(user?.fullName || 'User', user?.id || 0, '', formData.companyId, formData.vendorId, orderDate, items, expectedDeliveryDate, formData.notes, undefined, formData.approverIds?.length ? formData.approverIds : undefined, undefined, formData.currency, formData.vendorName);
                res = await procurementService.createPurchaseOrder(model);
            }

            if (res.status) {
                AlertMessages.getSuccessMessage(`Purchase Order ${initialPO ? 'updated' : 'created'} successfully`);
                onSuccess();
                onClose();
                // Reset form
                setFormData(defaultForm);
            } else {
                AlertMessages.getErrorMessage(res.message);
            }
        } catch (err) {
            AlertMessages.getErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialPO ? `Update Purchase Order: ${initialPO.poNumber}` : "Create New Purchase Order"}
            size="4xl"
            footer={
                <div className="flex gap-2 w-full">
                    <div className="flex-1 flex items-center px-4">
                        <span className="text-sm font-bold text-slate-500 mr-2">Total Amount:</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white dark:text-slate-300">
                            {formData.currency === 'INR' ? '₹' : '$'}
                            {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                        {initialPO ? 'Update PO' : 'Create PO & Submit'}
                    </Button>
                </div>
            }
        >
            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Select
                        label="Company"
                        value={formData.companyId ?? 0}
                        onChange={(e) => {
                            const newCompanyId = Number(e.target.value);
                            setFormData({
                                ...formData,
                                companyId: newCompanyId,
                                approverIds: [] // Reset selected approvers when company changes
                            });
                        }}
                        required
                        options={[
                            { label: 'Select Company', value: 0 },
                            ...companies.map(c => ({ label: c.name, value: Number(c.id) }))
                        ]}
                    />

                    <div className="space-y-2">
                        <Select
                            label="Vendor"
                            value={formData.vendorId ?? 0}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormData({ ...formData, vendorId: val, vendorName: val !== -1 ? '' : formData.vendorName });
                            }}
                            required
                            options={[
                                { label: 'Select Vendor', value: 0 },
                                ...vendors.map(v => ({ label: v.name, value: v.id })),
                                { label: 'Other (Online/Manual)', value: -1 }
                            ]}
                        />
                        {formData.vendorId === -1 && (
                            <Input
                                placeholder="Enter Vendor Name / Website"
                                value={formData.vendorName}
                                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                            />
                        )}
                    </div>

                    <Input
                        label="Order Date"
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Expected Delivery Date"
                        type="date"
                        value={formData.expectedDeliveryDate}
                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    />

                    <MultiSelect
                        label="Approvers"
                        value={(formData.approverIds || []).map(String)}
                        onChange={(val: string[]) => setFormData({ ...formData, approverIds: val.map(Number) })}
                        options={[
                            ...(() => {
                                const selectedCompanyId = Number(formData.companyId);
                                // Filter by selected company
                                const companyApprovers = selectedCompanyId > 0
                                    ? approvers.filter(a => Number(a.companyId) === selectedCompanyId)
                                    : [];

                                const seenIds = new Set<number>();
                                const seenEmails = new Set<string>();
                                const filtered = companyApprovers.filter(a => {
                                    if (!a.id) return false;
                                    const uid = Number(a.id);
                                    if (seenIds.has(uid)) return false;
                                    seenIds.add(uid);

                                    const email = (a.email || '').toLowerCase().trim();
                                    if (email) {
                                        if (seenEmails.has(email)) return false;
                                        seenEmails.add(email);
                                    }
                                    return true;
                                });

                                return filtered.map(a => {
                                    const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email;
                                    const isDuplicateName = filtered.filter(other => 
                                        (`${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email) === name
                                    ).length > 1;
                                    const label = isDuplicateName && a.email ? `${name} (${a.email})` : name;
                                    return { label, value: String(a.id) };
                                });
                            })()
                        ]}
                    />

                    <Select
                        label="Currency"
                        value={formData.currency ?? 'USD'}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        required
                        options={[
                            { label: 'USD ($)', value: 'USD' },
                            { label: 'INR (₹)', value: 'INR' }
                        ]}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <ShoppingCart size={16} className="text-slate-900 dark:text-white" />
                            Order Items
                        </h4>
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 py-0 px-3 font-bold text-xs uppercase tracking-widest">
                            <Plus size={14} className="mr-1" /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {formData.items.map((item, index: number) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-3 items-end group">
                                <div className="col-span-12 md:col-span-4">
                                    <Input
                                        label="Item Name"
                                        value={item.itemName}
                                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                                        className="bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="space-y-1">
                                        <Select
                                            label="Asset Type"
                                            value={item.assetTypeId ?? 0}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                updateItem(index, 'assetTypeId', val);
                                                if (val !== -1) updateItem(index, 'assetTypeName', '');
                                            }}
                                            options={[
                                                { label: 'Select Type', value: 0 },
                                                ...assetTypes.map(at => ({ label: at.name, value: Number(at.id) })),
                                                { label: 'Other', value: -1 }
                                            ]}
                                        />
                                        {item.assetTypeId === -1 && (
                                            <Input
                                                placeholder="Specify Type"
                                                value={item.assetTypeName}
                                                onChange={(e) => updateItem(index, 'assetTypeName', e.target.value)}
                                                className="h-8 py-1 text-xs"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <Input
                                        label="Qty"
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        className="bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <Input
                                        label="Price"
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                        className="bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1 pb-1 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
