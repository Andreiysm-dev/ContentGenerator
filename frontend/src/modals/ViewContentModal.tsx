import React, { useState } from 'react';

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
    isRevisingCaption: boolean;
    setIsRevisingCaption: (revising: boolean) => void;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    refreshCalendarRow: (rowId: string) => Promise<void>;
    setIsImageModalOpen: (open: boolean) => void;
    setIsViewModalOpen: (open: boolean) => void;
    activeCompanyId?: string;
    setBrandKbId: (id: string | null) => void;
    setSystemInstruction: (instruction: string) => void;
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
    isRevisingCaption,
    setIsRevisingCaption,
    authedFetch,
    backendBaseUrl,
    refreshCalendarRow,
    setIsImageModalOpen,
    setIsViewModalOpen,
    activeCompanyId,
    setBrandKbId,
    setSystemInstruction,
}: ViewContentModalProps) {
    const [isManualApproving, setIsManualApproving] = useState(false);

    if (!isOpen || !selectedRow) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Content Details"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-5xl">
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 p-6 bg-gradient-to-b from-white to-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-brand-dark tracking-tight font-display">
                                Content Details
                            </h2>
                            <p className="mt-1 text-sm text-brand-dark/60 font-medium">
                                Review inputs, generated outputs, and final approvals.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                                onClick={async () => {
                                    if (!selectedRow?.finalCaption) {
                                        notify('Add a final caption first.', 'error');
                                        return;
                                    }

                                    // Check for LinkedIn connection
                                    // Ideally we should have this state passed down or fetch it.
                                    // For MVP, letting them Try to publish and handling error is one way, 
                                    // OR we fetch accounts when modal opens.
                                    // Since we don't have 'connectedAccounts' here easily without prop drilling from App -> ViewContentModal,
                                    // let's try to Publish and if it fails saying "No account", we tell them.

                                    const proceed = await requestConfirm({
                                        title: 'Publish to LinkedIn?',
                                        description: 'This will post the Final Caption immediately to your connected LinkedIn account.',
                                        confirmLabel: 'Post Now',
                                        cancelLabel: 'Cancel'
                                    });

                                    if (!proceed) return;

                                    try {
                                        const res = await authedFetch(`${backendBaseUrl}/api/social/${activeCompanyId}/publish`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                provider: 'linkedin',
                                                content: {
                                                    text: [selectedRow.finalCaption, selectedRow.finalHashtags].filter(Boolean).join('\n\n')
                                                    // TODO: Add Image URL here once supported
                                                }
                                            })
                                        });

                                        const data = await res.json();

                                        if (!res.ok) {
                                            throw new Error(data.error || 'Failed to publish');
                                        }

                                        notify('Published to LinkedIn successfully!', 'success');

                                        // Update status to 'Published' locally or refetch
                                        // await refreshCalendarRow(selectedRow.contentCalendarId);

                                    } catch (e: any) {
                                        console.error(e);
                                        notify(`Failed to publish: ${e.message}. Go to Settings > Integrations to connect LinkedIn.`, 'error');
                                    }
                                }}
                            >
                                {/* LinkedIn Icon or Generic Publish Icon */}
                                <svg className="w-4 h-4 mr-2" fill="#0077b5" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                Publish to LinkedIn
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-brand-dark/70 shadow-sm transition hover:bg-slate-50 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
                                aria-label="Close"
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                        {/* Section: Inputs */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold tracking-wide text-brand-dark uppercase">
                                    Inputs
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200/70 to-transparent" />
                                <span className="text-xs text-brand-dark/50 italic">
                                    What was provided for generation
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { label: 'Date', value: selectedRow.date },
                                    { label: 'Brand Highlight', value: selectedRow.brandHighlight },
                                    { label: 'Cross Promo', value: selectedRow.crossPromo },
                                    { label: 'Theme', value: selectedRow.theme },
                                    { label: 'Content Type', value: selectedRow.contentType },
                                    { label: 'Channels', value: selectedRow.channels },
                                    { label: 'Target Audience', value: selectedRow.targetAudience },
                                    { label: 'Primary Goal', value: selectedRow.primaryGoal },
                                    { label: 'CTA', value: selectedRow.cta },
                                    { label: 'Promo Type', value: selectedRow.promoType },
                                    { label: 'Framework Used', value: selectedRow.frameworkUsed },
                                    { label: 'Status', value: getStatusValue(selectedRow.status) },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-xl border border-slate-200/60 bg-slate-50/50"
                                    >
                                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/50 mb-1">
                                            {item.label}
                                        </div>
                                        <div className="text-sm font-medium text-brand-dark break-words">
                                            {item.value || '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: AI Outputs */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold tracking-wide text-brand-dark uppercase">
                                    AI-Generated Outputs
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200/70 to-transparent" />
                                <span className="text-xs text-brand-dark/50 italic">
                                    What the system generated for review
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm flex flex-col gap-3 lg:col-span-1">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-brand-dark/70">Caption Output</div>
                                        <button
                                            type="button"
                                            className="text-[0.7rem] font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => handleCopy('captionOutput', selectedRow.captionOutput)}
                                        >
                                            {copiedField === 'captionOutput' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="text-sm text-brand-dark/80 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[120px] whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {selectedRow.captionOutput ?? '—'}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm flex flex-col gap-3 lg:col-span-1">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-brand-dark/70">CTA Output</div>
                                        <button
                                            type="button"
                                            className="text-[0.7rem] font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => handleCopy('ctaOuput', selectedRow.ctaOuput)}
                                        >
                                            {copiedField === 'ctaOuput' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="text-sm text-brand-dark/80 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[120px] whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {selectedRow.ctaOuput ?? '—'}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm flex flex-col gap-3 lg:col-span-1">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-brand-dark/70">Hashtags Output</div>
                                        <button
                                            type="button"
                                            className="text-[0.7rem] font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => handleCopy('hastagsOutput', selectedRow.hastagsOutput)}
                                        >
                                            {copiedField === 'hastagsOutput' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="text-sm text-brand-dark/80 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[120px] whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {selectedRow.hastagsOutput ?? '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Review & Final Approval */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold tracking-wide text-brand-dark uppercase">
                                    Review &amp; Final Approval
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200/70 to-transparent" />
                                <span className="text-xs text-brand-dark/50 italic">
                                    What will ship after human approval
                                </span>
                            </div>

                            {/* ✅ Restored CSS-like 3-column layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Review Decision */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4">
                                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/50 mb-2">
                                        Review Decision
                                    </div>
                                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm font-semibold text-brand-dark">
                                        {selectedRow.reviewDecision ?? '—'}
                                    </div>
                                </div>

                                {/* Review Notes */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4">
                                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/50 mb-2">
                                        Review Notes
                                    </div>
                                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-brand-dark/80 whitespace-pre-wrap">
                                        {selectedRow.reviewNotes ?? '—'}
                                    </div>
                                </div>

                                {/* Final Caption */}
                                <div className="rounded-2xl border border-[#3fa9f5]/25 bg-slate-50/40 p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-[#3fa9f5]">Final Caption</div>
                                        <button
                                            type="button"
                                            className="text-xs font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => handleCopy('finalCaption', selectedRow.finalCaption)}
                                        >
                                            {copiedField === 'finalCaption' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-brand-dark/90 whitespace-pre-wrap max-h-[240px] overflow-y-auto">
                                        {selectedRow.finalCaption ?? '—'}
                                    </div>
                                </div>

                                {/* Final CTA */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-bold uppercase tracking-widest text-brand-dark/60">
                                            Final CTA
                                        </div>
                                        <button
                                            type="button"
                                            className="text-xs font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => handleCopy('finalCTA', selectedRow.finalCTA)}
                                        >
                                            {copiedField === 'finalCTA' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-brand-dark/80 whitespace-pre-wrap">
                                        {selectedRow.finalCTA || '—'}
                                    </div>
                                </div>

                                {/* Final Hashtags */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-bold uppercase tracking-widest text-brand-dark/60">
                                            Final Hashtags
                                        </div>
                                        <button
                                            type="button"
                                            className="text-xs font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags)}
                                        >
                                            {copiedField === 'finalHashtags' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-brand-dark/80 whitespace-pre-wrap">
                                        {selectedRow.finalHashtags || '—'}
                                    </div>
                                </div>

                                {/* Final Description */}
                                <div className="rounded-2xl border border-brand-dark/10 bg-slate-50/50 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-brand-dark/80">
                                            Final Description (Ready to Post)
                                        </div>
                                        <button
                                            type="button"
                                            className="text-xs font-bold text-[#3fa9f5] hover:underline"
                                            onClick={() => {
                                                const finalDescription = [
                                                    selectedRow.finalCaption,
                                                    selectedRow.finalHashtags,
                                                ]
                                                    .filter(Boolean)
                                                    .join('\n\n');
                                                handleCopy('finalDescription', finalDescription);
                                            }}
                                        >
                                            {copiedField === 'finalDescription' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-brand-dark/90 whitespace-pre-wrap max-h-[240px] overflow-y-auto">
                                        {[selectedRow.finalCaption, selectedRow.finalHashtags].filter(Boolean).join('\n\n') ||
                                            '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: System Metadata (Expandable) */}
                        <details className="group border border-slate-200/60 rounded-xl bg-slate-50/30 overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold tracking-wide text-brand-dark/50 uppercase">
                                        System / Internal
                                    </h3>
                                    <span className="text-xs text-brand-dark/30 italic">
                                        Internal references and metadata
                                    </span>
                                </div>
                                <div className="text-brand-dark/30 group-open:rotate-180 transition-transform">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </summary>

                            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/60 mt-0">
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/40">
                                        DMP (Data Management Plan)
                                    </label>
                                    <textarea
                                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-3 text-brand-dark/70 outline-none focus:border-[#3fa9f5]/30 transition-colors"
                                        rows={6}
                                        value={selectedRow.dmp ?? ''}
                                        readOnly
                                        style={{ resize: 'vertical', maxHeight: '200px' }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/40">
                                            Generated Image Preview
                                        </label>
                                        <div className="p-2 border border-slate-200 rounded-xl bg-white min-h-[120px] flex items-center justify-center">
                                            {getImageGeneratedUrl(selectedRow) ? (
                                                (() => {
                                                    const imageUrl = getImageGeneratedUrl(selectedRow);
                                                    const separator = imageUrl?.includes('?') ? '&' : '?';
                                                    return (
                                                        <img
                                                            src={`${imageUrl}${separator}v=${imagePreviewNonce}`}
                                                            alt="Generated"
                                                            className="max-w-full h-auto rounded-lg shadow-sm border border-slate-100"
                                                            style={{ maxWidth: '220px' }}
                                                        />
                                                    );
                                                })()
                                            ) : (
                                                <div className="text-xs text-brand-dark/30 italic">No image generated yet</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/40">
                                                Company ID
                                            </div>
                                            <div className="text-[0.7rem] font-mono text-brand-dark/60 truncate">
                                                {selectedRow.companyId || '—'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/40">
                                                Calendar ID
                                            </div>
                                            <div className="text-[0.7rem] font-mono text-brand-dark/60 truncate">
                                                {selectedRow.contentCalendarId || '—'}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/40">
                                                Created At
                                            </div>
                                            <div className="text-[0.7rem] font-mono text-brand-dark/60 truncate">
                                                {selectedRow.created_at || '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-6 bg-slate-50/30">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={async () => {
                                if (!selectedRow) return;

                                const proceed = await requestConfirm({
                                    title: 'Generate caption for this item?',
                                    description: "You're about to trigger caption generation for this content item.",
                                    confirmLabel: 'Generate caption',
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
                                                genData.error || 'Caption generation is already running or completed.',
                                                'info',
                                            );
                                        } else {
                                            notify(genData.error || 'Failed to generate caption.', 'error');
                                        }
                                    } else {
                                        notify('Caption generation started.', 'success');
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
                            {isGeneratingCaption ? 'Generating…' : 'Generate Caption'}
                            {isGeneratingCaption && (
                                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                        </button>

                        <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ${['review', 'approved', 'needs revision'].includes(getStatusValue(selectedRow.status).trim().toLowerCase())
                                ? 'bg-white text-brand-dark border border-slate-200/70 hover:bg-slate-50'
                                : 'bg-white text-brand-dark border border-slate-200/70 opacity-40'
                                }`}
                            title="Send for review again"
                            disabled={
                                !['review', 'approved', 'needs revision'].includes(getStatusValue(selectedRow.status).trim().toLowerCase()) ||
                                !selectedRow.captionOutput
                            }
                            onClick={async () => {
                                if (!selectedRow) return;
                                if (!['review', 'approved', 'needs revision'].includes(getStatusValue(selectedRow.status).trim().toLowerCase())) return;
                                if (!selectedRow.captionOutput) return;

                                const proceed = await requestConfirm({
                                    title: 'Send this item for review?',
                                    description: "You're about to send this content item for AI review.",
                                    confirmLabel: 'Send for review',
                                    cancelLabel: 'Keep item',
                                });
                                if (!proceed) return;

                                setIsRevisingCaption(true);
                                try {
                                    const res = await authedFetch(
                                        `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/review-content`,
                                        {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({}),
                                        },
                                    );

                                    const data = await res.json().catch(() => ({}));

                                    if (!res.ok) {
                                        if (res.status === 409) {
                                            notify(data.error || 'Review is not allowed for this status.', 'info');
                                        } else {
                                            notify(data.error || 'Failed to trigger review.', 'error');
                                        }
                                        return;
                                    }

                                    notify('Sent for review.', 'success');
                                } catch (err) {
                                    console.error('Failed to call review endpoint', err);
                                    notify('Failed to trigger review. Check console for details.', 'error');
                                    return;
                                } finally {
                                    await refreshCalendarRow(selectedRow.contentCalendarId);
                                    setIsRevisingCaption(false);
                                }
                            }}
                        >
                            {isRevisingCaption ? 'Reviewing…' : 'Review caption'}
                            {isRevisingCaption && (
                                <span className="inline-block w-3 h-3 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
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
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ${['approved', 'design completed'].includes(getStatusValue(selectedRow.status).trim().toLowerCase())
                                ? 'bg-white text-brand-dark border border-slate-200/70 hover:bg-slate-50'
                                : 'bg-white text-brand-dark border border-slate-200/70 opacity-40'
                                }`}
                            disabled={
                                !['approved', 'design completed'].includes(getStatusValue(selectedRow.status).trim().toLowerCase())
                            }
                            onClick={() => {
                                if (
                                    !['approved', 'design completed'].includes(
                                        getStatusValue(selectedRow.status).trim().toLowerCase(),
                                    )
                                )
                                    return;

                                setIsImageModalOpen(true);
                                setIsViewModalOpen(false);

                                // Prefill from BrandKB for this company
                                const companyId = selectedRow?.companyId ?? activeCompanyId;
                                if (companyId) {
                                    (async () => {
                                        try {
                                            const res = await authedFetch(`${backendBaseUrl}/api/brandkb/company/${companyId}`);
                                            const data = await res.json();
                                            const list = Array.isArray(data.brandKBs) ? data.brandKBs : data;
                                            const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
                                            if (first) {
                                                if (typeof first.brandKbId === 'string') setBrandKbId(first.brandKbId);
                                                if (typeof first.systemInstruction === 'string') setSystemInstruction(first.systemInstruction);
                                            }
                                        } catch (err) {
                                            console.error('Failed to load BrandKB for image generation', err);
                                        }
                                    })();
                                }
                            }}
                        >
                            Generate Image
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
