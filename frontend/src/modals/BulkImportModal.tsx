import React from 'react';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    bulkText: string;
    setBulkText: (text: string) => void;
    bulkPreview: string[][];
    setBulkPreview: React.Dispatch<React.SetStateAction<string[][]>>;
    showPreview: boolean;
    setShowPreview: (show: boolean) => void;
    isImporting: boolean;
    parseBulkText: (text: string) => string[][];
    handleBulkImport: () => Promise<void>;
}

export function BulkImportModal({
    isOpen,
    onClose,
    bulkText,
    setBulkText,
    bulkPreview,
    setBulkPreview,
    showPreview,
    setShowPreview,
    isImporting,
    parseBulkText,
    handleBulkImport,
}: BulkImportModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal modal-bulk">
                <div className="modal-header bulk-header">
                    <div>
                        <p className="bulk-kicker">Bulk Import</p>
                        <h2 className="modal-title">Paste from Sheet</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-close"
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body bulk-modal-body">
                    <div className={`bulk-content ${showPreview ? 'bulk-content--preview' : 'bulk-content--paste'}`}>
                        <div className="bulk-paste-panel">
                            <p className="modal-description">
                                Paste rows from your sheet below. We'll format everything and show a preview before anything is
                                imported.
                            </p>
                            <textarea
                                rows={6}
                                value={bulkText}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBulkText(value);
                                }}
                                className="bulk-textarea"
                                placeholder="Paste rows copied from Google Sheets or Excel"
                                spellCheck={false}
                            />
                        </div>
                        {showPreview && bulkPreview.length > 0 && (
                            <div className="bulk-preview">
                                <div className="bulk-preview-title">Here's how your data will be imported</div>
                                <div className="bulk-preview-table-wrapper">
                                    <table className="bulk-preview-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Brand highlight</th>
                                                <th>Cross promo</th>
                                                <th>Theme</th>
                                                <th>Content type</th>
                                                <th>Channels</th>
                                                <th>Target audience</th>
                                                <th>Primary goal</th>
                                                <th>CTA</th>
                                                <th>Promo type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkPreview.map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={cellIndex}>{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                    >
                        Cancel
                    </button>
                    {showPreview ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="btn btn-secondary btn-sm"
                            >
                                Back to paste
                            </button>
                            <button
                                type="button"
                                disabled={isImporting}
                                onClick={handleBulkImport}
                                className="btn btn-primary btn-sm"
                            >
                                {isImporting ? 'Importing…' : 'Import'}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={!bulkText.trim()}
                            onClick={() => {
                                setBulkPreview(parseBulkText(bulkText));
                                setShowPreview(true);
                            }}
                        >
                            Preview import
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
