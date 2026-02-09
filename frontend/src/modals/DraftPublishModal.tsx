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
}: DraftPublishModalProps) {
    if (!isOpen || !selectedRow) return null;

    return (
        <div className="modal-backdrop modal-backdrop-top">
            <div className="modal modal-wide content-modal draft-publish-modal">
                <div className="modal-header content-modal-header">
                    <div className="content-modal-title">
                        <h2>Draft & publish content</h2>
                        <p>
                            Review the final content and decide how you'd like to proceed. You can save this as a draft or mark
                            it as ready for publishing.
                        </p>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="modal-body content-modal-body draft-publish-body">
                    <section className="draft-section">
                        <div className="section-title-row">
                            <h3 className="section-title">Content summary</h3>
                        </div>
                        <div className="draft-summary-grid">
                            <div>
                                <div className="draft-summary-label">Brand / Company</div>
                                <div className="draft-summary-value">{activeCompany?.companyName ?? '—'}</div>
                            </div>
                            <div>
                                <div className="draft-summary-label">Channels</div>
                                <div className="draft-summary-value">
                                    {Array.isArray(selectedRow.channels) && selectedRow.channels.length
                                        ? selectedRow.channels.join(', ')
                                        : '—'}
                                </div>
                            </div>
                        </div>
                        <div className="draft-summary-block">
                            <div className="draft-summary-header">
                                <span>Final caption</span>
                                <button type="button" className="copy-btn" onClick={() => handleCopy('finalCaption', selectedRow.finalCaption)}>
                                    {copiedField === 'finalCaption' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="content-box content-box--scroll">{selectedRow.finalCaption ?? ''}</div>
                        </div>
                        <div className="draft-summary-grid">
                            <div>
                                <div className="draft-summary-header">
                                    <span>Final hashtags</span>
                                    <button type="button" className="copy-btn" onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags)}>
                                        {copiedField === 'finalHashtags' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.finalHashtags ?? ''}</div>
                            </div>
                            <div>
                                <div className="draft-summary-header">
                                    <span>Final CTA</span>
                                    <button type="button" className="copy-btn" onClick={() => handleCopy('finalCTA', selectedRow.finalCTA)}>
                                        {copiedField === 'finalCTA' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="content-box content-box--scroll">{selectedRow.finalCTA ?? ''}</div>
                            </div>
                        </div>
                        <div className="draft-summary-block">
                            <div className="draft-summary-header">
                                <span>Attached images</span>
                                <label className="btn btn-secondary btn-sm draft-upload-btn">
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
                                        className="draft-upload-input"
                                    />
                                </label>
                            </div>
                            <div className="draft-image-preview">
                                {(() => {
                                    const attached = getAttachedDesignUrls(selectedRow);
                                    if (attached.length) {
                                        return (
                                            <div className="draft-image-grid">
                                                {attached.map((url, index) => (
                                                    <img key={`${url}-${index}`} src={url} alt={`Design ${index + 1}`} />
                                                ))}
                                            </div>
                                        );
                                    }
                                    if (getImageGeneratedUrl(selectedRow)) {
                                        const imageUrl = getImageGeneratedUrl(selectedRow);
                                        const separator = imageUrl?.includes('?') ? '&' : '?';
                                        return <img src={`${imageUrl}${separator}v=${imagePreviewNonce}`} alt="Generated" />;
                                    }
                                    return <div className="draft-preview-placeholder">No images attached yet</div>;
                                })()}
                            </div>
                        </div>
                    </section>

                    <section className="draft-section">
                        <div className="section-title-row">
                            <h3 className="section-title">Platform readiness</h3>
                        </div>
                        <div className="draft-readiness">
                            <div className="draft-summary-label">Selected platforms</div>
                            <div className="draft-summary-value">
                                {Array.isArray(selectedRow.channels) && selectedRow.channels.length
                                    ? selectedRow.channels.join(', ')
                                    : '—'}
                            </div>
                            <div className="draft-readiness-status">Posting not scheduled yet</div>
                            <div className="draft-readiness-note">
                                Publishing to connected social accounts will be available soon.
                            </div>
                        </div>
                    </section>

                    <section className="draft-section">
                        <div className="section-title-row">
                            <h3 className="section-title">Publish intent</h3>
                        </div>
                        <div className="draft-intent-options">
                            <label className={`draft-intent-card ${draftPublishIntent === 'draft' ? 'is-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="draftIntent"
                                    checked={draftPublishIntent === 'draft'}
                                    onChange={() => setDraftPublishIntent('draft')}
                                />
                                <div>
                                    <div className="draft-intent-title">Save as draft</div>
                                    <div className="draft-intent-copy">
                                        Keep this content saved and editable. You can publish it later.
                                    </div>
                                </div>
                            </label>
                            <label className={`draft-intent-card ${draftPublishIntent === 'ready' ? 'is-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="draftIntent"
                                    checked={draftPublishIntent === 'ready'}
                                    onChange={() => setDraftPublishIntent('ready')}
                                />
                                <div>
                                    <div className="draft-intent-title">Mark as ready to publish</div>
                                    <div className="draft-intent-copy">
                                        This content will be marked as approved and ready for publishing. Publishing can be scheduled later.
                                    </div>
                                </div>
                            </label>
                        </div>
                    </section>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleDraftPublishIntent}>
                        {draftPublishIntent === 'ready' ? 'Mark as ready' : 'Save draft'}
                    </button>
                </div>
            </div>
        </div>
    );
}
