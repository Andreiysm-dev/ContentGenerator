import React, { useState, useEffect } from "react";
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
  AlertCircle,
  SendHorizontal,
  XCircle,
  CheckCircle,
  Edit,
  Settings,
  Settings2,
  Trash2,
  Plus as PlusIcon,
  HelpCircle,
  ArrowRight as ArrowRightIcon,
  RotateCcw,
  Save
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
  activeCompany?: any;
  connectedAccounts?: any[];
  authedFetch?: any;
  backendBaseUrl?: string;
  userPermissions?: {
    canApprove: boolean;
    canGenerate: boolean;
    canCreate: boolean;
    canDelete: boolean;
    isOwner: boolean;
  };
}

type TabType = 'drafts' | 'scheduled' | 'published';

export function StudioPage({
  calendarRows,
  getStatusValue,
  getImageGeneratedUrl,
  getAttachedDesignUrls,
  setSelectedRow,
  setIsViewModalOpen,
  notify,
  activeCompanyId,
  activeCompany,
  connectedAccounts,
  authedFetch,
  backendBaseUrl,
  userPermissions = {
    canApprove: false,
    canGenerate: false,
    canCreate: false,
    canDelete: false,
    isOwner: false
  }
}: DraftsPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const studioSettings = activeCompany?.kanban_settings?.studio_settings;
  const studioTabs = studioSettings?.studioTabs || [
    { id: 'drafts', label: 'Post Drafts', icon: 'Edit', statuses: ['Draft', 'Drafts', 'To Do', 'Caption Generated', 'Design Generated', 'Revision', 'For Approval'] },
    { id: 'scheduled', label: 'Scheduled', icon: 'Clock', statuses: ['Approved', 'Scheduled'] },
    { id: 'published', label: 'Published', icon: 'CheckCircle2', statuses: ['Published'] }
  ];

  const [activeTab, setActiveTab] = useState<string>((location.state as any)?.activeTab || studioTabs[0].id);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [localStudioSettings, setLocalStudioSettings] = useState<any>(() => ({
    studioTabs: studioSettings?.studioTabs || studioTabs,
    schedulingStatus: studioSettings?.schedulingStatus || 'Scheduled',
    postedStatus: studioSettings?.postedStatus || 'Published',
    unscheduledStatus: studioSettings?.unscheduledStatus || 'Drafts'
  }));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const columns = activeCompany?.kanban_settings?.columns || [];

  // Robust sync: update local state whenever company props update, 
  // but only if we're not currently editing to avoid losing unsaved changes.
  useEffect(() => {
    if (activeCompany?.kanban_settings?.studio_settings && !isConfiguring) {
      const settings = activeCompany.kanban_settings.studio_settings;
      setLocalStudioSettings({
        studioTabs: settings.studioTabs || studioTabs,
        schedulingStatus: settings.schedulingStatus || 'Scheduled',
        postedStatus: settings.postedStatus || 'Published',
        unscheduledStatus: settings.unscheduledStatus || 'Drafts'
      });
    }
  }, [activeCompany?.kanban_settings?.studio_settings, isConfiguring, studioTabs]);

  // Specific refresh when opening the modal to ensure fresh data
  const handleOpenConfig = () => {
    const settings = activeCompany?.kanban_settings?.studio_settings;
    setLocalStudioSettings({
      studioTabs: settings?.studioTabs || studioTabs,
      schedulingStatus: settings?.schedulingStatus || 'Scheduled',
      postedStatus: settings?.postedStatus || 'Published',
      unscheduledStatus: settings?.unscheduledStatus || 'Drafts'
    });
    setIsConfiguring(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtering Logic
  const allRows = calendarRows.map(row => ({
    ...row,
    normalizedStatus: getStatusValue(row.status).toLowerCase(),
    displayStatus: getStatusValue(row.status)
  }));

  const iconMap: Record<string, any> = {
    'Edit': Edit,
    'Clock': Clock,
    'CheckCircle2': CheckCircle2,
    'FileText': FileText,
    'CalendarDays': CalendarDays,
    'LayoutGrid': LayoutGrid,
    'Search': Search,
    'Plus': Plus,
    'PlusCircle': PlusCircle,
    'List': List,
    'Sparkles': Sparkles,
    'AlertCircle': AlertCircle,
    'Send': Send,
    'XCircle': XCircle,
    'CheckCircle': CheckCircle
  };

  const getRowsForTab = (tabId: string) => {
    const tab = studioTabs.find((t: any) => t.id === tabId);
    if (!tab) return [];

    // Normalize tab statuses for comparison
    const tabStatuses = (tab.statuses || []).map((s: string) => s.toLowerCase());

    return allRows.filter(r => {
      const s = r.normalizedStatus;
      // Basic fallback: if it's the 'drafts' tab and status isn't idea/scheduled/published
      if (tab.id === 'drafts' && !tabStatuses.length) {
        return s !== "idea" && s !== "scheduled" && s !== "published";
      }
      return tabStatuses.includes(s);
    });
  };

  const currentTabRows = getRowsForTab(activeTab);

  const getStatusLabel = (row: any) => {
    const s = row.normalizedStatus;

    // Check custom columns first
    const companyCols = activeCompany?.kanban_settings?.columns || [];
    const match = companyCols.find((c: any) =>
      c.id.toLowerCase() === s ||
      c.title.toLowerCase() === s
    );
    if (match) return match.title;

    if (s === 'for approval') return 'For Approval';
    if (s === 'ready' || s === 'approved') return 'Ready';
    if (s === 'reviewed' || s === 'design completed') return 'Reviewed';
    if (s === 'draft' && (row.finalCaption || row.captionOutput)) return 'Drafting';
    return s;
  };

  const getActiveRows = () => {
    let rows = currentTabRows;

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

        // Precise matching for published posts
        if (activeTab === 'published' && r.social_account_id) {
          return r.social_account_id === selectedChannelId;
        }

        return rowChans.some(c => {
          if (!c) return false;
          // Match by UUID/ID
          if (c === selectedChannelId?.toLowerCase()) return true;

          // Fuzzy match by provider name - ONLY if there's no specific social_account_id
          // or if the account provider matches and the post is NOT yet published to a specific ID
          if (provider && (c.includes(provider) || provider.includes(c))) {
            // If it's a published post but has a DIFFERENT account ID, don't match
            if (r.social_account_id && r.social_account_id !== selectedChannelId) return false;
            return true;
          }
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
    let rows = currentTabRows;

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

      // Precise matching for published posts
      if (activeTab === 'published' && r.social_account_id) {
        return r.social_account_id === chanId;
      }

      return rowChans.some(c => {
        if (!c) return false;
        // Match by UUID/ID
        if (c === chanId?.toLowerCase()) return true;

        // Fuzzy match by provider name 
        if (provider && (c.includes(provider) || provider.includes(c))) {
          if (r.social_account_id && r.social_account_id !== chanId) return false;
          return true;
        }
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

  const tabConfigs = studioTabs.map((t: any) => ({
    id: t.id,
    label: t.label,
    icon: iconMap[t.icon] || Edit,
    count: getRowsForTab(t.id).length
  }));



  const handleUpdateStatus = async (row: any, newStatus: string, comments?: string) => {
    if (!authedFetch || !backendBaseUrl) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${row.contentCalendarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          supervisor_comments: comments
        })
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


        <section className="flex-1 bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden flex flex-row h-full relative z-10 min-w-0">
          {/* CHANNEL RAIL (INTERNAL) */}
          <aside className="hidden lg:flex flex-col gap-4 py-8 px-4 bg-slate-50 border-r border-slate-100 sticky top-0 h-full overflow-y-auto">
            {/* All Channels */}
            <button
              onClick={() => setSelectedChannelId(null)}
              className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${!selectedChannelId
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:scale-105 shadow-sm'
                }`}
            >
              <Globe className="w-5 h-5" />
              {getChannelCount(null) > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 rounded-full flex items-center justify-center text-[9px] font-black px-1 ${!selectedChannelId ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {getChannelCount(null)}
                </span>
              )}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-[100]">
                All Content
              </div>
            </button>

            <div className="w-6 h-[1px] bg-slate-200/50 mx-auto my-1" />

            {/* Connected Accounts */}
            {connectedAccounts?.map((acc: any) => {
              const isActive = selectedChannelId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedChannelId(acc.id)}
                  className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${isActive
                    ? 'bg-white border-slate-900 shadow-lg shadow-slate-900/10'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:scale-105 shadow-sm'
                    }`}
                >
                  <div className={`w-full h-full flex items-center justify-center transition-colors overflow-hidden rounded-xl ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {acc.profile_picture ? (
                      <img src={acc.profile_picture} alt={acc.provider} className="w-full h-full object-cover" />
                    ) : (
                      getPlatformIcon(acc.provider)
                    )}
                  </div>

                  {getChannelCount(acc.id) > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 rounded-full flex items-center justify-center text-[9px] font-black px-1 ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-white shadow-lg'
                      }`}>
                      {getChannelCount(acc.id)}
                    </span>
                  )}

                  <div className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-white ${acc.provider === 'linkedin' ? 'bg-[#0077b5]' :
                    acc.provider === 'facebook' ? 'bg-[#1877f2]' :
                      'bg-blue-400'
                    }`} />

                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-[100]">
                    {acc.profile_name || acc.provider}
                  </div>
                </button>
              );
            })}

            <div className="w-6 h-[1px] bg-slate-200/50 mx-auto my-1" />

            {/* Connect Button */}
            <button
              onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/settings/integrations`)}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300 group relative"
            >
              <PlusCircle className="w-5 h-5" />
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-[100]">
                Connect Channels
              </div>
            </button>
          </aside>

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header Section */}
            <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden">
              <FileText className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
                  Post Staging
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Content Studio
                </h2>
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



              {/* Tab Navigation */}
              <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-[2rem] w-fit shadow-sm">
                {tabConfigs.map((tab: any) => {
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

                <div className="w-[1px] h-6 bg-slate-100 mx-2" />

                <button
                  onClick={handleOpenConfig}
                  className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[1.2rem] transition-all transform hover:rotate-90 duration-500"
                  title="Configure Studio View"
                >
                  <Settings2 size={18} />
                </button>
              </div>

              {
                filteredRows.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
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
                              <div className={`w-full h-full flex items-center justify-center text-slate-200 bg-slate-100`}>
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
                                {activeTab === 'scheduled' && row.scheduled_at
                                  ? new Date(row.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                  : (row.date || 'TBD')}
                              </span>
                              <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${activeTab === 'published' ? 'bg-emerald-50 text-emerald-600' :
                                activeTab === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                {getStatusLabel(row)}
                              </div>
                            </div>

                            {row.theme && (
                              <h4 className="text-sm font-black text-slate-900 line-clamp-1 mb-1" title={row.theme}>
                                {row.theme}
                              </h4>
                            )}

                            <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-3 h-[4.5rem]">
                              {caption || <span className="text-slate-300 italic">No caption generated yet.</span>}
                            </p>

                            {row.supervisor_comments && (
                              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertCircle className="w-3 h-3 text-rose-500" />
                                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Revision Notes</span>
                                </div>
                                <p className="text-[11px] font-medium text-rose-900 leading-relaxed italic line-clamp-2">
                                  "{row.supervisor_comments}"
                                </p>
                              </div>
                            )}

                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                              {userPermissions.canCreate && (
                                <button
                                  onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                                  className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 uppercase tracking-widest"
                                >
                                  Edit Details
                                </button>
                              )}


                              {/* Approval actions removed as requested */}

                              {activeTab === 'scheduled' && userPermissions.canApprove && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(row, localStudioSettings.unscheduledStatus || 'Drafts');
                                  }}
                                  className="w-full py-3 px-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-black text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Unschedule
                                </button>
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
                                      <div className={`w-full h-full flex items-center justify-center text-slate-200 bg-slate-50`}>
                                        <FileText className="w-8 h-8" />
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
                                        {row.theme && (
                                          <h4 className="text-sm font-black text-slate-900 line-clamp-1 mb-1" title={row.theme}>
                                            {row.theme}
                                          </h4>
                                        )}
                                        <p className="text-slate-700 font-medium leading-relaxed line-clamp-2">
                                          {caption || <span className="text-slate-300 italic text-sm">No caption drafting yet.</span>}
                                        </p>
                                        {row.supervisor_comments && (
                                          <div className="mt-3 flex items-start gap-2 bg-rose-50/50 border border-rose-100/50 p-2.5 rounded-xl">
                                            <AlertCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                                            <p className="text-[11px] font-medium text-rose-800 leading-tight italic">
                                              "{row.supervisor_comments}"
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2 shrink-0">
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

                                    <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            {activeTab === 'scheduled' && row.scheduled_at
                                              ? format(parseISO(row.scheduled_at), 'hh:mm a')
                                              : (row.date || 'Not set')}
                                          </div>
                                        </div>

                                        <div className="flex gap-4">

                                          {/* Approval actions removed */}

                                          {activeTab === 'scheduled' && userPermissions.canApprove && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(row, localStudioSettings.unscheduledStatus || 'Drafts');
                                              }}
                                              className="text-[11px] font-black text-amber-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                            >
                                              <XCircle className="w-3 h-3" />
                                              Undo Schedule
                                            </button>
                                          )}



                                          {userPermissions.canCreate && (
                                            <button
                                              onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                                              className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
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
                )
              }
            </div>
          </div>

          {/* Studio Settings Modal */}
          {isConfiguring && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConfiguring(false)} />
              <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      <Settings2 className="text-blue-500" />
                      Studio Configuration
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-1">Configure layout, tabs, and automatic status transitions.</p>
                  </div>
                  <button
                    onClick={() => setIsConfiguring(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <XCircle className="text-slate-400 font-black cursor-pointer" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Tabs Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                          <LayoutGrid size={14} className="text-blue-500" />
                          Section 1: Dashboard Tabs
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Define the horizontal tabs shown on your Studio dashboard.</p>
                      </div>
                      <button
                        onClick={() => setLocalStudioSettings({
                          ...localStudioSettings,
                          studioTabs: [...localStudioSettings.studioTabs, { id: `tab-${Date.now()}`, label: 'New Tab', icon: 'Edit', statuses: [] }]
                        })}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        <PlusIcon size={12} /> Add Tab
                      </button>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3">
                      <Sparkles size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                        The statuses you select below determine <span className="font-bold underline">exactly what content you will see</span> in each tab. The first tab in this list will be your default view.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {localStudioSettings.studioTabs.map((tab: any, tIdx: number) => (
                        <div key={tab.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                                <Edit size={14} />
                              </div>
                              <input
                                value={tab.label}
                                onChange={(e) => {
                                  const nt = [...localStudioSettings.studioTabs];
                                  nt[tIdx].label = e.target.value;
                                  setLocalStudioSettings({ ...localStudioSettings, studioTabs: nt });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
                                placeholder="e.g. In Progress, Final Review..."
                              />
                            </div>
                            <button
                              onClick={() => {
                                const nt = localStudioSettings.studioTabs.filter((_: any, i: number) => i !== tIdx);
                                setLocalStudioSettings({ ...localStudioSettings, studioTabs: nt });
                              }}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {columns.map((c: any) => {
                              const isSel = tab.statuses.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    const nt = [...localStudioSettings.studioTabs];
                                    if (isSel) {
                                      nt[tIdx].statuses = tab.statuses.filter((s: string) => s !== c.id);
                                    } else {
                                      nt[tIdx].statuses = [...tab.statuses, c.id];
                                    }
                                    setLocalStudioSettings({ ...localStudioSettings, studioTabs: nt });
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isSel
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 transition-colors'
                                    }`}
                                >
                                  {c.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <ArrowRightIcon size={14} className="text-indigo-500" />
                        Section 2: System Mappings
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Automate status changes based on content lifecycle events.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Clock size={10} className="text-blue-500" />
                            On Scheduled
                          </label>
                          <p className="text-[9px] text-slate-400 font-medium ml-1 mt-0.5">Where content moves when a date is selected.</p>
                        </div>
                        <select
                          value={localStudioSettings.schedulingStatus}
                          onChange={(e) => setLocalStudioSettings({ ...localStudioSettings, schedulingStatus: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
                        >
                          <option value="">Manual Only - No Auto-Move</option>
                          {columns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Send size={10} className="text-emerald-500" />
                            On Posted
                          </label>
                          <p className="text-[9px] text-slate-400 font-medium ml-1 mt-0.5">Where content moves after social media delivery.</p>
                        </div>
                        <select
                          value={localStudioSettings.postedStatus}
                          onChange={(e) => setLocalStudioSettings({ ...localStudioSettings, postedStatus: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
                        >
                          <option value="">Manual Only - No Auto-Move</option>
                          {columns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <RotateCcw size={10} className="text-amber-500" />
                            On Unscheduled
                          </label>
                          <p className="text-[9px] text-slate-400 font-medium ml-1 mt-0.5">Where content moves when a date is removed.</p>
                        </div>
                        <select
                          value={localStudioSettings.unscheduledStatus}
                          onChange={(e) => setLocalStudioSettings({ ...localStudioSettings, unscheduledStatus: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
                        >
                          <option value="">Manual Only - No Auto-Move</option>
                          {columns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                    <AlertCircle size={14} />
                    Unsaved Changes
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsConfiguring(false)}
                      className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSavingSettings}
                      onClick={async () => {
                        if (!activeCompanyId || !authedFetch || !backendBaseUrl) return;
                        setIsSavingSettings(true);
                        try {
                          const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              kanban_settings: {
                                ...activeCompany.kanban_settings,
                                studio_settings: localStudioSettings
                              }
                            })
                          });
                          if (res.ok) {
                            notify('Studio settings updated!', 'success');
                            setIsConfiguring(false);
                            // We might need a full reload or state update here
                            window.location.reload();
                          } else {
                            notify('Failed to save settings', 'error');
                          }
                        } catch (err) {
                          notify('Error saving settings', 'error');
                        } finally {
                          setIsSavingSettings(false);
                        }
                      }}
                      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingSettings ? <RotateCcw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
