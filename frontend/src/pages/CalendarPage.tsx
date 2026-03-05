import { useState, useEffect } from "react";
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
  Zap,
  Wand2,
  Activity,
  Calendar as BigCalendar,
  Layout,
  Download,
  Copy as CopyIcon,
  Image as ImageIcon,
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
  Columns as ColumnsIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Target,
  SearchX,
  Lock,
  Bell,
  Loader2
} from "lucide-react";
import { KanbanView } from "./Workboard/KanbanView";
import type { Post, KanbanColumn } from "./Workboard/types";
import { SOKMED_COLUMNS } from "./Workboard/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarTableSkeleton } from "@/components/LoadingState";
import { ViewContentModal } from "@/modals/ViewContentModal";

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
  isBatchDeleting: boolean;
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
  isViewModalOpen: boolean;
  selectedRow: any;
  pageSize: number | "all";
  setPageSize: (size: number | "all") => void;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  currentPageRows: any[];
  getImageGeneratedUrl: (row: any) => string | null;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
  onStatusMoved?: (postId: string, status: string, originalStatus?: any) => void;
  userPermissions?: {
    canApprove: boolean;
    canGenerate: boolean;
    canCreate: boolean;
    canDelete: boolean;
    isOwner: boolean;
  };
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
    isBatchDeleting,
    handleBatchGenerate,
    openCsvModal,
    openCopyModal,
    handleDeleteSelected,
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
    onStatusMoved,
    userPermissions = {
      canApprove: false,
      canGenerate: false,
      canCreate: false,
      canDelete: false,
      isOwner: false
    },
  } = props;

  const [displayType, setDisplayType] = useState<'list' | 'kanban'>('kanban');
  const navigate = useNavigate();
  const { companyId } = useParams();

  const showClear = Boolean(calendarSearch) || calendarStatusFilter !== "all";

  const renderChannelIcons = (channelsString: string) => {
    if (!channelsString) return <span className="text-slate-300">—</span>;
    const channels = typeof channelsString === 'string' ? channelsString.toLowerCase() : '';
    return (
      <div className="flex gap-2 items-center">
        {channels.includes('linkedin') && <Linkedin className="w-4 h-4 text-[#0A66C2]" />}
        {channels.includes('instagram') && <Instagram className="w-4 h-4 text-[#E4405F]" />}
        {channels.includes('twitter') && <Twitter className="w-4 h-4 text-[#1DA1F2]" />}
        {channels.includes('facebook') && <Facebook className="w-4 h-4 text-[#1877F2]" />}
        {!channels.match(/linkedin|instagram|twitter|facebook/) && <Share2 className="w-4 h-4 text-slate-400" />}
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

  const KANBAN_CACHE_KEY = activeCompanyId ? `kanban_settings_${activeCompanyId}` : null;
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(SOKMED_COLUMNS);
  const [automations, setAutomations] = useState<any[]>([]);
  const [pendingMove, setPendingMove] = useState<{ postId: string; status: string; rules: any[] } | null>(null);
  const [pendingApprovalMove, setPendingApprovalMove] = useState<{ postId: string; status: string; roleName: string } | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);

  // Add-column popover state
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('#6366f1');
  const [isSavingCol, setIsSavingCol] = useState(false);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [watchedColumns, setWatchedColumns] = useState<Record<string, boolean>>({});
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const PRESET_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  useEffect(() => {
    fetchNotificationSettings();
  }, [activeCompanyId, authedFetch]);

  const fetchNotificationSettings = async () => {
    if (!activeCompanyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/profile/notifications/${activeCompanyId}`);
      if (res.ok) {
        const data = await res.json();
        setWatchedColumns(data.watchedColumns || {});
        setEmailNotificationsEnabled(data.emailNotificationsEnabled || false);
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    }
  };

  const saveNotificationSettings = async () => {
    if (!activeCompanyId) return;
    setIsSavingNotifications(true);
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/profile/notifications/${activeCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchedColumns,
          emailNotificationsEnabled
        }),
      });
      if (res.ok) {
        notify('Notification preferences saved!', 'success');
        setShowNotifications(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      notify('Error saving preferences', 'error');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const toggleWatchColumn = (columnId: string) => {
    setWatchedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const handleAddColumn = async () => {
    const name = newColName.trim();
    if (!name || !activeCompanyId) return;
    const newCol: KanbanColumn = { id: `custom-${Date.now()}`, title: name, color: newColColor };
    const updatedColumns = [...kanbanColumns, newCol];
    setIsSavingCol(true);
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanban_settings: { columns: updatedColumns, automations } }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setKanbanColumns(updatedColumns);
      setNewColName('');
      setNewColColor('#6366f1');
      setShowAddColumn(false);
      notify(`Column "${name}" added!`, 'success');
    } catch {
      notify('Failed to save column', 'error');
    } finally {
      setIsSavingCol(false);
    }
  };

  const handleColumnRename = async (columnId: string, newTitle: string) => {
    if (!activeCompanyId) return;
    const updatedColumns = kanbanColumns.map(c =>
      c.id === columnId ? { ...c, title: newTitle } : c
    );
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanban_settings: { columns: updatedColumns, automations } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to rename');
      }
      setKanbanColumns(updatedColumns);
      notify(`Column renamed to "${newTitle}"`, 'success');
    } catch (err: any) {
      notify(`Failed to rename column: ${err.message}`, 'error');
    }
  };

  const handleColumnColorChange = async (columnId: string, newColor: string) => {
    if (!activeCompanyId) return;
    const updatedColumns = kanbanColumns.map(c =>
      c.id === columnId ? { ...c, color: newColor } : c
    );
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanban_settings: { columns: updatedColumns, automations } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update color');
      }
      setKanbanColumns(updatedColumns);
      notify(`Column color updated!`, 'success');
    } catch (err: any) {
      notify(`Failed to update color: ${err.message}`, 'error');
    }
  };

  const executeStatusChange = async (postId: string, status: string, skipAutomation = false) => {
    const row = calendarRows.find(r => r.contentCalendarId === postId);
    onStatusMoved?.(postId, status, row?.status);
    setCalendarRows(prev => prev.map((r: any) => r.contentCalendarId === postId ? { ...r, status } : r));

    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }

      if (!skipAutomation) {
        const matchingRules = automations.filter(rule => rule.type === 'move_to' && rule.targetColumn === status);
        for (const rule of matchingRules) {
          const endpoint = rule.action === 'generate_caption' ? 'generate-caption' : 'generate-image';
          notify(`Auto-triggering ${rule.action.replace('_', ' ')}...`, 'info');
          authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}/${endpoint}`, { method: 'POST' })
            .then(r => r.ok ? notify(`${rule.action.replace('_', ' ')} started!`, 'success') : r.json().then(d => notify(d.error || 'Failed', 'error')))
            .catch(() => notify('Automation failed', 'error'));
        }
      }
    } catch (err: any) {
      // Revert local state
      setCalendarRows(prev => prev.map((r: any) => r.contentCalendarId === postId ? { ...r, status: row?.status } : r));
      notify(`Failed to move card: ${err.message}`, 'error');
    }
  };

  const onConfirmMoveAction = (shouldAutomate: boolean) => {
    if (!pendingMove) return;
    if (rememberChoice) {
      const prefKey = `automation_pref_${activeCompanyId}`;
      const prefs = JSON.parse(localStorage.getItem(prefKey) || '{}');
      prefs[pendingMove.status] = shouldAutomate ? 'automate' : 'skip';
      localStorage.setItem(prefKey, JSON.stringify(prefs));
    }
    executeStatusChange(pendingMove.postId, pendingMove.status, !shouldAutomate);
    setPendingMove(null);
  };

  useEffect(() => {
    if (!activeCompanyId) return;
    authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`).then(res => {
      if (res.ok) res.json().then(data => {
        if (data.company?.kanban_settings) {
          const { columns, automations } = data.company.kanban_settings;
          setKanbanColumns(columns?.length > 0 ? columns : SOKMED_COLUMNS);
          setAutomations(automations || []);
        }
      });
    });
  }, [activeCompanyId, authedFetch, backendBaseUrl]);

  const mapStatusToKanban = (status: any) => {
    const s = getStatusValue(status).trim();
    const match = kanbanColumns.find(c => c.id === s || c.title === s || c.id.toLowerCase() === s.toLowerCase() || c.title.toLowerCase() === s.toLowerCase());
    if (match) return match.id;
    const lower = s.toLowerCase();
    if (lower === 'generate' || lower === 'ready') return kanbanColumns.find(c => c.title.toLowerCase().includes('to do'))?.id || kanbanColumns[0]?.id;
    if (lower === 'approved') return kanbanColumns.find(c => c.title.toLowerCase().includes('approved'))?.id || s;
    return kanbanColumns[0]?.id || s;
  };

  // Resolves a raw status from DB to a human-readable column title using the company's kanban settings
  const mapStatusToDisplay = (status: any): { title: string; color?: string } => {
    const s = getStatusValue(status).trim();
    const match = kanbanColumns.find(
      c => c.id === s || c.title === s ||
        c.id.toLowerCase() === s.toLowerCase() ||
        c.title.toLowerCase() === s.toLowerCase()
    );
    if (match) return { title: match.title, color: match.color };
    // Friendly fallbacks for legacy values
    const lower = s.toLowerCase();
    if (lower === 'draft' || lower === 'drafts') return { title: 'Drafts' };
    if (lower === 'for review' || lower === 'review') return { title: 'For Review' };
    if (lower === 'approved') return { title: 'Approved' };
    if (lower === 'error') return { title: 'Error', color: '#ef4444' };
    return { title: s || 'Drafts' };
  };

  const onUpdateRow = (updatedRow: any) => {
    setCalendarRows(prev => prev.map(r => r.contentCalendarId === updatedRow.contentCalendarId ? updatedRow : r));
    setSelectedRow(updatedRow);
  };

  return (
    <main className="h-full flex flex-col overflow-hidden bg-gray-50/50 p-2.5 md:p-6 min-w-0 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/20 to-[#6fb6e8]/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/15 to-[#e5a4e6]/12 rounded-full blur-[100px] animate-pulse" />
      </div>

      <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[850px] relative z-10">
        <header className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">Workflow Planner</div>
            <h2 className="text-2xl font-black text-white tracking-tight">Content Board</h2>
          </div>
          <div className="flex items-center gap-3">
            {userPermissions.canCreate && (
              <button onClick={() => navigate(`/company/${companyId}/generate`)} className="rounded-xl px-6 py-3 text-sm font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Posts
              </button>
            )}
            <div className="relative group">
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition"><MoreVertical className="w-4 h-4" /></button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all z-50 overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                <button onClick={openCsvModal} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"><Download className="w-4 h-4" /> Export CSV</button>
                <button onClick={openCopyModal} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><CopyIcon className="w-4 h-4" /> Copy to Sheets</button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-white relative z-20">
            <div className="flex items-center min-w-fit">
              <div className="flex border-r border-slate-100">
                <TabButton active={viewMode === 'drafts'} onClick={() => navigate(`/company/${companyId}/calendar`)} icon={Layout} label="Pipeline" count={calendarRows.filter(r => {
                  const s = typeof r.status === 'string' ? r.status.toLowerCase() : (r.status?.state?.toLowerCase() || r.status?.value?.toLowerCase() || "");
                  return s !== 'published' && getStatusValue(r.status).toLowerCase() !== 'published';
                }).length} />
                <TabButton active={viewMode === 'published'} onClick={() => navigate(`/company/${companyId}/calendar/published`)} icon={CheckCircle2} label="Archives" count={calendarRows.filter(r => {
                  const s = typeof r.status === 'string' ? r.status.toLowerCase() : (r.status?.state?.toLowerCase() || r.status?.value?.toLowerCase() || "");
                  return s === 'published' || getStatusValue(r.status).toLowerCase() === 'published';
                }).length} />
              </div>

              <div className="px-4 py-3 min-w-[200px] md:min-w-[320px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={calendarSearch}
                    onChange={e => setCalendarSearch(e.target.value)}
                    placeholder="Search content..."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 flex items-center gap-4 min-w-fit">
              <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/50 group">
                    <Filter className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">
                      Status: <span className="text-blue-600 ml-1">{calendarStatusFilter}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-white/95 backdrop-blur-xl border-slate-200/60 rounded-2xl shadow-2xl">
                  <div className="px-2 py-1.5 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Status</p>
                  </div>
                  {calendarStatusOptions.map((f: string) => (
                    <DropdownMenuItem
                      key={f}
                      onClick={() => setCalendarStatusFilter(f)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all mb-0.5 ${calendarStatusFilter === f
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {f}
                      {calendarStatusFilter === f && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                    </DropdownMenuItem>
                  ))}
                  {calendarStatusFilter !== 'all' && (
                    <>
                      <div className="h-[1px] bg-slate-100 my-1" />
                      <DropdownMenuItem
                        onClick={() => setCalendarStatusFilter('all')}
                        className="flex items-center gap-2 px-3 py-2 text-[10px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer uppercase tracking-tight"
                      >
                        <FilterX className="w-3.5 h-3.5" />
                        Clear filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-6 w-[1px] bg-slate-100" />

              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
                  <button title="List view" onClick={() => setDisplayType('list')} className={`p-1.5 rounded-lg transition-all ${displayType === 'list' ? 'bg-white text-blue-600 shadow-sm border border-blue-500/10' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-3.5 h-3.5" /></button>
                  <button title="Board view" onClick={() => setDisplayType('kanban')} className={`p-1.5 rounded-lg transition-all ${displayType === 'kanban' ? 'bg-white text-blue-600 shadow-sm border border-blue-500/10' : 'text-slate-400 hover:text-slate-600'}`}><ColumnsIcon className="w-3.5 h-3.5" /></button>
                </div>

                <div className="relative">
                  <button
                    title="Add column"
                    onClick={() => setShowAddColumn(v => !v)}
                    className={`p-2 rounded-xl transition-all border ${showAddColumn
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {showAddColumn && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 animate-in zoom-in-95 fade-in duration-150">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">New Column</p>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Column name..."
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400 mb-3"
                      />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Colour</p>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setNewColColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newColColor === c ? 'border-slate-800 scale-110' : 'border-transparent'
                              }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddColumn}
                          disabled={!newColName.trim() || isSavingCol}
                          className="flex-1 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
                        >
                          {isSavingCol ? 'Saving…' : 'Add Column'}
                        </button>
                        <button
                          onClick={() => { setShowAddColumn(false); setNewColName(''); }}
                          className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    title="Notification settings"
                    onClick={() => setShowNotifications(v => !v)}
                    className={`p-2 rounded-xl transition-all border ${showNotifications
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                      }`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-200 border-2 border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Notification Preferences</h4>
                      <p className="text-[11px] text-slate-500 mb-6 font-medium leading-relaxed">
                        Select columns you want to monitor. You'll be notified when new cards arrive.
                      </p>

                      <div className="mb-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between group hover:bg-blue-50 transition-all">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Email Digest</span>
                          <span className="text-[10px] text-slate-500 font-medium">Send summary email every minute</span>
                        </div>
                        <button
                          onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                          className={`w-10 h-6 rounded-full transition-all relative ${emailNotificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${emailNotificationsEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Watch Columns</h4>
                      <br />

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-8 custom-scrollbar">
                        {kanbanColumns.map(col => (
                          <label key={col.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50/50 transition-all border border-transparent hover:border-blue-100 group">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: col.color }} />
                              <span className="text-xs font-bold text-slate-700">{col.title}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={watchedColumns[col.id] || false}
                              onChange={() => toggleWatchColumn(col.id)}
                              className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>

                      <button
                        onClick={saveNotificationSettings}
                        disabled={isSavingNotifications}
                        className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSavingNotifications ? <Loader2 size={16} className="animate-spin" /> : 'Save Preferences'}
                      </button>
                    </div>
                  )}
                </div>

                <button title="Configure workflow" onClick={() => navigate(`/company/${companyId}/settings/workflow`)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all"><SettingsIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-white">
            {isLoadingCalendar ? <div className="p-10"><CalendarTableSkeleton /></div> : filteredCalendarRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">No results found</h3>
              </div>
            ) : viewMode === 'published' ? (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/30">
                {currentPageRows.map(row => (
                  <div key={row.contentCalendarId} onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all cursor-pointer flex flex-col shadow-sm">
                    <div className="aspect-square bg-slate-100 relative">
                      {getImageGeneratedUrl(row) ? <img src={getImageGeneratedUrl(row)!} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-10 h-10" /></div>}
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-[9px] font-black flex items-center gap-1.5 shadow-sm"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Published</div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">{renderChannelIcons(row.channels)} <span className="text-[10px] text-slate-400 font-bold">{row.date}</span></div>
                      <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-relaxed">{row.finalCaption || row.captionOutput || 'No caption'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayType === 'kanban' ? (
              <KanbanView
                columns={calendarStatusFilter === 'all' ? kanbanColumns : kanbanColumns.filter(c => c.title === calendarStatusFilter)}
                posts={filteredCalendarRows.map(row => ({
                  id: row.contentCalendarId,
                  theme: row.theme || row.topic || 'Untitled Post',
                  contentType: row.contentType || 'Social Post',
                  status: mapStatusToKanban(row.status),
                  postDate: row.date || 'Unscheduled',
                  brandName: row.brandName || row.brandHighlight || '',
                  cardName: row.card_name,
                  imageUrl: row.imageGenerated || row.imageGeneratedUrl,
                  content_deadline: row.content_deadline || row.scheduled_at,
                  design_deadline: row.design_deadline || row.scheduled_at,
                  tags: row.tags,
                  collaborators: row.collaborators,
                  checklist: row.checklist,
                }))}
                automations={automations}
                userPermissions={userPermissions}
                onCardDelete={async (postId, e) => {
                  e.stopPropagation();
                  if (!window.confirm('Delete this post?')) return;
                  try {
                    const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${postId}`, {
                      method: 'DELETE'
                    });
                    if (!res.ok) throw new Error('Delete failed');
                    setCalendarRows(prev => prev.filter(r => r.contentCalendarId !== postId));
                    notify('Post deleted', 'success');
                  } catch (err: any) {
                    notify(err.message, 'error');
                  }
                }}
                onStatusChange={async (postId, status) => {
                  const matchingRules = automations.filter(rule => rule.type === 'move_to' && rule.targetColumn === status);
                  const lockRule = automations.find(rule => rule.type === 'access_rule' && rule.columnId === status);

                  // If moving to a locked column (unless owner), require approval confirmation
                  if (lockRule && !userPermissions.isOwner) {
                    setPendingApprovalMove({ postId, status, roleName: lockRule.roleName });
                    return;
                  }

                  if (matchingRules.length > 0) {
                    const prefKey = `automation_pref_${activeCompanyId}`;
                    const savedPref = JSON.parse(localStorage.getItem(prefKey) || '{}')[status];
                    if (savedPref === 'automate') executeStatusChange(postId, status, false);
                    else if (savedPref === 'skip') executeStatusChange(postId, status, true);
                    else {
                      setPendingMove({ postId, status, rules: matchingRules });
                      setRememberChoice(false);
                    }
                  } else executeStatusChange(postId, status, true);
                }}
                onCardClick={post => {
                  const row = calendarRows.find(r => r.contentCalendarId === post.id);
                  if (row) { setSelectedRow(row); setIsViewModalOpen(true); }
                }}
                onColumnRename={handleColumnRename}
                onColumnColorChange={handleColumnColorChange}
                onColumnReorder={async (newCols) => {
                  if (!activeCompanyId) return;
                  setKanbanColumns(newCols);
                  try {
                    await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ kanban_settings: { columns: newCols, automations } }),
                    });
                  } catch {
                    notify('Failed to save column order', 'error');
                  }
                }}
              />
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                    <tr>
                      <th className="w-12 px-6 py-4"><input type="checkbox" checked={isPageFullySelected} onChange={e => toggleSelectAllOnPage(e.target.checked)} className="rounded border-slate-300 text-blue-600" /></th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400">Content</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400">Strategy</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400">Team</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
                      <th className="w-32 px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPageRows.map(row => {
                      const status = getStatusValue(row.status) || "Draft";
                      const isSelected = selectedIds.includes(row.contentCalendarId);
                      return (
                        <tr key={row.contentCalendarId} className={`group hover:bg-slate-50/80 transition-all ${isSelected ? "bg-blue-50/30" : ""}`}>
                          <td className="px-6 py-5"><input type="checkbox" checked={isSelected} onChange={e => toggleSelectOne(row.contentCalendarId, e.target.checked)} className="rounded border-slate-300 text-blue-600" /></td>
                          <td className="px-4 py-5" onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }}>
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">{row.attachedDesign ? <Share2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}</div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-900 truncate">{row.card_name || row.theme || "Untitled Post"}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">{row.contentType}</span>
                                  {row.tags && row.tags.length > 0 && (
                                    <div className="flex gap-1 items-center ml-1">
                                      {row.tags.slice(0, 3).map((tag: any) => (
                                        <div
                                          key={tag.id}
                                          className="w-1.5 h-1.5 rounded-full"
                                          style={{ backgroundColor: tag.color }}
                                          title={tag.name}
                                        />
                                      ))}
                                      {row.tags.length > 3 && <span className="text-[8px] font-black text-slate-300">+{row.tags.length - 3}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5"><div className="flex flex-col gap-1">{row.primaryGoal && <div className="flex items-center gap-1.5"><Target className="w-3 h-3 text-blue-500" /><span className="text-[11px] font-bold text-slate-600">{row.primaryGoal}</span></div>}</div></td>
                          <td className="px-4 py-5 font-bold">
                            {row.collaborators && row.collaborators.length > 0 ? (
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {row.collaborators.slice(0, 3).map((c: any) => (
                                  <div
                                    key={c.id}
                                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-500 flex items-center justify-center text-[9px] font-black text-white uppercase shadow-sm"
                                    title={c.email}
                                  >
                                    {c.email?.substring(0, 1) || '?'}
                                  </div>
                                ))}
                                {row.collaborators.length > 3 && (
                                  <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 text-[8px] font-bold text-slate-500 shadow-sm">
                                    +{row.collaborators.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-medium">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-5 text-center">
                            {(() => {
                              const { title: displayTitle, color: colColor } = mapStatusToDisplay(row.status);
                              const badgeStyle = colColor
                                ? { borderColor: colColor + '40', color: colColor, backgroundColor: colColor + '15' }
                                : undefined;
                              return (
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${colColor ? '' : statusBadgeClasses(statusKey(displayTitle))
                                    }`}
                                  style={badgeStyle}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {displayTitle}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-5 text-right"><button onClick={() => { setSelectedRow(row); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ExternalLink className="w-4 h-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase">Size</span>
              <select value={pageSize} onChange={e => { setPage(1); setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); }} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none shadow-inner">
                {[10, 25, 50, "all"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-[11px] font-bold text-slate-500">{currentPageRows.length} of {filteredCalendarRows.length}</span>
            </div>
            {pageSize !== "all" && (
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black"><span className="text-blue-600">{page}</span> / {Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1)))}</div>
                <button disabled={page >= Math.ceil(filteredCalendarRows.length / (pageSize || 1))} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in zoom-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-3xl p-3 flex items-center gap-6 text-white min-w-[400px]">
            <div className="flex items-center gap-3 px-3"><div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Zap className="w-4 h-4" /></div><span className="text-xs font-black uppercase">{selectedIds.length} Selected</span></div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div className="flex gap-2 pr-2">
              <button onClick={handleBatchGenerate} disabled={isBatchGenerating || !userPermissions.canGenerate} className="px-5 py-2 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                {isBatchGenerating ? <Activity className="w-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Generate
              </button>
              <button onClick={handleDeleteSelected} disabled={isBatchDeleting} className="p-2.5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all rounded-xl border border-rose-500/20"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {pendingMove && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto"><Zap className="w-7 h-7" /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Automation Triggered</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">Moving to <span className="text-slate-900 font-bold">"{kanbanColumns.find(c => c.id === pendingMove.status)?.title}"</span> has automations. Run them?</p>
            <div className="space-y-2 mb-8 text-left">
              {pendingMove.rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100"><Wand2 className="w-4 h-4 text-blue-500" /><span className="text-[10px] font-black text-slate-700 uppercase">{rule.action.replace('_', ' ')}</span></div>
              ))}
            </div>
            <label className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-8 cursor-pointer">
              <input type="checkbox" checked={rememberChoice} onChange={e => setRememberChoice(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600" />
              <span className="text-[10px] font-black uppercase text-slate-600">Remember for this column</span>
            </label>
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirmMoveAction(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm shadow-lg shadow-blue-200">Yes, Run Automation</button>
              <button onClick={() => onConfirmMoveAction(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-sm">No, Just Move</button>
              <button onClick={() => setPendingMove(null)} className="w-full py-2 text-[10px] font-black text-slate-400 uppercase">Cancel Move</button>
            </div>
          </div>
        </div>
      )}

      {pendingApprovalMove && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Submit for Approval?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Moving this card to <span className="text-slate-900 font-bold">"{kanbanColumns.find(c => c.id === pendingApprovalMove.status)?.title}"</span> will lock it.
              A notification will be sent to the <span className="text-blue-600 font-bold">{pendingApprovalMove.roleName}</span> role for review.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  executeStatusChange(pendingApprovalMove.postId, pendingApprovalMove.status, true);
                  setPendingApprovalMove(null);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                Send for Approval
              </button>
              <button
                onClick={() => {
                  setPendingApprovalMove(null);
                  // Refresh rows to ensure card snaps back
                  setCalendarRows([...calendarRows]);
                }}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-sm hover:bg-slate-200 transition-all"
              >
                Cancel Move
              </button>
            </div>
            <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              Once moved, you may lose edit access
              <span className="w-1 h-1 rounded-full bg-slate-300" />
            </p>
          </div>
        </div>
      )}

      {/* Modal is now handled globally in App.tsx */}
    </main>
  );
}
