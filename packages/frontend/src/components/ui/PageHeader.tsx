'use client';

import React from 'react';
import { Button } from './Button';


interface Action {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost';
    className?: string;
}

interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode | React.ElementType;
    gradient?: string;
    actions?: Action[] | React.ReactNode;
    children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    icon: Icon,
    gradient = 'from-indigo-500 to-purple-600',
    actions = [],
    children
}: PageHeaderProps) => {
    // Process actions if it's passed as a React node instead of an array (common for custom layouts)
    const customActions = React.isValidElement(actions) ? actions : null;
    const structuredActions = Array.isArray(actions) ? actions : [];

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 mb-3">
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md [&>svg]:h-4 [&>svg]:w-4 flex items-center justify-center`}>
                        {React.isValidElement(Icon) ? Icon :
                            (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) ?
                                React.createElement(Icon as React.ElementType) :
                                (Icon as React.ReactNode)}
                    </div>
                )}
                <div>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-0.5">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tight">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 max-w-5xl">

                {children && (
                    <div className="flex items-center justify-end">
                        {children}
                    </div>
                )}

                {customActions}

                {structuredActions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {structuredActions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant || 'outline'}
                                size="sm"
                                onClick={action.onClick}
                                leftIcon={action.icon}
                                className="font-semibold rounded-lg shadow-sm h-7 text-xs px-2.5"
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
