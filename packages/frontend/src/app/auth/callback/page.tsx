'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AlertMessages } from '@/lib/utils/AlertMessages';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithTokens } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
            AlertMessages.getErrorMessage('Authentication failed');
            router.push('/login');
            return;
        }

        if (accessToken && refreshToken) {
            // Store tokens in AuthContext/LocalStorage
            loginWithTokens(accessToken, refreshToken).then(() => {
                AlertMessages.getSuccessMessage('Logged in with Google successfully!');
                router.push('/dashboard');
            }).catch(() => {
                AlertMessages.getErrorMessage('Failed to complete Google authentication');
                router.push('/login');
            });
        } else {
            router.push('/login');
        }
    }, [router, searchParams, loginWithTokens]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-transparent shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                <p className="text-white font-medium animate-pulse">Completing authentication...</p>
            </div>
        </div>
    );
}
