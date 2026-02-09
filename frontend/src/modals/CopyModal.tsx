import React from 'react';

interface CopyFieldDefinition {
    key: string;
    label: string;
}

interface CopyModalProps {
    isOpen: boolean;
    onClose: () => void;
    copyFieldSelection: Record<string, boolean>;
    setCopyFieldSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    copyFieldDefinitions: CopyFieldDefinition[];
    copySuccessMessage: string;
    handleCopySpreadsheet: () => void;
}

export function CopyModal({
    isOpen,
    onClose,
    copyFieldSelection,
    setCopyFieldSelection,
    copyFieldDefinitions,
    copySuccessMessage,
    handleCopySpreadsheet,
}: CopyModalProps) {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div
                className="modal modal-copy"
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCopySpreadsheet();
                    }
                }}
            >
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Copy content for spreadsheet</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="modal-close"
                    >
                        ×
                    </button>
                </div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleCopySpreadsheet();
                    }}
                >
                    <div className="modal-body copy-modal-body">
                        <p className="modal-description">
                            Copy your selected content in a spreadsheet-safe format. Emojis, line breaks, and formatting will
                            be preserved.
                        </p>
                        <div className="copy-fields">
                            {copyFieldDefinitions.map((field) => (
                                <label key={field.key} className="copy-field">
                                    <input
                                        type="checkbox"
                                        checked={!!copyFieldSelection[field.key]}
                                        onChange={(event) =>
                                            setCopyFieldSelection((prev) => ({
                                                ...prev,
                                                [field.key]: event.target.checked,
                                            }))
                                        }
                                    />
                                    <span>{field.label}</span>
                                </label>
                            ))}
                        </div>
                        {copySuccessMessage && <div className="copy-success">{copySuccessMessage}</div>}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary btn-sm"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-sm">
                            Copy to clipboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
