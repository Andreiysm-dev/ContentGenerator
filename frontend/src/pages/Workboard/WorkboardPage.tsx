
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useRef } from 'react';
import {
    Columns,
    Search,
    Calendar,
    Plus,
    Settings2,
    Loader2,
    Zap,
    Wand2,
    Clock,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';
import { SOKMED_COLUMNS } from './types';
import type { KanbanColumn, Post, SokMedStatus } from './types';
import { Column } from './components/Column';
import { TaskCard } from './components/TaskCard';
import { createPortal } from 'react-dom';

interface WorkboardPageProps {
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    userPermissions?: any;
    onStatusMoved?: (postId: string, status: string, originalStatus?: any) => void;
}

const getStatusValue = (status: any) => {
    if (typeof status === 'string') return status;
    if (status && typeof status === 'object' && status.state) return status.state;
    return 'Draft';
};

export function WorkboardPage({ authedFetch, backendBaseUrl, notify, onStatusMoved, userPermissions }: WorkboardPageProps) {
    const { companyId } = useParams();
    const [columns, setColumns] = useState<KanbanColumn[]>(SOKMED_COLUMNS);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // Tracks the target column during an active drag — updated by onDragOver via ref
    // so onDragEnd always has the latest value without stale closure issues.
    const dragTargetColumnRef = useRef<string | null>(null);

    // Automation state
    const [automations, setAutomations] = useState<any[]>([]);
    const [pendingMove, setPendingMove] = useState<{ postId: string; status: string; rules: any[] } | null>(null);
    const [rememberChoice, setRememberChoice] = useState(false);
    // Per-card generation cooldown — card is locked while AI is processing
    const [generatingPostIds, setGeneratingPostIds] = useState<Set<string>>(new Set());

    // Fetch real data from backend
    const fetchPosts = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${companyId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');

            const unwrapped = data.contentCalendars || data;
            const mappedPosts: Post[] = unwrapped.map((row: any) => {
                const statusStr = getStatusValue(row.status);
                return {
                    id: row.contentCalendarId,
                    theme: row.theme || row.topic || 'Untitled Post',
                    contentType: row.contentType || 'Social Post',
                    status: statusStr,
                    postDate: row.scheduled_at ? new Date(row.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Draft',
                    brandName: row.brandName || '',
                    cardName: row.card_name,
                    imageUrl: row.imageGenerated || row.imageGeneratedUrl,
                    content_deadline: row.content_deadline || row.scheduled_at,
                    design_deadline: row.design_deadline || row.scheduled_at,
                    organization_id: companyId,
                    tags: row.tags,
                    collaborators: row.collaborators,
                };
            });

            setPosts(mappedPosts);

            // Also fetch kanban settings
            const compRes = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`);
            if (compRes.ok) {
                const compData = await compRes.json();
                if (compData.company?.kanban_settings) {
                    const { columns: savedCols, automations: savedAutos } = compData.company.kanban_settings;
                    if (savedCols?.length > 0) setColumns(savedCols);
                    setAutomations(savedAutos || []);
                }
            }
        } catch (err: any) {
            notify(err.message || 'Error loading workboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [companyId]);

    const executeStatusChange = async (postId: string, newStatus: string, skipAutomation = false) => {
        // Optimistic UI updates
        const originalPost = posts.find(p => p.id === postId);
        const originalStatus = originalPost?.status;

        // Notify App.tsx about the move for polling preservation
        onStatusMoved?.(postId, newStatus, originalStatus);

        // Local state update
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: {
                        state: newStatus,
                        oldState: originalStatus,
                        updatedAt: new Date().toISOString(),
                        by: 'user_kanban'
                    }
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                console.error('Failed to update status:', data);
                throw new Error(data.error || 'Failed to update status');
            }

            if (!skipAutomation) {
                const matchingRules = automations.filter(rule => rule.type === 'move_to' && rule.targetColumn === newStatus);
                for (const rule of matchingRules) {
                    const endpoint = rule.action === 'generate_caption' ? 'generate-caption' : 'generate-image';
                    notify(`Auto-triggering ${rule.action.replace('_', ' ')}...`, 'info');

                    // Mark card as generating (cooldown starts)
                    setGeneratingPostIds(prev => new Set(prev).add(postId));

                    authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}/${endpoint}`, { method: 'POST' })
                        .then(async r => {
                            if (r.ok) {
                                notify(`${rule.action.replace('_', ' ')} complete!`, 'success');
                                // Refetch to get the final status from the server
                                await fetchPosts();
                            } else {
                                const d = await r.json().catch(() => ({}));
                                notify(d.error || 'Automation failed', 'error');
                            }
                        })
                        .catch(() => notify('Automation failed', 'error'))
                        .finally(() => {
                            // Release cooldown
                            setGeneratingPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
                        });
                }
            }
        } catch (err: any) {
            console.error('Error in executeStatusChange:', err);
            notify(err.message || 'Error moving card', 'error');
            // Revert to original state on failure
            fetchPosts();
        }
    };

    const handleStatusMove = (postId: string, newStatus: string) => {
        // Block drag while this card is generating
        if (generatingPostIds.has(postId)) {
            notify('Caption generation is in progress. Please wait.', 'info');
            fetchPosts(); // revert any visual drift
            return;
        }
        const matchingRules = automations.filter(rule => rule.type === 'move_to' && rule.targetColumn === newStatus);

        if (matchingRules.length > 0) {
            const prefKey = `automation_pref_${companyId}`;
            const prefs = JSON.parse(localStorage.getItem(prefKey) || '{}');
            const savedPref = prefs[newStatus];

            if (savedPref === 'automate') {
                executeStatusChange(postId, newStatus, false);
            } else if (savedPref === 'skip') {
                executeStatusChange(postId, newStatus, true);
            } else {
                setPendingMove({ postId, status: newStatus, rules: matchingRules });
                setRememberChoice(false);
            }
        } else {
            executeStatusChange(postId, newStatus, true);
        }
    };

    const onConfirmMoveAction = (shouldAutomate: boolean) => {
        if (!pendingMove) return;
        if (rememberChoice) {
            const prefKey = `automation_pref_${companyId}`;
            const prefs = JSON.parse(localStorage.getItem(prefKey) || '{}');
            prefs[pendingMove.status] = shouldAutomate ? 'automate' : 'skip';
            localStorage.setItem(prefKey, JSON.stringify(prefs));
        }
        executeStatusChange(pendingMove.postId, pendingMove.status, !shouldAutomate);
        setPendingMove(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }, // require 8px move before drag starts
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        dragTargetColumnRef.current = null;
        if (event.active.data.current?.type === 'Post') {
            // Read directly from posts state — accurate at drag start before any mutations
            const post = posts.find(p => p.id === event.active.id as string);
            setActivePost(post ?? null);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;
        if (active.data.current?.type !== 'Post') return;

        // Determine target column — check data first, then fall back to column id match
        const columnIds = new Set(columns.map(c => c.id));
        let targetStatus: string | undefined;

        if (over.data.current?.type === 'Column') {
            targetStatus = overId;
        } else if (over.data.current?.type === 'Post') {
            targetStatus = posts.find(p => p.id === overId)?.status as string | undefined;
        } else if (columnIds.has(overId)) {
            // data.current not set but overId is a known column — use it directly
            targetStatus = overId;
        }

        if (targetStatus) {
            dragTargetColumnRef.current = targetStatus;
            setPosts(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === activeId);
                if (activeIndex === -1 || tasks[activeIndex].status === targetStatus) return tasks;
                const newTasks = [...tasks];
                newTasks[activeIndex] = { ...newTasks[activeIndex], status: targetStatus! };
                return newTasks;
            });
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const savedActivePost = activePost;
        const originalStatus = savedActivePost?.status as string | undefined;
        const activeId = active.id as string;

        // Read target from ref (set by onDragOver), then fall back to inspecting the drop event
        let targetColumnId = dragTargetColumnRef.current;
        dragTargetColumnRef.current = null;
        setActivePost(null);

        // If ref wasn't set (card dropped without moving over anything), try to resolve from event
        if (!targetColumnId && over) {
            const overId = over.id as string;
            const columnIds = new Set(columns.map(c => c.id));
            if (over.data.current?.type === 'Column') {
                targetColumnId = overId;
            } else if (over.data.current?.type === 'Post') {
                targetColumnId = posts.find(p => p.id === overId)?.status as string ?? null;
            } else if (columnIds.has(overId)) {
                targetColumnId = overId;
            }
        }

        if (!targetColumnId || targetColumnId === originalStatus) {
            // No column change — revert any visual drift from onDragOver
            if (savedActivePost) {
                setPosts(prev => prev.map(p =>
                    p.id === activeId ? { ...p, status: savedActivePost.status } : p
                ));
            }
            return;
        }

        handleStatusMove(activeId, targetColumnId);
    };

    const handleAddColumn = () => {
        const name = window.prompt('Enter column name:');
        if (name) {
            const newCol: KanbanColumn = {
                id: name as SokMedStatus,
                title: name,
                description: 'Custom column'
            };
            setColumns([...columns, newCol]);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contentType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Columns size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Workboard</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Execution Hub</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-2xl px-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search theme or caption..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                        <Calendar size={18} className="text-slate-400" />
                        <span>All Dates</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddColumn}
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Manage Columns"
                    >
                        <Settings2 size={20} />
                    </button>

                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                        <Plus size={18} />
                        New Post
                    </button>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <span className="ml-3 text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Workboard...</span>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDragEnd={onDragEnd}
                    >
                        <div className="inline-flex gap-6 h-full min-w-full">
                            {columns.map((column) => (
                                <Column
                                    key={column.id}
                                    column={column}
                                    posts={filteredPosts.filter(p => p.status === column.id)}
                                    generatingPostIds={generatingPostIds}
                                />
                            ))}
                        </div>

                        {createPortal(
                            <DragOverlay>
                                {activePost && <TaskCard post={activePost} />}
                            </DragOverlay>,
                            document.body
                        )}
                    </DndContext>
                )}
            </div>

            {/* Automation Modal */}
            {pendingMove && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 mx-auto shadow-sm">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Automation Triggered</h3>
                        <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed px-4">
                            Moving to <span className="text-indigo-600 font-bold">"{columns.find(c => c.id === pendingMove.status)?.title}"</span> has defined automations. Would you like to execute them now?
                        </p>

                        <div className="space-y-3 mb-10 text-left">
                            {pendingMove.rules.map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/80">
                                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <Wand2 className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{rule.action.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>

                        <label className="flex items-center justify-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-10 cursor-pointer group hover:bg-white hover:border-indigo-200 transition-all">
                            <input
                                type="checkbox"
                                checked={rememberChoice}
                                onChange={e => setRememberChoice(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                            />
                            <span className="text-[11px] font-black uppercase text-slate-600 tracking-wide">Remember my choice for this column</span>
                        </label>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => onConfirmMoveAction(true)}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                Yes, Run Automations
                            </button>
                            <button
                                onClick={() => onConfirmMoveAction(false)}
                                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-sm hover:bg-slate-200 transition-all active:scale-95"
                            >
                                No, Just Move Card
                            </button>
                            <button
                                onClick={() => setPendingMove(null)}
                                className="w-full py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors mt-2"
                            >
                                Cancel Move
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
