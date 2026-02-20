import React from 'react';

interface DraftPublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRow: any;
    activeCompany: any;
    draftPublishIntent: 'draft' | 'ready';
    setDraftPublishIntent: (intent: 'draft' | 'ready') => void;
    handleDraftPublishIntent: () => Promise<void>;
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

                                <Section title="Publish intent">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <label
                                            className={[
                                                'flex gap-3 rounded-2xl border p-4 cursor-pointer transition',
                                                'bg-slate-50 border-slate-200/70 hover:bg-white',
                                                draftPublishIntent === 'draft'
                                                    ? 'border-[#3fa9f5]/60 bg-white shadow-sm ring-2 ring-[#3fa9f5]/10'
                                                    : '',
                                            ].join(' ')}
                                        >
                                            <input
                                                type="radio"
                                                name="draftIntent"
                                                checked={draftPublishIntent === 'draft'}
                                                onChange={() => setDraftPublishIntent('draft')}
                                                className="mt-1 h-4 w-4 accent-[#3fa9f5]"
                                            />
                                            <div>
                                                <div className="text-sm font-bold text-brand-dark">Save as draft</div>
                                                <div className="mt-1 text-sm text-brand-dark/60 leading-relaxed">
                                                    Keep this content saved and editable. You can publish it later.
                                                </div>
                                            </div>
                                        </label>

                                        <label
                                            className={[
                                                'flex gap-3 rounded-2xl border p-4 cursor-pointer transition',
                                                'bg-slate-50 border-slate-200/70 hover:bg-white',
                                                draftPublishIntent === 'ready'
                                                    ? 'border-[#3fa9f5]/60 bg-white shadow-sm ring-2 ring-[#3fa9f5]/10'
                                                    : '',
                                            ].join(' ')}
                                        >
                                            <input
                                                type="radio"
                                                name="draftIntent"
                                                checked={draftPublishIntent === 'ready'}
                                                onChange={() => setDraftPublishIntent('ready')}
                                                className="mt-1 h-4 w-4 accent-[#3fa9f5]"
                                            />
                                            <div>
                                                <div className="text-sm font-bold text-brand-dark">Mark as ready to publish</div>
                                                <div className="mt-1 text-sm text-brand-dark/60 leading-relaxed">
                                                    This content will be marked as approved and ready for publishing. Publishing can be scheduled later.
                                                </div>
                                            </div>
                                        </label>
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
                                        onClick={handleDraftPublishIntent}
                                        className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2"
                                    >
                                        {draftPublishIntent === 'ready' ? 'Mark as ready' : 'Save draft'}
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
                            onClick={handleDraftPublishIntent}
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2"
                        >
                            {draftPublishIntent === 'ready' ? 'Mark as ready' : 'Save draft'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
