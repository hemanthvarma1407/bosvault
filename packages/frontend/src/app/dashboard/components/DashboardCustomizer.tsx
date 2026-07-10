'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';

export interface WidgetConfig {
    id: string;
    label: string;
    description: string;
    category: 'KPI' | 'Analytics' | 'Operations';
}

export interface WidgetSettings {
    [key: string]: {
        isVisible: boolean;
        order: number;
    }
}

interface DashboardCustomizerProps {
    isOpen: boolean;
    onClose: () => void;
    widgets: WidgetConfig[];
    settings: WidgetSettings;
    onUpdateSettings: (settings: WidgetSettings) => void;
    onReset: () => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
    isOpen,
    onClose,
    widgets,
    settings,
    onUpdateSettings,
    onReset
}) => {
    const handleToggle = (id: string) => {
        const next = { ...settings };
        const current = next[id] || { isVisible: true, order: 0 };
        next[id] = { ...current, isVisible: !current.isVisible };
        onUpdateSettings(next);
    };

    // Sort widgets based on order in settings
    const sortedWidgets = [...widgets].sort((a, b) =>
        (settings[a.id]?.order ?? 0) - (settings[b.id]?.order ?? 0)
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Widget Management</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Show or hide dashboard components</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-indigo-600 hover:text-indigo-700 h-8 gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset Defaults
                    </Button>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedWidgets.map((widget) => {
                        const isVisible = settings[widget.id]?.isVisible !== false;
                        return (
                            <div
                                key={widget.id}
                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isVisible
                                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/50 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{widget.label}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{widget.category}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggle(widget.id)}
                                    className={`p-2 rounded-xl transition-all ${isVisible
                                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                        }`}
                                >
                                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="ghost" onClick={onClose} className="text-xs font-black uppercase tracking-widest">Done</Button>
                </div>
            </div>
        </Modal>
    );
};
