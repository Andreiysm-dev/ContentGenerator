import { useNavigate } from "react-router-dom";
import { FileText, Eye, Copy, Download } from "lucide-react";

interface DraftsPageProps {
  calendarRows: any[];
  getStatusValue: (status: any) => string;
  getImageGeneratedUrl: (row: any) => string | null;
  getAttachedDesignUrls: (row: any) => string[];
  setSelectedRow: (row: any) => void;
  setIsViewModalOpen: (value: boolean) => void;
  notify: (message: string, tone: "success" | "error" | "info") => void;
  activeCompanyId: string | undefined;
}

export function StudioPage({ calendarRows, getStatusValue, getImageGeneratedUrl, getAttachedDesignUrls, setSelectedRow, setIsViewModalOpen, notify, activeCompanyId }: DraftsPageProps) {
  const navigate = useNavigate();

  const draftRows = calendarRows.filter((row) => {
    const status = getStatusValue(row.status).toLowerCase();
    return status === "design completed";
  });

  const draftCount = draftRows.length;

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-6%] w-[36%] h-[36%] bg-gradient-to-bl from-[#81bad1]/16 to-[#6fb6e8]/12 rounded-full blur-[85px] animate-pulse" />
        <div className="absolute bottom-[-12%] left-[-4%] w-[38%] h-[38%] bg-gradient-to-tr from-[#e5a4e6]/12 to-[#a78bfa]/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '600ms' }} />
      </div>
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 relative z-10">
        <section className="w-full max-w-[1200px] mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-4 py-5 md:px-6 md:py-6 bg-gradient-to-r from-[#3fa9f5]/85 via-[#6fb6e8]/75 to-[#a78bfa]/65 border-t border-l border-r border-[#3fa9f5]/60 rounded-t-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 md:gap-0 shadow-sm">
            <div>
              <div className="text-md md:text-xl font-bold">Studio</div>

              <p className="mt-1 text-sm font-medium flex flex-wrap items-center gap-2">
                {draftCount > 0 ? (
                  <>
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-[#3fa9f5]/10 text-[#3fa9f5] font-semibold">{draftCount}</span>
                    {draftCount === 1 ? "design ready for final refinement." : "designs ready for final refinement."}
                  </>
                ) : (
                  "No items ready. Generated content will appear here once designs are completed."
                )}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary flex justify-center"
              onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/calendar`)}
              disabled={!activeCompanyId}
            >
              Go to Calendar
            </button>
          </div>

          {/* Empty State */}
          {draftRows.length === 0 ? (
            <div className="p-3">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-8 sm:p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <FileText className="h-6 w-6 text-brand-dark/60" />
                </div>

                <div className="text-base font-bold text-brand-dark">Nothing in Studio yet</div>

                <p className="mt-1 text-sm text-brand-dark/60">Complete designs in the Calendar to see them in the Studio.</p>


              </div>
            </div>
          ) : (
            /* Responsive Card Grid */
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {draftRows.map((row) => {
                  const imageUrl = getImageGeneratedUrl(row) || getAttachedDesignUrls(row)[0] || null;

                  const caption = row.finalCaption || row.captionOutput || "";

                  const captionPreview = caption.length > 150 ? `${caption.substring(0, 150)}...` : caption;

                  const channels = Array.isArray(row.channels) ? row.channels : row.channels ? [row.channels] : [];

                  return (
                    <div key={row.contentCalendarId} className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition hover:shadow-lg">
                      <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 shadow-sm hover:bg-[#3fa9f5] hover:text-white transition-colors"
                          onClick={() => {
                            setSelectedRow(row);
                            setIsViewModalOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {imageUrl && (
                          <button
                            type="button"
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 shadow-sm hover:bg-[#3fa9f5] hover:text-white transition-colors"
                            onClick={() => window.open(imageUrl, '_blank')}
                            title="Open Image in New Tab"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Image */}
                      {imageUrl ? (
                        <img src={imageUrl} alt="Content preview" className="h-48 sm:h-60 w-full object-cover bg-slate-100" loading="lazy" />
                      ) : (
                        <div className="h-48 sm:h-60 w-full bg-slate-100 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-brand-dark/30" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4 sm:p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-xs font-semibold text-[#3fa9f5]">{row.date || "No date"}</div>

                          <span className="text-[0.72rem] font-semibold px-2 py-0.5 rounded-full bg-blue-100">{getStatusValue(row.status)}</span>
                        </div>

                        <div className="text-sm leading-relaxed text-brand-dark/80 line-clamp-3">{captionPreview || <span className="text-brand-dark/50">No caption available.</span>}</div>

                        {channels.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {channels.map((channel: string, idx: number) => (
                              <span key={idx} className="text-[0.72rem] font-medium px-2.5 py-1 rounded-lg bg-[#3fa9f5]/10 text-[#3fa9f5]">
                                {channel}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm w-full flex justify-center"
                            onClick={() => {
                              if (activeCompanyId) {
                                navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`);
                              }
                            }}
                          >
                            Edit in Studio
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
