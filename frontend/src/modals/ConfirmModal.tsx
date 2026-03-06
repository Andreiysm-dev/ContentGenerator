import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    config: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
        thirdLabel?: string;
        confirmVariant?: 'primary' | 'danger';
        thirdVariant?: 'primary' | 'danger' | 'ghost';
    } | null;
    onResolve: (value: boolean | 'third') => void;
    isAiAssistantOpen?: boolean;
}

export function ConfirmModal({
    isOpen,
    config,
    onResolve,
    isAiAssistantOpen
}: ConfirmModalProps) {
    if (!isOpen || !config) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onResolve(false);
            }}
        >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h2 id="confirm-title" className="text-lg font-bold text-brand-dark tracking-tight font-display mb-2">
                        {config.title}
                    </h2>
                    <p className="text-sm text-brand-dark/60 leading-relaxed">
                        {config.description}
                    </p>
                </div>

                <div className="flex flex-col gap-2 p-4 bg-slate-50/30 border-t border-slate-200/60">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
                            onClick={() => onResolve(false)}
                        >
                            {config.cancelLabel}
                        </button>
                        {config.thirdLabel && (
                            <button
                                type="button"
                                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-inset ring-black/5 transition active:translate-y-[1px] ${config.thirdVariant === 'danger'
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : config.thirdVariant === 'ghost'
                                        ? 'bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    }`}
                                onClick={() => onResolve('third')}
                            >
                                {config.thirdLabel}
                            </button>
                        )}
                        <button
                            type="button"
                            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-inset ring-black/5 transition active:translate-y-[1px] ${config.confirmVariant === 'danger'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-[#3fa9f5] text-white hover:bg-[#2f97e6]'
                                }`}
                            onClick={() => onResolve(true)}
                        >
                            {config.confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
