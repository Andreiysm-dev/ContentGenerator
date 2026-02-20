import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Settings2, Pencil, Sparkles, Wand2 } from 'lucide-react';

interface ImageGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRow: any;
    isEditingDmp: boolean;
    setIsEditingDmp: (editing: boolean) => void;
    dmpDraft: string;
    setDmpDraft: (draft: string) => void;
    isGeneratingImage: boolean;
    setIsGeneratingImage: (generating: boolean) => void;
    getImageGeneratedUrl: (row: any | null) => string | null;
    imagePreviewNonce: number;
    imagePollError: string | null;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    setSelectedRow: React.Dispatch<React.SetStateAction<any>>;
    setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
    setIsImageModalOpen: (open: boolean) => void;
    activeCompanyId?: string;
    brandKbId: string | null;
    systemInstruction: string;
    requestConfirm: (config: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
    }) => Promise<boolean>;
    reopenImageModalOnImageReadyRef: React.MutableRefObject<boolean>;
    imageModalReopenTimeoutRef: React.MutableRefObject<number | null>;
    getImageGeneratedSignature: (row: any | null) => string | null;
    startWaitingForImageUpdate: (baseSignature: string | null) => void;
    isAiAssistantOpen?: boolean;
}

export function ImageGenerationModal({
    isOpen,
    onClose,
    selectedRow,
    isEditingDmp,
    setIsEditingDmp,
    dmpDraft,
    setDmpDraft,
    isGeneratingImage,
    setIsGeneratingImage,
    getImageGeneratedUrl,
    imagePreviewNonce,
    imagePollError,
    notify,
    authedFetch,
    backendBaseUrl,
    setSelectedRow,
    setCalendarRows,
    setIsImageModalOpen,
    activeCompanyId,
    brandKbId,
    systemInstruction,
    requestConfirm,
    reopenImageModalOnImageReadyRef,
    imageModalReopenTimeoutRef,
    getImageGeneratedSignature,
    startWaitingForImageUpdate,
    isAiAssistantOpen,
}: ImageGenerationModalProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showModelSelection, setShowModelSelection] = useState(false);
    const [provider, setProvider] = useState<'google' | 'replicate' | 'fal'>('fal');
    const [selectedModel, setSelectedModel] = useState('fal-ai/nano-banana-pro');

    const ALL_MODELS = [
        { id: 'fal-ai/nano-banana-pro', name: 'Google Nano Banana Pro', provider: 'fal', group: 'Fal.ai' },
        { id: 'google-imagen', name: 'Google Imagen', provider: 'google', group: 'Google' },
        { id: 'imagineart/imagineart-1.5-preview/text-to-image', name: 'Imagine Art', provider: 'fal', group: 'Fal.ai' },
    ];
    if (!isOpen || !selectedRow) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Generate Visual"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-5xl">
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 p-6 bg-gradient-to-b from-white to-slate-50/50">
                        <div>
                            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#3fa9f5] mb-1">Image Generation</p>
                            <h2 className="text-xl font-bold text-brand-dark tracking-tight font-display">
                                Generate Visual
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-brand-dark/70 shadow-sm transition hover:bg-slate-50 hover:text-brand-dark focus-visible:outline-none"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* DMP Panel */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-bold tracking-wide text-brand-dark uppercase">Design Mega Prompt</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            title="Copy Mega Prompt"
                                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50"
                                            onClick={() => {
                                                const textToCopy = isEditingDmp ? dmpDraft : (selectedRow.dmp ?? '');
                                                if (!textToCopy) {
                                                    notify('Nothing to copy.', 'info');
                                                    return;
                                                }
                                                navigator.clipboard.writeText(textToCopy);
                                                notify('Mega Prompt copied to clipboard!', 'success');
                                            }}
                                        >
                                            <Copy size={16} />
                                        </button>
                                        {!isEditingDmp ? (
                                            <button
                                                type="button"
                                                title="Customize Prompt"
                                                className="inline-flex items-center justify-center rounded-lg p-1.5 text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50"
                                                onClick={() => {
                                                    setDmpDraft(selectedRow.dmp ?? '');
                                                    setIsEditingDmp(true);
                                                }}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        ) : null}


                                        {isEditingDmp && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50"
                                                    onClick={() => {
                                                        setIsEditingDmp(false);
                                                        setDmpDraft(selectedRow.dmp ?? '');
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold bg-[#3fa9f5] text-white shadow-sm transition hover:bg-[#2f97e6] disabled:opacity-50"
                                                    disabled={isGeneratingImage}
                                                    onClick={async () => {
                                                        const rowId = selectedRow?.contentCalendarId;
                                                        if (!rowId) return;
                                                        const trimmedDmp = dmpDraft.trim();
                                                        if (!trimmedDmp) {
                                                            notify('Design Mega Prompt cannot be empty.', 'error');
                                                            return;
                                                        }
                                                        setIsGeneratingImage(true);
                                                        try {
                                                            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${rowId}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    dmp: trimmedDmp,
                                                                    provider,
                                                                    model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined
                                                                }),
                                                            });
                                                            const data = await res.json().catch(() => ({}));
                                                            if (!res.ok) {
                                                                console.error('Failed to save Design Mega Prompt', data);
                                                                notify('Failed to save Design Mega Prompt. Check console for details.', 'error');
                                                                setIsGeneratingImage(false);
                                                                return;
                                                            }
                                                            setSelectedRow((prev: any) => (prev ? { ...prev, dmp: trimmedDmp } : prev));
                                                            setCalendarRows((prev) =>
                                                                prev.map((r) =>
                                                                    r.contentCalendarId === rowId ? { ...r, dmp: trimmedDmp } : r,
                                                                ),
                                                            );
                                                            setIsEditingDmp(false);
                                                            notify('Design Mega Prompt saved.', 'success');

                                                            try {
                                                                const imageRes = await authedFetch(
                                                                    `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-image-from-dmp`,
                                                                    {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            dmp: trimmedDmp,
                                                                            provider,
                                                                            model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined
                                                                        }),
                                                                    }
                                                                );
                                                                if (!imageRes.ok) {
                                                                    const errorData = await imageRes.json().catch(() => ({}));
                                                                    notify(`Image generation failed: ${errorData.error || 'Unknown error'}`, 'error');
                                                                    setIsGeneratingImage(false);
                                                                    return;
                                                                }
                                                                notify('Image generation started using your saved prompt!', 'success');
                                                                setTimeout(() => {
                                                                    setIsImageModalOpen(false);
                                                                    setTimeout(() => setIsImageModalOpen(true), 200);
                                                                }, 15000);
                                                            } catch (webhookErr) {
                                                                console.error('Failed to trigger DMP webhook', webhookErr);
                                                            }

                                                            setTimeout(() => {
                                                                setIsGeneratingImage(false);
                                                            }, 15000);
                                                        } catch (err) {
                                                            console.error('Failed to save Design Mega Prompt', err);
                                                            notify('Failed to save Design Mega Prompt. Check console for details.', 'error');
                                                            setIsGeneratingImage(false);
                                                        }
                                                    }}
                                                >
                                                    {isGeneratingImage ? 'Saving…' : 'Save & Generate'}
                                                    {isGeneratingImage && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <textarea
                                    className={`w-full text-sm font-mono bg-slate-50 border rounded-xl p-4 text-brand-dark/80 outline-none transition-colors min-h-[300px] ${isEditingDmp ? 'border-[#3fa9f5]/30 bg-white ring-2 ring-[#3fa9f5]/5' : 'border-slate-200/60'
                                        }`}
                                    value={isEditingDmp ? dmpDraft : selectedRow.dmp ?? ''}
                                    onChange={(e) => setDmpDraft(e.target.value)}
                                    readOnly={!isEditingDmp}
                                    placeholder="Enter Design Mega Prompt here..."
                                />

                            </div>

                            {/* Preview Panel */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold tracking-wide text-brand-dark uppercase">Preview</h3>

                                {/* Options Panel */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                                    {!showModelSelection ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Model</label>
                                                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    {ALL_MODELS.find(m => m.id === selectedModel)?.name || 'Unknown Model'}
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3fa9f5]/10 text-[#3fa9f5] border border-[#3fa9f5]/20">Active</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowModelSelection(true)}
                                                className="text-xs font-bold text-[#3fa9f5] hover:text-[#2f97e6] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Change Model
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Provider</label>
                                                <button
                                                    onClick={() => setShowModelSelection(false)}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-200/50 transition-colors"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Model</label>
                                                <select
                                                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#3fa9f5]/20"
                                                    value={selectedModel}
                                                    onChange={(e) => {
                                                        const newModelId = e.target.value;
                                                        const modelData = ALL_MODELS.find(m => m.id === newModelId);
                                                        if (modelData) {
                                                            setSelectedModel(newModelId);
                                                            setProvider(modelData.provider as any);
                                                        }
                                                    }}
                                                >
                                                    {Array.from(new Set(ALL_MODELS.map(m => m.group))).map(group => (
                                                        <optgroup key={group} label={group}>
                                                            {ALL_MODELS.filter(m => m.group === group).map(m => (
                                                                <option key={m.id} value={m.id}>{m.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="aspect-square rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden flex items-center justify-center relative shadow-inner">
                                    {getImageGeneratedUrl(selectedRow) ? (
                                        (() => {
                                            const imageUrl = getImageGeneratedUrl(selectedRow);
                                            const separator = imageUrl?.includes('?') ? '&' : '?';
                                            return (
                                                <img
                                                    src={`${imageUrl}${separator}v=${imagePreviewNonce}`}
                                                    alt="Generated preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            );
                                        })()
                                    ) : (
                                        <div className="p-8 text-center space-y-3">
                                            <div className="w-16 h-16 rounded-full bg-slate-200/50 flex items-center justify-center mx-auto text-slate-400">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-xs text-brand-dark/40 italic">No image generated yet. Trigger generation to see results.</div>
                                        </div>
                                    )}
                                    {imagePollError && (
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-red-50/90 text-red-600 text-xs font-semibold backdrop-blur-sm border-t border-red-100">
                                            {imagePollError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-6 bg-slate-50/30 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="mr-auto inline-flex items-center gap-2 text-xs font-bold text-brand-dark/40 hover:text-brand-dark/70 transition-colors py-2"
                        >
                            <Settings2 size={14} className={showAdvanced ? 'text-[#3fa9f5]' : ''} />
                            <span>Advanced</span>
                            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showAdvanced && (
                            <>
                                <button
                                    type="button"
                                    title="Generate a fresh Design Mega Prompt text based on the caption and brand rules."
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] disabled:opacity-40 whitespace-nowrap"
                                    disabled={isGeneratingImage}
                                    onClick={async () => {
                                        if (!activeCompanyId || !brandKbId) {
                                            notify('Company/Brand information not fully loaded.', 'error');
                                            return;
                                        }
                                        setIsGeneratingImage(true);
                                        try {
                                            const response = await authedFetch(
                                                `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-dmp`,
                                                {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ systemInstruction }),
                                                }
                                            );
                                            if (!response.ok) {
                                                const data = await response.json().catch(() => ({}));
                                                notify(`DMP generation failed. ${data.error || ''}`, 'error');
                                            } else {
                                                const result = await response.json();
                                                setDmpDraft(result.dmp);
                                                setSelectedRow((prev: any) => ({ ...prev, dmp: result.dmp }));
                                                setCalendarRows((prev) => prev.map(r => r.contentCalendarId === selectedRow.contentCalendarId ? { ...r, dmp: result.dmp } : r));
                                                notify('Fresh Design Mega Prompt generated!', 'success');
                                            }
                                        } catch (err) {
                                            notify('Network error triggering DMP generation.', 'error');
                                        } finally {
                                            setIsGeneratingImage(false);
                                        }
                                    }}
                                >
                                    DMP Only
                                </button>

                                <button
                                    type="button"
                                    title="Generate a new image using the CURRENT Design Mega Prompt text shown above."
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] disabled:opacity-40 whitespace-nowrap"
                                    disabled={isGeneratingImage || isEditingDmp}
                                    onClick={async () => {
                                        if (getImageGeneratedUrl(selectedRow)) {
                                            const proceed = await requestConfirm({
                                                title: 'Replace Image?',
                                                description: 'Use the CURRENT prompt to generate a new image? The existing image will be replaced.',
                                                confirmLabel: 'Generate',
                                                cancelLabel: 'Cancel',
                                            });
                                            if (!proceed) return;
                                        }
                                        setIsGeneratingImage(true);
                                        try {
                                            const currentDmp = selectedRow.dmp || '';
                                            const response = await authedFetch(
                                                `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-image-from-dmp`,
                                                {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        dmp: currentDmp,
                                                        provider,
                                                        model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined
                                                    }),
                                                }
                                            );
                                            if (!response.ok) {
                                                const data = await response.json().catch(() => ({}));
                                                notify(`Image generation failed. ${data.error || ''}`, 'error');
                                                setIsGeneratingImage(false);
                                            } else {
                                                notify('Image generation started using current DMP!', 'success');
                                                startWaitingForImageUpdate(getImageGeneratedSignature(selectedRow));
                                                // Auto-disable generating state after a timeout or on completion
                                                setTimeout(() => setIsGeneratingImage(false), 30000);
                                            }
                                        } catch (err) {
                                            notify('Network error triggering image generation.', 'error');
                                            setIsGeneratingImage(false);
                                        }
                                    }}
                                >
                                    Image Only
                                </button>

                                <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                            </>
                        )}

                        <button
                            type="button"
                            title="Regenerate BOTH the prompt and the image from scratch."
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            disabled={isGeneratingImage}
                            onClick={async () => {
                                if (!activeCompanyId) {
                                    notify('Please select a company first.', 'error');
                                    return;
                                }
                                if (!brandKbId) {
                                    notify('BrandKB is not loaded yet. Please try again.', 'error');
                                    return;
                                }
                                if (isEditingDmp) {
                                    notify('Please save or cancel your Design Mega Prompt edits before generating a new image.', 'error');
                                    return;
                                }
                                if (getImageGeneratedUrl(selectedRow)) {
                                    const proceed = await requestConfirm({
                                        title: 'Replace this image?',
                                        description:
                                            "You're about to generate a new image for this content item. The current preview will be replaced once finished.",
                                        confirmLabel: 'Generate new image',
                                        cancelLabel: 'Keep current image',
                                    });
                                    if (!proceed) return;
                                }

                                try {
                                    setIsGeneratingImage(true);
                                    reopenImageModalOnImageReadyRef.current = true;
                                    const baseSignature = getImageGeneratedSignature(selectedRow);
                                    if (imageModalReopenTimeoutRef.current) {
                                        clearTimeout(imageModalReopenTimeoutRef.current);
                                        imageModalReopenTimeoutRef.current = null;
                                    }
                                    imageModalReopenTimeoutRef.current = window.setTimeout(() => {
                                        if (!reopenImageModalOnImageReadyRef.current) return;
                                        setIsImageModalOpen(false);
                                        window.setTimeout(() => {
                                            if (reopenImageModalOnImageReadyRef.current) {
                                                setIsImageModalOpen(true);
                                            }
                                        }, 200);
                                    }, 30000);

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
                                        notify(`Image generation failed (${response.status}). ${data.error || ''}`, 'error');
                                        setIsGeneratingImage(false);
                                        reopenImageModalOnImageReadyRef.current = false;
                                        return;
                                    }
                                    const result = await response.json().catch(() => ({}));
                                    notify(
                                        `Generating fresh prompt and image. ${result.successCount || 0} queued. Waiting for preview…`,
                                        'success'
                                    );
                                    startWaitingForImageUpdate(baseSignature);
                                } catch (err) {
                                    console.error('Failed to trigger image generation', err);
                                    notify('Failed to trigger image generation. Check console for details.', 'error');
                                    setIsGeneratingImage(false);
                                    reopenImageModalOnImageReadyRef.current = false;
                                }

                                setTimeout(() => {
                                    setIsGeneratingImage(false);
                                }, 30000);
                            }}
                        >
                            {isGeneratingImage ? 'Generating...' : 'Generate'}
                            {isGeneratingImage && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
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
            </div >
        </div >
    );
}
