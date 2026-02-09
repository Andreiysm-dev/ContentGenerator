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
}: AddCompanyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal settings-modal">
        <div className="modal-header settings-header">
          <div>
            <p className="modal-kicker">Company</p>
            <h2 className="modal-title">Add Company</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body settings-body">
          <div className="settings-section">
            <div className="settings-grid">
              <div className="form-group">
                <label className="field-label">Company Name</label>
                <input
                  type="text"
                  className="field-input"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g., Moonshot Studios"
                />
              </div>
              <div className="form-group">
                <label className="field-label">Company Description</label>
                <input
                  type="text"
                  className="field-input"
                  value={newCompanyDescription}
                  onChange={(e) => setNewCompanyDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer settings-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              if (!newCompanyName.trim()) {
                notify('Company name is required.', 'error');
                return;
              }
              await onSubmit();
            }}
          >
            Create Company
          </button>
        </div>
      </div>
    </div>
  );
}
