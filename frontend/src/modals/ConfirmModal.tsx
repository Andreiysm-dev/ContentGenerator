import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    config: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
        confirmVariant?: 'primary' | 'danger';
    } | null;
    onResolve: (value: boolean) => void;
}

export function ConfirmModal({
    isOpen,
    config,
    onResolve,
}: ConfirmModalProps) {
    if (!isOpen || !config) return null;

    return (
        <div className="modal-backdrop confirm-backdrop" role="presentation">
            <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                <div className="modal-header confirm-header">
                    <h2 id="confirm-title" className="modal-title">{config.title}</h2>
                </div>
                <div className="modal-body confirm-body">
                    <p className="modal-description">{config.description}</p>
                </div>
                <div className="modal-footer confirm-footer">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onResolve(false)}>
                        {config.cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-${config.confirmVariant === 'danger' ? 'danger' : 'primary'} btn-sm`}
                        onClick={() => onResolve(true)}
                    >
                        {config.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
