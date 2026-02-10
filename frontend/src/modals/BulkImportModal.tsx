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
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Bulk Import"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-5xl">
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 p-6 bg-gradient-to-b from-white to-slate-50/50">
                        <div>
                            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#3fa9f5] mb-1">Bulk Import</p>
                            <h2 className="text-xl font-bold text-brand-dark tracking-tight font-display">
                                Paste from Sheet
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
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                        {!showPreview ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm text-brand-dark/60 leading-relaxed">
                                    Paste rows from your sheet below. We'll format everything and show a preview before anything is
                                    imported.
                                </p>
                                <textarea
                                    className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-4 text-brand-dark/80 outline-none focus:border-[#3fa9f5]/30 focus:bg-white transition-all min-h-[300px]"
                                    rows={10}
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                    placeholder="Paste rows copied from Google Sheets or Excel"
                                    spellCheck={false}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold tracking-wide text-brand-dark uppercase">Import Preview</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200/70 to-transparent" />
                                    <span className="text-xs text-brand-dark/40 italic">Check your data before importing</span>
                                </div>

                                {bulkPreview.length > 0 ? (
                                    <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 border-b border-slate-200/60">
                                                    <tr>
                                                        {[
                                                            'Date', 'Brand highlight', 'Cross promo', 'Theme',
                                                            'Content type', 'Channels', 'Target audience',
                                                            'Primary goal', 'CTA', 'Promo type'
                                                        ].map((col) => (
                                                            <th key={col} className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark/50 whitespace-nowrap">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {bulkPreview.map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                                                            {row.map((cell, cellIndex) => (
                                                                <td key={cellIndex} className="px-4 py-2.5 text-xs text-brand-dark/80 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                                    {cell || '—'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <p className="text-sm text-brand-dark/40">No data to preview. Try pasting again.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-6 bg-slate-50/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                        >
                            Cancel
                        </button>
                        {showPreview ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-[#3fa9f5] border border-[#3fa9f5]/20 shadow-sm transition hover:bg-[#3fa9f5]/5 active:translate-y-[1px]"
                                >
                                    Back to paste
                                </button>
                                <button
                                    type="button"
                                    disabled={isImporting}
                                    onClick={handleBulkImport}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] disabled:opacity-40"
                                >
                                    {isImporting ? 'Importing…' : 'Import'}
                                    {isImporting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] disabled:opacity-40"
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
        </div>
    );
}
