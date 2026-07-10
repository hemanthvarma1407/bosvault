'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, UserPlus, UserMinus, RefreshCw, Trash2, Clock, History } from 'lucide-react';
import { services } from '@/lib/api/services';
import { AssetTimelineEvent, AssetTimelineEventType, AssetTimelineRequestModel } from '@bosvault/shared-models';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { Spinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { Modal } from '../../../components/ui/Modal';

interface AssetTimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: any;
    companyId: number;
}

interface AssetTimelineModalProps {
    children?: React.ReactNode;
}

export const AssetTimelineModal: React.FC<AssetTimelineModalProps> = ({ isOpen, onClose, asset, companyId }: AssetTimelineModalProps) => {
    const [events, setEvents] = useState<AssetTimelineEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && asset && companyId !== undefined) {
            fetchTimeline();
        }
    }, [isOpen, asset, companyId]);

    const fetchTimeline = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const req = new AssetTimelineRequestModel(asset.id, companyId);
            const response = await services.asset.getTimeline(req);
            if (response.status) {
                setEvents(response.events);
            } else {
                setError(response.message || 'Failed to fetch timeline');
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            setError(err.message || 'Error fetching timeline');
            AlertMessages.getErrorMessage(err.message || 'Error fetching timeline');
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (type: AssetTimelineEventType) => {
        const iconSize = "h-3.5 w-3.5";
        switch (type) {
            case AssetTimelineEventType.CREATED: return <PlusCircle className={iconSize} />;
            case AssetTimelineEventType.ASSIGNED: return <UserPlus className={iconSize} />;
            case AssetTimelineEventType.RETURNED: return <UserMinus className={iconSize} />;
            case AssetTimelineEventType.MAINTENANCE: return <RefreshCw className={iconSize} />;
            case AssetTimelineEventType.RETIRED: return <Trash2 className={iconSize} />;
            default: return <Clock className={iconSize} />;
        }
    };

    const getColor = (type: AssetTimelineEventType) => {
        switch (type) {
            case AssetTimelineEventType.CREATED: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
            case AssetTimelineEventType.ASSIGNED: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
            case AssetTimelineEventType.RETURNED: return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
            case AssetTimelineEventType.MAINTENANCE: return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case AssetTimelineEventType.RETIRED: return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
            default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Asset History - ${asset?.model || 'Asset'}`}
            size="md"
        >
            <div className="p-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="text-center text-rose-500 py-4">
                        {error}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        No history available for this asset.
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8">
                        {events.map((event, index) => (
                            <div key={event.id || index} className="relative pl-8">
                                {/* Icon Bubble */}
                                <div className={`absolute -left-[11px] top-0 h-6 w-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${getColor(event.type)}`}>
                                    {getIcon(event.type)}
                                </div>

                                {/* Content */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {event.type.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <History className="h-3 w-3" />
                                            {formatDateTime(event.date)}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                        {event.title}
                                    </h3>

                                    {event.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 mt-1">
                                            {event.description}
                                        </p>
                                    )}

                                    {event.metadata && (
                                        <div className="flex gap-2 mt-1">
                                            {event.metadata.condition && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    Condition: {event.metadata.condition}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
