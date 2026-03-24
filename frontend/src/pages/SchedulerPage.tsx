import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    MoreVertical,
    Trophy,
    Clock,
    Move,
    X,
    Check,
    Loader2
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, addDays, eachDayOfInterval, isToday } from 'date-fns';
import { ViewContentModal } from "@/modals/ViewContentModal";

interface SchedulerPageProps {
    calendarRows: any[];
    setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
    activeCompanyId?: string;
    activeCompany?: any;
    getStatusValue: (status: any) => string;
    getImageGeneratedUrl: (row: any) => string | null;
    setSelectedRow: (row: any) => void;
    setIsViewModalOpen: (open: boolean) => void;
    isViewModalOpen: boolean;
    selectedRow: any;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    navigate: (path: string) => void;
    userPermissions?: any;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    imagePreviewNonce: number;
    handleCopy: (fieldKey: string, text?: string | null) => void;
    copiedField: string | null;
    setIsDraftModalOpen: (open: boolean) => void;
    setDraftPublishIntent: (intent: 'draft' | 'ready') => void;
    requestConfirm: (config: any) => Promise<any>;
    isGeneratingCaption: boolean;
    setIsGeneratingCaption: (generating: boolean) => void;
    refreshCalendarRow: (rowId: string) => Promise<void>;
    setIsImageModalOpen: (open: boolean) => void;
    setBrandKbId: (id: string | null) => void;
    setSystemInstruction: (instruction: string) => void;
}

// ─── Inline Reschedule Time Picker Modal ───────────────────────────────────────
interface RescheduleModalState {
    isOpen: boolean;
    post: any | null;
    targetDate: string; // 'yyyy-MM-dd'
}

function RescheduleModal({
    state,
    onConfirm,
    onCancel,
    isSaving
}: {
    state: RescheduleModalState;
    onConfirm: (time: string) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [time, setTime] = useState('09:00');

    if (!state.isOpen || !state.post) return null;

    const displayDate = state.targetDate
        ? format(new Date(state.targetDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')
        : '';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={!isSaving ? onCancel : undefined}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-900 to-blue-900">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-[#3FA9F5]/20 rounded-xl flex items-center justify-center border border-[#3FA9F5]/30">
                            <Move className="w-4 h-4 text-[#3FA9F5]" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Reschedule Post</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-11">Moving to <span className="text-blue-300 font-semibold">{displayDate}</span></p>
                </div>

                {/* Post Preview */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Post</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{state.post?.card_name || state.post?.cardName || state.post?.theme || state.post?.topic || 'Untitled Campaign'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{state.post?.contentType || 'Social Media'}</p>
                </div>

                {/* Time Picker */}
                <div className="px-6 py-5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Planned time (optional)
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            disabled={isSaving}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/30 focus:border-[#3FA9F5] transition-all disabled:opacity-50"
                        />
                    </div>
                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <span className="text-amber-500 text-[11px] mt-px">ⓘ</span>
                        <p className="text-[9px] text-amber-700 font-semibold leading-relaxed">This only updates the <strong>planned date</strong> for tracking purposes. It does not schedule this post for publishing. To schedule for publishing, use the Studio Editor.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(time)}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl bg-[#3FA9F5] text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                        ) : (
                            <><Check className="w-3.5 h-3.5" /> Confirm</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function SchedulerPage({
    calendarRows,
    setCalendarRows,
    activeCompanyId,
    activeCompany,
    getStatusValue,
    getImageGeneratedUrl,
    setSelectedRow,
    setIsViewModalOpen,
    isViewModalOpen,
    selectedRow,
    notify,
    navigate,
    userPermissions = {},
    authedFetch,
    backendBaseUrl,
    imagePreviewNonce,
    handleCopy,
    copiedField,
    setIsDraftModalOpen,
    setDraftPublishIntent,
    requestConfirm,
    isGeneratingCaption,
    setIsGeneratingCaption,
    refreshCalendarRow,
    setIsImageModalOpen,
    setBrandKbId,
    setSystemInstruction
}: SchedulerPageProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week'>('month');

    // Drag & Drop state
    const [draggedPost, setDraggedPost] = useState<any | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null); // 'yyyy-MM-dd' of hovered cell
    const [rescheduleModal, setRescheduleModal] = useState<RescheduleModalState>({ isOpen: false, post: null, targetDate: '' });
    const [isSavingReschedule, setIsSavingReschedule] = useState(false);

    // 1. Resolve Dynamic Statuses & Colors
    const kanbanColumns = useMemo(() => {
        return activeCompany?.kanban_settings?.columns || [
            { id: 'Drafts', title: 'Drafts', color: '#94a3b8' },
            { id: 'To Do', title: 'To Do', color: '#6366f1' },
            { id: 'Caption Generated', title: 'Caption Generated', color: '#3fa9f5' },
            { id: 'Design Generated', title: 'Design Generated', color: '#8b5cf6' },
            { id: 'Revision', title: 'Revision', color: '#f59e0b' },
            { id: 'For Approval', title: 'For Approval', color: '#ec4899' },
            { id: 'Approved', title: 'Approved', color: '#10b981' },
            { id: 'Scheduled', title: 'Scheduled', color: '#0ea5e9' },
            { id: 'Published', title: 'Published', color: '#1e293b' },
        ];
    }, [activeCompany]);

    // Helper to get column by status value
    const getStatusColumn = (statusVal: string) => {
        return kanbanColumns.find((col: any) =>
            col.id === statusVal || col.title === statusVal
        ) || kanbanColumns[0];
    };

    // 2. Calendar Generation Logic
    const startDate = useMemo(() => {
        if (view === 'month') {
            const monthStart = startOfMonth(currentDate);
            return startOfWeek(monthStart);
        } else {
            return startOfWeek(currentDate);
        }
    }, [currentDate, view]);

    const endDate = useMemo(() => {
        if (view === 'month') {
            const monthEnd = endOfMonth(startOfMonth(currentDate));
            return endOfWeek(monthEnd);
        } else {
            return endOfWeek(currentDate);
        }
    }, [currentDate, view]);

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    // 3. Data Mapping
    const postsByDate = useMemo(() => {
        const map = new Map<string, any[]>();

        calendarRows.forEach(row => {
            const dateStr = row.scheduled_at
                ? row.scheduled_at.split('T')[0]
                : (row.date ? row.date.split('T')[0] : null);

            if (dateStr) {
                if (!map.has(dateStr)) map.set(dateStr, []);
                map.get(dateStr)!.push(row);
            }
        });

        return map;
    }, [calendarRows]);

    // 4. Navigation
    const nextPeriod = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 7));
    };

    const prevPeriod = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
        else setCurrentDate(addDays(currentDate, -7));
    };

    const handlePostClick = (post: any) => {
        setSelectedRow(post);
        setIsViewModalOpen(true);
    };

    // 5. Drag & Drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, post: any) => {
        setDraggedPost(post);
        e.dataTransfer.effectAllowed = 'move';
        // Small ghost-image offset
        if (e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedPost(null);
        setDropTarget(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(dateKey);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only clear if leaving the cell entirely (not just entering a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDropTarget(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dateKey: string) => {
        e.preventDefault();
        setDropTarget(null);

        if (!draggedPost) return;

        const currentDateKey = draggedPost.scheduled_at
            ? draggedPost.scheduled_at.split('T')[0]
            : draggedPost.date?.split('T')[0];

        // No-op if dropping on the same day
        if (currentDateKey === dateKey) {
            setDraggedPost(null);
            return;
        }

        // Open time-picker modal
        setRescheduleModal({ isOpen: true, post: draggedPost, targetDate: dateKey });
        setDraggedPost(null);
    }, [draggedPost]);

    const handleRescheduleConfirm = useCallback(async (time: string) => {
        const { post, targetDate } = rescheduleModal;
        if (!post || !targetDate) return;

        setIsSavingReschedule(true);

        // Combine targetDate + time into a local datetime string for the `date` field only.
        // We intentionally do NOT update `scheduled_at` — actual publishing is managed from the Studio Editor.
        const plannedDate = `${targetDate}T${time}:00`;
        const postId = post.contentCalendarId;

        // Optimistic update — only `date`, NOT `scheduled_at`
        setCalendarRows(prev =>
            prev.map(r => r.contentCalendarId === postId
                ? { ...r, date: targetDate }
                : r
            )
        );

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: targetDate })
            });

            if (!res.ok) {
                throw new Error('Failed to update date');
            }

            notify(`Post moved to ${format(new Date(`${targetDate}T12:00:00`), 'MMM d')}`, 'success');
        } catch (err) {
            // Revert on error
            setCalendarRows(prev =>
                prev.map(r => r.contentCalendarId === postId ? post : r)
            );
            notify('Failed to move post. Please try again.', 'error');
        } finally {
            setIsSavingReschedule(false);
            setRescheduleModal({ isOpen: false, post: null, targetDate: '' });
        }
    }, [rescheduleModal, authedFetch, backendBaseUrl, setCalendarRows, notify]);

    const handleRescheduleCancel = useCallback(() => {
        setRescheduleModal({ isOpen: false, post: null, targetDate: '' });
    }, []);

    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthStart = startOfMonth(currentDate);

    return (
        <main className="h-full flex flex-col overflow-hidden bg-gray-50/50 p-2.5 md:p-6 min-w-0 relative font-ribo">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/20 to-[#6fb6e8]/15 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/15 to-[#e5a4e6]/12 rounded-full blur-[100px] animate-pulse" />
            </div>

            <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[850px] relative z-10 font-ribo">

                {/* DARK HERO HEADER */}
                <header className="px-8 py-4 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">Content Strategy</div>
                        <h2 className="text-2xl font-black text-white tracking-tight leading-none">Calendar</h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-300 normal-case">
                            Plan content dates and timeline visibility here. Actual social publishing is still handled in Studio.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/company/${activeCompanyId}/generate`)}
                            className="rounded-xl px-6 py-3 text-sm font-bold bg-[#3FA9F5] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition flex items-center gap-2 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Posts</span>
                        </button>
                        <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* SECONDARY HEADER (Navigation & Primary Controls) */}
                <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-white relative z-20">
                    <div className="flex items-center min-w-fit">
                        {/* Navigation Cluster */}
                        <div className="flex items-center border-r border-slate-100">
                            <button
                                onClick={prevPeriod}
                                className="p-4 hover:bg-slate-50 transition-all text-slate-400 hover:text-[#3FA9F5]"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="px-6 min-w-[200px] text-center">
                                <span className="text-sm font-black text-[#0B2641] uppercase tracking-[0.2em]">
                                    {view === 'month'
                                        ? format(currentDate, 'MMMM yyyy')
                                        : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                                    }
                                </span>
                            </div>

                            <button
                                onClick={nextPeriod}
                                className="p-4 hover:bg-slate-50 transition-all text-slate-400 hover:text-[#3FA9F5]"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Today Reset */}
                        <div className="px-4 py-3 border-r border-slate-100">
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className={`flex items-center gap-2 px-4 py-2 bg-slate-100/50 border border-slate-200/50 rounded-xl font-black text-[10px] uppercase tracking-widest text-[#0B2641] transition-all ${isToday(currentDate) ? 'opacity-40 cursor-default' : 'hover:bg-slate-100 active:scale-95'}`}
                                disabled={isToday(currentDate)}
                            >
                                <CalendarIcon size={14} className="text-[#3FA9F5]" />
                                Today
                            </button>
                        </div>
                    </div>

                    {/* View Selection */}
                    <div className="px-6 py-3 flex items-center gap-4 min-w-fit">
                        <div className="bg-slate-100/50 border border-slate-200/50 rounded-xl p-1 flex items-center">
                            <button
                                onClick={() => setView('month')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'month' ? 'bg-[#0B2641] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'week' ? 'bg-[#0B2641] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Week
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-b border-slate-100 bg-slate-50 px-8 py-3">
                    <div className="flex flex-col gap-2 text-sm font-medium text-slate-600 lg:flex-row lg:items-center lg:justify-between">
                        <span>Drag posts to plan dates and review your timeline at a glance.</span>
                        <span>Need to actually publish? Open the post in <span className="font-bold text-blue-600">Studio</span>.</span>
                    </div>
                </div>

                {/* CALENDAR BODY */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Days Week Header */}
                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                        {dayOfWeek.map(day => (
                            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 grid grid-cols-7 overflow-y-auto no-scrollbar md:pb-24">
                        {calendarDays.map((day, idx) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayPosts = postsByDate.get(dateKey) || [];
                            const isViewActive = view === 'month' ? isSameMonth(day, monthStart) : true;
                            const isCurrentDay = isToday(day);

                            const isDropTarget = dropTarget === dateKey;

                            return (
                                <div
                                    key={idx}
                                    onDragOver={isViewActive ? (e) => handleDragOver(e, dateKey) : undefined}
                                    onDragLeave={isViewActive ? handleDragLeave : undefined}
                                    onDrop={isViewActive ? (e) => handleDrop(e, dateKey) : undefined}
                                    className={`min-h-[140px] p-2 border-r border-b transition-all group relative overflow-hidden ${isDropTarget
                                        ? 'border-[#3FA9F5]/60 bg-blue-50/40 ring-2 ring-inset ring-[#3FA9F5]/20'
                                        : !isViewActive
                                            ? 'border-slate-100 bg-slate-50/30 text-slate-300'
                                            : 'border-slate-100 bg-white hover:bg-slate-50/50'
                                        }`}
                                >
                                    {/* Drop zone overlay indicator */}
                                    {isDropTarget && (
                                        <div className="absolute inset-1 rounded-xl border-2 border-dashed border-[#3FA9F5]/40 pointer-events-none z-20 flex items-center justify-center">
                                            <div className="bg-[#3FA9F5]/10 rounded-lg px-2 py-1">
                                                <span className="text-[9px] font-black text-[#3FA9F5] uppercase tracking-widest">Drop here</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className={`text-[11px] font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isCurrentDay ? 'bg-[#3FA9F5] text-white shadow-lg shadow-blue-400/30' : isViewActive ? 'text-slate-800' : 'text-slate-300'}`}
                                        >
                                            {format(day, 'd')}
                                        </span>

                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {dayPosts.length > 0 && isViewActive && (
                                                <span className="text-[9px] font-black py-0.5 px-2 bg-blue-50 text-blue-500 rounded-full border border-blue-100 whitespace-nowrap">
                                                    {dayPosts.length} Post{dayPosts.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {isViewActive && (
                                                <button
                                                    onClick={() => navigate(`/company/${activeCompanyId}/generate`)}
                                                    className="w-7 h-7 bg-[#3FA9F5]/10 text-[#3FA9F5] hover:bg-[#3FA9F5] hover:text-white rounded-lg flex items-center justify-center transition-all"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Post List */}
                                    <div className="flex flex-col gap-1.5 relative z-10 max-h-[100px] overflow-y-auto no-scrollbar pr-0.5">
                                        {dayPosts.map((post, pIdx) => {
                                            const statusVal = getStatusValue(post);
                                            const col = getStatusColumn(statusVal);
                                            const color = col?.color || '#94a3b8';
                                            const isDragging = draggedPost?.contentCalendarId === post.contentCalendarId;

                                            return (
                                                <div
                                                    key={pIdx}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, post)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => handlePostClick(post)}
                                                    style={{ borderLeftColor: color, borderLeftWidth: '3px', cursor: 'grab' }}
                                                    className={`w-full p-2 text-left rounded-xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100/50 text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95 select-none ${isDragging ? 'opacity-40 scale-95' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Move size={9} className="text-slate-300 shrink-0" />
                                                        <span className="truncate text-slate-700">{post.card_name || post.cardName || post.theme || post.topic || 'Untitled Campaign'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{post.contentType || 'Social'}</span>
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add post slot */}
                                        {dayPosts.length < 2 && isViewActive && !isDropTarget && (
                                            <div
                                                className="hidden group-hover:flex items-center justify-center h-[34px] border border-dashed border-slate-200 rounded-xl bg-slate-50/10 text-slate-300 hover:border-[#3FA9F5]/40 hover:text-[#3FA9F5] transition-all cursor-pointer"
                                                onClick={() => navigate(`/company/${activeCompanyId}/generate`)}
                                            >
                                                <Plus size={14} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FOOTER LEGEND */}
                <footer className="mt-auto px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between relative z-30">
                    <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-2">
                        {kanbanColumns.map((col: any) => (
                            <div key={col.id} className="flex items-center gap-2 shrink-0">
                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: col.color || '#94a3b8' }} />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                    {col.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-4 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm ml-6 shrink-0">
                        <Trophy className="w-4 h-4 text-orange-400" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[#0B2641] uppercase">Strategy Insight</span>
                            <span className="text-[8px] font-bold text-slate-500">Your engagement is highest on Tuesdays. Add more content there!</span>
                        </div>
                    </div>
                </footer>
            </section>

            {/* Reschedule Time Picker Modal */}
            <RescheduleModal
                state={rescheduleModal}
                onConfirm={handleRescheduleConfirm}
                onCancel={handleRescheduleCancel}
                isSaving={isSavingReschedule}
            />

            {/* Modals */}
            {selectedRow && (
                <ViewContentModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    setIsViewModalOpen={setIsViewModalOpen}
                    selectedRow={selectedRow}
                    getStatusValue={getStatusValue}
                    getImageGeneratedUrl={getImageGeneratedUrl}
                    imagePreviewNonce={imagePreviewNonce}
                    handleCopy={handleCopy}
                    copiedField={copiedField}
                    notify={notify}
                    setIsDraftModalOpen={setIsDraftModalOpen}
                    setDraftPublishIntent={setDraftPublishIntent}
                    requestConfirm={requestConfirm}
                    isGeneratingCaption={isGeneratingCaption}
                    setIsGeneratingCaption={setIsGeneratingCaption}
                    authedFetch={authedFetch}
                    backendBaseUrl={backendBaseUrl}
                    refreshCalendarRow={refreshCalendarRow}
                    setIsImageModalOpen={setIsImageModalOpen}
                    activeCompanyId={activeCompanyId}
                    activeCompany={activeCompany}
                    setBrandKbId={setBrandKbId}
                    setSystemInstruction={setSystemInstruction}
                    userPermissions={userPermissions}
                />
            )}
        </main>
    );
}
