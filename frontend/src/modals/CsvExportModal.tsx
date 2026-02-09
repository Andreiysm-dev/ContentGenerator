import React from 'react';

interface CsvFieldDefinition {
    key: string;
    label: string;
}

interface CsvExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    csvScope: 'selected' | 'all';
    setCsvScope: (scope: 'selected' | 'all') => void;
    csvFieldSelection: Record<string, boolean>;
    setCsvFieldSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    csvFieldDefinitions: CsvFieldDefinition[];
    handleExportCsv: () => void;
}

export function CsvExportModal({
    isOpen,
    onClose,
    csvScope,
    setCsvScope,
    csvFieldSelection,
    setCsvFieldSelection,
    csvFieldDefinitions,
    handleExportCsv,
}: CsvExportModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal modal-copy">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Export CSV</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-close"
                    >
                        ×
                    </button>
                </div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleExportCsv();
                    }}
                >
                    <div className="modal-body copy-modal-body">
                        <p className="modal-description">
                            Choose which rows and fields you want to export. Your CSV will match the order below.
                        </p>
                        <div className="csv-scope">
                            <label className="copy-field">
                                <input
                                    type="radio"
                                    name="csvScope"
                                    checked={csvScope === 'selected'}
                                    onChange={() => setCsvScope('selected')}
                                />
                                <span>Selected rows</span>
                            </label>
                            <label className="copy-field">
                                <input
                                    type="radio"
                                    name="csvScope"
                                    checked={csvScope === 'all'}
                                    onChange={() => setCsvScope('all')}
                                />
                                <span>All rows</span>
                            </label>
                        </div>
                        <div className="copy-fields">
                            {csvFieldDefinitions.map((field) => (
                                <label key={field.key} className="copy-field">
                                    <input
                                        type="checkbox"
                                        checked={!!csvFieldSelection[field.key]}
                                        onChange={(event) =>
                                            setCsvFieldSelection((prev) => ({
                                                ...prev,
                                                [field.key]: event.target.checked,
                                            }))
                                        }
                                    />
                                    <span>{field.label}</span>
                                </label>
                            ))}
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
                        <button type="submit" className="btn btn-primary btn-sm">
                            Export CSV
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
