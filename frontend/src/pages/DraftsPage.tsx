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

    const copyAllText = async (row: any) => {
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
        } catch {
            notify('Failed to copy', 'error');
        }
    };

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
            <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6">
                <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:border-brand-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark tracking-tight font-display">Drafts</h1>
                            <p className="mt-1 text-sm text-brand-dark/60 font-medium">
                                Content ready to be posted on social media.{' '}
                                {draftCount > 0
                                    ? `${draftCount} ${draftCount === 1 ? 'item' : 'items'} ready`
                                    : 'No items ready yet'}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() =>
                                activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/calendar`)
                            }
                            disabled={!activeCompanyId}
                            title="Go to Calendar"
                        >
                            Go to Calendar
                        </button>
                    </div>

                    {draftRows.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                                <FileText className="h-6 w-6 text-brand-dark/60" aria-hidden />
                            </div>

                            <div className="text-base font-bold text-brand-dark">No drafts ready yet</div>
                            <p className="mt-1 text-sm text-brand-dark/60">
                                Generate and approve content in the Calendar to see drafts here.
                            </p>

                            <div className="mt-6 flex justify-center">
                                {/* Uses arbitrary colors so it won’t turn white even if brand tokens aren’t generated */}
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {draftRows.map((row) => {
                                const imageUrl = getImageGeneratedUrl(row) || getAttachedDesignUrls(row)[0] || null;
                                const caption = row.finalCaption || row.captionOutput || '';
                                const captionPreview = caption.length > 150 ? `${caption.substring(0, 150)}...` : caption;

                                const channels = Array.isArray(row.channels)
                                    ? row.channels
                                    : row.channels
                                        ? [row.channels]
                                        : [];

                                return (
                                    <div
                                        key={row.contentCalendarId}
                                        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-lg hover:border-brand-primary/20"
                                    >
                                        {/* Hover actions */}
                                        <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition group-hover:opacity-100 group-hover:pointer-events-auto">
                                            <button
                                                type="button"
                                                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 backdrop-blur shadow-sm transition hover:bg-[#3fa9f5] hover:border-[#3fa9f5] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35"
                                                onClick={() => {
                                                    setSelectedRow(row);
                                                    setIsViewModalOpen(true);
                                                }}
                                                title="View details"
                                            >
                                                <Eye className="h-4 w-4 text-brand-dark/80 group-hover:text-white" />
                                            </button>

                                            <button
                                                type="button"
                                                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 backdrop-blur shadow-sm transition hover:bg-[#3fa9f5] hover:border-[#3fa9f5] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35"
                                                onClick={() => copyAllText(row)}
                                                title="Copy all text"
                                            >
                                                <Copy className="h-4 w-4 text-brand-dark/80 group-hover:text-white" />
                                            </button>

                                            {imageUrl && (
                                                <button
                                                    type="button"
                                                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 backdrop-blur shadow-sm transition hover:bg-[#3fa9f5] hover:border-[#3fa9f5] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35"
                                                    onClick={() =>
                                                        downloadImage(imageUrl, `${row.date || 'draft'}-image.jpg`)
                                                    }
                                                    title="Download image"
                                                >
                                                    <Download className="h-4 w-4 text-brand-dark/80 group-hover:text-white" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Image */}
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt="Content preview"
                                                className="h-60 w-full object-cover bg-slate-100"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="h-60 w-full bg-slate-100 flex items-center justify-center">
                                                <FileText className="h-10 w-10 text-brand-dark/30" />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="p-5 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="text-xs font-semibold text-[#3fa9f5]">
                                                    {row.date || 'No date'}
                                                </div>

                                                {/* Optional: show status pill if you want */}
                                                <span className="text-[0.72rem] font-semibold px-2 py-1 rounded-full bg-slate-100 text-brand-dark/70">
                                                    {getStatusValue(row.status)}
                                                </span>
                                            </div>

                                            <div className="text-sm leading-relaxed text-brand-dark/80 line-clamp-3">
                                                {captionPreview || (
                                                    <span className="text-brand-dark/50">No caption available.</span>
                                                )}
                                            </div>

                                            {channels.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {channels.map((channel: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[0.72rem] font-medium px-2.5 py-1 rounded-lg bg-[#3fa9f5]/10 text-[#3fa9f5]"
                                                        >
                                                            {channel}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2"
                                                    onClick={() => {
                                                        setSelectedRow(row);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    View Details
                                                </button>

                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:ring-offset-2"
                                                    onClick={() => copyAllText(row)}
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
            </div>
        </main>
    );
}
