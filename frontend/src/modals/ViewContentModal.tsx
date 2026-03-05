import React, { useState } from 'react';
import { ExternalLink, Wand2, Check, Copy, Clock, Target, Layout, MessageSquare, Calendar, Zap, ClipboardList, PenLine, X, Eye, FileText, MousePointer2, Tag as TagIcon, Share2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, ShieldCheck, BarChart3, ArrowRight, Send, Trash2, MessageCircle, Plus, X as XIcon, Hash, Loader2, Edit3, Maximize2 } from 'lucide-react';
import type { Tag } from '../pages/Workboard/types';
import { useNavigate } from 'react-router-dom';


interface ViewContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRow: any;
    getStatusValue: (status: any) => string;
    getImageGeneratedUrl: (row: any | null) => string | null;
    imagePreviewNonce: number;
    handleCopy: (fieldKey: string, text?: string | null) => void;
    copiedField: string | null;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    setIsDraftModalOpen: (open: boolean) => void;
    setDraftPublishIntent: (intent: 'draft' | 'ready') => void;
    requestConfirm: (config: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
    }) => Promise<boolean>;
    isGeneratingCaption: boolean;
    setIsGeneratingCaption: (generating: boolean) => void;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    refreshCalendarRow: (rowId: string) => Promise<void>;
    setIsImageModalOpen: (open: boolean) => void;
    setIsViewModalOpen: (open: boolean) => void;
    activeCompanyId?: string;
    activeCompany?: any;
    setBrandKbId: (id: string | null) => void;
    setSystemInstruction: (instruction: string) => void;
    isAiAssistantOpen?: boolean;
    collaborators?: any[];
    automations?: any[];
    userPermissions?: any;
    allRows?: any[];
    onNavigate?: (row: any) => void;
}

export function ViewContentModal({
    isOpen,
    onClose,
    selectedRow,
    getStatusValue,
    getImageGeneratedUrl,
    imagePreviewNonce,
    handleCopy,
    copiedField,
    notify,
    setIsDraftModalOpen,
    setDraftPublishIntent,
    requestConfirm,
    isGeneratingCaption,
    setIsGeneratingCaption,
    authedFetch,
    backendBaseUrl,
    refreshCalendarRow,
    setIsImageModalOpen,
    setIsViewModalOpen,
    activeCompanyId,
    activeCompany,
    setBrandKbId,
    setSystemInstruction,
    isAiAssistantOpen,
    collaborators = [],
    automations = [],
    userPermissions = {},
    allRows = [],
    onNavigate,
}: ViewContentModalProps) {
    const navigate = useNavigate();
    const [isManualApproving, setIsManualApproving] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [analytics, setAnalytics] = useState<{ reach: number; likes: number; comments: number } | null>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
    const [isEditingInputs, setIsEditingInputs] = useState(false);
    const [editedValues, setEditedValues] = useState<any>({});
    const [isSavingInputs, setIsSavingInputs] = useState(false);
    const [showAllStrategy, setShowAllStrategy] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [logPage, setLogPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [tagPool, setTagPool] = useState<Tag[]>([]);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [selectedTagColor, setSelectedTagColor] = useState('#3b82f6');
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [isUpdatingTags, setIsUpdatingTags] = useState(false);
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
    const [isUpdatingCollaborators, setIsUpdatingCollaborators] = useState(false);
    const [toggledCollaboratorId, setToggledCollaboratorId] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const [checklists, setChecklists] = useState<{ id: string; title: string; items: { id: string; text: string; completed: boolean }[] }[]>([]);
    const [isUpdatingChecklist, setIsUpdatingChecklist] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [isAddingNewList, setIsAddingNewList] = useState(false);
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editingListTitle, setEditingListTitle] = useState('');
    const [isFullscreenImage, setIsFullscreenImage] = useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const hasCaptionContent = !!(
        selectedRow?.finalCaption ||
        selectedRow?.captionOutput ||
        selectedRow?.final_caption ||
        selectedRow?.caption_output ||
        selectedRow?.caption ||
        selectedRow?.description ||
        selectedRow?.finalDescription ||
        selectedRow?.final_description ||
        selectedRow?.caption_draft ||
        selectedRow?.draft_caption
    );

    const currentStatusInModal = getStatusValue(selectedRow?.status);
    const lockRuleInModal = automations?.find(a => a.type === 'access_rule' && a.columnId === currentStatusInModal);
    const isLockedInModal = !!(lockRuleInModal && !userPermissions?.isOwner && userPermissions?.roleName !== lockRuleInModal.roleName);

    React.useEffect(() => {
        if (isOpen && selectedRow) {
            fetchLogs();
            fetchComments();
            fetchTagPool();
            if (selectedRow.status === 'PUBLISHED' && selectedRow.social_provider === 'facebook') {
                fetchAnalytics();
            }
            setChecklists(Array.isArray(selectedRow.checklist) ? selectedRow.checklist : []);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
        } else {
            setAnalytics(null);
            setLogs([]);
            setComments([]);
            setLogPage(1);
            setTotalLogs(0);
            setCommentPage(1);
            setTotalComments(0);
            setNewCommentText('');
            setNewTagName('');
            setIsAddingTag(false);
            setIsAddingCollaborator(false);
        }
    }, [isOpen, selectedRow?.contentCalendarId]);

    const fetchLogs = async (page = 1) => {
        if (!activeCompanyId || !selectedRow?.contentCalendarId) return;
        setIsLoadingLogs(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/audit/${activeCompanyId}?entityId=${selectedRow.contentCalendarId}&page=${page}&pageSize=5`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotalLogs(data.count || 0);
                setLogPage(data.page || 1);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const fetchComments = async (page = 1) => {
        if (!selectedRow?.contentCalendarId) return;
        setIsLoadingComments(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/comments?page=${page}&pageSize=5`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
                setTotalComments(data.count || 0);
                setCommentPage(data.page || 1);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newCommentText.trim();
        if (!text || !selectedRow?.contentCalendarId || isPostingComment) return;

        setIsPostingComment(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                setNewCommentText('');
                await fetchComments();
            } else {
                notify('Failed to post comment', 'error');
            }
        } catch (err) {
            console.error('Add comment error:', err);
            notify('Error posting comment', 'error');
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const proceed = await requestConfirm({
            title: 'Delete Comment?',
            description: 'Are you sure you want to delete this comment? This action cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (!proceed) return;

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchComments();
            } else {
                notify('Failed to delete comment', 'error');
            }
        } catch (err) {
            console.error('Delete comment error:', err);
            notify('Error deleting comment', 'error');
        }
    };

    const fetchTagPool = async () => {
        if (!activeCompanyId) return;
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`);
            if (res.ok) {
                const data = await res.json();
                setTagPool(data.company?.kanban_settings?.tags || []);
            }
        } catch (err) {
            console.error('Error fetching tag pool:', err);
        }
    };

    const handleToggleTag = async (tag: Tag) => {
        if (!selectedRow || isUpdatingTags) return;

        setIsUpdatingTags(true);
        const currentTags = Array.isArray(selectedRow.tags) ? selectedRow.tags : [];
        const isAssigned = currentTags.some((t: any) => t.id === tag.id);

        let nextTags;
        if (isAssigned) {
            nextTags = currentTags.filter((t: any) => t.id !== tag.id);
        } else {
            nextTags = [...currentTags, tag];
        }

        // Optimistic UI update
        selectedRow.tags = nextTags;

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: nextTags })
            });

            if (res.ok) {
                await refreshCalendarRow(selectedRow.contentCalendarId);
            } else {
                notify('Failed to update tags', 'error');
                // Revert on failure (refresh handles this usually)
            }
        } catch (err) {
            console.error('Tag update error:', err);
            notify('Error updating tags', 'error');
        } finally {
            setIsUpdatingTags(false);
        }
    };

    const handleToggleCollaborator = async (collaborator: any) => {
        if (!selectedRow?.contentCalendarId || isUpdatingCollaborators) return;

        const currentCollaborators = selectedRow.collaborators || [];
        const isAssigned = currentCollaborators.some((c: any) => c.id === collaborator.id);

        let nextCollaborators;
        if (isAssigned) {
            nextCollaborators = currentCollaborators.filter((c: any) => c.id !== collaborator.id);
        } else {
            nextCollaborators = [...currentCollaborators, { id: collaborator.id, email: collaborator.email, role: collaborator.role }];
        }

        setIsUpdatingCollaborators(true);
        setToggledCollaboratorId(collaborator.id);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collaborators: nextCollaborators })
            });

            if (res.ok) {
                await refreshCalendarRow(selectedRow.contentCalendarId);
            } else {
                notify('Failed to update collaborators', 'error');
            }
        } catch (err) {
            console.error('Error updating collaborators:', err);
            notify('Error updating collaborators', 'error');
        } finally {
            setIsUpdatingCollaborators(false);
            setToggledCollaboratorId(null);
        }
    };

    const handleCreateTag = async () => {
        const name = newTagName.trim();
        if (!name || !activeCompanyId || isCreatingTag) return;

        setIsCreatingTag(true);
        const newTag: Tag = { id: `tag-${Date.now()}`, name, color: selectedTagColor };

        // Optimistic UI update for the tag pool
        const nextPool = [...tagPool, newTag];
        setTagPool(nextPool);

        try {
            // We use the existing kanban_settings from activeCompany props if possible, 
            // or we just send the updated tags. The backend should handle partial updates or we send what we have.
            const currentSettings = activeCompany?.kanban_settings || {};

            const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kanban_settings: {
                        ...currentSettings,
                        tags: nextPool
                    }
                })
            });

            if (res.ok) {
                setNewTagName('');
                setIsAddingTag(false);
                notify(`Tag "${name}" created!`, 'success');
                // Automatically assign it to the current card
                handleToggleTag(newTag);
            } else {
                // Rollback if failed
                setTagPool(tagPool);
                notify('Failed to create tag', 'error');
            }
        } catch (err) {
            console.error('Create tag error:', err);
            setTagPool(tagPool); // Rollback
            notify('Failed to create tag', 'error');
        } finally {
            setIsCreatingTag(false);
        }
    };
    const fetchAnalytics = async () => {
        if (!selectedRow?.contentCalendarId) return;
        setIsLoadingAnalytics(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/social/facebook/insights/${selectedRow.contentCalendarId}`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    const handleStartEditing = () => {
        setEditedValues({
            date: selectedRow.date,
            brandHighlight: selectedRow.brandHighlight,
            crossPromo: selectedRow.crossPromo,
            theme: selectedRow.theme,
            contentType: selectedRow.contentType,
            channels: selectedRow.channels,
            targetAudience: selectedRow.targetAudience,
            primaryGoal: selectedRow.primaryGoal,
            cta: selectedRow.cta,
            promoType: selectedRow.promoType,
            card_name: selectedRow.card_name || '',
            frameworkUsed: selectedRow.frameworkUsed,
        });
        setIsEditingInputs(true);
    };

    const handleSaveInputs = async () => {
        setIsSavingInputs(true);
        const payload = { ...editedValues };

        // Auto-status mapping for scheduling
        const studioSettings = activeCompany?.kanban_settings?.studio_settings;
        if (studioSettings?.schedulingStatus && editedValues.date && !selectedRow.date) {
            payload.status = studioSettings.schedulingStatus;
        }

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                notify('Details updated successfully', 'success');
                setIsEditingInputs(false);
                await refreshCalendarRow(selectedRow.contentCalendarId);
            } else {
                const data = await res.json().catch(() => ({}));
                notify(data.error || 'Failed to update details', 'error');
            }
        } catch (err) {
            console.error('Save inputs error:', err);
            notify('Error saving details', 'error');
        } finally {
            setIsSavingInputs(false);
        }
    };

    const handleSaveName = async () => {
        if (!tempName.trim()) return setIsEditingName(false);
        setIsSavingName(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card_name: tempName })
            });

            if (res.ok) {
                notify('Name updated', 'success');
                setIsEditingName(false);
                await refreshCalendarRow(selectedRow.contentCalendarId);
            } else {
                notify('Failed to update name', 'error');
            }
        } catch (err) {
            notify('Error saving name', 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (!onNavigate || !allRows || allRows.length === 0) return;
        const currentIndex = allRows.findIndex(r => r.contentCalendarId === selectedRow?.contentCalendarId);
        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'prev') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : allRows.length - 1;
        } else {
            nextIndex = currentIndex < allRows.length - 1 ? currentIndex + 1 : 0;
        }
        onNavigate(allRows[nextIndex]);
    };

    const handleChecklistUpdate = async (updatedChecklists: typeof checklists) => {
        setChecklists(updatedChecklists);
        if (!selectedRow?.contentCalendarId) return;

        setIsUpdatingChecklist(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checklist: updatedChecklists })
            });

            if (res.ok) {
                await refreshCalendarRow(selectedRow.contentCalendarId);
            } else {
                notify('Failed to update checklists', 'error');
            }
        } catch (err) {
            console.error('Checklist update error:', err);
            notify('Error updating checklists', 'error');
        } finally {
            setIsUpdatingChecklist(false);
        }
    };

    const addChecklist = () => {
        const title = newChecklistTitle.trim() || 'Checklist';
        const newList = { id: `list-${Date.now()}`, title, items: [] };
        handleChecklistUpdate([...checklists, newList]);
        setNewChecklistTitle('');
        setIsAddingNewList(false);
    };

    const deleteChecklist = (listId: string) => {
        handleChecklistUpdate(checklists.filter(l => l.id !== listId));
    };

    const addChecklistItem = (listId: string, text: string) => {
        const next = checklists.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    items: [...list.items, { id: `item-${Date.now()}`, text, completed: false }]
                };
            }
            return list;
        });
        handleChecklistUpdate(next);
    };

    const toggleChecklistItem = (listId: string, itemId: string) => {
        const next = checklists.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    items: list.items.map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    )
                };
            }
            return list;
        });
        handleChecklistUpdate(next);
    };

    const deleteChecklistItem = (listId: string, itemId: string) => {
        const next = checklists.map(list => {
            if (list.id === listId) {
                return { ...list, items: list.items.filter(i => i.id !== itemId) };
            }
            return list;
        });
        handleChecklistUpdate(next);
    };

    const renameChecklist = (listId: string, newTitle: string) => {
        if (!newTitle.trim()) {
            setEditingListId(null);
            return;
        }
        const next = checklists.map(list => {
            if (list.id === listId) {
                return { ...list, title: newTitle.trim() };
            }
            return list;
        });
        handleChecklistUpdate(next);
        setEditingListId(null);
    };

    if (!isOpen || !selectedRow) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Content Details"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Outside Navigation Arrows */}
            {allRows.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }}
                        className="fixed left-4 lg:left-12 top-1/2 -translate-y-1/2 z-[210] p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-95 group hidden md:flex"
                        title="Previous Card"
                    >
                        <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }}
                        className="fixed right-4 lg:right-12 top-1/2 -translate-y-1/2 z-[210] p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-95 group hidden md:flex"
                        title="Next Card"
                    >
                        <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </>
            )}

            <div className="w-full max-w-[95vw] xl:max-w-6xl 2xl:max-w-[1400px] relative z-[205]">
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden flex flex-col">

                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 p-6 bg-white sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    {isEditingName ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={tempName}
                                                onChange={e => setTempName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                                                onBlur={() => !isSavingName && handleSaveName()}
                                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-lg font-black outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 shadow-sm min-w-[200px]"
                                                placeholder="Enter post name..."
                                            />
                                            {isSavingName && <Loader2 size={16} className="animate-spin text-blue-500" />}
                                        </div>
                                    ) : (
                                        <h2
                                            className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 cursor-pointer hover:text-blue-600 transition-colors group"
                                            onClick={() => { setTempName(selectedRow.card_name || ''); setIsEditingName(true); }}
                                        >
                                            {selectedRow.card_name || selectedRow.theme || "Content Details"}
                                            <PenLine size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                        </h2>
                                    )}
                                    {(() => {
                                        const rawStatus = getStatusValue(selectedRow.status).trim();
                                        const columns = activeCompany?.kanban_settings?.columns || [];
                                        const match = columns.find(
                                            (c: any) => c.id === rawStatus || c.title === rawStatus ||
                                                c.id.toLowerCase() === rawStatus.toLowerCase() ||
                                                c.title.toLowerCase() === rawStatus.toLowerCase()
                                        );

                                        if (match) {
                                            const colColor = match.color;
                                            const badgeStyle = colColor
                                                ? { borderColor: colColor + '40', color: colColor, backgroundColor: colColor + '15' }
                                                : undefined;
                                            return (
                                                <div
                                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm"
                                                    style={badgeStyle}
                                                >
                                                    {match.title}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${statusBadgeClasses(statusKey(rawStatus))
                                                }`}>
                                                {rawStatus}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                        <Calendar size={12} />
                                        {selectedRow.date || "Unscheduled"}
                                    </div>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                        <Layout size={12} />
                                        {selectedRow.contentType || "General"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate(`/company/${activeCompanyId}/studio/${selectedRow.contentCalendarId}`);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                <Edit3 size={16} />
                                Edit in Studio
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body: Focused two-column layout */}
                    <div className="flex flex-col lg:flex-row h-full max-h-[70vh] min-h-[500px]">
                        {/* Main: Caption + CTA + Hashtags */}
                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 bg-slate-50/30">

                            {/* Final Caption */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                                    <PenLine size={14} className="text-emerald-600" />
                                    Final Caption
                                </h3>
                                <div className="bg-white border border-emerald-500/20 rounded-[1.5rem] p-6 shadow-sm relative group min-h-[160px]">
                                    <button
                                        onClick={() => handleCopy('finalDescription', [selectedRow.finalCaption || selectedRow.captionOutput, selectedRow.finalHashtags || selectedRow.hastagsOutput].filter(Boolean).join('\n\n'))}
                                        className="absolute top-4 right-4 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-[9px] font-black shadow-lg shadow-emerald-500/20"
                                    >
                                        {copiedField === 'finalDescription' ? 'COPIED' : 'COPY ALL'}
                                    </button>
                                    <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2">
                                        {selectedRow.finalCaption || selectedRow.captionOutput || <span className="text-slate-300 italic">Not generated yet</span>}
                                    </div>
                                </div>
                            </section>

                            {/* Focused Post Visual */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Layout size={14} className="text-blue-500" />
                                        Post Visual
                                    </h3>
                                    {getImageGeneratedUrl(selectedRow) && (
                                        <button
                                            onClick={() => setIsFullscreenImage(true)}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg transition-all active:scale-95"
                                        >
                                            <Maximize2 size={12} />
                                            View Fullscreen
                                        </button>
                                    )}
                                </div>
                                <div className="w-full bg-slate-100 rounded-[1.5rem] border-4 border-white shadow-xl relative overflow-hidden group max-w-2xl mx-auto">
                                    {getImageGeneratedUrl(selectedRow) ? (
                                        <div className="relative group/img cursor-pointer" onClick={() => setIsFullscreenImage(true)}>
                                            <img
                                                src={`${getImageGeneratedUrl(selectedRow)}${getImageGeneratedUrl(selectedRow)?.includes('?') ? '&' : '?'}v=${imagePreviewNonce}`}
                                                alt="Generated visual"
                                                className="w-full h-auto object-contain mx-auto transition-all duration-300"
                                                style={{ maxHeight: '320px' }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-all flex items-center justify-center">
                                                <Maximize2 size={24} className="text-white opacity-0 group-hover/img:opacity-100 transition-all" />
                                            </div>
                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 px-4 h-full bg-slate-50/50">
                                            <Layout size={40} className="text-slate-200 mb-3" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Image not generated yet</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CTA + Hashtags */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <section className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                        <Target size={14} />
                                        Final CTA
                                    </h3>
                                    <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm relative group">
                                        <button
                                            onClick={() => handleCopy('finalCTA', selectedRow.finalCTA || selectedRow.ctaOuput)}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors"
                                        >
                                            {copiedField === 'finalCTA' ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                        <div className="text-sm font-bold text-slate-900 leading-snug">
                                            {selectedRow.finalCTA || selectedRow.ctaOuput || <span className="text-slate-300 font-normal">—</span>}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                        <TagIcon size={14} />
                                        Final Hashtags
                                    </h3>
                                    <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm relative group">
                                        <button
                                            onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags || selectedRow.hastagsOutput)}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors"
                                        >
                                            {copiedField === 'finalHashtags' ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                        <div className="text-sm font-bold text-blue-600/80 leading-relaxed">
                                            {selectedRow.finalHashtags || selectedRow.hastagsOutput || <span className="text-slate-300 font-normal">—</span>}
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Checklist Section */}
                            <section className="space-y-8 pt-8 border-t border-slate-200/60">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Check size={14} className="text-blue-500" />
                                        Task Checklists
                                    </h3>
                                    {!isAddingNewList && (
                                        <button
                                            onClick={() => setIsAddingNewList(true)}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg"
                                        >
                                            <Plus size={12} />
                                            Add Checklist
                                        </button>
                                    )}
                                </div>

                                {isAddingNewList && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in zoom-in-95 duration-200">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Checklist title..."
                                            value={newChecklistTitle}
                                            onChange={e => setNewChecklistTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addChecklist()}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10 mb-3"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={addChecklist}
                                                className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setIsAddingNewList(false)}
                                                className="px-4 py-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-10">
                                    {checklists.map(list => {
                                        const completedCount = list.items.filter(i => i.completed).length;
                                        const progress = list.items.length > 0 ? Math.round((completedCount / list.items.length) * 100) : 0;

                                        return (
                                            <div key={list.id} className="space-y-4 group/list">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <ClipboardList size={14} className="text-slate-400 shrink-0" />
                                                        {editingListId === list.id ? (
                                                            <input
                                                                autoFocus
                                                                className="flex-1 bg-white border border-blue-400 rounded px-2 py-0.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-w-0"
                                                                value={editingListTitle}
                                                                onChange={(e) => setEditingListTitle(e.target.value)}
                                                                onBlur={() => renameChecklist(list.id, editingListTitle)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                                    else if (e.key === 'Escape') {
                                                                        setEditingListId(null);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <h4
                                                                onClick={() => {
                                                                    setEditingListId(list.id);
                                                                    setEditingListTitle(list.title);
                                                                }}
                                                                className="text-sm font-black text-slate-800 tracking-tight cursor-text hover:text-blue-600 transition-colors truncate"
                                                            >
                                                                {list.title}
                                                            </h4>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => deleteChecklist(list.id)}
                                                        className="opacity-0 group-hover/list:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                                                        title="Delete List"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>

                                                {list.items.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                                            <span>Progress</span>
                                                            <span className={progress === 100 ? 'text-green-500' : 'text-blue-500'}>{progress}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1">
                                                    {list.items.map(item => (
                                                        <div key={item.id} className="group/item flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all">
                                                            <button
                                                                onClick={() => toggleChecklistItem(list.id, item.id)}
                                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${item.completed
                                                                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                                                                    : 'border-slate-300 hover:border-blue-400 bg-white hover:shadow-md'
                                                                    }`}
                                                            >
                                                                {item.completed && <Check size={14} strokeWidth={3} />}
                                                            </button>
                                                            <span className={`text-sm font-medium flex-1 transition-all ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                {item.text}
                                                            </span>
                                                            <button
                                                                onClick={() => deleteChecklistItem(list.id, item.id)}
                                                                className="opacity-0 group-hover/item:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                                                            >
                                                                <XIcon size={12} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            const input = e.currentTarget.elements.namedItem('itemText') as HTMLInputElement;
                                                            if (input.value.trim()) {
                                                                addChecklistItem(list.id, input.value.trim());
                                                                input.value = '';
                                                            }
                                                        }}
                                                        className="flex items-center gap-3 pl-2 mt-2 group/form"
                                                    >
                                                        <div className="w-6 h-6 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover/form:border-blue-200 transition-colors shrink-0">
                                                            <Plus size={14} />
                                                        </div>
                                                        <input
                                                            name="itemText"
                                                            type="text"
                                                            placeholder="Add a task to this list..."
                                                            className="flex-1 bg-transparent text-sm font-medium text-slate-500 outline-none border-b border-transparent focus:border-blue-200 py-1 transition-all focus:text-slate-900"
                                                        />
                                                    </form>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {checklists.length === 0 && !isAddingNewList && (
                                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <ClipboardList size={24} className="text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No checklists added</p>
                                    </div>
                                )}
                            </section>

                            {/* Collapsible: AI Draft Outputs */}
                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer select-none py-2 px-1 rounded-xl hover:bg-slate-100/70 transition-colors">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Zap size={13} />
                                        AI Draft Outputs
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                                </summary>

                                <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Caption Draft */}
                                    <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm relative group/card">
                                        <button
                                            onClick={() => handleCopy('captionOutput', selectedRow.captionOutput)}
                                            className="absolute top-3 right-3 p-1.5 bg-slate-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors opacity-0 group-hover/card:opacity-100"
                                        >
                                            {copiedField === 'captionOutput' ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                            <MessageSquare size={11} /> Caption Draft
                                        </div>
                                        <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto pr-2">
                                            {selectedRow.captionOutput ?? <span className="text-slate-300 italic">Not generated yet</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* CTA Draft */}
                                        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-4 shadow-sm relative group/card">
                                            <button
                                                onClick={() => handleCopy('ctaOuput', selectedRow.ctaOuput)}
                                                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover/card:opacity-100"
                                            >
                                                {copiedField === 'ctaOuput' ? <Check size={11} /> : <Copy size={11} />}
                                            </button>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                                <Target size={11} /> Suggested CTA
                                            </div>
                                            <div className="text-sm font-bold text-slate-700">
                                                {selectedRow.ctaOuput ?? <span className="text-slate-300 italic font-normal">—</span>}
                                            </div>
                                        </div>
                                        {/* Hashtags Draft */}
                                        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-4 shadow-sm relative group/card">
                                            <button
                                                onClick={() => handleCopy('hastagsOutput', selectedRow.hastagsOutput)}
                                                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover/card:opacity-100"
                                            >
                                                {copiedField === 'hastagsOutput' ? <Check size={11} /> : <Copy size={11} />}
                                            </button>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                                <TagIcon size={11} /> Hashtag Draft
                                            </div>
                                            <div className="text-sm font-medium text-slate-600 line-clamp-4">
                                                {selectedRow.hastagsOutput ?? <span className="text-slate-300 italic font-normal">—</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </details>
                            {/* Comments Section */}
                            <div className="pt-8 border-t border-slate-200 mt-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <MessageCircle size={13} />
                                        Team Discussions
                                    </div>
                                    {totalComments > 5 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fetchComments(commentPage - 1)}
                                                disabled={commentPage === 1 || isLoadingComments}
                                                className="p-1 px-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Page {commentPage} / {Math.ceil(totalComments / 5)}
                                            </span>
                                            <button
                                                onClick={() => fetchComments(commentPage + 1)}
                                                disabled={commentPage >= Math.ceil(totalComments / 5) || isLoadingComments}
                                                className="p-1 px-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Comment Input */}
                                    <form onSubmit={handleAddComment} className="relative">
                                        <textarea
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-14 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none min-h-[100px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment(e);
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newCommentText.trim() || isPostingComment}
                                            className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            {isPostingComment ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                        </button>
                                    </form>

                                    {/* comments List */}
                                    <div className="space-y-4">
                                        {isLoadingComments ? (
                                            <div className="space-y-4">
                                                {[...Array(2)].map((_, i) => (
                                                    <div key={i} className="animate-pulse flex gap-3">
                                                        <div className="w-8 h-8 bg-slate-100 rounded-full" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-2 bg-slate-50 rounded w-1/4" />
                                                            <div className="h-10 bg-slate-50 rounded" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : comments.length > 0 ? (
                                            comments.map((comment) => (
                                                <div key={comment.id} className="flex gap-4 group/comment">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 uppercase shadow-sm">
                                                        {comment.actorName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-900">{comment.actorName}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {new Date(comment.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            {/* Delete button — only if user matches (handled by backend too) */}
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="opacity-0 group-hover/comment:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                {comment.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                                                <MessageSquare size={24} className="mb-2 opacity-20" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">No comments yet</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Stream — Moved from sidebar */}
                            <div className="pt-8 border-t border-slate-200 mt-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Clock size={13} />
                                        Activity Stream
                                    </div>
                                    {totalLogs > 5 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fetchLogs(logPage - 1)}
                                                disabled={logPage === 1 || isLoadingLogs}
                                                className="p-1 px-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Page {logPage} / {Math.ceil(totalLogs / 5)}
                                            </span>
                                            <button
                                                onClick={() => fetchLogs(logPage + 1)}
                                                disabled={logPage >= Math.ceil(totalLogs / 5) || isLoadingLogs}
                                                className="p-1 px-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                    {isLoadingLogs ? (
                                        <div className="flex flex-col gap-4">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 pl-8 py-2 animate-pulse">
                                                    <div className="w-2 h-2 bg-slate-200 rounded-full" />
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-2 bg-slate-50 rounded w-1/4" />
                                                        <div className="h-2 bg-slate-50 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : logs.length > 0 ? (
                                        logs.map((log, idx) => (
                                            <div key={idx} className="relative pl-8 group">
                                                <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 group-hover:border-blue-200 transition-colors">
                                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-blue-500 transition-colors" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-[11px] font-bold text-slate-700 leading-tight">
                                                        {log.action === 'STATUS_CHANGE' ? (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-slate-500">Status updated</span>
                                                                {log.metadata?.oldStatus && log.metadata?.newStatus && (
                                                                    <div className="flex items-center gap-1.5 py-0.5">
                                                                        <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded leading-none line-through opacity-70">
                                                                            {getStatusValue(log.metadata.oldStatus)}
                                                                        </span>
                                                                        <ArrowRight size={10} className="text-slate-300" />
                                                                        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded leading-none">
                                                                            {getStatusValue(log.metadata.newStatus)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            getStatusValue(log.action)
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                                                        {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        {log.actorEmail && (
                                                            <>
                                                                <div className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
                                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                                                                    {log.actorEmail.split('@')[0]}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="pl-8 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic" id="empty-activity-stream">
                                            No activity recorded
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-[320px] border-l border-slate-200 bg-white overflow-y-auto p-6 space-y-6 flex-shrink-0">


                            {/* Tags */}
                            <div className="space-y-3 pt-2">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TagIcon size={13} />
                                        Tags
                                    </div>
                                    <button
                                        onClick={() => setIsAddingTag(!isAddingTag)}
                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                                    >
                                        {isAddingTag ? <X size={14} /> : <Plus size={14} />}
                                    </button>
                                </div>

                                {isAddingTag && (
                                    <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm animate-in fade-in zoom-in-95 duration-200 mb-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Create New Tag</div>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Tag name..."
                                                value={newTagName}
                                                onChange={e => setNewTagName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                                            />
                                            <button
                                                onClick={handleCreateTag}
                                                disabled={isCreatingTag || !newTagName.trim()}
                                                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 min-w-[32px] flex items-center justify-center"
                                            >
                                                {isCreatingTag ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                            </button>
                                        </div>

                                        <div className="flex gap-1.5 flex-wrap mb-4 px-1">
                                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#64748b', '#000000'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedTagColor(color)}
                                                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedTagColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>

                                        {tagPool.some(t => !selectedRow.tags?.some((st: any) => st.id === t.id)) && (
                                            <>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 pt-2 border-t border-slate-100 text-center">Assign Existing</div>
                                                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                                    {tagPool.filter(t => !selectedRow.tags?.some((st: any) => st.id === t.id)).map(tag => (
                                                        <button
                                                            key={tag.id}
                                                            onClick={() => handleToggleTag(tag)}
                                                            className="px-2 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-200 hover:border-blue-200 hover:text-blue-600 transition-all"
                                                            style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}10` }}
                                                        >
                                                            {tag.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5">
                                    {selectedRow.tags?.map((tag: any) => (
                                        <div
                                            key={tag.id}
                                            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm animate-in zoom-in-95 duration-200 relative overflow-hidden"
                                            style={{
                                                color: tag.color,
                                                borderColor: `${tag.color}40`,
                                                backgroundColor: `${tag.color}15`
                                            }}
                                        >
                                            {isUpdatingTags && (
                                                <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                                                    <Loader2 size={10} className="animate-spin" />
                                                </div>
                                            )}
                                            <Hash size={10} className="opacity-50" />
                                            {tag.name}
                                            <button
                                                onClick={() => handleToggleTag(tag)}
                                                disabled={isUpdatingTags}
                                                className="ml-0.5 p-0.5 hover:bg-black/5 rounded-md transition-colors disabled:opacity-30"
                                            >
                                                <XIcon size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedRow.tags || selectedRow.tags.length === 0) && !isAddingTag && (
                                        <button
                                            onClick={() => setIsAddingTag(true)}
                                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-200 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/50 transition-all w-full justify-center"
                                        >
                                            <TagIcon size={12} />
                                            Add Tags
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Collaborators section */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <ClipboardList size={13} />
                                        Collaborators
                                    </div>
                                    <button
                                        onClick={() => setIsAddingCollaborator(!isAddingCollaborator)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all active:scale-95"
                                        title="Manage collaborators"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {isAddingCollaborator && (
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1 text-center">Assign Team Members</div>
                                        <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar overscroll-behavior-contain">
                                            {collaborators.map(c => {
                                                const isAssigned = (selectedRow.collaborators || []).some((ac: any) => ac.id === c.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleToggleCollaborator(c)}
                                                        disabled={isUpdatingCollaborators}
                                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${isAssigned
                                                            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/50'
                                                            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/10'
                                                            }`}
                                                    >
                                                        <span className="truncate pr-2">{c.email}</span>
                                                        {toggledCollaboratorId === c.id ? (
                                                            <Loader2 size={12} className="animate-spin flex-shrink-0" />
                                                        ) : isAssigned ? (
                                                            <Check size={12} className="flex-shrink-0" />
                                                        ) : (
                                                            <Plus size={12} className="flex-shrink-0 opacity-40 group-hover:opacity-100" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            {collaborators.length === 0 && (
                                                <div className="text-[10px] text-slate-400 text-center py-6 font-medium italic">
                                                    No team members found.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {selectedRow.collaborators?.map((c: any) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 shadow-sm transition-all hover:border-slate-300 group"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-white uppercase border border-white/20">
                                                {c.email?.substring(0, 1) || '?'}
                                            </div>
                                            <span className="text-[10px] font-bold truncate max-w-[80px]">{c.email}</span>
                                            <button
                                                onClick={() => handleToggleCollaborator(c)}
                                                className="p-0.5 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-rose-500"
                                            >
                                                <XIcon size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedRow.collaborators || selectedRow.collaborators.length === 0) && !isAddingCollaborator && (
                                        <button
                                            onClick={() => setIsAddingCollaborator(true)}
                                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-200 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/50 transition-all w-full justify-center"
                                        >
                                            <ClipboardList size={12} />
                                            Assign Collaborators
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content Strategy Metadata */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                                    <Target size={13} />
                                    Post Information
                                </div>
                                <div className="bg-indigo-50/30 rounded-2xl p-4 space-y-4 border border-indigo-100/50 shadow-sm shadow-indigo-100/10">
                                    {[
                                        { label: 'Primary Goal', value: selectedRow.primaryGoal, key: 'primaryGoal', description: 'The core objective of this content piece' },
                                        { label: 'Target Audience', value: selectedRow.targetAudience, key: 'targetAudience', description: 'Who this post is specifically for' },
                                        { label: 'CTA', value: selectedRow.cta, key: 'cta', description: 'The primary action we want users to take' },
                                        { label: 'Framework', value: selectedRow.frameworkUsed, key: 'frameworkUsed', description: 'The structural approach (e.g., AIDA, PAS)' },
                                        { label: 'Content Type', value: selectedRow.contentType, key: 'contentType', description: 'Format of the final delivery' },
                                    ].map((item, i) => (
                                        <div key={i} className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</div>
                                                <div className="text-[8px] font-medium text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block pl-2">{item.description}</div>
                                            </div>
                                            {isEditingInputs && item.key ? (
                                                <input
                                                    type="text"
                                                    value={editedValues[item.key] || ''}
                                                    onChange={e => setEditedValues({ ...editedValues, [item.key!]: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 shadow-sm"
                                                />
                                            ) : (
                                                <div className="text-xs font-bold text-slate-800 break-words leading-relaxed pl-1 border-l-2 border-indigo-200/50 ml-1">
                                                    {item.value || (
                                                        <span className="text-slate-300 font-medium italic">Not defined</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="pt-2 border-t border-slate-100/50 mt-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Other Execution Details</div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            {[
                                                { label: 'Theme', value: selectedRow.theme, key: 'theme' },
                                                { label: 'Date', value: selectedRow.date, key: 'date' },
                                                { label: 'Brand Highlight', value: selectedRow.brandHighlight, key: 'brandHighlight' },
                                                { label: 'Promo Type', value: selectedRow.promoType, key: 'promoType' },
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</div>
                                                    {isEditingInputs && item.key ? (
                                                        <input
                                                            type={item.key === 'date' ? 'date' : 'text'}
                                                            value={editedValues[item.key] || ''}
                                                            onChange={e => setEditedValues({ ...editedValues, [item.key!]: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                        />
                                                    ) : (
                                                        <div className="text-[10px] font-bold text-slate-700 truncate">{item.value || '—'}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {isEditingInputs ? (
                                        <div className="flex gap-2 pt-4">
                                            <button
                                                onClick={handleSaveInputs}
                                                disabled={isSavingInputs}
                                                className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md shadow-indigo-100"
                                            >
                                                {isSavingInputs ? 'Saving...' : 'Save Details'}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingInputs(false)}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleStartEditing}
                                            disabled={isLockedInModal}
                                            className={`w-full py-2 border border-dashed rounded-xl text-[10px] font-black uppercase transition-all mt-4 ${isLockedInModal
                                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                : 'border-indigo-200 text-indigo-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm shadow-indigo-50/30'
                                                }`}
                                        >
                                            {isLockedInModal ? 'Locked (Needs Access)' : 'Update Metadata'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-6 bg-slate-50/30">
                        <button
                            type="button"
                            disabled={isGeneratingCaption || isLockedInModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={async () => {
                                if (!selectedRow) return;

                                const proceed = await requestConfirm({
                                    title: 'Generate & Review Caption?',
                                    description: "This will trigger AI generation followed by an automatic review. The final caption will be ready for your approval once finished.",
                                    confirmLabel: 'Generate & Review',
                                    cancelLabel: 'Go back',
                                });
                                if (!proceed) return;

                                setIsGeneratingCaption(true);
                                try {
                                    const genRes = await authedFetch(
                                        `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-caption`,
                                        {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                        },
                                    );

                                    const genData = await genRes.json().catch(() => ({}));

                                    if (!genRes.ok) {
                                        if (genRes.status === 409) {
                                            notify(
                                                genData.error || 'Generation is already running or completed.',
                                                'info',
                                            );
                                        } else {
                                            notify(genData.error || 'Failed to generate caption.', 'error');
                                        }
                                    } else {
                                        notify('Generation & Review started.', 'success');
                                    }
                                } catch (err) {
                                    console.error('Failed to call generation endpoint', err);
                                    notify('Failed to trigger generation. Check console for details.', 'error');
                                } finally {
                                    await refreshCalendarRow(selectedRow.contentCalendarId);
                                    setIsGeneratingCaption(false);
                                }
                            }}
                        >
                            {isGeneratingCaption ? 'Generating…' : 'Generate & Review'}
                            {isGeneratingCaption && (
                                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                        </button>

                        {getStatusValue(selectedRow.status).trim().toLowerCase() === 'needs revision' && (
                            <button
                                type="button"
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ${selectedRow.captionOutput
                                    ? 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
                                    : 'bg-white text-brand-dark border border-slate-200/70 opacity-40'
                                    }`}
                                disabled={
                                    isManualApproving ||
                                    isLockedInModal ||
                                    !selectedRow.captionOutput
                                }
                                onClick={async () => {
                                    if (!selectedRow) return;

                                    const proceed = await requestConfirm({
                                        title: 'Manual Approval',
                                        description: "You're about to manually approve this content. This will set the status to 'Approved' and copy the generated outputs into the final fields.",
                                        confirmLabel: 'Approve Manually',
                                        cancelLabel: 'Cancel',
                                    });
                                    if (!proceed) return;

                                    setIsManualApproving(true);
                                    try {
                                        const res = await authedFetch(
                                            `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`,
                                            {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    status: {
                                                        state: 'Approved',
                                                        updatedAt: new Date().toISOString(),
                                                        by: 'user_manual',
                                                    },
                                                    reviewDecision: 'APPROVED',
                                                    finalCaption: selectedRow.captionOutput,
                                                    finalCTA: selectedRow.ctaOuput || selectedRow.cta,
                                                    finalHashtags: selectedRow.hastagsOutput,
                                                    reviewNotes: 'Manually approved by user',
                                                }),
                                            },
                                        );

                                        if (!res.ok) {
                                            const data = await res.json().catch(() => ({}));
                                            notify(data.error || 'Failed to approve manually.', 'error');
                                            return;
                                        }

                                        notify('Content manually approved.', 'success');
                                        await refreshCalendarRow(selectedRow.contentCalendarId);
                                    } catch (err) {
                                        console.error('Manual approve error:', err);
                                        notify('Failed to approve manually.', 'error');
                                    } finally {
                                        setIsManualApproving(false);
                                    }
                                }}
                            >
                                {isManualApproving ? 'Approving…' : 'Approve Manually'}
                                {isManualApproving && (
                                    <span className="inline-block w-3 h-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ${hasCaptionContent
                                ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                                : 'bg-white text-brand-dark border border-slate-200/70 opacity-40'
                                }`}
                            disabled={!hasCaptionContent}
                            onClick={() => {
                                if (!hasCaptionContent) return;

                                const companyId = selectedRow?.companyId ?? activeCompanyId;
                                if (companyId) {
                                    onClose();
                                    navigate(`/company/${encodeURIComponent(companyId)}/image-hub?id=${selectedRow.contentCalendarId}`);
                                }
                            }}
                        >
                            <Wand2 size={16} />
                            Open in Image Hub
                        </button>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightbox / Fullscreen Image Overlay */}
            {isFullscreenImage && getImageGeneratedUrl(selectedRow) && (
                <div
                    className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-20 animate-in fade-in duration-300"
                    onClick={() => setIsFullscreenImage(false)}
                >
                    <button
                        onClick={() => setIsFullscreenImage(false)}
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[310]"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={`${getImageGeneratedUrl(selectedRow)}${getImageGeneratedUrl(selectedRow)?.includes('?') ? '&' : '?'}v=${imagePreviewNonce}`}
                        alt="Fullscreen view"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500"
                    />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full backdrop-blur-md">
                        Press anywhere to close
                    </div>
                </div>
            )}
        </div>
    );
}

function statusKey(status: string) {
    return (status || "Draft").toLowerCase().replace(/\s+/g, "-");
}

function statusBadgeClasses(key: string) {
    switch (key) {
        case "approved":
            return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        case "review":
        case "needs-review":
            return "bg-yellow-400/10 text-yellow-700 border-yellow-400/20";
        case "design-complete":
        case "design-completed":
            return "bg-blue-400/10 text-blue-700 border-blue-400/20";
        case "generating":
        case "generate":
            return "bg-indigo-400/10 text-indigo-600 border-indigo-400/20 animate-pulse";
        case "pending":
            return "bg-orange-500/10 text-orange-700 border-orange-500/20";
        case "published":
            return "bg-blue-500/10 text-blue-600 border-blue-500/20";
        default:
            return "bg-slate-300/20 text-slate-600 border-slate-300/30";
    }
}
