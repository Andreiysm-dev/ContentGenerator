import React from 'react';

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
    if (!isOpen || !selectedRow) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal modal-wide content-modal">
                <div className="modal-header content-modal-header">
                    <div className="content-modal-title">
                        <h2>Content Details</h2>
                        <p>Review inputs, generated outputs, and final approvals.</p>
                    </div>
                    <div className="content-modal-actions">
                        <span className="status-pill status-pill--muted">
                            {getStatusValue(selectedRow.status) || 'Draft'}
                        </span>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                if (!selectedRow?.finalCaption) {
                                    notify('Add a final caption before preparing this content for publishing.', 'error');
                                    return;
                                }
                                setDraftPublishIntent('draft');
                                setIsDraftModalOpen(true);
                            }}
                        >
                            Draft & Publish
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="modal-close"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="modal-body content-modal-body">
                    <div className="section content-section">
                        <div className="section-title-row">
                            <div>
                                <h3 className="section-title">Inputs</h3>
                                <p className="section-subtitle">What was provided for generation.</p>
                            </div>
                        </div>
                        <div className="kv-grid">
                            <div className="kv-item">
                                <div className="kv-label">Date</div>
                                <div className="kv-value">{selectedRow.date ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Brand Highlight</div>
                                <div className="kv-value">{selectedRow.brandHighlight ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Cross Promo</div>
                                <div className="kv-value">{selectedRow.crossPromo ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Theme</div>
                                <div className="kv-value">{selectedRow.theme ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Content Type</div>
                                <div className="kv-value">{selectedRow.contentType ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Channels</div>
                                <div className="kv-value">{selectedRow.channels ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Target Audience</div>
                                <div className="kv-value">{selectedRow.targetAudience ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Primary Goal</div>
                                <div className="kv-value">{selectedRow.primaryGoal ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">CTA</div>
                                <div className="kv-value">{selectedRow.cta ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Promo Type</div>
                                <div className="kv-value">{selectedRow.promoType ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Framework Used</div>
                                <div className="kv-value">{selectedRow.frameworkUsed ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Status</div>
                                <div className="kv-value">{getStatusValue(selectedRow.status)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="section content-section">
                        <div className="section-title-row">
                            <div>
                                <h3 className="section-title">AI-Generated Outputs</h3>
                                <p className="section-subtitle">What the system generated for review.</p>
                            </div>
                        </div>
                        <div className="content-grid">
                            <div className="content-card content-card--primary">
                                <div className="content-card-header">
                                    <div className="content-card-title">Caption Output</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy('captionOutput', selectedRow.captionOutput)}
                                    >
                                        {copiedField === 'captionOutput' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.captionOutput ?? ''}</div>
                            </div>

                            <div className="content-card content-card--secondary">
                                <div className="content-card-header">
                                    <div className="content-card-title">CTA Output</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy('ctaOuput', selectedRow.ctaOuput)}
                                    >
                                        {copiedField === 'ctaOuput' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.ctaOuput ?? ''}</div>
                            </div>

                            <div className="content-card content-card--secondary">
                                <div className="content-card-header">
                                    <div className="content-card-title">Hashtags Output</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy('hastagsOutput', selectedRow.hastagsOutput)}
                                    >
                                        {copiedField === 'hastagsOutput' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.hastagsOutput ?? ''}</div>
                            </div>
                        </div>
                    </div>

                    <div className="section content-section section-final">
                        <div className="section-title-row">
                            <div>
                                <h3 className="section-title">Review & Final Approval</h3>
                                <p className="section-subtitle">What will ship after human approval.</p>
                            </div>
                        </div>
                        <div className="content-grid">
                            <div className="content-card content-card--secondary">
                                <div className="content-card-header">
                                    <div className="content-card-title">Review Decision</div>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.reviewDecision ?? ''}</div>
                            </div>
                            <div className="content-card content-card--secondary">
                                <div className="content-card-header">
                                    <div className="content-card-title">Review Notes</div>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.reviewNotes ?? ''}</div>
                            </div>


                            <div className="content-card content-card--final">
                                <div className="content-card-header">
                                    <div className="content-card-title">Final Caption</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy('finalCaption', selectedRow.finalCaption)}
                                    >
                                        {copiedField === 'finalCaption' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--final">{selectedRow.finalCaption ?? ''}</div>
                            </div>
                            <div className="content-card content-card--final">
                                <div className="content-card-header">
                                    <div className="content-card-title">Final CTA</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy('finalCTA', selectedRow.finalCTA)}
                                    >
                                        {copiedField === 'finalCTA' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--final">{selectedRow.finalCTA ?? ''}</div>
                            </div>
                            <div className="content-card content-card--final">
                                <div className="content-card-header">
                                    <div className="content-card-title">Final Hashtags</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags)}
                                    >
                                        {copiedField === 'finalHashtags' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--final">{selectedRow.finalHashtags ?? ''}</div>
                            </div>

                            <div className="content-card content-card--final">
                                <div className="content-card-header">
                                    <div className="content-card-title">Final Description (Ready to Post)</div>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => {
                                            const finalDescription = [
                                                selectedRow.finalCaption,
                                                selectedRow.finalHashtags
                                            ].filter(Boolean).join('\n\n');
                                            handleCopy('finalDescription', finalDescription);
                                        }}
                                    >
                                        {copiedField === 'finalDescription' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--final">
                                    {[selectedRow.finalCaption, selectedRow.finalHashtags]
                                        .filter(Boolean)
                                        .join('\n\n') || ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <details className="section content-section section-system" open={false}>
                        <summary className="section-title-row">
                            <div>
                                <h3 className="section-title section-title--muted">System / Internal</h3>
                                <p className="section-subtitle section-subtitle--muted">Internal references and metadata.</p>
                            </div>
                        </summary>
                        <div className="kv-grid">
                            <div className="kv-item">
                                <div className="kv-label">DMP</div>
                                <div className="kv-value">
                                    <textarea
                                        className="field-input field-textarea"
                                        rows={6}
                                        value={selectedRow.dmp ?? ''}
                                        readOnly
                                        style={{ resize: 'vertical', maxHeight: '200px', overflowY: 'auto' }}
                                    />
                                </div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Attached Design</div>
                                <div className="kv-value">{selectedRow.attachedDesign ? JSON.stringify(selectedRow.attachedDesign) : ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Image Generated</div>
                                <div className="kv-value">
                                    {getImageGeneratedUrl(selectedRow) ? (
                                        (() => {
                                            const imageUrl = getImageGeneratedUrl(selectedRow);
                                            const separator = imageUrl?.includes('?') ? '&' : '?';
                                            return (
                                                <img
                                                    src={`${imageUrl}${separator}v=${imagePreviewNonce}`}
                                                    alt="Generated"
                                                    style={{ maxWidth: '220px', borderRadius: 8 }}
                                                />
                                            );
                                        })()
                                    ) : (
                                        <span>{selectedRow.imageGenerated ? JSON.stringify(selectedRow.imageGenerated) : ''}</span>
                                    )}
                                </div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Company ID</div>
                                <div className="kv-value">{selectedRow.companyId ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Content Calendar ID</div>
                                <div className="kv-value">{selectedRow.contentCalendarId ?? ''}</div>
                            </div>
                            <div className="kv-item">
                                <div className="kv-label">Created At</div>
                                <div className="kv-value">{selectedRow.created_at ?? ''}</div>
                            </div>
                        </div>
                    </details>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
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
                                        notify(genData.error || 'Caption generation is already running or completed.', 'info');
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
                        {isGeneratingCaption && <span className="loading-spinner"></span>}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-${['review', 'approved'].includes(
                            getStatusValue(selectedRow.status).trim().toLowerCase(),
                        )
                            ? 'primary'
                            : 'secondary'
                            } btn-sm`}
                        title="Send for revision again"
                        disabled={
                            getStatusValue(selectedRow.status).trim().toLowerCase() !== 'review' ||
                            !selectedRow.captionOutput
                        }
                        onClick={async () => {
                            if (!selectedRow) return;
                            if (getStatusValue(selectedRow.status).trim().toLowerCase() !== 'review') return;
                            if (!selectedRow.captionOutput) return;
                            const proceed = await requestConfirm({
                                title: 'Send this item for revision?',
                                description: "You're about to send this content item for AI revision.",
                                confirmLabel: 'Send for revision',
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
                                        notify(data.error || 'Failed to trigger revision.', 'error');
                                    }
                                    return;
                                }
                                notify('Sent for revision.', 'success');
                            } catch (err) {
                                console.error('Failed to call review endpoint', err);
                                notify('Failed to trigger revision. Check console for details.', 'error');
                                return;
                            } finally {
                                await refreshCalendarRow(selectedRow.contentCalendarId);
                                setIsRevisingCaption(false);
                            }
                        }}
                    >
                        {isRevisingCaption ? 'Revising…' : 'Revise caption'}
                        {isRevisingCaption && <span className="loading-spinner"></span>}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-${['approved', 'design completed'].includes(
                            getStatusValue(selectedRow.status).trim().toLowerCase(),
                        )
                            ? 'primary'
                            : 'secondary'
                            } btn-sm`}
                        title="Generate image (coming soon)"
                        disabled={
                            !['approved', 'design completed'].includes(
                                getStatusValue(selectedRow.status).trim().toLowerCase(),
                            )
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
                        className="btn btn-secondary btn-sm"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
