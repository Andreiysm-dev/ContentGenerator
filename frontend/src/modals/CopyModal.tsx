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
    isAiAssistantOpen?: boolean;
}

export function CopyModal({
    isOpen,
    onClose,
    copyFieldSelection,
    setCopyFieldSelection,
    copyFieldDefinitions,
    copySuccessMessage,
    handleCopySpreadsheet,
    isAiAssistantOpen
}: CopyModalProps) {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
    };

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Copy content for spreadsheet"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden"
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCopySpreadsheet();
                    }
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 p-5 bg-gradient-to-b from-white to-slate-50/50">
                    <h2 className="text-lg font-bold text-brand-dark tracking-tight font-display">
                        Copy content for spreadsheet
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-brand-dark/70 shadow-sm transition hover:bg-slate-50 hover:text-brand-dark focus-visible:outline-none"
                        aria-label="Close"
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
                    <div className="p-6 space-y-5">
                        <p className="text-sm text-brand-dark/60 leading-relaxed">
                            Copy your selected content in a spreadsheet-safe format. Emojis, line breaks, and formatting will
                            be preserved.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            {copyFieldDefinitions.map((field) => (
                                <label key={field.key} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-[#3fa9f5] checked:bg-[#3fa9f5] hover:border-[#3fa9f5]"
                                            checked={!!copyFieldSelection[field.key]}
                                            onChange={(event) =>
                                                setCopyFieldSelection((prev) => ({
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

                        {copySuccessMessage && (
                            <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs font-semibold border border-green-100 animate-in fade-in slide-in-from-top-1">
                                {copySuccessMessage}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-5 bg-slate-50/30">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px]"
                        >
                            Copy to clipboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
