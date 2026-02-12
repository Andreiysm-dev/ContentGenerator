import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, Filter, FilterX, Plus, Rocket, Search, SearchX, Target, Wand2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalendarTableSkeleton } from "@/components/LoadingState";

export type CalendarPageProps = {
  calendarSearch: string;
  setCalendarSearch: (val: string) => void;
  calendarStatusFilter: string;
  setCalendarStatusFilter: (val: string) => void;
  calendarStatusOptions: string[];
  selectedIds: string[];
  isBatchGenerating: boolean;
  isBatchReviewing: boolean;
  isBatchGeneratingImages: boolean;
  handleBatchGenerate: () => void;
  handleBatchReview: () => void;
  handleBatchGenerateImages: () => void;
  openCsvModal: () => void;
  openCopyModal: () => void;
  handleDeleteSelected: () => void;
  isBackendWaking: boolean;
  calendarError: string | null;
  isLoadingCalendar: boolean;
  calendarRows: any[];
  filteredCalendarRows: any[];
  activeCompanyId: string | undefined;
  isPageFullySelected: boolean;
  toggleSelectAllOnPage: (checked: boolean) => void;
  toggleSelectOne: (id: string, checked: boolean) => void;
  getStatusValue: (status: any) => string;
  setSelectedRow: (row: any) => void;
  setIsViewModalOpen: (open: boolean) => void;
  pageSize: number | "all";
  setPageSize: (size: number | "all") => void;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  currentPageRows: any[];
};

function statusKey(status: string) {
  return (status || "Draft").toLowerCase().replace(/\s+/g, "-");
}

function statusBadgeClasses(key: string) {
  switch (key) {
    case "approved":
      return "bg-[#3fa9f5]/10 text-[#3fa9f5] border-[#3fa9f5]/20";
    case "review":
    case "needs-review":
      return "bg-yellow-400/10 text-yellow-700 border-yellow-400/20";
    case "design-complete":
    case "design-completed":
      return "bg-green-400/10 text-green-700 border-green-400/20";
    case "generating":
    case "generate":
      return "bg-indigo-400/10 text-indigo-600 border-indigo-400/20 animate-pulse";
    case "pending":
      return "bg-orange-500/10 text-orange-700 border-orange-500/20";
    case "approved-with-edits":
      return "bg-violet-400/10 text-violet-700 border-violet-400/20";
    case "draft":
    default:
      return "bg-slate-300/20 text-slate-600 border-slate-300/30";
  }
}

function rowAccentClasses(key: string) {
  switch (key) {
    case "approved":
      return "border-l-blue-400";
    case "review":
    case "needs-review":
      return "border-l-yellow-400";
    case "design-complete":
    case "design-completed":
      return "border-l-green-400";
    case "generating":
    case "generate":
      return "border-l-indigo-400";
    case "pending":
      return "border-l-orange-500";
    case "approved-with-edits":
      return "border-l-violet-400";
    case "draft":
    default:
      return "border-l-slate-300";
  }
}

export function CalendarPage(props: CalendarPageProps) {
  const {
    calendarSearch,
    setCalendarSearch,
    calendarStatusFilter,
    setCalendarStatusFilter,
    calendarStatusOptions,
    selectedIds,
    isBatchGenerating,
    isBatchReviewing,
    isBatchGeneratingImages,
    handleBatchGenerate,
    handleBatchReview,
    handleBatchGenerateImages,
    handleDeleteSelected,
    isBackendWaking,
    calendarError,
    isLoadingCalendar,
    calendarRows,
    filteredCalendarRows,
    activeCompanyId,
    isPageFullySelected,
    toggleSelectAllOnPage,
    toggleSelectOne,
    getStatusValue,
    setSelectedRow,
    setIsViewModalOpen,
    pageSize,
    setPageSize,
    page,
    setPage,
    currentPageRows,
  } = props;

  const navigate = useNavigate();
  const showClear = Boolean(calendarSearch) || calendarStatusFilter !== "all";

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6">
      <section className="w-full max-w-[1200px] mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="px-4 py-5 md:px-6 md:py-6 bg-gradient-to-r from-brand-primary/10 to-white border-t border-l border-r border-gray-200 rounded-t-2xl shadow-sm flex flex-col gap-4">
          <div className="flex-1">
            <h2 className="text-md md:text-xl font-bold">Content Calendar</h2>
            <p className="mt-1 text-sm md:text-[0.875rem] font-medium text-slate-600">Plan, generate, review, and track content status.</p>
          </div>

          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-3 w-full">
            {showClear && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white text-rose-600 border border-slate-200/70 shadow-sm transition hover:bg-rose-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 w-full md:w-auto"
                onClick={() => {
                  setCalendarSearch("");
                  setCalendarStatusFilter("all");
                }}
              >
                <FilterX className="h-4 w-4" />
                Clear filters
              </button>
            )}

            <div className="flex flex-col sm:flex-row md:flex-row md:items-center gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  className="w-full md:w-auto rounded-xl border border-slate-200/70 bg-white pl-10 pr-3 py-2.5 text-sm font-medium text-brand-dark placeholder:text-slate-400 outline-none focus:border-[#3fa9f5]/50 focus:ring-4 focus:ring-[#3fa9f5]/10 transition-all"
                  placeholder="Search calendar..."
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 shadow-sm w-full sm:w-auto">
                <span className="inline-flex items-center gap-2 text-[0.78rem] font-bold text-brand-dark/60 whitespace-nowrap">
                  <Filter className="h-4 w-4" />
                  Status
                </span>

                <div className="relative flex-1 sm:flex-none">
                  <select
                    className="appearance-none w-full sm:w-auto bg-transparent pr-7 pl-2 py-1 text-sm font-semibold text-brand-dark outline-none cursor-pointer"
                    value={calendarStatusFilter}
                    onChange={(e) => setCalendarStatusFilter(e.target.value)}
                  >
                    {calendarStatusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "all" ? "All" : opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 shadow-sm flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm font-bold text-brand-dark">Selected actions</div>
              <span className="inline-flex items-center rounded-full bg-[#3fa9f5]/10 px-2.5 py-1 text-xs font-bold text-[#3fa9f5]">{selectedIds.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBatchGenerate}
                disabled={isBatchGenerating}
              >
                {isBatchGenerating ? "Generating…" : "Generate"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBatchReview}
                disabled={isBatchReviewing}
              >
                {isBatchReviewing ? "Reviewing…" : "Review"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBatchGenerateImages}
                disabled={isBatchGeneratingImages}
              >
                {isBatchGeneratingImages ? "Generating…" : "Generate Image"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-rose-700 border border-slate-200/70 shadow-sm transition hover:bg-rose-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2"
                onClick={handleDeleteSelected}
              >
                Delete ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="p-4 md:p-6">
          {isBackendWaking && (
            <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-3">
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" aria-hidden="true" />
              <div className="text-sm font-medium flex items-center">Getting things ready…</div>
            </div>
          )}
          {!isLoadingCalendar && !calendarError && calendarRows.length === 0 && (
            <div className="rounded-xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <FileText className="h-6 w-6 text-brand-dark/60" aria-hidden />
              </div>
              <div className="text-base font-bold text-brand-dark">No content yet</div>
              <p className="mt-1 text-sm text-brand-dark/60">Import rows or generate content to get started. Your calendar will appear here.</p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`)}
                  disabled={!activeCompanyId}
                >
                  <Plus className="h-4 w-4" />
                  Go to Content Generator
                </button>
              </div>
            </div>
          )}

          {!isLoadingCalendar && !calendarError && filteredCalendarRows.length === 0 && calendarRows.length > 0 && (
            <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <SearchX className="h-6 w-6 text-brand-dark/60" aria-hidden />
              </div>
              <div className="text-base font-bold text-brand-dark">No matching rows</div>
              <p className="mt-1 text-sm text-brand-dark/60">Try adjusting your search or filter to see more content.</p>
            </div>
          )}
          {!isLoadingCalendar && !calendarError && filteredCalendarRows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-slate-200/70">
                      <th className="w-11 px-4 py-3 text-left">
                        <input type="checkbox" checked={isPageFullySelected} onChange={(e) => toggleSelectAllOnPage(e.target.checked)} className="h-4 w-4 accent-[#3fa9f5]" />
                      </th>

                      <th className="w-[120px] px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 opacity-70" />
                          Date
                        </span>
                      </th>

                      <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                        <span className="inline-flex items-center gap-2">
                          <Wand2 className="h-4 w-4 opacity-70" />
                          Theme / Content
                        </span>
                      </th>

                      <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">Brand / Promo</th>

                      <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                        <span className="inline-flex items-center gap-2">
                          <Target className="h-4 w-4 opacity-70" />
                          Channel / Target
                        </span>
                      </th>

                      <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                        <span className="inline-flex items-center gap-2">
                          <Rocket className="h-4 w-4 opacity-70" />
                          Primary / CTA
                        </span>
                      </th>

                      <th className="w-[140px] px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                        <span className="inline-flex items-center gap-2">
                          <Activity className="h-4 w-4 opacity-70" />
                          Status
                        </span>
                      </th>

                      <th className="w-[120px] px-4 py-3 text-center text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentPageRows.map((row) => {
                      const currentStatus = getStatusValue(row.status) || "Draft";
                      const key = statusKey(currentStatus);

                      return (
                        <tr key={row.contentCalendarId} className={["border-b border-slate-200/50 align-top", "hover:bg-[#3fa9f5]/[0.06] transition-colors", "border-l-4", rowAccentClasses(key)].join(" ")}>
                          <td className="w-11 px-4 py-3">
                            <input type="checkbox" checked={selectedIds.includes(row.contentCalendarId)} onChange={(e) => toggleSelectOne(row.contentCalendarId, e.target.checked)} className="h-4 w-4 accent-[#3fa9f5]" />
                          </td>

                          <td className="w-[120px] px-4 py-3">
                            <div className="text-sm font-medium text-brand-dark/80">{row.date ?? "—"}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-brand-dark">{row.theme || "—"}</span>
                              {row.contentType ? <span className="text-xs text-brand-dark/60">{row.contentType}</span> : null}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 text-brand-dark/80">
                              {row.brandHighlight ? <span className="text-xs text-brand-dark/60">{row.brandHighlight}</span> : null}

                              {row.crossPromo || row.promoType ? <span className="text-xs text-brand-dark/60">{[row.crossPromo, row.promoType].filter(Boolean).join(" • ")}</span> : null}

                              {!row.brandHighlight && !row.crossPromo && !row.promoType && <span className="text-sm text-brand-dark/30">—</span>}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {row.channels ? <span className="text-sm font-semibold text-brand-dark">{row.channels}</span> : null}
                              {row.targetAudience ? <span className="text-xs text-brand-dark/60">{row.targetAudience}</span> : null}
                              {!row.channels && !row.targetAudience && <span className="text-sm text-brand-dark/30">—</span>}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {row.primaryGoal ? <span className="text-sm font-semibold text-brand-dark">{row.primaryGoal}</span> : null}
                              {row.cta ? <span className="text-xs text-brand-dark/60">{row.cta}</span> : null}
                              {!row.primaryGoal && !row.cta && <span className="text-sm text-brand-dark/30">—</span>}
                            </div>
                          </td>

                          <td className="w-[140px] px-4 py-3">
                            <span className={["inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold capitalize whitespace-nowrap", statusBadgeClasses(key)].join(" ")}>{currentStatus}</span>
                          </td>

                          <td className="w-[120px] px-4 py-3 text-center">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
                              onClick={() => {
                                setSelectedRow(row);
                                setIsViewModalOpen(true);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs font-semibold text-brand-dark/60 md:block whitespace-nowrap">Rows per page</span>
                    <div className="relative">
                      <select
                        className="appearance-none rounded-lg border border-slate-200/70 bg-white pl-3 pr-7 py-1.5 text-xs sm:text-sm font-semibold text-brand-dark shadow-sm transition hover:border-[#3fa9f5]/30 focus:outline-none focus:ring-2 focus:ring-[#3fa9f5]/20"
                        value={pageSize}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPage(1);
                          setPageSize(val === "all" ? "all" : Number(val));
                        }}
                      >
                        {[10, 25, 50, "all"].map((size) => (
                          <option key={size} value={size}>
                            {size === "all" ? "All" : size}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    </div>
                  </div>

                  <div className="text-[11px] sm:text-sm text-brand-dark/60 border-l border-slate-200 pl-2 sm:pl-4">
                    <span className="xs:inline">Showing </span>
                    <strong className="text-brand-dark">{currentPageRows.length}</strong> of {filteredCalendarRows.length}
                  </div>
                </div>

                {pageSize !== "all" && (
                  <div className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-slate-200/70 bg-white p-0.5 sm:p-1 shadow-sm">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg text-brand-dark/70 transition hover:bg-[#3fa9f5]/10 hover:text-[#3fa9f5] disabled:opacity-30"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="px-1 sm:px-2 text-[11px] sm:text-sm font-semibold whitespace-nowrap">
                      <span className="text-[#3fa9f5]">{page}</span>
                      <span className="text-slate-400 font-medium px-0.5">/</span>
                      <span className="text-brand-dark">{Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1)))}</span>
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg text-brand-dark/70 transition hover:bg-[#3fa9f5]/10 hover:text-[#3fa9f5] disabled:opacity-30"
                      disabled={page >= Math.ceil(filteredCalendarRows.length / (pageSize || 1))}
                      onClick={() => setPage((prev) => Math.min(Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1))), prev + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
