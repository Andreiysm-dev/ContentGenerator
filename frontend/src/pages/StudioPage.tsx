import React, { useState } from "react";
import {
  FileText,
  CalendarDays,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  LayoutGrid,
  Search,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

type TabType = 'drafts' | 'approvals' | 'scheduled' | 'published';

export function StudioPage({
  calendarRows,
  getStatusValue,
  getImageGeneratedUrl,
  getAttachedDesignUrls,
  setSelectedRow,
  setIsViewModalOpen,
  notify,
  activeCompanyId
}: DraftsPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('drafts');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering Logic
  const allRows = calendarRows.map(row => ({
    ...row,
    normalizedStatus: getStatusValue(row.status).toLowerCase()
  }));

  const drafts = allRows.filter(r =>
    (
      r.normalizedStatus === "design completed" ||
      r.normalizedStatus === "draft" ||
      r.normalizedStatus === "approved"
    ) &&
    (r.finalCaption || r.captionOutput)
  );

  const approvals = allRows.filter(r =>
    r.normalizedStatus === "ready"
  );

  const scheduled = allRows.filter(r =>
    r.normalizedStatus === "scheduled"
  );

  const published = allRows.filter(r =>
    r.normalizedStatus === "published"
  );

  const getActiveRows = () => {
    let rows: any[] = [];
    if (activeTab === 'drafts') rows = drafts;
    else if (activeTab === 'approvals') rows = approvals;
    else if (activeTab === 'scheduled') rows = scheduled;
    else if (activeTab === 'published') rows = published;

    if (searchQuery) {
      return rows.filter(r =>
        (r.finalCaption || r.captionOutput || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.theme || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return rows;
  };

  const filteredRows = getActiveRows();

  const tabConfigs = [
    { id: 'drafts', label: 'Drafts', icon: FileText, count: drafts.length, color: 'blue' },
    { id: 'approvals', label: 'Approvals', icon: Eye, count: approvals.length, color: 'purple' },
    { id: 'scheduled', label: 'Scheduled', icon: Clock, count: scheduled.length, color: 'amber' },
    { id: 'published', label: 'Published', icon: CheckCircle2, count: published.length, color: 'emerald' },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 min-w-0 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/15 to-transparent rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/12 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
        {/* Header Section */}
        <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden">
          <FileText className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
              Post Staging
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Content Studio</h2>
            <p className="mt-1 text-sm font-medium text-slate-400 max-w-lg">
              Refine, schedule, and track your brand's footprint across all social ecosystems.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-sm"
              />
            </div>
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:translate-y-[1px]"
              onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/calendar`)}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar View
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-8 flex-1 flex flex-col overflow-hidden">

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-[2rem] w-fit shadow-sm">
            {tabConfigs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`relative flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-sm font-black transition-all duration-300 ${isActive
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Grid */}
          {filteredRows.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-20 text-center shadow-sm">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
                  <LayoutGrid className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {searchQuery ? 'No matches found' : `Your ${activeTab} is empty`}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    {activeTab === 'drafts'
                      ? 'Generate new content plans or designs in the calendar to see them here.'
                      : activeTab === 'approvals'
                        ? 'No posts are currently waiting for supervisor approval.'
                        : activeTab === 'scheduled'
                          ? 'No posts are currently waiting in the wings.'
                          : 'Published posts will automatically archive here for your review.'}
                  </p>
                </div>
                {activeTab === 'drafts' && (
                  <button
                    onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/planner`)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-[2rem] text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Plan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredRows.map((row) => {
                const imageUrl = getImageGeneratedUrl(row) || getAttachedDesignUrls(row)[0] || null;
                const caption = row.finalCaption || row.captionOutput || "";
                const channels = Array.isArray(row.channels) ? row.channels : row.channels ? [row.channels] : [];

                return (
                  <div
                    key={row.contentCalendarId}
                    className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500"
                  >
                    {/* Visual Preview */}
                    <div className="relative aspect-square overflow-hidden bg-slate-100 group/img">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-[1.2] cursor-zoom-in"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <FileText className="w-16 h-16" />
                        </div>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-3">
                        <button
                          onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }}
                          className="p-4 bg-white rounded-2xl text-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                          title="Quick View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {imageUrl && (
                          <button
                            onClick={() => window.open(imageUrl, '_blank')}
                            className="p-4 bg-white rounded-2xl text-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-[50ms]"
                            title="Download Asset"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Channel Badges */}
                      <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 pointer-events-none">
                        {channels.map((chan: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-slate-900 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm border border-white/20">
                            {chan}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {row.date || 'TBD'}
                        </span>
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${activeTab === 'published' ? 'bg-emerald-50 text-emerald-600' :
                          activeTab === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                          {row.normalizedStatus}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-3 h-[4.5rem]">
                        {caption || <span className="text-slate-300 italic">No caption generated yet.</span>}
                      </p>

                      <button
                        onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                        className="w-full py-4 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 uppercase tracking-widest"
                      >
                        {activeTab === 'drafts' ? 'Refine Post' : 'Edit Details'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
