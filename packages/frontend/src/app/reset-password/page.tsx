'use client'

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from '@/lib/api/services';
import { ResetPasswordModel } from '@bosvault/shared-models';
import { hashPassword } from '@/lib/utils';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { success, error: toastError } = useToast();

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) {
            setToken(t);
        } else {
            toastError('Invalid Link', 'No reset token found in the URL. Please use the link sent to your email.');
            router.push('/login');
        }
    }, [searchParams]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toastError('Validation Error', 'Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            toastError('Validation Error', 'Password must be at least 8 characters long.');
            return;
        }

        setIsResetting(true);
        try {
            const hashedPassword = await hashPassword(newPassword);
            const model = new ResetPasswordModel(token, hashedPassword);
            const response = await authService.resetPassword(model);

            if (response.status) {
                success('Success', 'Your password has been reset successfully. You can now log in with your new password.');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                toastError('Reset Failed', response.message || 'Could not reset password. The link may have expired.');
            }
        } catch (error) {
            toastError('Reset Failed', error.message || 'An error occurred during password reset.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#020617] font-sans items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-700/20 via-slate-950/0 to-slate-950/0" />
            <div className="absolute inset-0 bg-[radial-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-slate-950/0 to-slate-950/0" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 p-8 sm:p-12 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-500/20">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">New Password</h2>
                        <p className="text-slate-400">Set a secure password for your BosVault account.</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wide">New Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="h-14 pl-4 pr-12 text-base bg-slate-800/50 border-slate-700 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-2xl text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wide">Confirm password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="h-14 pl-4 text-base bg-slate-800/50 border-slate-700 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-2xl text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 group"
                            isLoading={isResetting}
                        >
                            Reset Password
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="w-full text-sm font-bold text-slate-400 hover:text-white transition-colors py-2"
                        >
                            Back to Login
                        </button>
                    </form>
                </div>

                {/* Footer Brand */}
                <div className="mt-8 text-center text-slate-500 text-sm font-medium">
                    Protected by BosVault Security Engine
                </div>
            </div>
        </div>
    );
}

const ResetPasswordPage: React.FC = () => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020617]"></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}


export default ResetPasswordPage;