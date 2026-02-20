import React, { useState } from 'react';
import { ExternalLink, Wand2, Check, Copy, BarChart3, Clock, Target, Layout, MessageSquare, Calendar, ChevronDown, Zap, ClipboardList, PenLine, X, Info, ShieldCheck, Eye, FileText, MousePointer2, Tag, Share2, ChevronUp } from 'lucide-react';
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
    setBrandKbId: (id: string | null) => void;
    setSystemInstruction: (instruction: string) => void;
    isAiAssistantOpen?: boolean;
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
    setBrandKbId,
    setSystemInstruction,
    isAiAssistantOpen
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

    React.useEffect(() => {
        if (isOpen && selectedRow && selectedRow.status === 'PUBLISHED' && selectedRow.social_provider === 'facebook') {
            fetchAnalytics();
        } else {
            setAnalytics(null);
        }
    }, [isOpen, selectedRow?.contentCalendarId]);

    const fetchAnalytics = async () => {
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
            frameworkUsed: selectedRow.frameworkUsed,
        });
        setIsEditingInputs(true);
    };

    const handleSaveInputs = async () => {
        setIsSavingInputs(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedValues)
            });

            if (res.ok) {
                notify('Inputs updated successfully', 'success');
                setIsEditingInputs(false);
                await refreshCalendarRow(selectedRow.contentCalendarId);
            } else {
                const data = await res.json().catch(() => ({}));
                notify(data.error || 'Failed to update inputs', 'error');
            }
        } catch (err) {
            console.error('Save inputs error:', err);
            notify('Error saving inputs', 'error');
        } finally {
            setIsSavingInputs(false);
        }
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
            <div className="w-full max-w-[95vw] xl:max-w-6xl 2xl:max-w-[1400px]">
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden flex flex-col">
                    {/* Header: Premium Workspace Style */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 p-6 bg-white sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    {selectedRow.theme || "Content Details"}
                                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusBadgeClasses(statusKey(getStatusValue(selectedRow.status)))
                                        }`}>
                                        {getStatusValue(selectedRow.status)}
                                    </div>
                                </h2>
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
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body: Two-Column Workspace */}
                    <div className="flex flex-col lg:flex-row h-full max-h-[70vh] min-h-[500px]">
                        {/* Main Feed Column */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-12 bg-slate-50/30">

                            {/* Section: AI-Generated Core */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                        <Zap size={14} className="fill-blue-600" />
                                        AI-Generated Outputs
                                    </h3>
                                    <span className="text-[11px] font-bold text-slate-400">Draft suggestions for your review</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Caption Output Card */}
                                    <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleCopy('captionOutput', selectedRow.captionOutput)}
                                                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                                            >
                                                {copiedField === 'captionOutput' ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                            <MessageSquare size={12} />
                                            Caption draft
                                        </div>
                                        <div className="text-sm font-medium text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-wrap max-h-[250px] overflow-y-auto pr-2">
                                            {selectedRow.captionOutput ?? <span className="text-slate-300 italic">Not generated yet</span>}
                                        </div>
                                    </div>

                                    {/* CTA & Hashtags Stack */}
                                    <div className="space-y-5">
                                        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm relative group">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                <Target size={12} />
                                                Suggested CTA
                                            </div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {selectedRow.ctaOuput ?? <span className="text-slate-300 italic font-normal">—</span>}
                                            </div>
                                            <button
                                                onClick={() => handleCopy('ctaOuput', selectedRow.ctaOuput)}
                                                className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors"
                                            >
                                                {copiedField === 'ctaOuput' ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm relative group">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                <PenLine size={12} />
                                                Suggested Hashtags
                                            </div>
                                            <div className="text-sm font-medium text-slate-600 line-clamp-3">
                                                {selectedRow.hastagsOutput ?? <span className="text-slate-300 italic font-normal">—</span>}
                                            </div>
                                            <button
                                                onClick={() => handleCopy('hastagsOutput', selectedRow.hastagsOutput)}
                                                className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors"
                                            >
                                                {copiedField === 'hastagsOutput' ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Final Deliverable */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                                        <ShieldCheck size={14} className="fill-emerald-600" />
                                        Review & Final Deliverable
                                    </h3>
                                    <span className="text-[11px] font-bold text-slate-400">Approved version ready for deployment</span>
                                </div>

                                <div className="bg-emerald-500/[0.03] border-2 border-emerald-500/10 rounded-[2rem] p-6 lg:p-8 relative">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-6">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                    <Info size={12} />
                                                    Approval status & Notes
                                                </div>
                                                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm min-h-[100px]">
                                                    <div className="text-sm font-black text-slate-900 mb-2">Decision: {selectedRow.reviewDecision || "PENDING"}</div>
                                                    <p className="text-xs font-semibold text-slate-500 italic leading-relaxed">
                                                        "{selectedRow.reviewNotes || "No review notes provided yet."}"
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                                                        Final CTA
                                                        <button onClick={() => handleCopy('finalCTA', selectedRow.finalCTA)} className="text-slate-300 hover:text-blue-600 transition-colors">
                                                            {copiedField === 'finalCTA' ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900 leading-snug">
                                                        {selectedRow.finalCTA || <span className="text-slate-300 font-normal">—</span>}
                                                    </div>
                                                </div>
                                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                                                        Final Hashtags
                                                        <button onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags)} className="text-slate-300 hover:text-blue-600 transition-colors">
                                                            {copiedField === 'finalHashtags' ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                    <div className="text-sm font-bold text-blue-600/80 leading-relaxed">
                                                        {selectedRow.finalHashtags || <span className="text-slate-300 font-normal">—</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex justify-between items-center">
                                                <div className="flex items-center gap-2"><PenLine size={12} /> Final Caption</div>
                                                <button
                                                    onClick={() => handleCopy('finalDescription', [selectedRow.finalCaption, selectedRow.finalHashtags].filter(Boolean).join('\n\n'))}
                                                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-[9px] font-black shadow-lg shadow-emerald-500/20"
                                                >
                                                    {copiedField === 'finalDescription' ? "COPIED" : "COPY READY DESCRIPTION"}
                                                </button>
                                            </div>
                                            <div className="bg-white border border-emerald-500/20 rounded-2xl p-5 shadow-inner min-h-[180px] text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                                {[selectedRow.finalCaption, selectedRow.finalHashtags].filter(Boolean).join('\n\n') || "Drafting finalized version..."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Analytics */}
                            {selectedRow.status === 'PUBLISHED' && selectedRow.social_provider === 'facebook' && (
                                <section className="pt-6 border-t border-slate-200 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                                            <BarChart3 size={14} className="text-slate-900" />
                                            Live Insights
                                        </h3>
                                        {selectedRow.social_post_id && (
                                            <a href={`https://facebook.com/${selectedRow.social_post_id}`} target="_blank" className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 hover:underline decoration-2">
                                                LIVE AT FACEBOOK <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { label: 'Reach', val: analytics?.reach, icon: Eye },
                                            { label: 'Engagement', val: analytics?.likes, icon: Target },
                                            { label: 'Conversations', val: analytics?.comments, icon: MessageSquare }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white border border-slate-200 rounded-[1.5rem] p-4 text-center group hover:border-blue-200 transition-all">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                    <stat.icon size={16} />
                                                </div>
                                                <div className="text-xl font-black text-slate-900">{isLoadingAnalytics ? '...' : (stat.val ?? '0')}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar: Strategy & Metadata */}
                        <div className="w-full lg:w-[400px] border-l border-slate-200 bg-white overflow-y-auto p-8 space-y-10 flex-shrink-0">

                            {/* Strategy Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-900">Campaign Strategy</div>
                                    {isEditingInputs ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditingInputs(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-all"><X size={14} /></button>
                                            <button onClick={handleSaveInputs} disabled={isSavingInputs} className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"><Check size={14} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={handleStartEditing} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                            <PenLine size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="bg-slate-50/50 border border-slate-200/60 rounded-[1.5rem] p-4 space-y-5">
                                    {[
                                        { label: 'Theme', key: 'theme', icon: Layout },
                                        { label: 'Type', key: 'contentType', icon: FileText },
                                        { label: 'Date', key: 'date', icon: Calendar },
                                        { label: 'Brand Focus', key: 'brandHighlight', icon: Target },
                                        { label: 'Primary Goal', key: 'primaryGoal', icon: Zap },
                                        { label: 'Audience', key: 'targetAudience', icon: Eye },
                                        { label: 'Channels', key: 'channels', icon: ExternalLink },
                                        { label: 'CTA', key: 'cta', icon: MousePointer2 },
                                        { label: 'Promo Type', key: 'promoType', icon: Tag },
                                        { label: 'Cross Promo', key: 'crossPromo', icon: Share2 },
                                        { label: 'Framework', key: 'frameworkUsed', icon: ClipboardList },
                                    ].slice(0, showAllStrategy ? undefined : 5).map((item, idx) => (
                                        <div key={idx} className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <item.icon size={10} />
                                                {item.label}
                                            </div>
                                            {isEditingInputs ? (
                                                <input
                                                    type="text"
                                                    value={editedValues[item.key] || ''}
                                                    onChange={(e) => setEditedValues({ ...editedValues, [item.key]: e.target.value })}
                                                    className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-bold text-blue-600 outline-none shadow-sm"
                                                    autoFocus={idx === 0}
                                                />
                                            ) : (
                                                <div className="text-xs font-bold text-slate-900 leading-tight">
                                                    {selectedRow[item.key] || '—'}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setShowAllStrategy(!showAllStrategy)}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-blue-100"
                                    >
                                        {showAllStrategy ? (
                                            <>Show Less <ChevronUp size={12} /></>
                                        ) : (
                                            <>Show More +6 Items <ChevronDown size={12} /></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Visual Preview */}
                            <div className="space-y-4">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-900">Visual Asset</div>
                                <div className="aspect-square bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all hover:border-blue-200 group">
                                    {getImageGeneratedUrl(selectedRow) ? (
                                        <img
                                            src={`${getImageGeneratedUrl(selectedRow)}${getImageGeneratedUrl(selectedRow)?.includes('?') ? '&' : '?'}v=${imagePreviewNonce}`}
                                            alt="Generated"
                                            className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <>
                                            <Layout size={32} className="text-slate-300 mb-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty visual slate</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* System Metadata Details */}
                            <details className="group border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
                                    System Metadata
                                    <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-4 pb-5 space-y-4 border-t border-slate-100 mt-0 pt-4">
                                    <div className="space-y-1.5">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-300">DMP Prompt</div>
                                        <div className="bg-slate-50 rounded-xl p-3 text-[10px] font-mono text-slate-500 line-clamp-4 leading-relaxed">
                                            {selectedRow.dmp || "No DMP data found."}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                        <div>
                                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-300 mb-1">Row ID</div>
                                            <div className="text-[10px] font-bold text-slate-400 truncate">{selectedRow.contentCalendarId}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-300 mb-1">Company</div>
                                            <div className="text-[10px] font-bold text-slate-400 truncate">{selectedRow.companyId}</div>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-6 bg-slate-50/30">
                        <button
                            type="button"
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
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ${['approved', 'design completed', 'design-complete', 'design-completed', 'ready'].includes(getStatusValue(selectedRow.status).trim().toLowerCase())
                                ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                                : 'bg-white text-brand-dark border border-slate-200/70 opacity-40'
                                }`}
                            disabled={
                                !['approved', 'design completed', 'design-complete', 'design-completed', 'ready'].includes(getStatusValue(selectedRow.status).trim().toLowerCase())
                            }
                            onClick={() => {
                                const status = getStatusValue(selectedRow.status).trim().toLowerCase();
                                if (!['approved', 'design completed', 'design-complete', 'design-completed', 'ready'].includes(status)) return;

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
