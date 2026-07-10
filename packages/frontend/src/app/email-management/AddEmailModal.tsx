'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmailTypeEnum, GetAllEmployeesRequestModel, EmailStatusEnum } from '@bosvault/shared-models';
import { employeeService, departmentService } from '@/lib/api/services';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';

interface AddEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => Promise<boolean>;
    companyId: number;
    initialTab?: 'COMPANY' | 'USER' | 'GROUP';
    editData?: any;
    companies?: any[];
    children?: React.ReactNode;
}

export const AddEmailModal: React.FC<AddEmailModalProps> = ({ isOpen, onClose, onSuccess, companyId, initialTab, editData, companies }: AddEmailModalProps) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    useEffect(() => {
        if (companyId > 0) {
            setSelectedCompanyId(String(companyId));
        } else if (editData?.companyId) {
            setSelectedCompanyId(String(editData.companyId));
        } else if (companies && companies.length > 0) {
            setSelectedCompanyId(String(companies[0].id));
        } else {
            setSelectedCompanyId('');
        }
    }, [companyId, editData, companies, isOpen]);

    const getDefaultType = useCallback(() => {
        if (initialTab === 'USER') return EmailTypeEnum.USER;
        if (initialTab === 'GROUP') return EmailTypeEnum.GROUP;
        return EmailTypeEnum.COMPANY;
    }, [initialTab]);

    const [formData, setFormData] = useState({
        email: '',
        emailType: getDefaultType(),
        department: '',
        employeeId: '',
        memberIds: [] as string[],
        name: '',
        billing: '',
        createdDate: '',
        description: '',
        status: EmailStatusEnum.ACTIVE
    });

    const fetchEmployees = useCallback(async () => {
        try {
            // Fetch all employees across all companies for assignment (companyId=0 means all)
            // Always exclude deactivated employees from assignment dropdowns
            const req = new GetAllEmployeesRequestModel(0, false);
            const response = await employeeService.getAllEmployees(req);
            if (response.status) {
                const data = response.data || [];
                setEmployees(data);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, [selectedCompanyId]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentService.getAllDepartments();
            if (response.status) {
                const depts = response.departments || [];
                setDepartments(depts);
                if (depts.length > 0) {
                    setFormData(prev => {
                        if (!prev.department) {
                            return { ...prev, department: depts[0].name };
                        }
                        return prev;
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
            fetchDepartments();
            if (editData) {
                setFormData({
                    email: editData.email || '',
                    emailType: editData.emailType || getDefaultType(),
                    department: editData.department || '',
                    employeeId: editData.employeeId ? String(editData.employeeId) : '',
                    memberIds: editData.memberIds || [],
                    name: editData.name || '',
                    billing: editData.billing ? String(editData.billing) : '',
                    createdDate: editData.createdDate ? new Date(editData.createdDate).toISOString().split('T')[0] : '',
                    description: editData.description || '',
                    status: editData.status || EmailStatusEnum.ACTIVE
                });
            } else {
                setFormData({
                    email: '',
                    emailType: getDefaultType(),
                    department: '',
                    employeeId: '',
                    memberIds: [],
                    name: '',
                    billing: '',
                    createdDate: '',
                    description: '',
                    status: EmailStatusEnum.ACTIVE
                });
            }
        }
    }, [isOpen, editData, fetchEmployees, fetchDepartments, getDefaultType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            id: editData?.id,
            companyId: Number(selectedCompanyId) || companyId,
            employeeId: formData.employeeId ? Number(formData.employeeId) : null,
            memberIds: formData.emailType === EmailTypeEnum.GROUP ? formData.memberIds : [],
            billing: formData.billing ? Number(formData.billing) : null,
            createdDate: formData.createdDate ? new Date(formData.createdDate) : null,
            name: formData.name || null, // Ensure name is null if empty
        };

        const success = await onSuccess(payload);
        if (success) {
            setFormData({
                email: '',
                emailType: EmailTypeEnum.USER,
                department: '',
                employeeId: '',
                memberIds: [],
                name: '',
                billing: '',
                createdDate: '',
                description: '',
                status: EmailStatusEnum.ACTIVE
            });
            onClose();
        }
    };

    const isGroup = formData.emailType === EmailTypeEnum.GROUP;
    const isCompany = formData.emailType === EmailTypeEnum.COMPANY;

    const targetCompanyId = Number(selectedCompanyId) || companyId;
    const companyEmployees = targetCompanyId > 0
        ? employees.filter(emp => Number(emp.companyId) === targetCompanyId)
        : employees;

    const seenIds = new Set<number>();
    const seenEmails = new Set<string>();
    const deduplicatedEmployees = companyEmployees.filter(emp => {
        if (!emp.id) return false;
        const uid = Number(emp.id);
        if (seenIds.has(uid)) return false;
        seenIds.add(uid);

        const email = (emp.email || '').toLowerCase().trim();
        if (email) {
            if (seenEmails.has(email)) return false;
            seenEmails.add(email);
        }
        return true;
    });

    const formattedEmployeeOptions = deduplicatedEmployees.map(emp => {
        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email;
        const isDuplicateName = deduplicatedEmployees.filter(other => 
            (`${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email) === name
        ).length > 1;
        const label = isDuplicateName && emp.email ? `${name} (${emp.email})` : name;
        return {
            id: emp.id,
            email: emp.email,
            firstName: emp.firstName,
            lastName: emp.lastName,
            empStatus: emp.empStatus,
            departmentName: emp.departmentName,
            label,
            value: String(emp.id)
        };
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? 'Edit Email Allocation' : 'Allocate Email Address'}
            size="4xl"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {companyId === 0 && (
                    <div className="grid grid-cols-1 gap-4">
                        <Select
                            label="Target Company"
                            value={selectedCompanyId}
                            onChange={e => {
                                const newCompanyId = e.target.value;
                                setSelectedCompanyId(newCompanyId);
                                setFormData(prev => ({
                                    ...prev,
                                    employeeId: '',
                                    memberIds: []
                                }));
                            }}
                            options={
                                (companies || []).map(c => ({
                                    value: String(c.id),
                                    label: (c.companyName || c.name || '').toUpperCase()
                                }))
                            }
                            required
                        />
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="font-bold"
                    />
                    <Select
                        label="Routing Type"
                        value={formData.emailType}
                        onChange={e => setFormData({ ...formData, emailType: e.target.value as EmailTypeEnum })}
                        options={[
                            { value: EmailTypeEnum.USER, label: 'USER' },
                            { value: EmailTypeEnum.GROUP, label: 'GROUP' },
                            { value: EmailTypeEnum.COMPANY, label: 'COMPANY' }
                        ]}
                        required
                    />
                    <Select
                        label="Status"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as EmailStatusEnum })}
                        options={[
                            { value: EmailStatusEnum.ACTIVE, label: 'ACTIVE' },
                            { value: EmailStatusEnum.INACTIVE, label: 'INACTIVE' },
                            { value: EmailStatusEnum.SUSPENDED, label: 'SUSPENDED' }
                        ]}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!isGroup && !isCompany ? (
                        <>
                            <Select
                                label="Department"
                                value={formData.department}
                                onChange={e => {
                                    const newDept = e.target.value;
                                    setFormData(prev => {
                                        const selectedEmp = employees.find(emp => String(emp.id) === prev.employeeId);
                                        const shouldClearEmployee = selectedEmp && selectedEmp.departmentName !== newDept;
                                        return {
                                            ...prev,
                                            department: newDept,
                                            employeeId: shouldClearEmployee ? '' : prev.employeeId
                                        };
                                    });
                                }}
                                options={[
                                    { value: '', label: 'Choose Department' },
                                    ...departments.map(dept => ({
                                        value: dept.name,
                                        label: dept.name.toUpperCase()
                                    }))
                                ]}
                                required
                            />
                            <Input
                                label="Description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="font-bold"
                            />
                        </>
                    ) : (
                        <>
                            <Input
                                label="Description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="font-bold"
                            />
                            <Input
                                label={isGroup ? 'Group Name (Optional)' : 'Name (Email Name)'}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="font-bold"
                            />
                        </>
                    )}
                </div>

                {(isCompany || isGroup) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Billing Amount ($)"
                            type="number"
                            step="0.01"
                            value={formData.billing}
                            onChange={e => setFormData({ ...formData, billing: e.target.value })}
                            className="font-bold"
                        />
                        <Input
                            label="Email Created Date"
                            type="date"
                            value={formData.createdDate}
                            onChange={e => setFormData({ ...formData, createdDate: e.target.value })}
                            className="font-bold"
                        />
                    </div>
                )}


                <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label={isGroup ? 'Owner / Primary Contact' : 'Employee Name'}
                            value={formData.employeeId}
                            onChange={e => {
                                const employeeId = e.target.value;
                                const selectedEmp = formattedEmployeeOptions.find(emp => String(emp.id) === employeeId);
                                setFormData(prev => ({
                                    ...prev,
                                    employeeId,
                                    department: selectedEmp?.departmentName || prev.department
                                }));
                            }}
                            options={[
                                { value: '', label: 'Unassigned' },
                                ...formattedEmployeeOptions
                                    .filter(emp => {
                                        // For COMPANY or GROUP types, dept field is hidden — show all employees
                                        if (isCompany || isGroup) return true;
                                        if (!formData.department) return true;
                                        // For USER type, filter by selected department if one is chosen
                                        return !emp.departmentName || emp.departmentName === formData.department;
                                    })
                                    .map(emp => ({
                                        value: emp.value,
                                        label: `${emp.label}${emp.departmentName ? ` (${emp.departmentName})` : ''}`
                                    }))
                            ]}
                        />

                        {isGroup && (
                            <MultiSelect
                                label="Group Members"
                                options={formattedEmployeeOptions
                                    .filter(emp => emp.empStatus?.toLowerCase() !== 'deactivated')
                                    .map(emp => ({
                                        value: emp.value,
                                        label: emp.label
                                    }))}
                                value={formData.memberIds}
                                onChange={(v: string[]) => setFormData({ ...formData, memberIds: v })}
                            />
                        )}
                    </div>
                    {!isGroup && <p className="text-[11px] font-medium text-slate-400 px-1">Assign an employee to this email address for tracking and responsibility.</p>}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="outline" type="button" onClick={onClose} className="rounded-xl px-8">Cancel</Button>
                    <Button variant="primary" type="submit" className="rounded-xl px-12 font-black">
                        {editData ? 'Save Changes' : 'Allocate Email'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
