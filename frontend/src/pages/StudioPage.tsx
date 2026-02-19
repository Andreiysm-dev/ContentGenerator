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
  Plus,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  PlusCircle,
  List,
  Lightbulb,
  Send,
  Sparkles,
  SendHorizontal,
  XCircle,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

interface DraftsPageProps {
  calendarRows: any[];
  getStatusValue: (status: any) => string;
  getImageGeneratedUrl: (row: any) => string | null;
  getAttachedDesignUrls: (row: any) => string[];
  setSelectedRow: (row: any) => void;
  setIsViewModalOpen: (value: boolean) => void;
  notify: (message: string, tone: "success" | "error" | "info") => void;
  activeCompanyId: string | undefined;
  connectedAccounts?: any[];
  authedFetch?: any;
  backendBaseUrl?: string;
}

type TabType = 'ideas' | 'drafts' | 'approvals' | 'scheduled' | 'published';

export function StudioPage({
  calendarRows,
  getStatusValue,
  getImageGeneratedUrl,
  getAttachedDesignUrls,
  setSelectedRow,
  setIsViewModalOpen,
  notify,
  activeCompanyId,
  connectedAccounts,
  authedFetch,
  backendBaseUrl
}: DraftsPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('drafts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newIdea, setNewIdea] = useState('');
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);

  // Filtering Logic
  const allRows = calendarRows.map(row => ({
    ...row,
    normalizedStatus: getStatusValue(row.status).toLowerCase()
  }));

  const ideas = allRows.filter(r =>
    r.normalizedStatus === "idea" ||
    (r.normalizedStatus === "draft" && !r.finalCaption && !r.captionOutput)
  );

  const drafts = allRows.filter(r =>
    (
      r.normalizedStatus === "draft" ||
      r.normalizedStatus === "design completed" ||
      r.normalizedStatus === "reviewed"
    ) &&
    (r.finalCaption || r.captionOutput) &&
    r.normalizedStatus !== "idea" &&
    r.normalizedStatus !== "ready"
  );

  const approvals = allRows.filter(r =>
    r.normalizedStatus === "ready"
  );

  const scheduled = allRows.filter(r =>
    r.normalizedStatus === "scheduled" || r.normalizedStatus === "approved"
  );

  const published = allRows.filter(r =>
    r.normalizedStatus === "published"
  );

  const getStatusLabel = (row: any) => {
    const s = row.normalizedStatus;
    if (s === 'ready') return 'Pending';
    if (s === 'approved') return 'Approved';
    if (s === 'reviewed' || s === 'design completed') return 'Reviewed';
    if (s === 'draft' && (row.finalCaption || row.captionOutput)) return 'Drafting';
    if (s === 'idea') return 'Idea';
    return s;
  };

  const getActiveRows = () => {
    let rows: any[] = [];
    if (activeTab === 'ideas') rows = ideas;
    else if (activeTab === 'drafts') rows = drafts;
    else if (activeTab === 'approvals') rows = approvals;
    else if (activeTab === 'scheduled') rows = scheduled;
    else if (activeTab === 'published') rows = published;

    // Channel Filtering
    if (selectedChannelId) {
      const selectedAccount = connectedAccounts?.find(a => a.id === selectedChannelId);
      const provider = selectedAccount?.provider?.toLowerCase();

      rows = rows.filter(r => {
        let raw = r.channels || r.platform || [];
        let rowChans: string[] = [];

        // Handle stringified JSON
        if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
          try {
            const parsed = JSON.parse(raw);
            raw = Array.isArray(parsed) ? parsed : (parsed.urls || parsed.channels || [parsed]);
          } catch (e) { }
        }

        if (Array.isArray(raw)) {
          rowChans = raw.map(c => String(c || '').toLowerCase().trim());
        } else if (typeof raw === 'string' && raw.trim()) {
          rowChans = raw.split(',').map(c => c.trim().toLowerCase());
        }

        return rowChans.some(c => {
          if (!c) return false;
          // Match by UUID/ID
          if (c === selectedChannelId?.toLowerCase()) return true;
          // Fuzzy match by provider name
          if (provider && (c.includes(provider) || provider.includes(c))) return true;
          return false;
        });
      });
    }

    if (searchQuery) {
      return rows.filter(r =>
        (r.finalCaption || r.captionOutput || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.theme || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return rows;
  };

  const getChannelCount = (chanId: string | null) => {
    let rows: any[] = [];
    if (activeTab === 'ideas') rows = ideas;
    else if (activeTab === 'drafts') rows = drafts;
    else if (activeTab === 'approvals') rows = approvals;
    else if (activeTab === 'scheduled') rows = scheduled;
    else if (activeTab === 'published') rows = published;

    if (!chanId) return rows.length;

    const selectedAccount = connectedAccounts?.find(a => a.id === chanId);
    const provider = selectedAccount?.provider?.toLowerCase();

    return rows.filter(r => {
      let raw = r.channels || r.platform || [];
      let rowChans: string[] = [];

      // Handle stringified JSON
      if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
        try {
          const parsed = JSON.parse(raw);
          raw = Array.isArray(parsed) ? parsed : (parsed.urls || parsed.channels || [parsed]);
        } catch (e) { }
      }

      if (Array.isArray(raw)) {
        rowChans = raw.map(c => String(c || '').toLowerCase().trim());
      } else if (typeof raw === 'string' && raw.trim()) {
        rowChans = raw.split(',').map(c => c.trim().toLowerCase());
      }

      return rowChans.some(c => {
        if (!c) return false;
        // Match by UUID/ID
        if (c === chanId?.toLowerCase()) return true;
        // Fuzzy match by provider name
        if (provider && (c.includes(provider) || provider.includes(c))) return true;
        return false;
      });
    }).length;
  };

  const filteredRows = getActiveRows();

  const getPlatformIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p === 'linkedin') return <Linkedin className="w-5 h-5" />;
    if (p === 'facebook') return <Facebook className="w-5 h-5" />;
    if (p === 'instagram') return <Instagram className="w-5 h-5" />;
    if (p === 'twitter' || p === 'x') return <Twitter className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  const tabConfigs = [
    { id: 'drafts', label: 'Drafts', icon: FileText, count: drafts.length, color: 'blue' },
    { id: 'approvals', label: 'Approvals', icon: Eye, count: approvals.length, color: 'purple' },
    { id: 'scheduled', label: 'Scheduled', icon: Clock, count: scheduled.length, color: 'amber' },
    { id: 'published', label: 'Published', icon: CheckCircle2, count: published.length, color: 'emerald' },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb, count: ideas.length, color: 'amber' },
  ];

  const handleCreateIdea = async () => {
    if (!newIdea.trim() || !activeCompanyId || !authedFetch || !backendBaseUrl) return;
    setIsCreatingIdea(true);
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompanyId,
          theme: newIdea,
          status: 'IDEA',
          date: new Date().toISOString().split('T')[0],
          contentType: 'Social Post'
        })
      });
      if (res.ok) {
        setNewIdea('');
        notify('Idea added to scratchpad!', 'success');
        // The parent App will refresh data through its interval polling or we could trigger a refresh if we had a dedicated prop
      } else {
        notify('Failed to save idea', 'error');
      }
    } catch (err) {
      notify('Error creating idea', 'error');
    } finally {
      setIsCreatingIdea(false);
    }
  };

  const handleUpdateStatus = async (row: any, newStatus: string) => {
    if (!authedFetch || !backendBaseUrl) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${row.contentCalendarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        notify(`Status updated to ${newStatus.toLowerCase()}!`, 'success');
      } else {
        notify('Failed to update status', 'error');
      }
    } catch (err) {
      notify('Error updating status', 'error');
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 min-w-0 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/15 to-transparent rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/12 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      <div className="max-w-[1600px] mx-auto flex gap-6 items-start relative z-20">
        {/* CHANNEL RAIL (STICKY) */}
        <aside className="hidden lg:flex flex-col gap-4 py-4 sticky top-6">
          {/* All Channels */}
          <button
            onClick={() => setSelectedChannelId(null)}
            className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${!selectedChannelId
              ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20'
              : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:scale-110 shadow-sm'
              }`}
            title="All Channels"
          >
            <Globe className="w-6 h-6" />
            {getChannelCount(null) > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-black px-1 ${!selectedChannelId ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                {getChannelCount(null)}
              </span>
            )}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
              All Content
            </div>
          </button>

          <div className="w-8 h-[1px] bg-slate-200/50 mx-auto my-2" />

          {/* Connected Accounts */}
          {connectedAccounts?.map((acc: any) => {
            const isActive = selectedChannelId === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setSelectedChannelId(acc.id)}
                className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${isActive
                  ? 'bg-white border-slate-900 shadow-xl shadow-slate-900/10'
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:scale-110 shadow-sm'
                  }`}
              >
                <div className={`w-full h-full flex items-center justify-center transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {getPlatformIcon(acc.provider)}
                </div>

                {getChannelCount(acc.id) > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-black px-1 ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-white shadow-lg'
                    }`}>
                    {getChannelCount(acc.id)}
                  </span>
                )}

                <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${acc.provider === 'linkedin' ? 'bg-[#0077b5]' :
                  acc.provider === 'facebook' ? 'bg-[#1877f2]' :
                    'bg-blue-400'
                  }`} />

                <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
                  {acc.provider_account_name || acc.provider}
                </div>
              </button>
            );
          })}

          <div className="w-8 h-[1px] bg-slate-200/50 mx-auto my-2" />

          {/* Connect Button */}
          <button
            onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/settings/integrations`)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300 group relative"
            title="Manage Accounts"
          >
            <PlusCircle className="w-6 h-6" />
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
              Connect Channels
            </div>
          </button>
        </aside>

        <section className="flex-1 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10 min-w-0">
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
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  title="Timeline View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

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

            {/* Ideas Scratchpad Creator */}
            {activeTab === 'ideas' && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                <Sparkles className="absolute top-[-20px] right-[-20px] w-40 h-40 text-amber-200/20 rotate-12 pointer-events-none group-hover:rotate-45 transition-transform duration-1000" />
                <div className="relative z-10 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Quick Idea Scratchpad
                    </h3>
                    <textarea
                      placeholder="What's your next big content move? Jot down a theme, a hook, or a rough thought..."
                      value={newIdea}
                      onChange={(e) => setNewIdea(e.target.value)}
                      className="w-full bg-white/60 border border-amber-200/50 rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder:text-amber-900/30 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all resize-none h-24 backdrop-blur-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleCreateIdea}
                      disabled={isCreatingIdea || !newIdea.trim()}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isCreatingIdea ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Save to Scratchpad
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            {filteredRows.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
                    {activeTab === 'ideas' ? <Lightbulb className="w-10 h-10" /> : <LayoutGrid className="w-10 h-10" />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {searchQuery ? 'No matches found' : activeTab === 'ideas' ? 'Your Scratchpad is clean' : `Your ${activeTab} is empty`}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">
                      {activeTab === 'ideas'
                        ? 'Jot down your first brilliant idea above to get started!'
                        : activeTab === 'drafts'
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
                      className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Plan
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredRows.map((row) => {
                  const imageUrl = getImageGeneratedUrl(row) || getAttachedDesignUrls(row)[0] || null;
                  const caption = row.finalCaption || row.captionOutput || "";
                  const channels = Array.isArray(row.channels) ? row.channels : row.channels ? [row.channels] : [];

                  return (
                    <div
                      key={row.contentCalendarId}
                      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500"
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
                          <div className={`w-full h-full flex items-center justify-center ${activeTab === 'ideas' ? 'text-amber-200 bg-amber-50/30' : 'text-slate-200 bg-slate-100'}`}>
                            {activeTab === 'ideas' ? <Lightbulb className="w-16 h-16" /> : <FileText className="w-16 h-16" />}
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
                              activeTab === 'ideas' ? 'bg-orange-100 text-orange-600' :
                                activeTab === 'approvals' ? 'bg-purple-100 text-purple-600' :
                                  'bg-blue-50 text-blue-600'
                            }`}>
                            {getStatusLabel(row)}
                          </div>
                        </div>

                        <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-3 h-[4.5rem]">
                          {caption || <span className="text-slate-300 italic">No caption generated yet.</span>}
                        </p>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                          <button
                            onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                            className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 uppercase tracking-widest"
                          >
                            Edit Details
                          </button>

                          {activeTab === 'drafts' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row, 'READY'); }}
                              className="w-full py-3 px-4 bg-purple-50 border border-purple-100 rounded-xl text-[10px] font-black text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              <SendHorizontal className="w-3.5 h-3.5" />
                              Send for Review
                            </button>
                          )}

                          {activeTab === 'approvals' && (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row, 'DRAFT'); }}
                                className="flex-1 py-3 px-4 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Return
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row, 'APPROVED'); }}
                                className="flex-1 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-12 relative before:absolute before:left-[1.85rem] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {(Object.entries(
                  filteredRows.sort((a, b) => (a.date || '').localeCompare(b.date || '')).reduce((acc, row) => {
                    const dateStr = row.date || 'TBD';
                    if (!acc[dateStr]) acc[dateStr] = [];
                    acc[dateStr].push(row);
                    return acc;
                  }, {} as Record<string, any[]>)
                ) as [string, any[]][]).map(([date, posts]) => {
                  let dateLabel = date;
                  try {
                    const parsed = parseISO(date);
                    if (isToday(parsed)) dateLabel = 'Today';
                    else if (isTomorrow(parsed)) dateLabel = 'Tomorrow';
                    else dateLabel = format(parsed, 'EEEE, MMM do');
                  } catch (e) { }

                  return (
                    <div key={date} className="relative space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-[3.75rem] h-[3.75rem] rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
                          <CalendarDays className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{dateLabel}</h3>
                      </div>

                      <div className="ml-[3.75rem] space-y-4">
                        {posts.map((row) => {
                          const imageUrl = getImageGeneratedUrl(row) || getAttachedDesignUrls(row)[0] || null;
                          const caption = row.finalCaption || row.captionOutput || "";
                          const channels = Array.isArray(row.channels) ? row.channels : row.channels ? [row.channels] : [];

                          return (
                            <div
                              key={row.contentCalendarId}
                              className="group flex flex-col md:flex-row gap-6 bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                            >
                              <div className="w-full md:w-32 h-32 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 relative group/thumb">
                                {imageUrl ? (
                                  <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500" />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center ${activeTab === 'ideas' ? 'text-amber-200 bg-amber-50/20' : 'text-slate-200 bg-slate-50'}`}>
                                    {activeTab === 'ideas' ? <Lightbulb className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      {channels.map((chan: string, i: number) => (
                                        <span key={i} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{chan}</span>
                                      ))}
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[10px] font-bold text-slate-400 capitalize">{getStatusLabel(row)}</span>
                                    </div>
                                    <p className="text-slate-700 font-medium leading-relaxed line-clamp-2">
                                      {caption || <span className="text-slate-300 italic text-sm">No caption drafting yet.</span>}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }}
                                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                      <PlusCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      {row.scheduled_at ? format(parseISO(row.scheduled_at), 'hh:mm a') : 'Not time-set'}
                                    </div>
                                  </div>

                                  <div className="flex gap-4">
                                    {activeTab === 'drafts' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row, 'READY'); }}
                                        className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                      >
                                        <SendHorizontal className="w-3 h-3" />
                                        Request Approval
                                      </button>
                                    )}

                                    {activeTab === 'approvals' && (
                                      <>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row, 'DRAFT'); }}
                                          className="text-[11px] font-black text-rose-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                        >
                                          <XCircle className="w-3 h-3" />
                                          Return
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row, 'APPROVED'); }}
                                          className="text-[11px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                          Approve
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                                      className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
