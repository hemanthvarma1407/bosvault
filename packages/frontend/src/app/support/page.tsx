'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import { ticketService } from '@/lib/api/services';
import { TicketStatusEnum } from '@bosvault/shared-models';
import { configVariables } from '@bosvault/shared-services';
import { Bot, PlusCircle, Lock, ArrowLeft, Send, Eye, FileText, File } from 'lucide-react';
import { UserRoleEnum } from '@bosvault/shared-models';

interface Message {
    id: number;
    senderId: number;
    senderType: 'user' | 'support';
    sender?: {
        firstName: string;
    };
    message: string;
    commentType?: 'public' | 'internal';
    attachments?: any[];
    createdAt: string;
}

const SupportChatPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const ticketId = searchParams.get('ticketId');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [ticket, setTicket] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!ticketId) return;

        const fetchTicket = async () => {
            try {
                const response = await ticketService.getTicket({ id: Number(ticketId) });
                if (response.status) {
                    setTicket(response.ticket);
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
            }
        };

        fetchTicket();

        const socket = getSocket('/tickets');
        const handleJoin = () => socket.emit('joinTicket', { ticketId: Number(ticketId) });
        const handleHistory = (history: Message[]) => setMessages(history);
        const handleNewMessage = (message: Message) => {
            setMessages((prev) => {
                if (prev.some(m => String(m.id) === String(message.id))) return prev;
                return [...prev, message];
            });
        };
        const handleStatusUpdate = (updatedTicket: any) => {
            if (String(updatedTicket.id) === String(ticketId)) setTicket(updatedTicket);
        };

        if (socket.connected) handleJoin();
        socket.on('connect', handleJoin);
        socket.on('previousMessages', handleHistory);
        socket.on('newMessage', handleNewMessage);
        socket.on('ticketUpdated', handleStatusUpdate);

        return () => {
            socket.off('connect', handleJoin);
            socket.off('previousMessages', handleHistory);
            socket.off('newMessage', handleNewMessage);
            socket.off('ticketUpdated', handleStatusUpdate);
        };
    }, [ticketId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const parsedAttachments: any[] = [];
    let cleanDescription = ticket?.description || '';
    if (ticket?.description) {
        const regex = /\[(.*?)\]\((.*?)\)/g;
        let match;
        while ((match = regex.exec(ticket.description)) !== null) {
            parsedAttachments.push({
                name: match[1],
                url: match[2],
                fileName: match[2].split('/').pop() || match[1],
                type: match[2].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image/jpeg' : 'application/octet-stream',
                size: 0
            });
        }
        cleanDescription = ticket.description.replace(/\*\*Attachments:\*\*[\s\S]*/, '').trim();
    }
    const allAttachments = [...parsedAttachments, ...messages.flatMap(m => m.attachments || [])];

    const handleSendMessage = (attachments?: any[]) => {
        if ((!inputMessage.trim() && (!attachments || attachments.length === 0)) || !ticketId || !user) return;

        const socket = getSocket('/tickets');
        const isAdmin = user && (
            user.role === UserRoleEnum.ADMIN ||
            user.role === UserRoleEnum.SUPER_ADMIN ||
            user.role === UserRoleEnum.SUPPORT_ADMIN ||
            user.role === UserRoleEnum.MANAGER
        );
        const senderType = isAdmin ? 'support' : 'user';

        socket.emit('sendMessage', {
            ticketId: Number(ticketId),
            senderId: user.id,
            senderType: senderType,
            message: inputMessage,
            attachments: attachments
        });

        setInputMessage('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !ticketId) return;

        setIsUploading(true);
        try {
            const result = await ticketService.uploadAttachment(file);
            if (result.status) {
                handleSendMessage([result.data]);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isClosed = ticket?.ticketStatus === TicketStatusEnum.CLOSED || ticket?.ticketStatus === TicketStatusEnum.RESOLVED;

    const getStatusColor = (status: TicketStatusEnum) => {
        switch (status) {
            case TicketStatusEnum.OPEN: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case TicketStatusEnum.IN_PROGRESS: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case TicketStatusEnum.RESOLVED: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            case TicketStatusEnum.CLOSED: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="px-4 pt-1 pb-12 bg-transparent h-[calc(100vh-80px)] overflow-hidden transition-colors duration-500">
            <div className="flex h-full bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
                {/* Main Chat Area (70%) */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent border-r border-slate-200 dark:border-slate-800 shadow-sm relative z-10 transition-all duration-300">
                    {/* Header - More Compact */}
                    <div className="h-12 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between bg-white dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="min-w-0">
                                {ticket ? (
                                    <>
                                        <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[250px] md:max-w-xl">
                                            {ticket.subject}
                                        </h1>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-wider">
                                                {ticket.ticketCode}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-medium text-slate-400 truncate">Activity Stream</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="h-4 w-32 md:w-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                                        <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const isAdmin = user && (
                                    user.role === UserRoleEnum.ADMIN ||
                                    user.role === UserRoleEnum.SUPER_ADMIN ||
                                    user.role === UserRoleEnum.SUPPORT_ADMIN ||
                                    user.role === UserRoleEnum.MANAGER
                                );
                                router.push(isAdmin ? '/tickets' : '/create-ticket');
                            }}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back to Tickets</span>
                        </button>
                    </div>

                    {/* Messages Stream - Jira-Style */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-8 bg-white dark:bg-slate-900 select-text custom-scrollbar transition-colors duration-500"
                    >
                        {isClosed && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3">
                                <Lock size={16} className="text-rose-500" />
                                <span className="text-xs font-bold text-rose-600">This ticket is closed</span>
                            </div>
                        )}
                        {messages.length === 0 && !cleanDescription ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                <Bot size={48} className="mb-2 text-slate-400" />
                                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No messages yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {cleanDescription && (
                                    <div className="py-4 first:pt-0 last:pb-0 flex gap-4">
                                        <div className="flex-shrink-0 pt-1">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                <span className="text-xs font-bold uppercase">
                                                    {ticket?.employeeName?.[0] || 'R'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 wrap">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {ticket?.employeeName || 'Reporter'}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center">
                                                    Original Request
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                </span>
                                            </div>
                                            <div className="text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                                {cleanDescription}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {messages.map((message) => {
                                    const isMe = message.senderId === user?.id;
                                    const isInternal = message.commentType === 'internal';

                                    return (
                                        <div
                                            key={message.id}
                                            className={`py-4 first:pt-0 last:pb-0 flex gap-4 ${isInternal ? 'bg-amber-50/30 dark:bg-amber-900/10 -mx-4 px-4' : ''}`}
                                        >
                                            {/* Avatar/Icon Column */}
                                            <div className="flex-shrink-0 pt-1">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    <span className="text-xs font-bold uppercase">
                                                        {(message.sender?.firstName?.[0] || message.senderType?.[0] || 'U')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1 min-w-0">
                                                {/* Meta Header */}
                                                <div className="flex items-center gap-2 mb-1.5 wrap">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {isMe ? 'You' : (message.sender?.firstName || (message.senderType === 'support' ? 'Support' : 'Reporter'))}
                                                    </span>
                                                    {isInternal && (
                                                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                                            <Lock size={8} />
                                                            Internal
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(message.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>

                                                {/* Text Content */}
                                                <div className="text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                                    {message.message}
                                                </div>

                                                {/* Attachments */}
                                                {message.attachments && message.attachments.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                                        {message.attachments.map((file, idx) => {
                                                            const attachmentUrl = `${configVariables.APP_AVS_SERVICE_URL}/tickets/attachment/${file.fileName || file.url?.split('/').pop()}`;
                                                            const isImage = file.type?.startsWith('image/') || 
                                                                file.fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
                                                                file.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
                                                                file.name?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                                                            if (isImage) {
                                                                return (
                                                                    <div key={idx} className="relative group/image max-w-[280px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                                                        <img src={attachmentUrl} alt={file.name || "Screenshot"} className="w-full h-auto object-cover max-h-[200px]" />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                                            <a
                                                                                href={attachmentUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all"
                                                                                title="View full size"
                                                                            >
                                                                                <Eye size={18} />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <a
                                                                    key={idx}
                                                                    href={attachmentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/10 transition-all cursor-pointer group/file"
                                                                >
                                                                    <div className="w-10 h-10 rounded border border-slate-100 dark:border-slate-700 overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/file:text-blue-500">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[11px] font-bold truncate text-slate-700 dark:text-slate-200 group-hover/file:text-blue-600">{file.name || file.fileName}</p>
                                                                        <p className="text-[9px] opacity-60">{file.size ? `${(file.size / 1024).toFixed(0)}kb` : ''}</p>
                                                                    </div>
                                                                    <Eye size={14} className="text-slate-300 group-hover/file:text-blue-500 mr-1" />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-slate-950 backdrop-blur-xl">
                        <div className="w-full flex items-end gap-2">
                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col px-3 py-2">
                                <div className="flex items-end gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*,.pdf"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors mb-1"
                                    >
                                        <PlusCircle size={20} />
                                    </button>

                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        className="flex-1 bg-transparent py-1 text-sm focus:outline-none resize-none max-h-32 min-h-[32px] text-slate-700 dark:text-slate-200"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputMessage.trim() || isUploading}
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md active:scale-90 disabled:opacity-50 bg-[#00a884] text-white"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={18} strokeWidth={2.5} className="ml-0.5" />
                                )}
                            </button>
                        </div>
                        <p className="w-full mt-2 text-center text-[9px] text-slate-400 font-medium">
                            Press <span className="text-slate-500 px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Enter</span> to send
                        </p>
                    </div>
                </div>

                {/* Sidebar Details - Reduced Width & Tighter Padding */}
                <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-900 overflow-y-auto border-l border-slate-200 dark:border-slate-800 hidden lg:flex flex-col">
                    <div className="p-4 space-y-6">
                        <section>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Status</span>
                                    <div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${getStatusColor(ticket?.ticketStatus)}`}>
                                            {ticket?.ticketStatus?.replace('_', ' ') || 'OPEN'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Priority</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${ticket?.priorityEnum === 'URGENT' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{ticket?.priorityEnum || 'MEDIUM'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Category</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{ticket?.categoryEnum?.replace('_', ' ') || '-'}</span>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Time & Effort</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Original Estimate</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{ticket?.originalEstimate || '-'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Time Spent</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{ticket?.timeSpent || '-'}</span>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">People</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Assignee</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-600">SA</div>
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Agent</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Reporter</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                                            {ticket?.employeeName?.split(' ').map((n: any) => n[0]).join('') || 'RP'}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title={ticket?.employeeEmail}>
                                            {ticket?.employeeName || 'Reporter'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dates</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Created</span>
                                    <span className="text-[11px] font-medium text-slate-500">{new Date(ticket?.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachments</h3>
                                {!isClosed && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
                                    >
                                        + Add
                                    </button>
                                )}
                            </div>
                            {allAttachments.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">No attachments uploaded yet</p>
                            ) : (
                                <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    {allAttachments.map((file, idx) => {
                                        let attachmentUrl = file.url || '';
                                        if (!attachmentUrl.startsWith('http')) {
                                            attachmentUrl = `${configVariables.APP_AVS_SERVICE_URL}/tickets/attachment/${file.fileName || attachmentUrl.split('/').pop()}`;
                                        }
                                        return (
                                            <a
                                                key={idx}
                                                href={attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                    {file.type?.startsWith('image/') ? (
                                                        <img src={attachmentUrl} alt="" className="w-full h-full object-cover rounded" />
                                                    ) : (
                                                        <File size={16} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title={file.name || file.fileName}>
                                                        {file.name || file.fileName}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 font-medium">
                                                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Download'}
                                                    </p>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="mt-auto p-5 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Diagnostic Context</p>
                            <p className="text-[10px] leading-tight text-slate-500 italic">
                                Stream active. Monitoring node infrastructure.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportChatPage;