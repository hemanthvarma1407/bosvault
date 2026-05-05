'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Edit, Lock, Key, AlertCircle, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authService } from '@/lib/api/services';
import { UpdateUserModel } from '@bosvault/shared-models';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Modal } from '@/components/ui/Modal';
import { AlertMessages } from '@/lib/utils/AlertMessages';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [editedData, setEditedData] = useState({ fullName: user?.fullName || '', email: user?.email || '' });

    useEffect(() => {
        if (user) {
            setEditedData({
                fullName: user.fullName,
                email: user.email
            });
        }
    }, [user]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (passwordData.new !== passwordData.confirm) {
            AlertMessages.getErrorMessage('New passwords do not match');
            return;
        }
        if (passwordData.new.length < 6) {
            AlertMessages.getErrorMessage('Password must be at least 6 characters');
            return;
        }
        try {
            const model = new UpdateUserModel(user.id);
            model.password = passwordData.new;
            const res = await authService.updateUser(model);
            if (res.status) {
                AlertMessages.getSuccessMessage(res.message);
                setIsPasswordModalOpen(false);
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                AlertMessages.getErrorMessage(res.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        try {
            const model = new UpdateUserModel(user.id);
            model.fullName = editedData.fullName;
            model.email = editedData.email;
            const res = await authService.updateUser(model);
            if (res.status) {
                AlertMessages.getSuccessMessage(res.message);
                setIsEditing(false);
            } else {
                AlertMessages.getErrorMessage(res.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        };
    }
    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        if (password.length === 0) return { strength: 0, label: 'None', color: 'bg-slate-200' };
        if (password.length < 6) return { strength: 25, label: 'Weak', color: 'bg-rose-500' };
        if (password.length < 10) return { strength: 50, label: 'Fair', color: 'bg-amber-500' };
        if (password.length < 14) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
        return { strength: 100, label: 'Strong', color: 'bg-emerald-500' };
    };
    const passwordStrength = getPasswordStrength(passwordData.new);

    return (
        <RouteGuard>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950/20 p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    {/* Details Card with integrated Identity */}
                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full lg:col-span-1">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {user!.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Profile Info</h3>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Edit Profile"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedData.fullName}
                                        onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                    />
                                ) : (
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{user!.fullName}</div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editedData.email}
                                        onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                    />
                                ) : (
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{user!.email}</div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                                    {user!.role || 'Administrator'}
                                </div>
                            </div>
                            {isEditing && (
                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSaveProfile}>Save</Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Security & Password */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="group hover:border-indigo-500/50 transition-colors cursor-pointer rounded-2xl h-full" onClick={() => setIsPasswordModalOpen(true)}>
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Change Password</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Update account password</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Card>

                            <Card className="rounded-2xl border-l-4 border-l-emerald-500 h-full">
                                <div className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Security Status</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Account is secure. Change password every 90 days.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Change Password Modal */}
                <Modal
                    isOpen={isPasswordModalOpen}
                    onClose={() => {
                        setIsPasswordModalOpen(false);
                        setPasswordData({ current: '', new: '', confirm: '' });
                    }}
                    title="Change Password"
                    size="md"
                >
                    <form onSubmit={handlePasswordChange} className="space-y-6 pt-2">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex gap-3 text-indigo-800 dark:text-indigo-300">
                            <Shield className="w-5 h-5 shrink-0" />
                            <p className="text-xs leading-relaxed">
                                Choose a strong password with at least 8 characters, including numbers and symbols.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {passwordData.new && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-500">Strength</span>
                                        <span className={`${passwordStrength.strength >= 75 ? 'text-emerald-600' : passwordStrength.strength >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300 ease-out`}
                                            style={{ width: `${passwordStrength.strength}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={passwordData.confirm}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                placeholder="Confirm new password"
                            />
                            {passwordData.confirm && passwordData.new !== passwordData.confirm && (
                                <p className="text-xs text-rose-600 flex items-center gap-1 font-bold">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    setIsPasswordModalOpen(false);
                                    setPasswordData({ current: '', new: '', confirm: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={passwordData.new !== passwordData.confirm || passwordData.new.length < 6}
                            >
                                Update Password
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RouteGuard>
    );
};

export default ProfilePage;
