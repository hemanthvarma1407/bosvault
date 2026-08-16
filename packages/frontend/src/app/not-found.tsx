'use client';

import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/20 text-slate-900 dark:text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/10">
                <Search className="w-10 h-10" />
            </div>

            <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                404
            </h1>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Endpoint Not Found
            </h2>
            <p className="text-slate-500 max-w-sm mb-10 text-sm font-medium">
                The resource you are looking for at this address doesn't exist or has been moved to a new vault.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                    <Button
                        variant="primary"
                        className="min-w-[140px]"
                        leftIcon={<Home className="w-4 h-4" />}
                    >
                        Return Home
                    </Button>
                </Link>
                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="min-w-[140px]"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                    Go Back
                </Button>
            </div>
        </div>
    );
}
