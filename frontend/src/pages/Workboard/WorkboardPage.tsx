import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { useCalendarQuery } from '@/hooks/useCalendarQuery';
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
    Info,
    Bell,
    Lock
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
    activeCompany?: any;
}

const getStatusValue = (status: any) => {
    if (!status) return 'Draft';
    if (typeof status === 'string') return status;
    if (status && typeof status === 'object') {
        if (status.state) return status.state;
        if (status.value) return status.value;
    }
    return String(status || 'Draft');
};

export function WorkboardPage({ authedFetch, backendBaseUrl, notify, onStatusMoved, userPermissions, activeCompany }: WorkboardPageProps) {
    const { companyId } = useParams();
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // Tracks the target column during an active drag — updated by onDragOver via ref
    // so onDragEnd always has the latest value without stale closure issues.
    const dragTargetColumnRef = useRef<string | null>(null);
    // Tracks the last column we actually applied to posts state in onDragOver,
    // to skip redundant setPosts calls on fast drags (prevents render flooding).
    const lastDragOverColumnRef = useRef<string | null>(null);
    // Guards against overlapping API calls when cards are moved rapidly.
    const isMovingRef = useRef<Set<string>>(new Set());
    const lastLoadedCompanyIdRef = useRef<string | null>(null);
    const recentStatusMoves = useRef<Map<string, { status: string; ts: number; originalStatus?: string }>>(new Map());

    // Automation state
    const [automations, setAutomations] = useState<any[]>([]);
    const [pendingMove, setPendingMove] = useState<{ postId: string; status: string; rules: any[] } | null>(null);
    const [pendingApprovalMove, setPendingApprovalMove] = useState<{ postId: string; status: string; roleName: string } | null>(null);
    const [rememberChoice, setRememberChoice] = useState(false);
    // Per-card generation cooldown — card is locked while AI is processing
    const [generatingPostIds, setGeneratingPostIds] = useState<Set<string>>(new Set());

    // Settings loaded flag to prevent partial-save overwrites
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Add-column popover state
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [newColColor, setNewColColor] = useState('#6366f1');
    const [isSavingCol, setIsSavingCol] = useState(false);

    const PRESET_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#1e293b'];

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [watchedColumns, setWatchedColumns] = useState<Record<string, boolean>>({});
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    // Automation preferences (localStorage based)
    const [showAutomations, setShowAutomations] = useState(false);
    const [automationPrefs, setAutomationPrefs] = useState<Record<string, string>>(() => {
        if (typeof window === 'undefined') return {};
        const companyId = window.location.pathname.split('/').find((s, i, a) => a[i - 1] === 'company');
        if (!companyId) return {};
        try {
            const saved = localStorage.getItem(`automation_pref_${companyId}`);
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    // Collapsed columns state
    const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(() => {
        if (typeof window === 'undefined') return {};
        const companyId = window.location.pathname.split('/').find((s, i, a) => a[i - 1] === 'company');
        if (!companyId) return {};
        try {
            const saved = localStorage.getItem(`collapsed_columns_${companyId}`);
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    useEffect(() => {
        if (!companyId) return;
        const prefKey = `automation_pref_${companyId}`;
        const collapseKey = `collapsed_columns_${companyId}`;
        try {
            const saved = localStorage.getItem(prefKey);
            if (saved) setAutomationPrefs(JSON.parse(saved));

            const savedCollapse = localStorage.getItem(collapseKey);
            if (savedCollapse) setCollapsedColumns(JSON.parse(savedCollapse));
        } catch (e) {
            console.error("Local preferences load failed", e);
        }
    }, [companyId]);

    const saveCollapsedState = async (newCollapsed: Record<string, boolean>) => {
        if (!companyId || !settingsLoaded) return;
        try {
            await authedFetch(`${backendBaseUrl}/api/profile/notifications/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    watchedColumns,
                    collapsedColumns: newCollapsed
                }),
            });
        } catch (err) {
            console.error('Failed to save collapsed state to backend:', err);
        }
    };

    const toggleColumnCollapse = (columnId: string) => {
        const newCollapsed = {
            ...collapsedColumns,
            [columnId]: !collapsedColumns[columnId]
        };
        setCollapsedColumns(newCollapsed);
        if (companyId) {
            localStorage.setItem(`collapsed_columns_${companyId}`, JSON.stringify(newCollapsed));
            saveCollapsedState(newCollapsed);
        }
    };

    const updateAutomationPref = (columnId: string, pref: string | null) => {
        if (!companyId) return;
        const prefKey = `automation_pref_${companyId}`;
        const newPrefs = { ...automationPrefs };
        if (!pref || pref === 'ask') {
            delete newPrefs[columnId];
        } else {
            newPrefs[columnId] = pref;
        }
        setAutomationPrefs(newPrefs);
        localStorage.setItem(prefKey, JSON.stringify(newPrefs));
    };

    // Use the calendar query for posts
    const { data: rawPosts = [], isLoading: isLoadingQuery, refetch: fetchPosts } = useCalendarQuery(
        authedFetch,
        backendBaseUrl,
        companyId,
        true,
        recentStatusMoves,
        getStatusValue
    );

    // Map raw posts to Workboard Post type
    useEffect(() => {
        if (!rawPosts) return;

        const currentColumns = columns.length > 0 ? columns : SOKMED_COLUMNS;
        const mappedPosts: Post[] = rawPosts
            .filter((row: any) => {
                const statusStr = getStatusValue(row.status).toLowerCase();
                return statusStr !== 'archived';
            })
            .map((row: any) => {
                const statusStr = getStatusValue(row.status).trim();
                const match = currentColumns.find(c =>
                    c.id === statusStr ||
                    c.title === statusStr ||
                    String(c.id || '').toLowerCase() === String(statusStr || '').toLowerCase() ||
                    String(c.title || '').toLowerCase() === String(statusStr || '').toLowerCase()
                );

                return {
                    id: row.contentCalendarId,
                    theme: row.card_name || row.theme || row.topic || 'Untitled Post',
                    contentType: row.contentType || 'Social Post',
                    status: match ? match.id : statusStr,
                    postDate: row.scheduled_at ? new Date(row.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Draft',
                    brandName: row.brandName || '',
                    cardName: row.card_name,
                    imageUrl: row.imageGenerated || row.imageGeneratedUrl,
                    content_deadline: row.content_deadline || row.scheduled_at,
                    design_deadline: row.design_deadline || row.scheduled_at,
                    organization_id: companyId,
                    tags: row.tags,
                    collaborators: row.collaborators,
                    checklist: row.checklist,
                };
            });

        setPosts(mappedPosts);
    }, [rawPosts, columns, companyId]);

    // Only fetch kanban settings if we haven't already.
    useEffect(() => {
        if (!companyId) return;
        const fetchSettings = async () => {
            if (columns.length === 0) {
                const compRes = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`);
                if (compRes.ok) {
                    const compData = await compRes.json();
                    if (compData.company?.kanban_settings?.columns?.length > 0) {
                        setColumns(compData.company.kanban_settings.columns);
                        if (compData.company.kanban_settings.automations) {
                            setAutomations(compData.company.kanban_settings.automations);
                        }
                    } else {
                        setColumns(SOKMED_COLUMNS);
                    }
                }
            }
        };
        fetchSettings();
    }, [companyId, authedFetch, backendBaseUrl]);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!companyId) return;

        const loadAll = async () => {
            // Only show the full synchronized loader if the company changed
            if (lastLoadedCompanyIdRef.current !== companyId) {
                setLoading(true);
                // Reset state to avoid showing stale data from previous company
                setPosts([]);
                setColumns([]);
                setAutomations([]);
            }

            await fetchNotificationSettings();
            setLoading(false);
            lastLoadedCompanyIdRef.current = companyId;
        };
        loadAll();

        // Realtime sync
        const channel = supabase
            ?.channel(`workboard-changes-${companyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contentCalendar',
                    filter: `companyId=eq.${companyId}`
                },
                () => {
                    // Invalidate query to trigger refresh
                    queryClient.invalidateQueries({ queryKey: ['calendar', companyId] });
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                supabase?.removeChannel(channel);
            }
        };
    }, [companyId, queryClient]);

    const fetchNotificationSettings = async () => {
        if (!companyId) return;
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/profile/notifications/${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setWatchedColumns(data.watchedColumns || {});
                setCollapsedColumns(prev => ({ ...prev, ...(data.collapsedColumns || {}) }));
                setSettingsLoaded(true);
            }
        } catch (err) {
            console.error('Failed to fetch notification settings:', err);
        }
    };

    const saveNotificationSettings = async () => {
        if (!companyId) return;
        setIsSavingNotifications(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/profile/notifications/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ watchedColumns, collapsedColumns }),
            });
            if (res.ok) {
                notify('Notification preferences saved!', 'success');
                setShowNotifications(false);
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            notify('Error saving preferences', 'error');
        } finally {
            setIsSavingNotifications(false);
        }
    };

    const toggleWatchColumn = (columnId: string) => {
        setWatchedColumns(prev => ({
            ...prev,
            [columnId]: !prev[columnId]
        }));
    };

    const executeStatusChange = async (postId: string, newStatus: string, skipAutomation = false) => {
        // In-flight guard: if this card already has a pending API call, skip.
        if (isMovingRef.current.has(postId)) return;
        isMovingRef.current.add(postId);

        const row = posts.find(p => p.id === postId);
        const originalStatus = row?.status;

        // Optimistic UI update
        recentStatusMoves.current.set(postId, { status: newStatus, ts: Date.now(), originalStatus });
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
                                // Invalidate query to get final status
                                queryClient.invalidateQueries({ queryKey: ['calendar', companyId] });
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
            // Revert to original status
            if (originalStatus !== undefined) {
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: originalStatus } : p));
            }
        } finally {
            isMovingRef.current.delete(postId);
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
        const lockRule = automations.find(rule => rule.type === 'access_rule' && rule.columnId === newStatus);

        // If moving to a locked column (unless owner), require approval confirmation
        if (lockRule && !userPermissions.isOwner) {
            const savedLockPref = automationPrefs[`lock_${newStatus}`];
            if (savedLockPref === 'automate') {
                executeStatusChange(postId, newStatus, true);
                return;
            }
            setPendingApprovalMove({ postId, status: newStatus, roleName: lockRule.roleName });
            setRememberChoice(false);
            return;
        }

        if (matchingRules.length > 0) {
            const savedPref = automationPrefs[newStatus];

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
            updateAutomationPref(pendingMove.status, shouldAutomate ? 'automate' : 'skip');
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
        lastDragOverColumnRef.current = null; // reset per-drag tracking
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

            // KEY FIX: only call setPosts when the visual target column actually changed.
            // onDragOver fires on every pointer-move event (~60fps), so without this guard
            // React gets flooded with state updates on fast drags, causing render loops.
            if (lastDragOverColumnRef.current === targetStatus) return;
            lastDragOverColumnRef.current = targetStatus;

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

    const handleAddColumn = async () => {
        const name = newColName.trim();
        if (!name || !companyId) return;

        const newCol: KanbanColumn = {
            id: `custom-${Date.now()}` as SokMedStatus,
            title: name,
            color: newColColor
        };
        const updatedColumns = [...columns, newCol];
        setIsSavingCol(true);

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kanban_settings: { columns: updatedColumns, automations } }),
            });
            if (!res.ok) throw new Error('Failed to save');

            setColumns(updatedColumns);
            setNewColName('');
            setNewColColor('#6366f1');
            setShowAddColumn(false);
            notify(`Column "${name}" added!`, 'success');
        } catch (err) {
            notify('Failed to save column', 'error');
        } finally {
            setIsSavingCol(false);
        }
    };

    const handleColumnRename = async (columnId: string, newTitle: string) => {
        if (!companyId) return;
        const updatedColumns = columns.map(c =>
            c.id === columnId ? { ...c, title: newTitle } : c
        );
        try {
            await authedFetch(`${backendBaseUrl}/api/company/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kanban_settings: { columns: updatedColumns, automations } }),
            });
            setColumns(updatedColumns);
            notify(`Column renamed to "${newTitle}"`, 'success');
        } catch {
            notify('Failed to rename column', 'error');
        }
    };

    const handleColumnColorChange = async (columnId: string, newColor: string) => {
        if (!companyId) return;
        const updatedColumns = columns.map(c =>
            c.id === columnId ? { ...c, color: newColor } : c
        );
        try {
            await authedFetch(`${backendBaseUrl}/api/company/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kanban_settings: { columns: updatedColumns, automations } }),
            });
            setColumns(updatedColumns);
            notify(`Column color updated!`, 'success');
        } catch {
            notify('Failed to update color', 'error');
        }
    };

    const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        // Optimistic UI update
        const originalPosts = [...posts];
        setPosts(prev => prev.filter(p => p.id !== postId));

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete post');
            notify('Post deleted successfully', 'success');
        } catch (err: any) {
            setPosts(originalPosts);
            notify(err.message || 'Error deleting post', 'error');
        }
    };

    const filteredPosts = posts.filter(p =>
        String(p.theme || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
        (p.cardName && String(p.cardName || '').toLowerCase().includes(String(searchQuery || '').toLowerCase())) ||
        String(p.contentType || '').toLowerCase().includes(String(searchQuery || '').toLowerCase())
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

                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => {
                            setShowAddColumn(!showAddColumn);
                            setShowNotifications(false);
                            setShowAutomations(false);
                        }}
                        className={`p-2.5 rounded-xl transition-all ${showAddColumn ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title="Add Column"
                    >
                        <Settings2 size={20} />
                    </button>

                    <button
                        onClick={() => {
                            setShowAutomations(!showAutomations);
                            setShowAddColumn(false);
                            setShowNotifications(false);
                        }}
                        className={`p-2.5 rounded-xl transition-all ${showAutomations ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title="Automation Settings"
                    >
                        <Zap size={20} />
                    </button>

                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowAddColumn(false);
                            setShowAutomations(false);
                        }}
                        className={`p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title="Notification Settings"
                    >
                        <Bell size={20} />
                    </button>

                    {showAddColumn && (
                        <div className="absolute right-0 top-full mt-4 z-50 w-72 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200 border-2 border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">New Column Context</h4>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Status title..."
                                value={newColName}
                                onChange={e => setNewColName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 mb-5 transition-all"
                            />

                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Branding Colour</p>
                            <div className="flex gap-2.5 flex-wrap mb-6">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-125 ${newColColor === c ? 'border-slate-800 scale-125 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddColumn}
                                    disabled={!newColName.trim() || isSavingCol}
                                    className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-40 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center min-h-[40px]"
                                >
                                    {isSavingCol ? <Loader2 size={14} className="animate-spin" /> : 'Create Status'}
                                </button>
                                <button
                                    onClick={() => { setShowAddColumn(false); setNewColName(''); }}
                                    className="px-4 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {showAutomations && (
                        <div className="absolute right-0 top-full mt-4 z-50 w-96 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-200 border-2 border-slate-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Zap size={16} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Automation Controls</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-8 font-medium leading-relaxed">
                                Manage how automations trigger when moving cards between columns.
                            </p>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-2 custom-scrollbar">
                                {columns.map((col: any) => {
                                    const moveToRules = automations.filter((a: any) => a.type === 'move_to' && a.targetColumn === col.id);
                                    const lockRule = automations.find((a: any) => a.type === 'access_rule' && a.columnId === col.id);
                                    const hasRules = moveToRules.length > 0 || lockRule;

                                    if (!hasRules) return null;

                                    const currentMovePref = automationPrefs[col.id] || 'ask';
                                    const currentLockPref = automationPrefs[`lock_${col.id}`] || 'ask';

                                    return (
                                        <div key={col.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:border-blue-100 transition-all group">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: col.color }} />
                                                    <span className="text-xs font-bold text-slate-700">{col.title}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {moveToRules.length > 0 && (
                                                        <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                                                            {moveToRules.length} Automations
                                                        </span>
                                                    )}
                                                    {lockRule && (
                                                        <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <Lock size={8} /> Protected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {moveToRules.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Card Automations</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { id: 'ask', label: 'Ask', icon: Info },
                                                            { id: 'automate', label: 'Auto', icon: Zap },
                                                            { id: 'skip', label: 'Skip', icon: XCircle }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => updateAutomationPref(col.id, opt.id)}
                                                                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${currentMovePref === opt.id ? 'bg-white border-blue-200 shadow-sm text-blue-600 ring-4 ring-blue-50' : 'bg-transparent border-slate-200 text-slate-400 hover:bg-white hover:border-slate-300'}`}
                                                            >
                                                                <opt.icon size={12} />
                                                                <span className="text-[9px] font-bold uppercase">{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {lockRule && (
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Lock/Approval Access</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'ask', label: 'Always Ask', icon: Info },
                                                            { id: 'automate', label: 'Auto-Submit', icon: Lock }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => updateAutomationPref(`lock_${col.id}`, opt.id)}
                                                                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${currentLockPref === opt.id ? 'bg-white border-amber-200 shadow-sm text-amber-600 ring-4 ring-amber-50' : 'bg-transparent border-slate-200 text-slate-400 hover:bg-white hover:border-slate-300'}`}
                                                            >
                                                                <opt.icon size={12} />
                                                                <span className="text-[9px] font-bold uppercase">{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {columns.filter(col => automations.some(a => (a.type === 'move_to' && a.targetColumn === col.id) || (a.type === 'access_rule' && a.columnId === col.id))).length === 0 && (
                                    <div className="text-center py-10">
                                        <Wand2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-slate-400">No move-to rules defined.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-4 z-50 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-200 border-2 border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Notification Preferences</h4>
                            <p className="text-[11px] text-slate-500 mb-8 font-medium leading-relaxed">
                                Select columns you want to monitor. You'll be notified when new cards arrive.
                            </p>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-8 custom-scrollbar">
                                {columns.map(col => (
                                    <label key={col.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: col.color }} />
                                            <span className="text-xs font-bold text-slate-700">{col.title}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={watchedColumns[col.id] || false}
                                            onChange={() => toggleWatchColumn(col.id)}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                        />
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={saveNotificationSettings}
                                disabled={isSavingNotifications}
                                className="w-full py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSavingNotifications ? <Loader2 size={16} className="animate-spin" /> : 'Save Preferences'}
                            </button>
                        </div>
                    )}

                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                        <Plus size={18} />
                        New Post
                    </button>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto p-6 relative">
                {loading && columns.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F8FAFC] z-20">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                )}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <div className="inline-flex gap-6 h-full min-w-full pb-20">
                        {columns.map((column) => (
                            <Column
                                key={column.id}
                                column={column}
                                posts={filteredPosts.filter(p => p.status === column.id)}
                                generatingPostIds={generatingPostIds}
                                onRename={handleColumnRename}
                                onColorChange={handleColumnColorChange}
                                onDeletePost={handleDeletePost}
                                isCollapsed={!!collapsedColumns[column.id]}
                                onToggleCollapse={() => toggleColumnCollapse(column.id)}
                            />
                        ))}
                    </div>

                    {createPortal(
                        <DragOverlay>
                            {activePost && (
                                <TaskCard
                                    post={activePost}
                                    statusColor={columns.find(c => c.id === activePost.status)?.color}
                                />
                            )}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
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
            {/* Approval Modal */}
            {pendingApprovalMove && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 mx-auto shadow-sm">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Submit for Approval?</h3>
                        <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed px-4">
                            Moving this card to <span className="text-slate-900 font-bold">"{columns.find(c => c.id === pendingApprovalMove.status)?.title}"</span> will lock it.
                            A notification will be sent to the <span className="text-indigo-600 font-bold">{pendingApprovalMove.roleName}</span> role for review.
                        </p>
                        <label className="flex items-center justify-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-10 cursor-pointer group hover:bg-white hover:border-amber-200 transition-all">
                            <input
                                type="checkbox"
                                checked={rememberChoice}
                                onChange={e => setRememberChoice(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-slate-300 text-amber-600 focus:ring-amber-500 transition-all cursor-pointer"
                            />
                            <span className="text-[11px] font-black uppercase text-slate-600 tracking-wide">Remember my choice for this column</span>
                        </label>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    if (rememberChoice) {
                                        updateAutomationPref(`lock_${pendingApprovalMove.status}`, 'automate');
                                    }
                                    executeStatusChange(pendingApprovalMove.postId, pendingApprovalMove.status, true);
                                    setPendingApprovalMove(null);
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                            >
                                Send for Approval
                            </button>
                            <button
                                onClick={() => {
                                    setPendingApprovalMove(null);
                                    fetchPosts(); // revert any visual drift
                                }}
                                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel Move
                            </button>
                        </div>
                        <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            Once moved, you may lose edit access
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
