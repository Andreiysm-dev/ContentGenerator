import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  FilterX,
  Plus,
  Rocket,
  Search,
  SearchX,
  Target,
  Wand2,
  Activity,
  Calendar as BigCalendar,
  Layout,
  Share2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
  Zap,
  Download,
  Copy as CopyIcon
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarTableSkeleton } from "@/components/LoadingState";

export type CalendarPageProps = {
  viewMode: 'drafts' | 'published';
  calendarSearch: string;
  setCalendarSearch: (val: string) => void;
  calendarStatusFilter: string;
  setCalendarStatusFilter: (val: string) => void;
  calendarStatusOptions: string[];
  selectedIds: string[];
  isBatchGenerating: boolean;
  isBatchGeneratingImages: boolean;
  handleBatchGenerate: () => void;
  handleBatchGenerateImages: () => void;
  openCsvModal: () => void;
  openCopyModal: () => void;
  handleDeleteSelected: () => void;
  isBackendWaking: boolean;
  calendarError: string | null;
  isLoadingCalendar: boolean;
  calendarRows: any[];
  setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
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
  getImageGeneratedUrl: (row: any) => string | null;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
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
    case "published":
      return "bg-[#3fa9f5]/10 text-[#3fa9f5] border-[#3fa9f5]/20";
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
    case "published":
      return "border-l-[#3fa9f5]";
    case "draft":
    default:
      return "border-l-slate-300";
  }
}

export function CalendarPage(props: CalendarPageProps) {
  const {
    viewMode,
    calendarSearch,
    setCalendarSearch,
    calendarStatusFilter,
    setCalendarStatusFilter,
    calendarStatusOptions,
    selectedIds,
    isBatchGenerating,
    isBatchGeneratingImages,
    handleBatchGenerate,
    handleBatchGenerateImages,
    handleDeleteSelected,
    isBackendWaking,
    calendarError,
    isLoadingCalendar,
    calendarRows,
    setCalendarRows,
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
    getImageGeneratedUrl,
    authedFetch,
    backendBaseUrl,
    notify,
  } = props;

  const navigate = useNavigate();
  const { companyId } = useParams();

  const showClear = Boolean(calendarSearch) || calendarStatusFilter !== "all";

  const renderChannelIcons = (channelsString: string) => {
    if (!channelsString) return <span className="text-slate-300">—</span>;
    // Handle both comma-separated strings and potential arrays
    const rawChannels: string[] = typeof channelsString === 'string'
      ? channelsString.toLowerCase().split(/[,\/&|]/).map((s: string) => s.trim())
      : (Array.isArray(channelsString) ? (channelsString as any[]).map((s: any) => String(s).toLowerCase()) : []);

    return (
      <div className="flex gap-2 items-center">
        {rawChannels.map((ch: string, i: number) => {
          if (ch.includes('linkedin') || ch.includes('li')) return <Linkedin key={i} className="w-4 h-4 text-[#0A66C2]" />;
          if (ch.includes('instagram') || ch.includes('ig') || ch.includes('insta')) return <Instagram key={i} className="w-4 h-4 text-[#E4405F]" />;
          if (ch.includes('twitter') || ch.includes('tw') || ch.includes('x')) return <Twitter key={i} className="w-4 h-4 text-[#1DA1F2]" />;
          if (ch.includes('facebook') || ch.includes('fb')) return <Facebook key={i} className="w-4 h-4 text-[#1877F2]" />;
          return <Share2 key={i} className="w-4 h-4 text-slate-400" />;
        })}
      </div>
    );
  };

  const TabButton = ({ active, onClick, icon: Icon, label, count }: any) => (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-6 py-5 text-sm font-bold transition-all border-b-2 z-10 ${active
        ? "text-blue-600 border-blue-600 bg-white"
        : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/50"
        }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 min-w-0 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/20 to-[#6fb6e8]/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/15 to-[#e5a4e6]/12 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
        {/* Header Section */}
        <header className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden flex-shrink-0">
          <CalendarDays className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
              Workflow Planner
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Content Calendar</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">Streamline your content pipeline from concept to publication.</p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => navigate(`/company/${companyId}/generate`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
            >
              <Plus className="w-4 h-4" />
              Create Posts
            </button>
            <div className="relative group">
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition-all shadow-sm">
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 overflow-hidden">
                <button onClick={props.openCsvModal} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50">
                  <Download className="w-4 h-4 text-slate-400" /> Export CSV
                </button>
                <button onClick={props.openCopyModal} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                  <CopyIcon className="w-4 h-4 text-slate-400" /> Copy to Sheets
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex flex-col border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex">
                <TabButton
                  active={viewMode === 'drafts'}
                  onClick={() => navigate(`/company/${companyId}/calendar`)}
                  icon={Layout}
                  label="Pipeline"
                  count={calendarRows.filter(r => (getStatusValue(r.status) || 'Draft').toLowerCase() !== 'published').length}
                />
                <TabButton
                  active={viewMode === 'published'}
                  onClick={() => navigate(`/company/${companyId}/calendar/published`)}
                  icon={CheckCircle2}
                  label="Archives"
                  count={calendarRows.filter(r => (getStatusValue(r.status) || 'Draft').toLowerCase() === 'published').length}
                />
              </div>

              <div className="hidden md:flex items-center gap-6 px-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                  <div className="flex gap-1.5">
                    {['all', 'Approved', 'Generate', 'Draft'].map(f => (
                      <button
                        key={f}
                        onClick={() => setCalendarStatusFilter(f)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${calendarStatusFilter === f
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                      >
                        {f === 'all' ? 'All' : f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                  placeholder="Search and filter content..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                />
              </div>

              {showClear && (
                <button
                  onClick={() => { setCalendarSearch(""); setCalendarStatusFilter("all"); }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-all bg-rose-50 px-3 py-2 rounded-xl"
                >
                  <FilterX className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto relative bg-white">
            {isLoadingCalendar ? (
              <div className="p-10"><CalendarTableSkeleton /></div>
            ) : filteredCalendarRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <SearchX className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">No content matches</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
                  Try adjusting your search or filter to see more results.
                </p>
              </div>
            ) : viewMode === 'drafts' ? (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isPageFullySelected}
                        onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Content Overview</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Channels</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Strategy</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Date</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="w-32 px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPageRows.map((row) => {
                    const status = getStatusValue(row.status) || "Draft";
                    const key = statusKey(status);
                    const isSelected = selectedIds.includes(row.contentCalendarId);

                    return (
                      <tr key={row.contentCalendarId} className={`group hover:bg-slate-50/80 transition-all ${isSelected ? "bg-blue-50/30" : ""}`}>
                        <td className="w-12 px-6 py-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectOne(row.contentCalendarId, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-5" onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }}>
                          <div className="flex gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${status.toLowerCase() === 'approved' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                              {row.attachedDesign ? <Share2 className="w-5 h-5 opacity-80" /> : <FileText className="w-5 h-5 opacity-80" />}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {row.theme || "Untitled Post"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{row.contentType || "General"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          {renderChannelIcons(row.channels)}
                        </td>
                        <td className="px-4 py-5 font-medium">
                          <div className="flex flex-col gap-1.5">
                            {row.primaryGoal && (
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3 h-3 text-blue-500" />
                                <span className="text-[11px] font-bold text-slate-600">{row.primaryGoal}</span>
                              </div>
                            )}
                            {row.cta && <span className="text-[10px] bg-slate-100 w-fit px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{row.cta}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{row.date ? row.date.split(' ')[0] : '—'}</span>
                            <span className="text-xs font-bold text-slate-700">{row.date ? row.date.split(' ')[1] : ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusBadgeClasses(key)
                              }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            {status}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 transition-all">
                            {status.toLowerCase() === 'approved' && (
                              <button
                                title="Go to Image Hub"
                                onClick={(e) => { e.stopPropagation(); navigate(`/company/${companyId}/image-hub?id=${row.contentCalendarId}`); }}
                                className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 shadow-sm border border-blue-100"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }}
                              className="p-2.5 text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Published Grid View */
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/30 overflow-y-auto max-h-full">
                {currentPageRows.map((row) => {
                  const imageUrl = getImageGeneratedUrl(row);
                  const caption = row.finalCaption || row.captionOutput || "";
                  const captionPreview = caption.length > 100 ? `${caption.substring(0, 100)}...` : caption;

                  return (
                    <div
                      key={row.contentCalendarId}
                      className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all cursor-pointer flex flex-col"
                      onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }}
                    >
                      <div className="aspect-square relative bg-slate-100 overflow-hidden shrin-0">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 border-b border-slate-100">
                            <FileText className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Visual</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 z-10">
                          <div className="px-2.5 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full flex items-center gap-1.5 border border-white/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-black text-slate-900 uppercase">Published</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2.5 mb-3">
                          {renderChannelIcons(row.channels)}
                          <div className="h-3 w-[1.5px] bg-slate-200" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{row.date || "Past Post"}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-relaxed mb-4 flex-1">
                          {captionPreview || <span className="text-slate-300 italic font-medium">No caption preserved.</span>}
                        </p>
                        <div className="pt-3 border-t border-slate-50 mt-auto flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Performance Ready</span>
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase">Size</span>
              <select
                value={pageSize}
                onChange={(e) => { setPage(1); setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none hover:bg-white transition-all shadow-inner"
              >
                {[10, 25, 50, "all"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="h-4 w-[1px] bg-slate-100 mx-1" />
              <span className="text-[11px] font-bold text-slate-500">
                {currentPageRows.length} of {filteredCalendarRows.length} results
              </span>
            </div>

            {pageSize !== "all" && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-inner text-[11px] font-black">
                  <span className="text-blue-600">{page}</span>
                  <span className="text-slate-300 mx-2">/</span>
                  <span className="text-slate-900">{Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1)))}</span>
                </div>
                <button
                  disabled={page >= Math.ceil(filteredCalendarRows.length / (pageSize || 1))}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-[scale-up_0.2s_ease-out]">
          <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-3xl p-3 flex items-center gap-6 text-white min-w-[480px]">
            <div className="flex items-center gap-3 px-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider">{selectedIds.length} Selected</span>
              </div>
            </div>

            <div className="h-10 w-[1px] bg-white/10" />

            <div className="flex gap-2 pr-2">
              <button
                onClick={handleBatchGenerate}
                disabled={isBatchGenerating}
                className="px-5 py-2 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                {isBatchGenerating ? <Activity className="w-3 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate
              </button>
              <button
                onClick={handleBatchGenerateImages}
                disabled={isBatchGeneratingImages}
                className="px-5 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all flex items-center gap-2"
              >
                {isBatchGeneratingImages ? <Activity className="w-3 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Visuals
              </button>
              <button
                onClick={handleDeleteSelected}
                className="p-2 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
