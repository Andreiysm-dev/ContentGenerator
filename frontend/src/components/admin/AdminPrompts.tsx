import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    MessageSquare,
    Search,
    RotateCcw,
    Save,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Prompt {
    key: string;
    value: string;
    description?: string;
    category?: string;
}

interface AdminPromptsProps {
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    caption: { label: 'Caption Generation', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    review: { label: 'Content Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    image: { label: 'Image Generation', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    brand: { label: 'Brand Rules', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    general: { label: 'General', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

function stripCategory(key: string): string {
    // Remove category prefix from DB key for a nicer display name
    return key
        .replace(/^(caption_|review_|image_generation_|brand_)/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

export const AdminPrompts: React.FC<AdminPromptsProps> = ({
    authedFetch,
    backendBaseUrl,
    notify,
}) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    // `loading` = true only for the very first fetch (blank-screen spinner).
    // `refreshing` = true for subsequent manual reloads (subtle indicator, no content flash).
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [resetting, setResetting] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [preview, setPreview] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState('');
    const hasLoadedOnce = useRef(false);

    // Keep all props in refs so fetchPrompts can have a [] dep array
    // and never gets recreated on parent re-renders.
    const authedFetchRef = useRef(authedFetch);
    const backendBaseUrlRef = useRef(backendBaseUrl);
    const notifyRef = useRef(notify);
    useEffect(() => {
        authedFetchRef.current = authedFetch;
        backendBaseUrlRef.current = backendBaseUrl;
        notifyRef.current = notify;
    });

    const fetchPrompts = useCallback(async (isManualReload = false) => {
        // Show full spinner only on first load; subsequent calls use subtle refreshing state
        if (!hasLoadedOnce.current) {
            setLoading(true);
        } else if (isManualReload) {
            setRefreshing(true);
        } else {
            // Automatic re-trigger with data already shown — do nothing visually
            return;
        }

        try {
            const res = await authedFetchRef.current(`${backendBaseUrlRef.current}/api/admin/prompts`);
            if (!res.ok) throw new Error('Failed to load prompts');
            const data = await res.json();

            const raw: Record<string, string> = data.prompts || {};

            const list: Prompt[] = Object.entries(raw).map(([key, value]) => {
                let category = 'general';
                if (key.startsWith('caption_')) category = 'caption';
                else if (key.startsWith('review_')) category = 'review';
                else if (key.startsWith('image_')) category = 'image';
                else if (
                    key.startsWith('brand_') ||
                    key.startsWith('writer_') ||
                    key.startsWith('reviewer_') ||
                    key.startsWith('visual_')
                ) category = 'brand';
                return { key, value, category };
            });

            setPrompts(list);

            // Only seed drafts on first load to avoid wiping unsaved edits on manual reload
            if (!hasLoadedOnce.current) {
                const initDrafts: Record<string, string> = {};
                for (const p of list) initDrafts[p.key] = p.value;
                setDrafts(initDrafts);

                const uniqueCats = [...new Set(list.map(p => p.category || 'general'))];
                const initCollapsed: Record<string, boolean> = {};
                uniqueCats.forEach(c => { initCollapsed[c] = true; });
                setCollapsed(initCollapsed);
            }

            hasLoadedOnce.current = true;
        } catch (err) {
            notifyRef.current('Failed to load prompt settings', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
        // Empty deps: all values are accessed via refs — this function is created once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mount-only effect: runs exactly once when the component mounts
    useEffect(() => {
        fetchPrompts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async (key: string) => {
        setSaving(key);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/prompts/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: drafts[key] }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save prompt');
            }
            // Update local state
            setPrompts(prev => prev.map(p => p.key === key ? { ...p, value: drafts[key] } : p));
            notify('Prompt saved successfully', 'success');
        } catch (err: any) {
            notify(err.message || 'Failed to save prompt', 'error');
        } finally {
            setSaving(null);
        }
    };

    const handleReset = async (key: string) => {
        if (!window.confirm(`Reset "${key}" to its hardcoded default? This will discard your custom prompt.`)) return;
        setResetting(key);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/prompts/${key}/reset`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to reset prompt');
            }
            const data = await res.json();
            const defaultValue = data.defaultValue || '';

            setDrafts(prev => ({ ...prev, [key]: defaultValue }));
            setPrompts(prev => prev.map(p => p.key === key ? { ...p, value: defaultValue } : p));
            notify('Prompt reset to default', 'success');
        } catch (err: any) {
            notify(err.message || 'Failed to reset prompt', 'error');
        } finally {
            setResetting(null);
        }
    };

    const isDirty = (key: string) => {
        const original = prompts.find(p => p.key === key)?.value ?? '';
        return drafts[key] !== original;
    };

    // Group prompts by category
    const grouped = prompts.reduce<Record<string, Prompt[]>>((acc, p) => {
        const cat = p.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {});

    const filteredGrouped = Object.entries(grouped).reduce<Record<string, Prompt[]>>((acc, [cat, items]) => {
        const filtered = items.filter(p =>
            !search ||
            p.key.toLowerCase().includes(search.toLowerCase()) ||
            (p.value || '').toLowerCase().includes(search.toLowerCase())
        );
        if (filtered.length > 0) acc[cat] = filtered;
        return acc;
    }, {});

    const toggleAll = (expand: boolean) => {
        const uniqueCats = [...new Set(prompts.map(p => p.category || 'general'))];
        const next: Record<string, boolean> = {};
        uniqueCats.forEach(c => { next[c] = !expand; });
        setCollapsed(next);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const allCollapsed = Object.values(collapsed).every(v => v);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        AI Prompt Settings
                        {refreshing && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Customize the AI prompts used across the system. Changes apply immediately.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => toggleAll(allCollapsed)}
                        className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
                    >
                        {allCollapsed ? 'Expand All' : 'Collapse All'}
                    </button>
                    <button
                        onClick={() => fetchPrompts(true)}
                        disabled={refreshing}
                        className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Reload
                    </button>
                </div>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> These prompts directly control AI behaviour. Incorrect changes may break content
                    generation. Always test in a development environment first. Unsaved changes are highlighted in orange.
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search prompts by key or content..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 outline-none transition-all"
                />
            </div>

            {/* Prompt groups (Accordion) */}
            <div className="space-y-4">
                {Object.entries(filteredGrouped).map(([cat, items]) => {
                    const meta = CATEGORY_LABELS[cat] || CATEGORY_LABELS.general;
                    const isCollapsed = collapsed[cat] ?? false;

                    return (
                        <div
                            key={cat}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isCollapsed ? 'border-slate-200' : 'border-blue-200 shadow-lg shadow-blue-500/5'
                                }`}
                        >
                            <button
                                onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !isCollapsed }))}
                                className={`w-full flex items-center justify-between px-6 py-4 transition-colors text-left group ${isCollapsed ? 'bg-slate-50/50 hover:bg-slate-50' : 'bg-blue-50/30'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${isCollapsed ? 'bg-white border border-slate-200 text-slate-400 group-hover:text-slate-600' : 'bg-blue-100/50 text-blue-600'
                                        }`}>
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-sm font-bold transition-colors ${isCollapsed ? 'text-slate-700' : 'text-blue-900'}`}>
                                                {meta.label}
                                            </h3>
                                            {items.some(p => isDirty(p.key)) && (
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            {items.length} {items.length === 1 ? 'Template' : 'Templates'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {items.some(p => isDirty(p.key)) && isCollapsed && (
                                        <span className="hidden sm:block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200">
                                            Unsaved changes
                                        </span>
                                    )}
                                    <div className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                                        <ChevronDown className={`w-5 h-5 ${isCollapsed ? 'text-slate-300' : 'text-blue-400'}`} />
                                    </div>
                                </div>
                            </button>

                            {/* Accordion Content */}
                            {!isCollapsed && (
                                <div className="divide-y divide-slate-100 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                    {items.map(prompt => {
                                        const dirty = isDirty(prompt.key);
                                        const isPreviewing = preview[prompt.key];
                                        const isSavingThis = saving === prompt.key;
                                        const isResettingThis = resetting === prompt.key;

                                        return (
                                            <div key={prompt.key} className={`p-6 transition-colors ${dirty ? 'bg-amber-50/20' : ''}`}>
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <code className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                                                                {prompt.key}
                                                            </code>
                                                            {dirty && (
                                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-1.5 py-0.5 rounded shadow-sm">
                                                                    Modified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800 mt-2">
                                                            {stripCategory(prompt.key)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setPreview(prev => ({ ...prev, [prompt.key]: !isPreviewing }))}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all font-bold"
                                                            title={isPreviewing ? 'Show editor' : 'Preview rendered'}
                                                        >
                                                            {isPreviewing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>

                                                        <button
                                                            onClick={() => handleReset(prompt.key)}
                                                            disabled={!!isResettingThis || isSavingThis}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm bg-white"
                                                        >
                                                            {isResettingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                                            Reset
                                                        </button>

                                                        <button
                                                            onClick={() => handleSave(prompt.key)}
                                                            disabled={!dirty || !!isSavingThis || !!isResettingThis}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/10"
                                                        >
                                                            {isSavingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>

                                                {isPreviewing ? (
                                                    <pre className="mt-2 p-4 bg-slate-900 text-slate-200 rounded-xl text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-96 font-mono border border-slate-700 shadow-inner">
                                                        {drafts[prompt.key]}
                                                    </pre>
                                                ) : (
                                                    <textarea
                                                        rows={12}
                                                        value={drafts[prompt.key] ?? ''}
                                                        onChange={e => setDrafts(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                                                        className={`w-full px-4 py-3 font-mono text-xs leading-relaxed border rounded-xl outline-none transition-all resize-y min-h-[120px] bg-white text-slate-800 ${dirty
                                                            ? 'border-amber-400 ring-2 ring-amber-400/10 focus:border-amber-500'
                                                            : 'border-slate-200 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/5'
                                                            }`}
                                                        spellCheck={false}
                                                    />
                                                )}

                                                {/* Placeholders */}
                                                {(prompt.key.includes('caption_user') || prompt.key.includes('review_user') || prompt.key.includes('image_generation_user')) && (
                                                    <details className="mt-4 group/details">
                                                        <summary className="text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-500 transition-colors select-none list-none flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-slate-300 group-hover/details:bg-blue-500 transition-colors" />
                                                            Available Variables
                                                        </summary>
                                                        <div className="mt-3 flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/50 border-dashed">
                                                            {(prompt.key === 'caption_user_prompt' ? [
                                                                '{{brandHighlight}}', '{{crossPromo}}', '{{theme}}', '{{contentType}}',
                                                                '{{channels}}', '{{targetAudience}}', '{{primaryGoal}}', '{{cta}}'
                                                            ] : prompt.key === 'review_user_prompt' ? [
                                                                '{{captionOutput}}', '{{ctaOuput}}', '{{channels}}', '{{primaryGoal}}'
                                                            ] : [
                                                                '{{contentCalendar.finalCaption}}', '{{contentCalendar.finalCTA}}'
                                                            ]).map(ph => (
                                                                <code key={ph} className="px-1.5 py-0.5 bg-white text-blue-600 text-[10px] rounded font-bold border border-blue-100 shadow-sm">
                                                                    {ph}
                                                                </code>
                                                            ))}
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {Object.keys(filteredGrouped).length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100 border-dashed animate-in fade-in duration-500">
                    <MessageSquare className="mx-auto w-12 h-12 mb-4 text-slate-200" />
                    <p className="text-sm font-bold text-slate-400 tracking-tight">No templates match your search query.</p>
                </div>
            )}
        </div>
    );
};

