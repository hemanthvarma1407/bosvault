'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Lock, Plus, Search, ShieldCheck, Key, ShieldAlert, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/Button';
import { UserRoleEnum } from '@bosvault/shared-models';
import { CredentialVaultMasterView, CredentialVaultMasterViewHandle } from '../masters/components/credential-vault-master-view';
import { authService, authVaultService } from '@/lib/api/services';
import { AlertMessages } from '@/lib/utils/AlertMessages';

const CredentialVaultPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);
    const viewRef = useRef<CredentialVaultMasterViewHandle>(null);

    const [isResetting, setIsResetting] = useState(false);
    const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newVaultPassword, setNewVaultPassword] = useState('');
    const [confirmNewVaultPassword, setConfirmNewVaultPassword] = useState('');
    const [isProcessingReset, setIsProcessingReset] = useState(false);
    const [setupStep, setSetupStep] = useState<'input' | 'verify'>('input');
    const [setupOtp, setSetupOtp] = useState('');

    useEffect(() => {
        const vaultSession = sessionStorage.getItem('vault_unlocked');
        if (vaultSession === 'true') {
            setIsUnlocked(true);
        }
        checkVaultStatus();
        fetchUserEmail();
    }, []);

    const fetchUserEmail = async () => {
        try {
            const user = await authService.getMe();
            if (user && user.userInfo && user.userInfo.email) {
                setResetEmail(user.userInfo.email);
            }
        } catch (error) {
            console.error('Failed to fetch user email', error);
        }
    };

    const checkVaultStatus = async () => {
        try {
            // We'll use a dummy verify with empty password to check if it's set
            const response = await authVaultService.verifyVaultPassword('');
            if (response.code === 2) {
                setIsFirstTime(true);
            }
        } catch (error) {
            // Error might happen if it's not set
        }
    };

    const handleUnlock = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!password) return;

        setIsVerifying(true);
        try {
            const response = await authVaultService.verifyVaultPassword(password);
            if (response.status) {
                unlockVault();
            } else if (response.code === 2) {
                setIsFirstTime(true);
                AlertMessages.getErrorMessage('Vault password not set. Please set it first.');
            } else {
                AlertMessages.getErrorMessage('Invalid vault password');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRequestSetupOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!password) return;
        if (password !== confirmPassword) {
            AlertMessages.getErrorMessage('Passwords do not match');
            return;
        }
        if (!resetEmail) {
            AlertMessages.getErrorMessage('User email not found');
            return;
        }

        setIsVerifying(true);
        try {
            const response = await authVaultService.requestVaultOtp({ email: resetEmail });
            if (response.status) {
                AlertMessages.getSuccessMessage('Verification OTP sent to your email');
                setSetupStep('verify');
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to request OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleConfirmSetup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!password || !setupOtp) return;

        setIsVerifying(true);
        try {
            const response = await authVaultService.setVaultPassword(password, setupOtp);
            if (response.status) {
                AlertMessages.getSuccessMessage('Vault password set successfully');
                setIsFirstTime(false);
                setSetupStep('input');
                setSetupOtp('');
                unlockVault();
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to set vault password');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRequestOtp = async () => {
        if (!resetEmail) {
            AlertMessages.getErrorMessage('User email not found');
            return;
        }
        setIsProcessingReset(true);
        try {
            const response = await authVaultService.requestVaultOtp({ email: resetEmail });
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message);
                setResetStep('verify');
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to request OTP');
        } finally {
            setIsProcessingReset(false);
        }
    };

    const handleResetWithOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || !newVaultPassword) return;
        if (newVaultPassword !== confirmNewVaultPassword) {
            AlertMessages.getErrorMessage('Passwords do not match');
            return;
        }

        setIsProcessingReset(true);
        try {
            const response = await authVaultService.resetVaultPasswordWithOtp({
                email: resetEmail,
                otp: otp,
                newPassword: newVaultPassword
            });
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message);
                setIsResetting(false);
                setResetStep('request');
                setOtp('');
                setNewVaultPassword('');
                setConfirmNewVaultPassword('');
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to reset password');
        } finally {
            setIsProcessingReset(false);
        }
    };

    const unlockVault = () => {
        setIsUnlocked(true);
        sessionStorage.setItem('vault_unlocked', 'true');
        AlertMessages.getSuccessMessage('Vault Unlocked');
        setPassword('');
        setConfirmPassword('');
    };

    const handleLock = () => {
        setIsUnlocked(false);
        sessionStorage.removeItem('vault_unlocked');
        AlertMessages.getSuccessMessage('Vault Locked');
    };

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950/50 space-y-8 flex flex-col items-center">

                <div className="w-full">
                    <PageHeader
                        title="Credential Vault"
                        description="Securely manage and protect organizational secrets"
                        icon={<Lock />}
                        gradient="from-blue-600 to-indigo-700"
                        actions={isUnlocked ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="List View"
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <Button
                                    onClick={handleLock}
                                    variant="outline"
                                    className="h-8 px-3 font-black uppercase tracking-widest text-[9px] border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                                    size="sm"
                                    leftIcon={<Lock className="h-3 w-3 text-slate-400" />}
                                >
                                    Lock Vault
                                </Button>
                                <div className="relative group">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="pl-8 pr-3 py-1.5 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-32 md:w-48 placeholder:text-slate-400"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => viewRef.current?.showAddModal()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-3 font-black uppercase tracking-widest text-[9px] shadow-sm flex items-center gap-2"
                                    size="sm"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add New
                                </Button>
                            </div>
                        ) : null}
                    />
                </div>

                {!isUnlocked && (
                    <div className="w-full max-w-xs animate-in fade-in zoom-in duration-500">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl shadow-blue-500/10 p-6 space-y-5 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />

                            <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3 transition-transform hover:rotate-0 duration-500 group">
                                    <Lock className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                                        {isFirstTime ? 'Initial Configuration' : isResetting ? 'Security Recovery' : 'Standard Authentication'}
                                    </p>
                                </div>

                                {isResetting ? (
                                    <div className="w-full space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-500/20 rounded-2xl flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 text-left leading-relaxed">
                                                {resetStep === 'request'
                                                    ? `We'll send a 6-digit OTP to ${resetEmail.replace(/(.{3}).*(@.*)/, '$1***$2')} for identity verification.`
                                                    : 'Enter the verification code sent to your email to define a new security key.'}
                                            </p>
                                        </div>

                                        {resetStep === 'request' ? (
                                            <Button
                                                onClick={handleRequestOtp}
                                                disabled={isProcessingReset}
                                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                            >
                                                {isProcessingReset ? 'Processing...' : 'Send Recovery Code'}
                                            </Button>
                                        ) : (
                                            <form onSubmit={handleResetWithOtp} className="space-y-4">
                                                <div className="relative group">
                                                    <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="6-Digit OTP"
                                                        maxLength={6}
                                                        className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="relative group">
                                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="password"
                                                        placeholder="New Security Key"
                                                        className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                        value={newVaultPassword}
                                                        onChange={(e) => setNewVaultPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="relative group">
                                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                                    <input
                                                        type="password"
                                                        placeholder="Confirm New Key"
                                                        className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                                                        value={confirmNewVaultPassword}
                                                        onChange={(e) => setConfirmNewVaultPassword(e.target.value)}
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={isProcessingReset || !otp || !newVaultPassword}
                                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                                >
                                                    {isProcessingReset ? 'Verifying...' : 'Reset & Authenticate'}
                                                </Button>
                                            </form>
                                        )}
                                        <button
                                            onClick={() => { setIsResetting(false); setResetStep('request'); }}
                                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full space-y-6 animate-in slide-in-from-left-4 duration-300">
                                        <form onSubmit={isFirstTime ? (setupStep === 'input' ? handleRequestSetupOtp : handleConfirmSetup) : handleUnlock} className="space-y-4">
                                            {isFirstTime ? (
                                                setupStep === 'verify' ? (
                                                    <>
                                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-500/20 rounded-2xl flex items-center gap-3">
                                                            <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 text-left leading-relaxed">
                                                                Enter the 6-Digit OTP sent to {resetEmail.replace(/(.{3}).*(@.*)/, '$1***$2')} to confirm setup.
                                                            </p>
                                                        </div>
                                                        <div className="relative group">
                                                            <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                            <input
                                                                type="text"
                                                                placeholder="6-Digit OTP"
                                                                maxLength={6}
                                                                className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                                value={setupOtp}
                                                                onChange={(e) => setSetupOtp(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="relative group">
                                                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                            <input
                                                                type="password"
                                                                placeholder="Create Master Key"
                                                                className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="relative group">
                                                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                                            <input
                                                                type="password"
                                                                placeholder="Confirm Master Key"
                                                                className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                                                                value={confirmPassword}
                                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                            />
                                                        </div>
                                                    </>
                                                )
                                            ) : (
                                                <div className="relative group">
                                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="password"
                                                        placeholder="Enter Security Key"
                                                        className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <Button
                                                    type="submit"
                                                    disabled={isVerifying || !password || (isFirstTime && setupStep === 'input' && !confirmPassword) || (isFirstTime && setupStep === 'verify' && !setupOtp)}
                                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {isVerifying ? 'Verifying...' : isFirstTime ? (setupStep === 'input' ? 'Send OTP & Continue' : 'Confirm OTP & Setup') : 'Authenticate Vault'}
                                                </Button>

                                                {isFirstTime && setupStep === 'verify' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSetupStep('input'); setSetupOtp(''); }}
                                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors py-2 block w-full text-center"
                                                    >
                                                        Back
                                                    </button>
                                                )}

                                                {!isFirstTime && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsResetting(true)}
                                                        className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors py-2"
                                                    >
                                                        Forgot Security Key?
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}

                {isUnlocked && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <CredentialVaultMasterView ref={viewRef} searchTerm={searchTerm} viewMode={viewMode} />
                    </div>
                )}
            </div>
        </RouteGuard>
    );
};

export default CredentialVaultPage;
