import React from 'react';

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
}: ImageGenerationModalProps) {
    if (!isOpen || !selectedRow) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal modal-wide image-modal">
                <div className="modal-header">
                    <div>
                        <p className="modal-kicker">Image Generation</p>
                        <h2 className="modal-title">Generate Visual</h2>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    <div className="image-modal-grid">
                        <div className="image-modal-panel">
                            <div className="panel-header">
                                <h3>Design Mega Prompt</h3>
                                <div className="panel-actions">
                                    {!isEditingDmp ? (
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setDmpDraft(selectedRow.dmp ?? '');
                                                setIsEditingDmp(true);
                                            }}
                                        >
                                            Custom
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setIsEditingDmp(false);
                                                    setDmpDraft(selectedRow.dmp ?? '');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={async () => {
                                                    const rowId = selectedRow?.contentCalendarId;
                                                    if (!rowId) return;
                                                    const trimmedDmp = dmpDraft.trim();
                                                    if (!trimmedDmp) {
                                                        notify('Design Mega Prompt cannot be empty.', 'error');
                                                        return;
                                                    }
                                                    // Disable generate button immediately to prevent double triggers
                                                    setIsGeneratingImage(true);
                                                    try {
                                                        // Save to backend first
                                                        const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${rowId}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                dmp: trimmedDmp,
                                                            }),
                                                        });
                                                        const data = await res.json().catch(() => ({}));
                                                        if (!res.ok) {
                                                            console.error('Failed to save Design Mega Prompt', data);
                                                            notify('Failed to save Design Mega Prompt. Check console for details.', 'error');
                                                            setIsGeneratingImage(false); // Re-enable on error
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

                                                        // Trigger image generation using the saved DMP (no OpenAI regeneration)
                                                        try {
                                                            const imageRes = await authedFetch(
                                                                `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-image-from-dmp`,
                                                                {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        dmp: trimmedDmp,
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
                                                            // Auto close/reopen modal after 15 seconds
                                                            setTimeout(() => {
                                                                setIsImageModalOpen(false);
                                                                setTimeout(() => setIsImageModalOpen(true), 200);
                                                            }, 15000);
                                                        } catch (webhookErr) {
                                                            console.error('Failed to trigger DMP webhook', webhookErr);
                                                            // Silently ignore webhook failure; the DMP was saved
                                                        }

                                                        // Auto-stop loading after 15 seconds
                                                        setTimeout(() => {
                                                            setIsGeneratingImage(false);
                                                        }, 15000);
                                                    } catch (err) {
                                                        console.error('Failed to save Design Mega Prompt', err);
                                                        notify('Failed to save Design Mega Prompt. Check console for details.', 'error');
                                                        setIsGeneratingImage(false); // Re-enable on error
                                                    }
                                                }}
                                            >
                                                {isGeneratingImage ? 'Saving & Generating…' : 'Save & Generate'}
                                                {isGeneratingImage && <span className="loading-spinner"></span>}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <textarea
                                className="field-input field-textarea"
                                rows={10}
                                value={isEditingDmp ? dmpDraft : selectedRow.dmp ?? ''}
                                onChange={(e) => setDmpDraft(e.target.value)}
                                readOnly={!isEditingDmp}
                            />
                        </div>
                        <div className="image-modal-panel">
                            <div className="panel-header">
                                <h3>Preview</h3>
                            </div>
                            <div className="image-preview">
                                {getImageGeneratedUrl(selectedRow) ? (
                                    (() => {
                                        const imageUrl = getImageGeneratedUrl(selectedRow);
                                        const separator = imageUrl?.includes('?') ? '&' : '?';
                                        return (
                                            <img
                                                src={`${imageUrl}${separator}v=${imagePreviewNonce}`}
                                                alt="Generated preview"
                                            />
                                        );
                                    })()
                                ) : (
                                    <div className="empty-state">No image yet. Generate an image to see the preview.</div>
                                )}
                                {imagePollError && (
                                    <div className="empty-state" style={{ color: '#b91c1c', marginTop: 8 }}>
                                        {imagePollError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer image-modal-footer">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
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

                                // Regenerate DMP via OpenAI, then generate image
                                const response = await authedFetch(
                                    `${backendBaseUrl}/api/content-calendar/batch-generate-image`,
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            rowIds: [selectedRow.contentCalendarId],
                                            brandKbId,
                                            systemInstruction: systemInstruction ?? '',
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

                            // Auto-stop loading after 30 seconds
                            setTimeout(() => {
                                setIsGeneratingImage(false);
                            }, 30000);
                        }}
                    >
                        {isGeneratingImage ? 'Generating…' : 'Generate Image'}
                        {isGeneratingImage && <span className="loading-spinner"></span>}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
