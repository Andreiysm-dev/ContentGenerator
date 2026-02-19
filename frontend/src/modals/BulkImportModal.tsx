import React, { useState } from 'react';

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
    const [addCount, setAddCount] = useState(1);

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
            <div className="w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[1600px]">
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
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
                        <div className="flex flex-col gap-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-2xl">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Bulk Spreadsheet Mode</h3>
                                    <p className="text-[10px] font-bold text-slate-400">Paste directly into cells or type to edit. Column order must match the headers.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const headers = ['Date', 'Brand highlight (80%)', 'Cross promo (20%)', 'Theme', 'Content type', 'Target audience', 'Primary goal', 'CTA', 'Promo type'];
                                            navigator.clipboard.writeText(headers.join('\t'));
                                            // Simple custom notification logic if needed, otherwise alert is fine for now
                                            alert('Excel headers copied! Paste them into your sheet to prepare your data.');
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black bg-blue-600/10 text-blue-400 border border-blue-500/20 transition hover:bg-blue-600/20 active:scale-95"
                                    >
                                        Copy Headers
                                    </button>
                                    <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={addCount}
                                            onChange={(e) => setAddCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                                            className="w-12 bg-transparent text-white text-[10px] font-black text-center outline-none border-none focus:ring-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newRows = Array.from({ length: addCount }, () => Array(9).fill(''));
                                                setBulkPreview([...bulkPreview, ...newRows]);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black bg-emerald-500 text-white transition hover:bg-emerald-600 active:scale-95 whitespace-nowrap"
                                        >
                                            Add {addCount > 1 ? addCount : ''} Rows
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Clear all data?')) {
                                                setBulkPreview([Array(9).fill('')]);
                                                setBulkText('');
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black bg-rose-600/10 text-rose-400 border border-rose-500/20 transition hover:bg-rose-600/20 active:scale-95"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            {/* Spreadsheet Grid */}
                            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xl bg-white group/grid">
                                <div className="overflow-x-auto max-h-[500px]">
                                    <table className="w-full text-left border-collapse table-fixed">
                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-30">
                                            <tr>
                                                <th className="w-10 px-2 py-3 text-[90px] font-black text-slate-300 text-center opacity-20 select-none">#</th>
                                                {[
                                                    'Date', 'Brand Highlight', 'Cross Promo', 'Theme',
                                                    'Content Type', 'Audience', 'Goal', 'CTA', 'Promo Type'
                                                ].map((col) => (
                                                    <th key={col} className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-l border-slate-200 first:border-l-0">
                                                        {col}
                                                    </th>
                                                ))}
                                                <th className="w-12 border-l border-slate-200"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bulkPreview.length > 0 ? (
                                                bulkPreview.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="hover:bg-blue-50/30 transition-colors group/row">
                                                        <td className="px-2 py-3 text-[10px] font-black text-slate-400 text-center bg-slate-50/50 group-hover/row:bg-blue-100/50 transition-colors select-none">
                                                            {rowIndex + 1}
                                                        </td>
                                                        {row.slice(0, 9).map((cell, colIndex) => (
                                                            <td key={colIndex} className="p-0 border-l border-slate-100 first:border-l-0 relative focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:z-10">
                                                                <input
                                                                    type="text"
                                                                    value={cell}
                                                                    placeholder="..."
                                                                    onPaste={(e) => {
                                                                        e.preventDefault();
                                                                        let pasteData = e.clipboardData.getData('text');

                                                                        // 1. Smart Cleanup: Detect if this is a markdown table with text around it
                                                                        if (pasteData.includes('|')) {
                                                                            const lines = pasteData.split(/\r?\n/);
                                                                            const tableLines = lines.filter(l => l.includes('|'));
                                                                            if (tableLines.length > 0) {
                                                                                pasteData = tableLines.join('\n');
                                                                            }
                                                                        }

                                                                        const rawLines = pasteData.split(/\r?\n/).filter(line => line.trim().length > 0);
                                                                        let parsedRows: string[][] = [];

                                                                        // Check for delimiters
                                                                        const hasTabs = pasteData.includes('\t');
                                                                        const hasPipes = pasteData.includes('|');

                                                                        if (hasPipes) {
                                                                            // Parse Markdown Table
                                                                            parsedRows = rawLines
                                                                                .filter(l => l.includes('|') && !l.includes('---'))
                                                                                .map(l => {
                                                                                    // Split by pipe and remove first/last empty elements if they exist (caused by | cell | cell |)
                                                                                    let cells = l.split('|').map(c => c.trim());
                                                                                    if (cells[0] === '') cells.shift();
                                                                                    if (cells[cells.length - 1] === '') cells.pop();
                                                                                    return cells;
                                                                                });
                                                                        } else if (hasTabs) {
                                                                            // Standard Spreadsheet Paste
                                                                            parsedRows = rawLines.map(l => l.split('\t').map(c => c.trim()));
                                                                        } else {
                                                                            // 2. ChatGPT/AI List Detection
                                                                            // If we have multiple lines but no tabs/pipes, it's likely a vertical list
                                                                            // We strip prefixes like "1. ", "- ", or "Field Name: "
                                                                            const cleanLines = rawLines.map(l => {
                                                                                // Strip "1. ", "- ", "* "
                                                                                let s = l.replace(/^[0-9]+[\.\)]\s*|^[\-\*\u2022]\s*/, '').trim();
                                                                                // Strip "Field: " if it exists
                                                                                if (s.includes(':')) {
                                                                                    const parts = s.split(':');
                                                                                    // Only strip if the prefix is short (likely a label)
                                                                                    if (parts[0].length < 25) {
                                                                                        s = parts.slice(1).join(':').trim();
                                                                                    }
                                                                                }
                                                                                return s;
                                                                            });

                                                                            // If pasting into the first column and we have a list that fits a single row (<= 9 items)
                                                                            if (colIndex === 0 && cleanLines.length > 1 && cleanLines.length <= 9) {
                                                                                parsedRows = [cleanLines]; // Transpose to a single row
                                                                            } else {
                                                                                parsedRows = cleanLines.map(l => [l]); // Standard vertical paste
                                                                            }
                                                                        }

                                                                        // Apply the parsed rows to the grid
                                                                        const newPreview = [...bulkPreview];
                                                                        parsedRows.forEach((pRow, rIdx) => {
                                                                            const targetRowIdx = rowIndex + rIdx;
                                                                            if (!newPreview[targetRowIdx]) {
                                                                                newPreview[targetRowIdx] = Array(9).fill('');
                                                                            }
                                                                            pRow.forEach((pCell, cIdx) => {
                                                                                const targetColIdx = colIndex + cIdx;
                                                                                if (targetColIdx < 9) {
                                                                                    newPreview[targetRowIdx][targetColIdx] = pCell;
                                                                                }
                                                                            });
                                                                        });
                                                                        setBulkPreview(newPreview);
                                                                    }}
                                                                    onChange={(e) => {
                                                                        const newPreview = [...bulkPreview];
                                                                        newPreview[rowIndex][colIndex] = e.target.value;
                                                                        setBulkPreview(newPreview);
                                                                    }}
                                                                    className="w-full px-3 py-3 text-xs font-bold text-slate-800 bg-transparent outline-none border-none placeholder:text-slate-200"
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="px-2 py-3 text-center border-l border-slate-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newPreview = bulkPreview.filter((_, i) => i !== rowIndex);
                                                                    setBulkPreview(newPreview.length ? newPreview : [Array(9).fill('')]);
                                                                }}
                                                                className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 text-slate-300 hover:text-rose-500"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={11} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No data. Click "Add Row" or Paste here.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {bulkPreview.length > 0 && bulkPreview.some(r => r.some(c => c)) && (
                                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in zoom-in duration-300">
                                    <p className="text-[11px] font-bold text-blue-700 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Spreadsheet ready. Review your {bulkPreview.length} rows and click Import to save to calendar.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-6 bg-slate-50/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-slate-500 border border-slate-200 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isImporting || !bulkPreview.length || !bulkPreview.some(r => r.some(c => c))}
                            onClick={handleBulkImport}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-inset ring-black/5 transition hover:bg-blue-700 active:bg-blue-800 active:translate-y-[1px] disabled:opacity-40 disabled:shadow-none"
                        >
                            {isImporting ? 'Importing…' : `Import ${bulkPreview.filter(r => r.some(c => c)).length} Rows`}
                            {isImporting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
