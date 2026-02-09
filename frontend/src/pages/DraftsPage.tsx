import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Copy, Download } from 'lucide-react';

interface DraftsPageProps {
    calendarRows: any[];
    getStatusValue: (status: any) => string;
    getImageGeneratedUrl: (row: any) => string | null;
    getAttachedDesignUrls: (row: any) => string[];
    setSelectedRow: (row: any) => void;
    setIsViewModalOpen: (value: boolean) => void;
    notify: (message: string, tone: 'success' | 'error' | 'info') => void;
    activeCompanyId: string | undefined;
}

export function DraftsPage({
    calendarRows,
    getStatusValue,
    getImageGeneratedUrl,
    getAttachedDesignUrls,
    setSelectedRow,
    setIsViewModalOpen,
    notify,
    activeCompanyId,
}: DraftsPageProps) {
    const navigate = useNavigate();

    const draftRows = calendarRows.filter((row) => {
        const status = getStatusValue(row.status).toLowerCase();
        return status === 'design completed' || status === 'approved';
    });

    const draftCount = draftRows.length;

    return (
        <main className="app-main">
            <section className="card">
                <div className="card-header">
                    <div>
                        <h1 className="card-title">Drafts</h1>
                        <p className="card-subtitle">
                            Content ready to be posted on social media.{' '}
                            {draftCount > 0
                                ? `${draftCount} ${draftCount === 1 ? 'item' : 'items'} ready`
                                : 'No items ready yet'}
                        </p>
                    </div>
                </div>

                {draftRows.length === 0 ? (
                    <div className="empty-state">
                        <FileText className="empty-state-icon" aria-hidden />
                        <span className="empty-state-title">No drafts ready yet</span>
                        <p>Generate and approve content in the Calendar to see drafts here.</p>
                        <div className="empty-state-cta">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                    activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/calendar`)
                                }
                                disabled={!activeCompanyId}
                            >
                                Go to Calendar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="drafts-grid">
                        {draftRows.map((row) => {
                            const imageUrl = getImageGeneratedUrl(row) || getAttachedDesignUrls(row)[0];
                            const caption = row.finalCaption || row.captionOutput || '';
                            const captionPreview = caption.length > 150 ? caption.substring(0, 150) + '...' : caption;
                            const channels = Array.isArray(row.channels)
                                ? row.channels
                                : row.channels
                                    ? [row.channels]
                                    : [];

                            return (
                                <div key={row.contentCalendarId} className="draft-card">
                                    <div className="draft-card-hover-actions">
                                        <button
                                            type="button"
                                            className="draft-card-hover-btn"
                                            onClick={() => {
                                                setSelectedRow(row);
                                                setIsViewModalOpen(true);
                                            }}
                                            title="View details"
                                        >
                                            <Eye style={{ width: '16px', height: '16px', color: 'var(--ink-700)' }} />
                                        </button>
                                        <button
                                            type="button"
                                            className="draft-card-hover-btn"
                                            onClick={async () => {
                                                const textToCopy = [
                                                    row.finalCaption || row.captionOutput || '',
                                                    row.finalHashtags || row.hastagsOutput || '',
                                                    row.finalCTA || row.ctaOuput || '',
                                                ]
                                                    .filter(Boolean)
                                                    .join('\n\n');
                                                try {
                                                    await navigator.clipboard.writeText(textToCopy);
                                                    notify('Copied to clipboard!', 'success');
                                                } catch (err) {
                                                    notify('Failed to copy', 'error');
                                                }
                                            }}
                                            title="Copy all text"
                                        >
                                            <Copy style={{ width: '16px', height: '16px', color: 'var(--ink-700)' }} />
                                        </button>
                                        {imageUrl && (
                                            <button
                                                type="button"
                                                className="draft-card-hover-btn"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = imageUrl;
                                                    link.download = `${row.date || 'draft'}-image.jpg`;
                                                    link.click();
                                                }}
                                                title="Download image"
                                            >
                                                <Download style={{ width: '16px', height: '16px', color: 'var(--ink-700)' }} />
                                            </button>
                                        )}
                                    </div>
                                    {imageUrl && (
                                        <img src={imageUrl} alt="Content preview" className="draft-card-image" />
                                    )}
                                    {!imageUrl && (
                                        <div className="draft-card-image draft-card-image-placeholder">
                                            <FileText size={48} style={{ opacity: 0.3 }} />
                                        </div>
                                    )}
                                    <div className="draft-card-content">
                                        <div className="draft-card-date">{row.date || 'No date'}</div>
                                        <div className="draft-card-caption">{captionPreview}</div>
                                        {channels.length > 0 && (
                                            <div className="draft-card-channels">
                                                {channels.map((channel: string, idx: number) => (
                                                    <span key={idx} className="channel-badge">
                                                        {channel}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="draft-card-actions">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={() => {
                                                    setSelectedRow(row);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                View Details
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={async () => {
                                                    const textToCopy = [
                                                        row.finalCaption || row.captionOutput || '',
                                                        row.finalHashtags || row.hastagsOutput || '',
                                                        row.finalCTA || row.ctaOuput || '',
                                                    ]
                                                        .filter(Boolean)
                                                        .join('\n\n');
                                                    try {
                                                        await navigator.clipboard.writeText(textToCopy);
                                                        notify('Copied to clipboard!', 'success');
                                                    } catch (err) {
                                                        notify('Failed to copy', 'error');
                                                    }
                                                }}
                                            >
                                                Copy All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
