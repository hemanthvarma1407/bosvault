'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import {
    ShieldCheck,
    UserPlus,
    AtSign,
    Phone,
    Lock,
    ArrowLeft,
    Building2,
    CheckCircle2
} from 'lucide-react';
import { RegisterUserModel, UserRoleEnum } from '@bosvault/shared-models';
import Link from 'next/link';
import { hashPassword } from '@/lib/utils';

const RegisterPage: React.FC = () => {
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phNumber: '',
        companyId: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toastError('Validation Error', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            // Hash the password on frontend before sending to backend
            const hashedPassword = await hashPassword(formData.password);
            const registerModel = new RegisterUserModel(
                formData.fullName,
                Number(formData.companyId),
                formData.email,
                formData.phNumber,
                hashedPassword,
                UserRoleEnum.USER
            );

            const response = await authService.registerUser(registerModel);

            if (response.status) {
                success('Success', 'Account created successfully! You can now log in.');
                router.push('/login');
            } else {
                toastError('Registration Failed', response.message || 'Unable to create account.');
            }
        } catch (err: any) {
            toastError('Error', err.message || 'An unexpected error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-[#020617] font-sans">

            {/* Left Side: Brand/Art (60%) */}
            <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-between p-16 text-white bg-[#0F172A]">
                <div className="absolute inset-0 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-700/30 via-slate-900/0 to-slate-900/0" />
                <div className="absolute inset-0 bg-[radial-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/30 via-slate-900/0 to-slate-900/0" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] z-0" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold text-sm tracking-wide uppercase">Back to Login</span>
                        </Link>
                        <h1 className="text-7xl font-black tracking-tight mb-6 leading-tight text-white">
                            Join the<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Future</span> of Admin
                        </h1>
                        <p className="text-slate-300 text-xl font-light leading-relaxed max-w-md">
                            Create your professional identity and start managing your organization with pinpoint precision.
                        </p>
                    </div>

                    <div className="space-y-6 max-w-sm">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Secure by Design</h4>
                                <p className="text-xs text-slate-400">Encrypted identity vault and secure RBAC.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Instant Access</h4>
                                <p className="text-xs text-slate-400">No waiting. Start working in seconds.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-slate-500 font-medium">
                        © 2026 BosVault Enterprise. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side: Form (40%) */}
            <div className="w-full lg:w-[40%] flex flex-col justify-center relative bg-white dark:bg-[#020617] transition-colors duration-300">
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="w-full max-w-[500px] mx-auto px-8 sm:px-12 py-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">

                    <div className="mb-8">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="inline-flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">BosVault</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Create Account</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base">Get started with your organizational workspace.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Full Identity Name</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter your full name"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                        required
                                    />
                                    <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Work Email</label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                            required
                                        />
                                        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Input
                                            placeholder="+1 (555) 000-0000"
                                            value={formData.phNumber}
                                            onChange={e => setFormData({ ...formData, phNumber: e.target.value })}
                                            className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                            required
                                        />
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Organization ID</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="Enter the ID provided by your admin"
                                        value={formData.companyId}
                                        onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                                        className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                        required
                                    />
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Access Secret</label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            placeholder="Min 8 characters"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                            required
                                        />
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Verify Secret</label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            placeholder="Repeat password"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                            required
                                        />
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                isLoading={isLoading}
                            >
                                Construct Profile
                                <CheckCircle2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm font-medium text-slate-500">
                            Already part of the network?{' '}
                            <Link href="/login" className="font-bold text-blue-600 hover:underline">
                                Return to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default RegisterPage;