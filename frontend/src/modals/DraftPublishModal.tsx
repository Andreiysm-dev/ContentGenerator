import React from 'react';

interface DraftPublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRow: any;
    activeCompany: any;
    draftPublishIntent: 'draft' | 'ready';
    setDraftPublishIntent: (intent: 'draft' | 'ready') => void;
    handleDraftPublishIntent: (status?: string) => Promise<void>;
    getAttachedDesignUrls: (row: any) => string[];
    getImageGeneratedUrl: (row: any | null) => string | null;
    imagePreviewNonce: number;
    handleCopy: (fieldKey: string, text?: string | null) => void;
    copiedField: string | null;
    handleUploadDesigns: (files: FileList | null) => Promise<void>;
    isUploadingDesigns: boolean;
    isAiAssistantOpen?: boolean;
}

export function DraftPublishModal({
    isOpen,
    onClose,
    selectedRow,
    activeCompany,
    draftPublishIntent,
    setDraftPublishIntent,
    handleDraftPublishIntent,
    getAttachedDesignUrls,
    getImageGeneratedUrl,
    imagePreviewNonce,
    handleCopy,
    copiedField,
    handleUploadDesigns,
    isUploadingDesigns,
    isAiAssistantOpen
}: DraftPublishModalProps) {
    const [targetStatus, setTargetStatus] = React.useState<string>(() => {
        if (selectedRow?.status) return selectedRow.status;
        return activeCompany?.kanban_settings?.columns?.[0]?.id || '';
    });

    React.useEffect(() => {
        if (selectedRow) {
            setTargetStatus(selectedRow.status || activeCompany?.kanban_settings?.columns?.[0]?.id || '');
        }
    }, [selectedRow, activeCompany]);

    if (!isOpen || !selectedRow) return null;

    const channelsText =
        Array.isArray(selectedRow.channels) && selectedRow.channels.length
            ? selectedRow.channels.join(', ')
            : '—';

    const CopyBtn = ({ id, text }: { id: string; text?: string | null }) => (
        <button
            type="button"
            onClick={() => handleCopy(id, text)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200/70 bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
        >
            {copiedField === id ? 'Copied' : 'Copy'}
        </button>
    );

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
                <h3 className="text-sm font-bold tracking-wide text-brand-dark">{title}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200/70 to-transparent" />
            </div>
            {children}
        </section>
    );

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Draft & publish content"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-5xl">
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 p-6">
                        <div>
                            <h2 className="text-xl font-bold text-brand-dark tracking-tight font-display">
                                Draft &amp; publish content
                            </h2>
                            <p className="mt-1 text-sm text-brand-dark/60 font-medium">
                                Review the final content and decide how you&apos;d like to proceed. You can save this as a draft or
                                mark it as ready for publishing.
                            </p>
                        </div>

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

                    {/* Body */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {/* Left: summary + readiness + intent */}
                            <div className="lg:col-span-2 flex flex-col gap-4">
                                <Section title="Content summary">
                                    {/* Summary grid */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <div className="text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                Brand / Company
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-brand-dark">
                                                {activeCompany?.companyName ?? '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                Channels
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-brand-dark">{channelsText}</div>
                                        </div>
                                    </div>

                                    {/* Final caption */}
                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-sm font-semibold text-brand-dark">Final caption</div>
                                            <CopyBtn id="finalCaption" text={selectedRow.finalCaption} />
                                        </div>
                                        <div className="max-h-56 overflow-auto rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-brand-dark/80">
                                            {selectedRow.finalCaption ?? ''}
                                        </div>
                                    </div>

                                    {/* Hashtags + CTA */}
                                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div className="text-sm font-semibold text-brand-dark">Final hashtags</div>
                                                <CopyBtn id="finalHashtags" text={selectedRow.finalHashtags} />
                                            </div>
                                            <div className="max-h-40 overflow-auto rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-brand-dark/80">
                                                {selectedRow.finalHashtags ?? ''}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div className="text-sm font-semibold text-brand-dark">Final CTA</div>
                                                <CopyBtn id="finalCTA" text={selectedRow.finalCTA} />
                                            </div>
                                            <div className="max-h-40 overflow-auto rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-brand-dark/80">
                                                {selectedRow.finalCTA ?? ''}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-sm font-semibold text-brand-dark">Attached images</div>

                                            <label className="relative inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-within:ring-2 focus-within:ring-[#3fa9f5]/25 focus-within:ring-offset-2">
                                                {isUploadingDesigns ? 'Uploading…' : 'Upload images'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(event) => {
                                                        void handleUploadDesigns(event.target.files);
                                                        event.currentTarget.value = '';
                                                    }}
                                                    disabled={isUploadingDesigns}
                                                    className="absolute inset-0 cursor-pointer opacity-0"
                                                />
                                            </label>
                                        </div>

                                        <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50 p-3">
                                            {(() => {
                                                const attached = getAttachedDesignUrls(selectedRow);

                                                if (attached.length) {
                                                    return (
                                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                            {attached.map((url, index) => (
                                                                <img
                                                                    key={`${url}-${index}`}
                                                                    src={url}
                                                                    alt={`Design ${index + 1}`}
                                                                    className="h-32 w-full rounded-lg object-cover border border-slate-200/60 bg-white"
                                                                    loading="lazy"
                                                                />
                                                            ))}
                                                        </div>
                                                    );
                                                }

                                                const generated = getImageGeneratedUrl(selectedRow);
                                                if (generated) {
                                                    const sep = generated.includes('?') ? '&' : '?';
                                                    return (
                                                        <img
                                                            src={`${generated}${sep}v=${imagePreviewNonce}`}
                                                            alt="Generated"
                                                            className="w-full max-h-[360px] rounded-lg object-cover border border-slate-200/60 bg-white"
                                                            loading="lazy"
                                                        />
                                                    );
                                                }

                                                return (
                                                    <div className="py-10 text-center text-sm font-medium text-brand-dark/50">
                                                        No images attached yet
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Platform readiness">
                                    <div className="space-y-2">
                                        <div className="text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                            Selected platforms
                                        </div>
                                        <div className="text-sm font-semibold text-brand-dark">{channelsText}</div>

                                        <div className="mt-2 text-sm font-semibold text-brand-dark/80">Posting not scheduled yet</div>
                                        <div className="text-sm text-brand-dark/60">
                                            Publishing to connected social accounts will be available soon.
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Workflow & Status">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Gallery Status</label>
                                            <select
                                                value={targetStatus}
                                                onChange={(e) => setTargetStatus(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15"
                                            >
                                                {activeCompany?.kanban_settings?.columns ? (
                                                    activeCompany.kanban_settings.columns.map((col: any) => (
                                                        <option key={col.id} value={col.id}>{col.title}</option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="Drafts">Drafts</option>
                                                        <option value="To Do">To Do</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Ready">Ready</option>
                                                    </>
                                                )}
                                            </select>
                                            <p className="text-[10px] text-slate-400 font-medium">Select which column this content should be visible in.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Publishing Intent</label>
                                            <div className="flex p-1 bg-slate-100/80 rounded-xl gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setDraftPublishIntent('draft')}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${draftPublishIntent === 'draft' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Draft
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDraftPublishIntent('ready')}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${draftPublishIntent === 'ready' ? 'bg-[#3fa9f5] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Ready to Publish
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {draftPublishIntent === 'ready' ? 'Marked as approved for final scheduling.' : 'Still being worked on/needs changes.'}
                                            </p>
                                        </div>
                                    </div>
                                </Section>
                            </div>

                            {/* Right: sticky preview (optional area if you want later) */}
                            <div className="lg:col-span-1">
                                <div className="lg:sticky lg:top-4 space-y-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                                    <div className="text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                        Quick actions
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDraftPublishIntent(targetStatus)}
                                        className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 uppercase tracking-wide"
                                    >
                                        Save
                                    </button>

                                    <div className="pt-2 text-xs text-brand-dark/50 leading-relaxed">
                                        Tip: Use “Copy” buttons to quickly paste caption/hashtags/CTA into your scheduler.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 p-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDraftPublishIntent(targetStatus)}
                            className="inline-flex items-center justify-center rounded-xl px-12 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 uppercase tracking-wide"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
