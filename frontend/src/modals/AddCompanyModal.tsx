import React from 'react';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCompanyName: string;
  setNewCompanyName: (value: string) => void;
  newCompanyDescription: string;
  setNewCompanyDescription: (value: string) => void;
  onSubmit: () => Promise<void>;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
  isAiAssistantOpen?: boolean;
  isLoading?: boolean;
}

export function AddCompanyModal({
  isOpen,
  onClose,
  newCompanyName,
  setNewCompanyName,
  newCompanyDescription,
  setNewCompanyDescription,
  onSubmit,
  notify,
  isAiAssistantOpen,
  isLoading
}: AddCompanyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 transition-all duration-300 ${isAiAssistantOpen ? 'pr-[400px]' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Add Company"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 p-5 bg-gradient-to-b from-white to-slate-50/50">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#3fa9f5] mb-1">Company</p>
            <h2 className="text-lg font-bold text-brand-dark tracking-tight font-display">
              Add Company
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-brand-dark/70 shadow-sm transition hover:bg-slate-50 hover:text-brand-dark focus-visible:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 ml-1">Company Name</label>
              <input
                type="text"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-brand-dark outline-none focus:border-[#3fa9f5]/30 focus:bg-white transition-all"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g., Moonshot Studios"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 ml-1">Company Description</label>
              <input
                type="text"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-brand-dark outline-none focus:border-[#3fa9f5]/30 focus:bg-white transition-all"
                value={newCompanyDescription}
                onChange={(e) => setNewCompanyDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 p-5 bg-slate-50/30">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-bold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={async () => {
              if (isLoading) return;
              if (!newCompanyName.trim()) {
                notify('Company name is required.', 'error');
                return;
              }
              await onSubmit();
            }}
          >
            {isLoading ? 'Creating...' : 'Create Company'}
          </button>
        </div>
      </div>
    </div>
  );
}
