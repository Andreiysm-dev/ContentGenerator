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
    isAiAssistantOpen?: boolean;
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
    isAiAssistantOpen
}: CsvExportModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Export CSV"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 p-5 bg-gradient-to-b from-white to-slate-50/50">
                    <h2 className="text-lg font-bold text-brand-dark tracking-tight font-display">
                        Export CSV
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-brand-dark/70 shadow-sm transition hover:bg-slate-50 hover:text-brand-dark focus-visible:outline-none"
                        aria-label="Close"
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
                    <div className="p-6 space-y-6">
                        <p className="text-sm text-brand-dark/60 leading-relaxed">
                            Choose which rows and fields you want to export. Your CSV will match the order below.
                        </p>

                        <div className="flex gap-6 pb-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="csvScope"
                                    className="h-4 w-4 border-slate-300 text-[#3fa9f5] focus:ring-[#3fa9f5] cursor-pointer"
                                    checked={csvScope === 'selected'}
                                    onChange={() => setCsvScope('selected')}
                                />
                                <span className="text-sm font-semibold text-brand-dark/80 group-hover:text-brand-dark transition-colors">Selected rows</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="csvScope"
                                    className="h-4 w-4 border-slate-300 text-[#3fa9f5] focus:ring-[#3fa9f5] cursor-pointer"
                                    checked={csvScope === 'all'}
                                    onChange={() => setCsvScope('all')}
                                />
                                <span className="text-sm font-semibold text-brand-dark/80 group-hover:text-brand-dark transition-colors">All rows</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                            {csvFieldDefinitions.map((field) => (
                                <label key={field.key} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-[#3fa9f5] checked:bg-[#3fa9f5] hover:border-[#3fa9f5]"
                                            checked={!!csvFieldSelection[field.key]}
                                            onChange={(event) =>
                                                setCsvFieldSelection((prev) => ({
                                                    ...prev,
                                                    [field.key]: event.target.checked,
                                                }))
                                            }
                                        />
                                        <svg className="absolute w-3 h-3 text-white transition-opacity opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-brand-dark/80 group-hover:text-brand-dark transition-colors">{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-5 bg-slate-50/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px]"
                        >
                            Export CSV
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
