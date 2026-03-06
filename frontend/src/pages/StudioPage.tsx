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
  Save,
  ShieldCheck,
  Wand2
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
  requestConfirm: (config: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    thirdLabel?: string;
    confirmVariant?: 'primary' | 'danger';
    thirdVariant?: 'primary' | 'danger' | 'ghost';
  }) => Promise<boolean | 'third'>;
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
  requestConfirm,
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
    { id: 'drafts', label: 'Post Drafts', icon: 'Edit', statuses: ['To Do', 'Drafts', 'Caption Generated', 'Design Generated'] },
    { id: 'scheduled', label: 'Scheduled', icon: 'Clock', statuses: ['Approved', 'Scheduled'] },
    { id: 'published', label: 'Published', icon: 'CheckCircle2', statuses: ['Published'] }
  ];

  const [activeTab, setActiveTab] = useState<string>((location.state as any)?.activeTab || studioTabs[0].id);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [localStudioSettings, setLocalStudioSettings] = useState<any>(() => ({
    studioTabs: activeCompany?.kanban_settings?.studio_settings?.studioTabs || studioTabs
  }));
  const [localAutomations, setLocalAutomations] = useState<any[]>(activeCompany?.kanban_settings?.automations || []);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const columns = activeCompany?.kanban_settings?.columns || [];

  // Robust sync: update local state whenever company props update, 
  // but only if we're not currently editing to avoid losing unsaved changes.
  useEffect(() => {
    if (activeCompany?.kanban_settings && !isConfiguring) {
      const ks = activeCompany.kanban_settings;
      setLocalStudioSettings({
        studioTabs: ks.studio_settings?.studioTabs || studioTabs
      });
      setLocalAutomations(ks.automations || []);
    }
  }, [activeCompany?.kanban_settings, isConfiguring, studioTabs]);

  // Specific refresh when opening the modal to ensure fresh data
  const handleOpenConfig = () => {
    const ks = activeCompany?.kanban_settings;
    setLocalStudioSettings({
      studioTabs: ks?.studio_settings?.studioTabs || studioTabs
    });
    setLocalAutomations(ks?.automations || []);
    setIsConfiguring(true);
  };

  const addEventTrigger = () => {
    setLocalAutomations([...localAutomations, { id: `event-${Date.now()}`, type: 'event', event: 'caption_generated', targetStatus: columns[0]?.id || '' }]);
  };

  const addMoveTrigger = () => {
    setLocalAutomations([...localAutomations, { id: `move-${Date.now()}`, type: 'move_to', targetColumn: columns[0]?.id || '', action: 'generate_caption' }]);
  };

  const addLockRule = () => {
    setLocalAutomations([...localAutomations, { id: `lock-${Date.now()}`, type: 'access_rule', columnId: columns[0]?.id || '', roleName: '' }]);
  };

  const updateAutomation = (id: string, updates: any) => {
    setLocalAutomations(localAutomations.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAutomation = (id: string) => {
    setLocalAutomations(localAutomations.filter(a => a.id !== id));
  };

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtering Logic
  const allRows = calendarRows.map(row => {
    const rawValue = getStatusValue(row.status);
    return {
      ...row,
      statusTitle: rawValue
    };
  });

  // Simple label map for common fallbacks
  const labelMap: Record<string, string> = {
    'idea': 'Idea',
    'scheduled': 'Scheduled',
    'published': 'Published'
  };

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

    const companyCols = activeCompany?.kanban_settings?.columns || [];
    const colIds = companyCols.map((c: any) => c.id.toLowerCase());
    const colTitles = companyCols.map((c: any) => c.title.toLowerCase());

    // Normalize and SANITIZE tab statuses: Only match against current columns or known core IDs
    const tabStatuses = (tab.statuses || [])
      .map((s: string) => s.toLowerCase())
      .filter((s: string) => colIds.includes(s) || colTitles.includes(s) || s === 'scheduled' || s === 'published' || s === 'idea');

    return allRows.filter(r => {
      const title = String(r.statusTitle || '').toLowerCase();
      const originalStatus = String(r.status || '').toLowerCase();

      // STRICT MATCHING: Only show if the status is explicitly in the sanitized list
      if (tabStatuses.length > 0) {
        return tabStatuses.includes(title) || tabStatuses.includes(originalStatus);
      }

      // Safe fallback if tab configuration is empty (rare)
      if (tab.id === 'drafts') {
        return !["idea", "scheduled", "published"].includes(title) && !["idea", "scheduled", "published"].includes(originalStatus);
      }

      return false;
    });
  };

  const currentTabRows = getRowsForTab(activeTab);

  const getStatusLabel = (row: any) => {
    const s = String(row.status || '').toLowerCase();
    const st = String(row.statusTitle || '').toLowerCase();
    const companyCols = activeCompany?.kanban_settings?.columns || [];
    const match = companyCols.find((c: any) =>
      c.id.toLowerCase() === s ||
      c.title.toLowerCase() === s ||
      c.id.toLowerCase() === st ||
      c.title.toLowerCase() === st
    );

    if (st === 'for approval') return 'For Approval';
    if (st === 'ready' || st === 'approved') return 'Ready';
    if (st === 'reviewed' || st === 'design completed') return 'Reviewed';
    return match ? match.title : (labelMap[st] || row.statusTitle || st.replace(/\b\w/g, (l: string) => l.toUpperCase()));
  };

  const getActiveRows = () => {
    let rows = currentTabRows;

    if (selectedStatusFilter !== 'all') {
      rows = rows.filter(r =>
        String(r.status || '').toLowerCase() === selectedStatusFilter.toLowerCase() ||
        String(r.statusTitle || '').toLowerCase() === selectedStatusFilter.toLowerCase()
      );
    }

    // Channel Filtering
    if (selectedChannelId) {
      const selectedAccount = connectedAccounts?.find(a => a.id === selectedChannelId);
      const provider = selectedAccount?.provider?.toLowerCase();

      rows = rows.filter(r => {
        // Precise matching for published posts
        if (r.social_account_id) {
          return r.social_account_id === selectedChannelId;
        }

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

          // Fuzzy match by provider name only if there are no UUIDs in the list
          // and we don't have a specific record for another account on same provider
          const hasUuids = rowChans.some(rc => rc.match(/^[0-9a-f-]{36}$/));
          if (!hasUuids && provider && (c.includes(provider) || provider.includes(c))) {
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

  const tabConfigs = studioTabs.map((t: any) => {
    const tabRows = getRowsForTab(t.id);
    let count = tabRows.length;

    // If a channel is selected, show the count for that channel within the tab
    if (selectedChannelId) {
      count = tabRows.filter(r => {
        if (r.social_account_id) return r.social_account_id === selectedChannelId;
        const rowChans = Array.isArray(r.channels) ? r.channels : (r.channels ? [r.channels] : []);
        return rowChans.some((c: any) => String(c).toLowerCase() === selectedChannelId.toLowerCase());
      }).length;
    }

    return {
      id: t.id,
      label: t.label,
      icon: iconMap[t.icon] || Edit,
      count
    };
  });



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

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-transparent text-white text-xs font-bold outline-none px-2 py-1 cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">All Statuses</option>
                    {(() => {
                      const tab = studioTabs.find((t: any) => t.id === activeTab);
                      const tStatuses = tab?.statuses || [];
                      return tStatuses.map((s: string) => (
                        <option key={s} value={s} className="bg-slate-900">{s}</option>
                      ));
                    })()}
                  </select>
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
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setSelectedStatusFilter('all');
                      }}
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
                          <div
                            className="relative aspect-square overflow-hidden bg-slate-100 group/img cursor-pointer"
                            onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-[1.2]"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center text-slate-200 bg-slate-100`}>
                                <FileText className="w-16 h-16" />
                              </div>
                            )}

                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-3">
                              {imageUrl && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.open(imageUrl, '_blank'); }}
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
                                  <div
                                    className="w-full md:w-32 h-32 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 relative group/thumb cursor-pointer"
                                    onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${row.contentCalendarId}`)}
                                  >
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
                                    const currentStatuses = tab.statuses || [];
                                    const colId = c.id;
                                    const colTitle = c.title;

                                    if (isSel) {
                                      // Remove ALL instances of ID and Title to purge duplicates/legacy names
                                      nt[tIdx].statuses = currentStatuses.filter((s: string) =>
                                        s.toLowerCase() !== colId.toLowerCase() &&
                                        s.toLowerCase() !== colTitle.toLowerCase()
                                      );
                                    } else {
                                      // Add ID and Title for maximum match compatibility
                                      nt[tIdx].statuses = [...currentStatuses, colId];
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                          <Wand2 size={14} className="text-indigo-500" />
                          Section 2: Triggers & Automations
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Automate status changes and restrict access based on events.</p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                        >
                          <PlusIcon size={12} /> Add Trigger
                        </button>
                        {isAddMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-[110] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                            <button onClick={() => { addEventTrigger(); setIsAddMenuOpen(false); }} className="p-2 text-left hover:bg-indigo-50 rounded-xl transition-all">
                              <div className="text-[10px] font-black uppercase text-indigo-600">Event Trigger</div>
                              <div className="text-[9px] text-slate-400 font-medium tracking-tight">On content change</div>
                            </button>
                            <button onClick={() => { addMoveTrigger(); setIsAddMenuOpen(false); }} className="p-2 text-left hover:bg-blue-50 rounded-xl transition-all border-t border-slate-50">
                              <div className="text-[10px] font-black uppercase text-blue-600">Move Trigger</div>
                              <div className="text-[9px] text-slate-400 font-medium tracking-tight">On status move</div>
                            </button>
                            <button onClick={() => { addLockRule(); setIsAddMenuOpen(false); }} className="p-2 text-left hover:bg-amber-50 rounded-xl transition-all border-t border-slate-50">
                              <div className="text-[10px] font-black uppercase text-amber-600">Lock Rule</div>
                              <div className="text-[9px] text-slate-400 font-medium tracking-tight">Restrict access</div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {localAutomations.map((rule: any) => (
                        <div key={rule.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col gap-3 group/rule">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {rule.type === 'access_rule' ? (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-wider">
                                  <ShieldCheck size={12} />
                                  Lock Rule
                                </div>
                              ) : rule.type === 'move_to' ? (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-wider">
                                  <RotateCcw size={12} />
                                  Move Trigger
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                                  <Wand2 size={12} />
                                  Event Trigger
                                </div>
                              )}
                            </div>
                            <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/rule:opacity-100">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {rule.type === 'access_rule' ? (
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Lock</span>
                              <select
                                value={rule.columnId}
                                onChange={(e) => updateAutomation(rule.id, { columnId: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                {columns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                              </select>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 text-[8px]">to</span>
                              <select
                                value={rule.roleName}
                                onChange={(e) => updateAutomation(rule.id, { roleName: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                <option value="">Select Role</option>
                                {activeCompany?.custom_roles?.map((r: any) => (
                                  <option key={r.name} value={r.name}>{r.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : rule.type === 'move_to' ? (
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">In</span>
                              <select
                                value={rule.targetColumn}
                                onChange={(e) => updateAutomation(rule.id, { targetColumn: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                {columns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                              </select>
                              <ArrowRightIcon size={14} className="text-slate-300 shrink-0" />
                              <select
                                value={rule.action}
                                onChange={(e) => updateAutomation(rule.id, { action: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                <option value="generate_caption">AI: Write Caption</option>
                                <option value="generate_image">AI: Design Image</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <select
                                value={rule.event}
                                onChange={(e) => updateAutomation(rule.id, { event: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                <option value="caption_generated">AI Caption Generated</option>
                                <option value="image_generated">AI Image Generated</option>
                                <option value="comment_added">New Comment Added</option>
                                <option value="revision_requested">Revision Requested</option>
                                <option value="content_approved">Content Approved</option>
                                <option value="content_scheduled">When a post is scheduled</option>
                                <option value="content_posted">When a post is live</option>
                                <option value="content_unscheduled">When a post is unscheduled</option>
                              </select>
                              <ArrowRightIcon size={14} className="text-slate-300 shrink-0" />
                              <select
                                value={rule.targetStatus}
                                onChange={(e) => updateAutomation(rule.id, { targetStatus: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                {columns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      ))}

                      {localAutomations.length === 0 && (
                        <div className="py-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No custom triggers active</p>
                        </div>
                      )}
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
                                studio_settings: localStudioSettings,
                                automations: localAutomations
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
