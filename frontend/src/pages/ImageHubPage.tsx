import React, { useState, useEffect, useMemo } from 'react';
import {
    Image,
    Sparkles,
    Wand2,
    Copy,
    Pencil,
    Settings2,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    History,
    Search,
    Filter,
    ArrowRight,
    Layout,
    X,
    EyeOff,
    HelpCircle,
    ArrowLeft,
    Maximize2,
    MousePointer2,
    RefreshCw,
    Download
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface ImageHubPageProps {
    calendarRows: any[];
    setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    activeCompanyId?: string;
    brandKbId: string | null;
    systemInstruction: string;
    backendBaseUrl: string;
    getStatusValue: (status: any) => string;
    getImageGeneratedUrl: (row: any | null) => string | null;
    getImageGeneratedSignature: (row: any | null) => string | null;
    requestConfirm: (config: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
    }) => Promise<boolean>;
    setSelectedRow: React.Dispatch<React.SetStateAction<any | null>>;
}

export function ImageHubPage({
    calendarRows,
    setCalendarRows,
    authedFetch,
    notify,
    activeCompanyId,
    brandKbId,
    systemInstruction,
    backendBaseUrl,
    getStatusValue,
    getImageGeneratedUrl,
    getImageGeneratedSignature,
    requestConfirm,
    setSelectedRow
}: ImageHubPageProps) {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [dmpDraft, setDmpDraft] = useState('');
    const [isEditingDmp, setIsEditingDmp] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [provider, setProvider] = useState<'google' | 'replicate' | 'fal'>('fal');
    const [selectedModel, setSelectedModel] = useState('fal-ai/nano-banana-pro');
    const [imagePreviewNonce, setImagePreviewNonce] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [searchParams] = useSearchParams();

    // Persist dismissed IDs in localStorage
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('imageHubDismissedIds') || '[]');
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('imageHubDismissedIds', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    const ALL_MODELS = [
        { id: 'fal-ai/nano-banana-pro', name: 'Google Nano Banana Pro', provider: 'fal', group: 'Fal.ai' },
        { id: 'google-imagen', name: 'Google Imagen', provider: 'google', group: 'Google' },
        { id: 'imagineart/imagineart-1.5-preview/text-to-image', name: 'Imagine Art', provider: 'fal', group: 'Fal.ai' },
    ];

    const approvedRows = useMemo(() => {
        return calendarRows.filter(row => {
            const status = getStatusValue(row.status).toLowerCase();
            return status === 'approved' || status === 'design completed' || status === 'design-completed' || status === 'design-complete';
        }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [calendarRows, getStatusValue]);

    const activeQueueRows = useMemo(() => {
        // Filter out dismissed items, but ALWAYS show the explicitly selected one from URL/Editor
        return approvedRows.filter(row => {
            if (row.contentCalendarId === selectedRowId) return true;
            return !dismissedIds.includes(row.contentCalendarId);
        });
    }, [approvedRows, dismissedIds, selectedRowId]);

    const filteredRows = useMemo(() => {
        if (!searchQuery.trim()) return activeQueueRows;
        return activeQueueRows.filter(row =>
            (row.theme || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.finalCaption || row.captionOutput || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeQueueRows, searchQuery]);

    const selectedRow = useMemo(() => {
        const row = approvedRows.find(r => r.contentCalendarId === selectedRowId) || null;
        // Sync with global state so AI Assistant knows which row is active
        return row;
    }, [approvedRows, selectedRowId]);

    // Lift state to App.tsx whenever selectedRow changes
    useEffect(() => {
        setSelectedRow(selectedRow);
    }, [selectedRow, setSelectedRow]);

    const handleDownload = async () => {
        const imageUrl = getImageGeneratedUrl(selectedRow);
        if (!imageUrl) return;

        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `brand_image_${selectedRow.contentCalendarId.slice(0, 8)}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            notify('Download started!', 'success');
        } catch (e) {
            console.error(e);
            notify('Failed to download image', 'error');
        }
    };

    // Track last ID to avoid selection lock and unnecessary resets
    const [lastId, setLastId] = useState<string | null>(null);
    const [lastUrlId, setLastUrlId] = useState<string | null>(null);

    // Initial item selection & URL Handling
    useEffect(() => {
        const urlId = searchParams.get('id');

        // Priority 1: New URL ID detected
        if (urlId && urlId !== lastUrlId) {
            if (dismissedIds.includes(urlId)) {
                setDismissedIds(prev => prev.filter(id => id !== urlId));
            }
            setSelectedRowId(urlId);
            setLastId(urlId);
            setLastUrlId(urlId);
            return;
        }

        // Priority 2: Auto-select first item if none selected
        if (!selectedRowId && activeQueueRows.length > 0) {
            const firstId = activeQueueRows[0].contentCalendarId;
            setSelectedRowId(firstId);
            setLastId(firstId);
        }
    }, [activeQueueRows, selectedRowId, searchParams, dismissedIds, lastUrlId]);

    // Handle row selection change - Only reset when switching DIFFERENT items
    useEffect(() => {
        if (!selectedRow) return;
        if (selectedRow.contentCalendarId !== lastId) {
            setDmpDraft(selectedRow.dmp || '');
            setIsEditingDmp(false);
            setLastId(selectedRow.contentCalendarId);
        } else if (!isEditingDmp) {
            if (selectedRow.dmp !== dmpDraft) {
                setDmpDraft(selectedRow.dmp || '');
            }
        }
    }, [selectedRow, lastId, isEditingDmp, dmpDraft]);

    const handleSaveDmp = async () => {
        if (!selectedRow) return;
        const trimmedDmp = dmpDraft.trim();
        if (!trimmedDmp) {
            notify('Design Style Guide cannot be empty.', 'error');
            return;
        }

        setIsGeneratingImage(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dmp: trimmedDmp,
                    provider,
                    model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined
                }),
            });
            if (!res.ok) {
                notify('Failed to save Visual Style Guide.', 'error');
                setIsGeneratingImage(false);
                return;
            }
            // Update local state
            setCalendarRows(prev => prev.map(r =>
                r.contentCalendarId === selectedRow.contentCalendarId ? { ...r, dmp: trimmedDmp } : r
            ));
            setIsEditingDmp(false);
            notify('Visual Style Guide saved.', 'success');
        } catch (err) {
            notify('Error saving style info.', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateStyleGuide = async (silent = false) => {
        if (!selectedRow) return null;

        if (!silent) setIsGeneratingImage(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-dmp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemInstruction }),
            });

            if (res.ok) {
                const data = await res.json();
                setDmpDraft(data.dmp);
                // Update local rows
                setCalendarRows(prev => prev.map(r =>
                    r.contentCalendarId === selectedRow.contentCalendarId ? { ...r, dmp: data.dmp } : r
                ));
                if (!silent) notify('Visual Style Guide generated!', 'success');
                return data.dmp;
            } else {
                if (!silent) notify('Failed to generate Style Guide.', 'error');
                return null;
            }
        } catch (err) {
            if (!silent) notify('Error generating Style Guide.', 'error');
            return null;
        } finally {
            if (!silent) setIsGeneratingImage(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedRow || !activeCompanyId || !brandKbId) {
            notify('Please ensure company and brand info are loaded.', 'error');
            return;
        }

        if (isEditingDmp) {
            notify('Please save or cancel edits first.', 'error');
            return;
        }

        setIsGeneratingImage(true);
        try {
            // Step 2: Generate Image
            const response = await authedFetch(
                `${backendBaseUrl}/api/content-calendar/batch-generate-image`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rowIds: [selectedRow.contentCalendarId],
                        brandKbId,
                        systemInstruction: systemInstruction ?? '',
                        provider,
                        model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined
                    }),
                }
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                notify(`Image generation failed. ${data.error || ''}`, 'error');
            } else {
                notify('Image generation started! This may take a few moments.', 'success');
            }
        } catch (err) {
            notify('Network error triggering image generation.', 'error');
        } finally {
            setTimeout(() => setIsGeneratingImage(false), 2000);
        }
    };

    const handleDismissItem = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDismissedIds(prev => [...new Set([...prev, id])]);
        if (selectedRowId === id) {
            // Find next available row in activeQueue
            const remaining = activeQueueRows.filter(r => r.contentCalendarId !== id);
            if (remaining.length > 0) {
                setSelectedRowId(remaining[0].contentCalendarId);
            } else {
                setSelectedRowId(null);
            }
        }
    };

    return (
        <main className="flex-1 bg-gray-50/50 p-2.5 md:p-6 min-h-0 relative flex flex-col overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-12%] left-[5%] w-[38%] h-[38%] bg-gradient-to-br from-[#6fb6e8]/18 to-[#81bad1]/14 rounded-full blur-[95px] animate-pulse" />
                <div className="absolute bottom-[-8%] right-[8%] w-[35%] h-[35%] bg-gradient-to-tl from-[#a78bfa]/14 to-[#3fa9f5]/12 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '900ms' }} />
            </div>

            <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
                {/* Header */}
                <header className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden flex-shrink-0">
                    <Sparkles className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
                            Aesthetics & Visuals
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Image Hub</h2>
                        <p className="mt-1 text-sm font-medium text-slate-400">Refine your design prompts and generate stunning AI visuals for approved content.</p>
                    </div>

                    <div className="hidden lg:flex items-center gap-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Workflow</span>
                                <span className="text-xs font-bold text-white uppercase">2-Step Process</span>
                            </div>
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 gap-1">
                                <div className={`px-3 py-1.5 ${!selectedRow?.dmp ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'} text-[10px] font-black rounded-xl transition-all duration-300`}>1. PROMPT</div>
                                <ArrowRight size={14} className="text-white/20" />
                                <div className={`px-3 py-1.5 ${selectedRow?.dmp ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'} text-[10px] font-black rounded-xl transition-all duration-300`}>2. GENERATE</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: Queue */}
                    <aside className="w-80 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search queue..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                <span>Approved Queue ({filteredRows.length})</span>
                                {dismissedIds.length > 0 && (
                                    <button
                                        onClick={() => setDismissedIds([])}
                                        className="text-[9px] text-blue-500 hover:text-blue-700 font-bold underline transition-colors"
                                    >
                                        Restore all
                                    </button>
                                )}
                            </div>
                            {filteredRows.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                        <Filter size={20} />
                                    </div>
                                    <p className="text-xs text-slate-400 italic">No approved items found.</p>
                                </div>
                            ) : (
                                filteredRows.map(row => {
                                    const isActive = row.contentCalendarId === selectedRowId;
                                    const status = getStatusValue(row.status).toLowerCase();
                                    const isDone = status === 'design completed' || status === 'design-completed' || status === 'design-complete';

                                    return (
                                        <button
                                            key={row.contentCalendarId}
                                            onClick={() => setSelectedRowId(row.contentCalendarId)}
                                            className={`w-full text-left p-3 rounded-2xl transition-all group relative ${isActive
                                                ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg scale-[1.02] z-10'
                                                : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {row.date ? new Date(row.date).toLocaleDateString() : 'No date'}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {isDone && <CheckCircle2 size={12} className={isActive ? 'text-white' : 'text-emerald-500'} />}
                                                    <div
                                                        onClick={(e) => handleDismissItem(row.contentCalendarId, e)}
                                                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10`}
                                                        title="Dismiss from Hub"
                                                    >
                                                        <X size={12} className={isActive ? 'text-white' : 'text-slate-400'} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                                    {row.theme || 'Untiteld Theme'}
                                                </div>
                                            </div>
                                            <div className={`text-[10px] truncate opacity-70 ${isActive ? 'text-blue-50' : 'text-slate-500'}`}>
                                                {row.contentType} • {row.channels ? (Array.isArray(row.channels) ? row.channels[0] : row.channels) : 'N/A'}
                                            </div>
                                            {isActive && (
                                                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full blur-[2px]" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* Main Content: Editor */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 md:p-8">
                        {selectedRow ? (
                            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Left Col: Prompting */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-fit relative">
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl relative">
                                                    <Wand2 size={18} />
                                                    <div className="absolute -top-1 -left-1 flex items-center justify-center w-4 h-4 bg-blue-600 text-[10px] font-black text-white rounded-full">1</div>
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                                                        Visual Style Guide
                                                        <button
                                                            onClick={() => notify('The Style Guide (DMP) tells the AI exactly how the image should look based on your brand rules.', 'info')}
                                                            className="text-slate-300 hover:text-blue-500 transition-colors"
                                                        >
                                                            <HelpCircle size={14} />
                                                        </button>
                                                    </h2>
                                                    <p className="text-[10px] font-medium text-slate-400 -mt-1 uppercase tracking-tight">Step 1: Refine the vision</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleGenerateStyleGuide()}
                                                    disabled={isGeneratingImage}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Regenerate Style Guide"
                                                >
                                                    <RefreshCw size={16} className={isGeneratingImage ? 'animate-spin' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(dmpDraft);
                                                        notify('Style instructions copied!', 'success');
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                                    title="Copy Prompt"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingDmp(!isEditingDmp)}
                                                    className={`p-1.5 rounded-lg transition-colors border ${isEditingDmp ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-transparent hover:border-slate-200'}`}
                                                    title="Edit Mode"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="relative group min-h-[400px]">
                                                <textarea
                                                    value={dmpDraft}
                                                    onChange={(e) => setDmpDraft(e.target.value)}
                                                    readOnly={!isEditingDmp}
                                                    className={`w-full min-h-[400px] p-5 rounded-2xl font-mono text-sm border-2 outline-none transition-all resize-none shadow-inner ${isEditingDmp
                                                        ? 'border-blue-500/30 bg-white ring-8 ring-blue-500/[0.03]'
                                                        : 'border-slate-100 bg-slate-50/50 text-slate-600'
                                                        }`}
                                                    placeholder="The Design Style Guide will appear here..."
                                                />
                                                {!isEditingDmp && dmpDraft && (
                                                    <div className="absolute inset-0 w-full h-full bg-slate-900/0 hover:bg-slate-900/[0.02] flex items-center justify-center opacity-0 hover:opacity-100 transition-all rounded-2xl group-hover:scale-[0.99] pointer-events-none">
                                                        <button
                                                            onClick={() => setIsEditingDmp(true)}
                                                            className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-600 pointer-events-auto"
                                                        >
                                                            <Pencil size={14} />
                                                            Click to Edit
                                                        </button>
                                                    </div>
                                                )}

                                                {!dmpDraft && !isGeneratingImage && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 rounded-2xl border border-dashed border-slate-200 animate-in fade-in duration-500">
                                                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-blue-500 border border-slate-100">
                                                            <Wand2 size={24} />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-900 mb-1">Missing Style Guide</h4>
                                                        <p className="text-[11px] text-slate-500 max-w-xs mb-6 font-medium">
                                                            You haven't defined the visual style for this content yet. Let our AI handle the translation of your brand kit into a design prompt.
                                                        </p>
                                                        <button
                                                            onClick={() => handleGenerateStyleGuide()}
                                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            <RefreshCw size={14} />
                                                            Generate Style Guide
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditingDmp && (
                                                <div className="mt-4 flex items-center justify-end gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingDmp(false);
                                                            setDmpDraft(selectedRow.dmp || '');
                                                        }}
                                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 underline underline-offset-4"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveDmp}
                                                        disabled={isGeneratingImage}
                                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {isGeneratingImage ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Context Panel */}
                                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                            <Layout size={80} />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            Design Context
                                        </h3>
                                        <div className="space-y-4 relative z-10">
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                                    <ArrowRight size={10} className="text-blue-500" />
                                                    Original Theme
                                                </div>
                                                <div className="text-lg font-black leading-tight italic">"{selectedRow.theme}"</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Audience</div>
                                                    <div className="text-xs font-semibold text-slate-200">{selectedRow.targetAudience || 'General'}</div>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Primary Goal</div>
                                                    <div className="text-xs font-semibold text-slate-200">{selectedRow.primaryGoal || 'Engagement'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Preview & Actions */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col h-fit">
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl relative">
                                                    <Image size={18} />
                                                    <div className="absolute -top-1 -left-1 flex items-center justify-center w-4 h-4 bg-purple-600 text-[10px] font-black text-white rounded-full">2</div>
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                        Visual Output
                                                    </h2>
                                                    <p className="text-[10px] font-medium text-slate-400 -mt-1 uppercase tracking-tight">Step 2: Generate Vision</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedModel}
                                                    onChange={(e) => {
                                                        const m = ALL_MODELS.find(x => x.id === e.target.value);
                                                        if (m) {
                                                            setSelectedModel(m.id);
                                                            setProvider(m.provider as any);
                                                        }
                                                    }}
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer hover:bg-white transition-all shadow-sm"
                                                >
                                                    {ALL_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col items-center justify-center bg-slate-100/30 min-h-[400px] relative overflow-hidden rounded-2xl">
                                            {/* Design Pattern Grid (Subtle) */}
                                            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '16px 16px' }} />

                                            {getImageGeneratedUrl(selectedRow) ? (
                                                <div className="relative group/preview w-full flex items-center justify-center z-10">
                                                    <img
                                                        src={`${getImageGeneratedUrl(selectedRow)}?v=${imagePreviewNonce}`}
                                                        alt="Preview"
                                                        className="max-w-full max-h-[600px] rounded-2xl shadow-premium-lg object-contain bg-white transition-all duration-500 relative z-10"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 opacity-0 group-hover/preview:opacity-100 transition-opacity z-40">
                                                        <button
                                                            onClick={() => setIsZoomModalOpen(true)}
                                                            className="px-4 py-2 bg-white text-slate-900 text-[10px] font-bold rounded-full shadow-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <Maximize2 size={12} />
                                                            Expand
                                                        </button>
                                                        <button
                                                            onClick={handleDownload}
                                                            className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-full backdrop-blur-md flex items-center gap-2 shadow-xl hover:bg-blue-700 transition-colors pointer-events-auto"
                                                        >
                                                            <Download size={12} />
                                                            Download
                                                        </button>
                                                        <button
                                                            onClick={() => setImagePreviewNonce(n => n + 1)}
                                                            className="px-4 py-2 bg-slate-900/80 text-white text-[10px] font-bold rounded-full backdrop-blur-md flex items-center gap-2 shadow-xl hover:bg-slate-900 transition-colors pointer-events-auto"
                                                        >
                                                            <History size={12} />
                                                            Refresh
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-12 max-w-sm relative z-10">
                                                    <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
                                                        <Image size={32} strokeWidth={1} />
                                                    </div>
                                                    <h3 className="text-slate-900 font-bold mb-2">Ready to Design?</h3>
                                                    <p className="text-xs text-slate-500 leading-relaxed font-semibold italic opacity-80 mb-6">
                                                        Visual instructions are ready. Click the button below to bring this concept to life.
                                                    </p>
                                                    <div className="flex items-center justify-center animate-bounce text-blue-400">
                                                        <ArrowRight size={20} className="rotate-90" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-8 border-t border-slate-100 bg-white">
                                            <div className="flex gap-3 mb-4">
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={isGeneratingImage || isEditingDmp || !dmpDraft.trim()}
                                                    className="flex-1 py-4 bg-[#3fa9f5] text-white rounded-2xl text-base font-black shadow-lg shadow-blue-200/50 hover:bg-[#2f97e6] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                                                    title={!dmpDraft.trim() ? "Generate Style Guide first (Step 1)" : "Create high-res visual"}
                                                >
                                                    {isGeneratingImage ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wand2 size={20} />
                                                            Generate Visual
                                                        </>
                                                    )}
                                                </button>
                                                {getImageGeneratedUrl(selectedRow) && (
                                                    <button
                                                        onClick={() => handleDismissItem(selectedRow.contentCalendarId)}
                                                        className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                                                        title="Satisfied? Dismiss from queue"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        Finish
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 py-2 rounded-lg border border-slate-100">
                                                <div className="p-1 bg-white rounded-md border shadow-sm">
                                                    <Layout size={10} className="text-blue-500" />
                                                </div>
                                                Moves to <span className="text-blue-600">Studio</span> for final posting
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Settings */}
                                    <div className="bg-slate-50/50 rounded-3xl border border-slate-200/30 overflow-hidden">
                                        <button
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Settings2 size={16} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Advanced Settings</span>
                                            </div>
                                            {showAdvanced ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </button>

                                        {showAdvanced && (
                                            <div className="px-6 pb-6 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Engine Provider</label>
                                                    <div className="flex bg-white p-1 rounded-xl border border-slate-200/50">
                                                        {['fal', 'google'].map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => setProvider(p as any)}
                                                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${provider === p ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                                                    }`}
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        onClick={async () => {
                                                            const proceed = await requestConfirm({
                                                                title: 'Reset Visual Style?',
                                                                description: 'This will replace the current visual instructions with fresh ones from our AI. You will lose manual edits.',
                                                                confirmLabel: 'Reset',
                                                                cancelLabel: 'Keep Current'
                                                            });
                                                            if (!proceed) return;
                                                            handleGenerateStyleGuide();
                                                        }}
                                                        className="w-full py-2.5 rounded-xl border border-rose-200 text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        Force Style Reset
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm max-w-4xl mx-auto relative overflow-hidden">
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] text-blue-50 opacity-[0.4] pointer-events-none" />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-sm">
                                        <MousePointer2 size={48} className="text-blue-500/30 animate-pulse" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Ready to Start Designing?</h2>
                                    <p className="text-slate-500 max-w-sm font-medium mb-8">
                                        Select an approved content item from the sidebar to begin generating stunning visuals.
                                    </p>
                                    <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-3xl border border-blue-100">
                                        <ArrowLeft className="text-blue-500 animate-bounce-x" />
                                        <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Select an item to begin</span>
                                    </div>

                                    {dismissedIds.length > 0 && (
                                        <button
                                            onClick={() => setDismissedIds([])}
                                            className="mt-12 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"
                                        >
                                            <History size={16} />
                                            Restore finished items
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Lightbox / Zoom Modal */}
            {isZoomModalOpen && getImageGeneratedUrl(selectedRow) && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
                    onClick={() => setIsZoomModalOpen(false)}
                >
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />

                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-20 shadow-2xl"
                        onClick={() => setIsZoomModalOpen(false)}
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="relative z-10 max-w-7xl w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={getImageGeneratedUrl(selectedRow)!}
                            alt="Visual Detail"
                            className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500"
                        />

                        <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Theme</span>
                                <span className="text-sm font-bold text-white truncate max-w-sm">{selectedRow?.theme}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                            >
                                <Download size={14} />
                                Download High-Res
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
