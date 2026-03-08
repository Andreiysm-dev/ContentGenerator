import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wand2,
  Settings2,
  Plus,
  Trash2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Target,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  LayoutGrid,
  ListFilter,
  BarChart3,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Tags,
  Activity,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { format } from "date-fns";

interface DashboardProps {
  activeCompany: any;
  activeCompanyId: string | undefined;
  dashboardStats: any;
  brandIntelligenceReady: boolean;
  calendarRows: any[];
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

// Helper to get raw status as string - outside component so helper components can use it
const getStatusValue = (status: any): string => {
  if (status === null || status === undefined) return '';
  if (typeof status === 'string') return status;
  if (typeof status === 'object') {
    return status.id || status.state || status.value || status.status || String(status);
  }
  return String(status);
};

export function DashboardPage({
  activeCompany,
  activeCompanyId,
  brandIntelligenceReady,
  calendarRows,
  authedFetch,
  backendBaseUrl,
  notify
}: DashboardProps) {
  const navigate = useNavigate();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [editingWidget, setEditingWidget] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load dashboard settings from company
  const [localSettings, setLocalSettings] = useState<any>({
    widgets: [],
    showNextPost: true,
    showPipelineChart: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localSettings.widgets.findIndex((w: any) => w.id === active.id);
      const newIndex = localSettings.widgets.findIndex((w: any) => w.id === over.id);
      setLocalSettings({
        ...localSettings,
        widgets: arrayMove(localSettings.widgets, oldIndex, newIndex)
      });
    }
  };

  const columns = activeCompany?.kanban_settings?.columns || [];

  useEffect(() => {
    if (activeCompany?.dashboard_settings) {
      setLocalSettings({
        widgets: activeCompany.dashboard_settings.widgets || [],
        showNextPost: activeCompany.dashboard_settings.showNextPost ?? true,
        showPipelineChart: activeCompany.dashboard_settings.showPipelineChart ?? true
      });
    } else if (activeCompany && columns.length > 0) {
      // Default setup for new companies
      const drf = columns.filter((c: any) => c.title.toLowerCase().includes('draft') || c.title.toLowerCase().includes('backlog')).map((c: any) => c.id);
      setLocalSettings({
        widgets: [
          { id: 'w-nav', type: 'navigation_grid', label: 'Quick Access' },
          { id: 'def-draft', type: 'stat_card', label: 'Drafts', statusIds: drf, targetPath: `/company/${activeCompanyId}/workboard` }
        ],
        showNextPost: true,
        showPipelineChart: true
      });
    }
  }, [activeCompany?.dashboard_settings, activeCompany, columns, activeCompanyId]);


  const handleSaveSettings = async () => {
    if (!activeCompanyId) return;
    setIsSaving(true);
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboard_settings: localSettings
        })
      });
      if (res.ok) {
        notify('Dashboard updated!', 'success');
        setIsConfiguring(false);
        window.location.reload();
      } else {
        notify('Failed to save settings', 'error');
      }
    } catch (err) {
      notify('Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Widget Calculation Logic
  const renderedWidgets = useMemo(() => {
    const widgets = localSettings.widgets || [];
    return widgets.map((w: any) => {
      // Some widgets should NEVER be filtered by status (like Pipeline Analysis or Navigation)
      const isGlobalOnly = ['pipeline_analysis', 'navigation_grid'].includes(w.type);
      const isStatusFilteredByDefault = ['stat_card', 'attention_list'].includes(w.type);
      const hasSelectedStatuses = w.statusIds && w.statusIds.length > 0;

      const items = (!isGlobalOnly && (isStatusFilteredByDefault || hasSelectedStatuses))
        ? calendarRows.filter(r => {
          const s = getStatusValue(r.status);
          return (w.statusIds || []).includes(s);
        })
        : calendarRows;

      return { ...w, items, count: items.length };
    });
  }, [localSettings.widgets, calendarRows]);

  const nextPost = useMemo(() => {
    const now = new Date().getTime();
    return calendarRows
      .filter(r => r.date && new Date(r.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [calendarRows]);

  // Presets system
  const applyPreset = (preset: 'standard' | 'content_focused' | 'minimal' | 'navigation') => {
    let newWidgets: any[] = [];

    // Find common column IDs (approximation)
    const reviewIds = columns.filter((c: any) => c.title.toLowerCase().includes('review') || c.title.toLowerCase().includes('waiting')).map((c: any) => c.id);
    const designIds = columns.filter((c: any) => c.title.toLowerCase().includes('design') || c.title.toLowerCase().includes('generate')).map((c: any) => c.id);
    const approvalIds = columns.filter((c: any) => c.title.toLowerCase().includes('approval') || c.title.toLowerCase().includes('ready')).map((c: any) => c.id);
    const draftIds = columns.filter((c: any) => c.title.toLowerCase().includes('draft') || c.title.toLowerCase().includes('backlog')).map((c: any) => c.id);

    if (preset === 'standard') {
      newWidgets = [
        { id: 'w-nav', type: 'navigation_grid', label: 'Quick Access' },
        { id: 'w-pipe', type: 'pipeline_analysis', label: 'Workflow Pipeline', targetPath: `/company/${activeCompanyId}/workboard` },
        { id: 'w-ai', type: 'ai_insights', label: 'AI Brand Insights' },
        { id: 'w0', type: 'stat_card', label: 'Drafts', statusIds: draftIds, targetPath: `/company/${activeCompanyId}/workboard` },
        { id: 'w-sched', type: 'upcoming_schedule', label: '7-Day Focus' },
        { id: 'w3', type: 'attention_list', label: 'Needs Approval', statusIds: approvalIds, targetPath: `/company/${activeCompanyId}/workboard` }
      ];
    } else if (preset === 'content_focused') {
      newWidgets = [
        { id: 'w-nav', type: 'navigation_grid', label: 'Tools' },
        { id: 'w-pipe', type: 'pipeline_analysis', label: 'Production Flow' },
        { id: 'w1', type: 'attention_list', label: 'Priority Revisions', statusIds: reviewIds },
        { id: 'w-tag', type: 'tag_velocity', label: 'Topic Velocity' }
      ];
    } else if (preset === 'navigation') {
      newWidgets = [
        { id: 'w-nav', type: 'navigation_grid', label: 'Workspace Navigation' },
        { id: 'w-plat', type: 'platform_stats', label: 'Channel Distribution' }
      ];
    }

    setLocalSettings({
      ...localSettings,
      widgets: newWidgets
    });
    notify('Template applied. Save to finalize!', 'info');
  };

  const hasWidgets = renderedWidgets.length > 0 || localSettings.showNextPost || localSettings.showPipelineChart;

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const total = calendarRows.length;
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    // Dynamic mapping helpers
    const getCount = (keywords: string[]) => calendarRows.filter(r => {
      const s = getStatusValue(r.status).toLowerCase();
      // Also check against column titles if we have columns
      const colTitle = columns.find((c: any) => c.id === r.status)?.title?.toLowerCase() || '';
      return keywords.some(k => s.includes(k.toLowerCase()) || colTitle.includes(k.toLowerCase()));
    }).length;

    const approvedCount = getCount(['approved', 'final ok', 'ready to post', 'published']);
    const reviewCount = getCount(['review', 'waiting', 'attention']);
    const generatingCount = getCount(['generating', 'design', 'lab', 'captioning']);
    const scheduledCount = getCount(['scheduled', 'ready']);

    const countNext7 = calendarRows.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= now && d <= next7Days;
    }).length;

    return {
      total,
      approved: approvedCount,
      review: reviewCount,
      generating: generatingCount,
      scheduled: scheduledCount,
      next7: countNext7,
      approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0
    };
  }, [calendarRows, columns]);

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Top Header Section - Matches Workboard & Content Board Layout */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Intelligence Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dashboard & Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConfiguring(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-[#1E3A5F] hover:bg-slate-50 transition-all active:scale-95"
          >
            <Settings2 size={16} />
            <span>Customize Hub</span>
          </button>

          <button
            onClick={() => activeCompanyId && navigate(`/company/${activeCompanyId}/generate`)}
            className="flex items-center gap-2 px-6 py-2 bg-[#3FA9F5] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#2F99E5] transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Sparkles size={16} />
            <span>Create Content</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <section className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-full">
          {/* Dark Header Banner - Inside the section now */}
          <div className="bg-[#1E3A5F] bg-gradient-to-br from-[#1E3A5F] to-[#0B2641] px-8 py-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-400/10 to-transparent pointer-events-none" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center px-3 py-1 bg-[#3FA9F5]/20 text-[#3FA9F5] rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-[#3FA9F5]/30 mb-4">
                Workspace Overview
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {activeCompany?.companyName || "Organization"} Hub
                </h2>
                <p className="text-slate-400 font-bold text-base max-w-2xl">
                  Monitoring performance and orchestrating your content workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            {renderedWidgets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-20 text-center">
                <div
                  onClick={() => setIsConfiguring(true)}
                  className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-300 mb-8 cursor-pointer hover:border-[#3FA9F5] hover:text-[#3FA9F5] hover:bg-blue-50/30 transition-all group shadow-sm"
                >
                  <Plus size={40} className="group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <h3 className="text-2xl font-black text-[#1E3A5F] uppercase tracking-tight">Your Hub is Empty</h3>
                <p className="text-slate-400 font-bold text-base mt-2 max-w-sm mx-auto leading-relaxed">
                  Design your customized command center by adding modules and mapping them to your workflow.
                </p>
                <button
                  onClick={() => setIsConfiguring(true)}
                  className="mt-10 px-8 py-3.5 bg-[#1E3A5F] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0B2641] transition-all shadow-xl shadow-blue-900/10 active:scale-95"
                >
                  Initialize Hub
                </button>
              </div>
            ) : (
              <div className="p-8 md:p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {renderedWidgets.map((w: any) => (
                    <div
                      key={w.id}
                      className={`group/widget relative transition-all duration-300 ${w.targetPath ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''} ${w.type === 'pipeline_analysis' || w.type === 'navigation_grid' ? 'md:col-span-2 xl:col-span-3' : ''}`}
                      onClick={() => {
                        if (w.targetPath) navigate(w.targetPath);
                      }}
                    >
                      <div className="absolute top-6 right-6 z-10 opacity-0 group-hover/widget:opacity-100 transition-opacity">
                        <div className="relative dropdown-parent">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWidget(w);
                            }}
                            className="p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-400 hover:text-[#3FA9F5] hover:border-[#3FA9F5] transition-all shadow-sm"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                      <WidgetRenderer
                        widget={w}
                        columns={columns}
                        navigate={navigate}
                        activeCompanyId={activeCompanyId}
                        calendarRows={calendarRows}
                        activeCompany={activeCompany}
                        authedFetch={authedFetch}
                        backendBaseUrl={backendBaseUrl}
                      />
                    </div>
                  ))}
                </div>

                {/* Floating Add Button when widgets exist */}
                <div className="flex justify-center pb-10">
                  <button
                    onClick={() => setIsConfiguring(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1E3A5F] hover:border-[#3FA9F5] hover:text-[#3FA9F5] transition-all shadow-sm group"
                  >
                    <Plus size={16} className="group-hover:rotate-90 transition-all" />
                    <span>Add Hub Module</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Per-Widget Configuration Modal */}
      {editingWidget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B2641]/90 backdrop-blur-xl" onClick={() => setEditingWidget(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-black text-[#0B2641] flex items-center gap-3">
                  <div className="p-2 bg-[#3FA9F5]/10 rounded-xl">
                    <Settings2 className="text-[#3FA9F5]" size={20} />
                  </div>
                  Widget Settings
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mt-1">Configure your {editingWidget.type.replace('_', ' ')} module.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const nw = localSettings.widgets.filter((w: any) => w.id !== editingWidget.id);
                    const newSettings = { ...localSettings, widgets: nw };
                    setLocalSettings(newSettings);
                    setEditingWidget(null);

                    // Auto-save on delete to prevent confusion
                    if (activeCompanyId) {
                      try {
                        await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dashboard_settings: newSettings })
                        });
                        notify('Widget removed', 'success');
                      } catch (e) {
                        notify('Could not sync deletion', 'error');
                      }
                    }
                  }}
                  className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button onClick={() => setEditingWidget(null)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Display Label</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0B2641] outline-none focus:ring-4 focus:ring-[#3FA9F5]/10 focus:border-[#3FA9F5] transition-all"
                  value={editingWidget.label}
                  onChange={e => {
                    const nw = localSettings.widgets.map((w: any) =>
                      w.id === editingWidget.id ? { ...w, label: e.target.value } : w
                    );
                    setLocalSettings({ ...localSettings, widgets: nw });
                    setEditingWidget({ ...editingWidget, label: e.target.value });
                  }}
                  placeholder="Card Label"
                />
              </div>

              {/* Status Mapping (Now optional for all but required for some) */}
              {(['stat_card', 'attention_list', 'platform_stats', 'upcoming_schedule', 'tag_velocity', 'ai_insights'].includes(editingWidget.type)) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      Data Scope & Workflow <span className="h-1 w-1 rounded-full bg-slate-300" />
                    </p>
                    <span className="text-[9px] font-black text-indigo-500 uppercase">
                      {(editingWidget.statusIds || []).length === 0 ? 'Full Workspace' : `Filtered (${(editingWidget.statusIds || []).length})`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((c: any) => {
                      const isSel = (editingWidget.statusIds || []).includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            const nwStatus = isSel
                              ? (editingWidget.statusIds || []).filter((s: string) => s !== c.id)
                              : [...(editingWidget.statusIds || []), c.id];

                            const nw = localSettings.widgets.map((w: any) =>
                              w.id === editingWidget.id ? { ...w, statusIds: nwStatus } : w
                            );
                            setLocalSettings({ ...localSettings, widgets: nw });
                            setEditingWidget({ ...editingWidget, statusIds: nwStatus });
                          }}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap min-w-[120px] text-center ${isSel
                            ? 'bg-[#0B2641] border-[#0B2641] text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-[#3FA9F5] hover:text-[#3FA9F5]'
                            }`}
                        >
                          {c.title}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic">
                    {(['stat_card', 'attention_list'].includes(editingWidget.type))
                      ? "Select which stages this card should track. If none selected, card will show 0."
                      : "Optional: Filter data to specific stages. Leave empty to track the entire workspace."}
                  </p>
                </div>
              )}

              {editingWidget.type === 'pipeline_analysis' && (
                <div className="space-y-8">
                  <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl">
                    <div className="flex items-center gap-2 text-[#0B2641]">
                      <BarChart3 size={16} className="text-[#3FA9F5]" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Section 2: Pipeline Stage Definition</h3>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 leading-relaxed">
                      Assign your Kanban columns to specific pipeline stages. This determines how items flow through your analysis bar.
                    </p>
                  </div>

                  <div className="space-y-8">
                    {/* PLANNING */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stage 1</span>
                      </div>
                      <input
                        type="text"
                        value={editingWidget.planningLabel ?? 'Planning'}
                        placeholder="e.g. Planning, Backlog, Ideas"
                        onChange={e => {
                          const nw = localSettings.widgets.map((w: any) => w.id === editingWidget.id ? { ...w, planningLabel: e.target.value } : w);
                          setLocalSettings({ ...localSettings, widgets: nw });
                          setEditingWidget({ ...editingWidget, planningLabel: e.target.value });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0B2641] outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all"
                      />
                      <div className="flex flex-wrap gap-2">
                        {columns.map((c: any) => {
                          const isSel = (editingWidget.planningIds || []).includes(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                const nwIds = isSel ? (editingWidget.planningIds || []).filter((id: string) => id !== c.id) : [...(editingWidget.planningIds || []), c.id];
                                const nw = localSettings.widgets.map((w: any) => w.id === editingWidget.id ? { ...w, planningIds: nwIds } : w);
                                setLocalSettings({ ...localSettings, widgets: nw });
                                setEditingWidget({ ...editingWidget, planningIds: nwIds });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSel ? 'bg-slate-100 border-slate-300 text-slate-600 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300'}`}
                            >
                              {c.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* EXECUTION */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Stage 2</span>
                      </div>
                      <input
                        type="text"
                        value={editingWidget.executionLabel ?? 'Execution'}
                        placeholder="e.g. Execution, In Progress, Review"
                        onChange={e => {
                          const nw = localSettings.widgets.map((w: any) => w.id === editingWidget.id ? { ...w, executionLabel: e.target.value } : w);
                          setLocalSettings({ ...localSettings, widgets: nw });
                          setEditingWidget({ ...editingWidget, executionLabel: e.target.value });
                        }}
                        className="w-full bg-amber-50/40 border border-amber-100 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-800 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-300 transition-all placeholder:text-amber-300"
                      />
                      <div className="flex flex-wrap gap-2">
                        {columns.map((c: any) => {
                          const isSel = (editingWidget.executionIds || []).includes(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                const nwIds = isSel ? (editingWidget.executionIds || []).filter((id: string) => id !== c.id) : [...(editingWidget.executionIds || []), c.id];
                                const nw = localSettings.widgets.map((w: any) => w.id === editingWidget.id ? { ...w, executionIds: nwIds } : w);
                                setLocalSettings({ ...localSettings, widgets: nw });
                                setEditingWidget({ ...editingWidget, executionIds: nwIds });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSel ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:border-amber-200'}`}
                            >
                              {c.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SUCCESS */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#3FA9F5] shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3FA9F5]">Stage 3</span>
                      </div>
                      <input
                        type="text"
                        value={editingWidget.successLabel ?? 'Success'}
                        placeholder="e.g. Success, Published, Done"
                        onChange={e => {
                          const nw = localSettings.widgets.map((w: any) => w.id === editingWidget.id ? { ...w, successLabel: e.target.value } : w);
                          setLocalSettings({ ...localSettings, widgets: nw });
                          setEditingWidget({ ...editingWidget, successLabel: e.target.value });
                        }}
                        className="w-full bg-blue-50/40 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#3FA9F5] transition-all placeholder:text-blue-300"
                      />
                      <div className="flex flex-wrap gap-2">
                        {columns.map((c: any) => {
                          const isSel = (editingWidget.successIds || []).includes(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                const nwIds = isSel ? (editingWidget.successIds || []).filter((id: string) => id !== c.id) : [...(editingWidget.successIds || []), c.id];
                                const nw = localSettings.widgets.map((w: any) => w.id === editingWidget.id ? { ...w, successIds: nwIds } : w);
                                setLocalSettings({ ...localSettings, widgets: nw });
                                setEditingWidget({ ...editingWidget, successIds: nwIds });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSel ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:border-blue-200'}`}
                            >
                              {c.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Type-Specific Specialized Settings */}
              {editingWidget.type === 'upcoming_schedule' && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule Visibility</p>
                  <div className="flex gap-4">
                    {[3, 5, 7, 14, 30].map(days => (
                      <button
                        key={days}
                        onClick={() => {
                          const nw = localSettings.widgets.map((w: any) =>
                            w.id === editingWidget.id ? { ...w, daysCount: days } : w
                          );
                          setLocalSettings({ ...localSettings, widgets: nw });
                          setEditingWidget({ ...editingWidget, daysCount: days });
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingWidget.daysCount === days || (!editingWidget.daysCount && days === 7)
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                          : 'bg-white border-slate-200 text-slate-400'
                          }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editingWidget.type === 'activity_log' && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Entries to Show</p>
                  <div className="flex gap-3">
                    {[5, 10, 20, 50].map(count => (
                      <button
                        key={count}
                        onClick={() => {
                          const nw = localSettings.widgets.map((w: any) =>
                            w.id === editingWidget.id ? { ...w, logsCount: count } : w
                          );
                          setLocalSettings({ ...localSettings, widgets: nw });
                          setEditingWidget({ ...editingWidget, logsCount: count });
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${(editingWidget.logsCount ?? 10) === count
                          ? 'bg-teal-50 border-teal-200 text-teal-600'
                          : 'bg-white border-slate-200 text-slate-400'
                          }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic">Shows the most recent N events from your company's audit log.</p>
                </div>
              )}

              {editingWidget.type === 'platform_stats' && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Channels</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Linkedin', 'Facebook', 'Instagram', 'Twitter'].map(platform => {
                      const isDisabled = (editingWidget.disabledPlatforms || []).includes(platform);
                      return (
                        <button
                          key={platform}
                          onClick={() => {
                            const newList = isDisabled
                              ? (editingWidget.disabledPlatforms || []).filter((p: string) => p !== platform)
                              : [...(editingWidget.disabledPlatforms || []), platform];
                            const nw = localSettings.widgets.map((w: any) =>
                              w.id === editingWidget.id ? { ...w, disabledPlatforms: newList } : w
                            );
                            setLocalSettings({ ...localSettings, widgets: nw });
                            setEditingWidget({ ...editingWidget, disabledPlatforms: newList });
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${!isDisabled
                            ? 'bg-sky-50 border-sky-200 text-sky-600'
                            : 'bg-white border-slate-200 text-slate-300'
                            }`}
                        >
                          {!isDisabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Destination</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Workboard', path: `/company/${activeCompanyId}/workboard`, icon: LayoutGrid },
                    { label: 'Content Studio', path: `/company/${activeCompanyId}/studio`, icon: Wand2 },
                    { label: 'Content Board', path: `/company/${activeCompanyId}/calendar`, icon: Calendar },
                    { label: 'Settings', path: `/company/${activeCompanyId}/settings`, icon: Settings2 },
                    { label: 'Intelligence', path: `/company/${activeCompanyId}/brand`, icon: Target },
                  ].map((page) => (
                    <button
                      key={page.path}
                      onClick={() => {
                        const nw = localSettings.widgets.map((w: any) =>
                          w.id === editingWidget.id ? { ...w, targetPath: page.path } : w
                        );
                        setLocalSettings({ ...localSettings, widgets: nw });
                        setEditingWidget({ ...editingWidget, targetPath: page.path });
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${editingWidget.targetPath === page.path
                        ? 'bg-[#3FA9F5]/10 border-[#3FA9F5] text-[#3FA9F5]'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                      <page.icon size={14} />
                      {page.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const nw = localSettings.widgets.map((w: any) =>
                        w.id === editingWidget.id ? { ...w, targetPath: undefined } : w
                      );
                      setLocalSettings({ ...localSettings, widgets: nw });
                      setEditingWidget({ ...editingWidget, targetPath: undefined });
                    }}
                    className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${!editingWidget.targetPath
                      ? 'bg-slate-100 border-slate-400 text-slate-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    No Redirect
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic">Clicking the widget on your dashboard will take you to this page.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingWidget(null)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              >
                Close
              </button>
              <button
                disabled={isSaving}
                onClick={handleSaveSettings}
                className="px-8 py-3 bg-[#0B2641] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
              >
                {isSaving ? <TrendingUp className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Configuration Modal */}
      {isConfiguring && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B2641]/90 backdrop-blur-xl" onClick={() => setIsConfiguring(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-[#0B2641] flex items-center gap-3">
                  <div className="p-2 bg-[#3FA9F5]/10 rounded-xl">
                    <Sparkles className="text-[#3FA9F5]" size={20} />
                  </div>
                  Hub Workspace Library
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mt-1">Initialize templates or add individual modules.</p>
              </div>
              <button onClick={() => setIsConfiguring(false)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Left Sidebar */}
              <div className="w-80 border-r border-slate-100 p-8 flex flex-col gap-10 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dashboard Templates</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => applyPreset('standard')}
                      className="w-full relative bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-[#3FA9F5] transition-all group overflow-hidden shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#3FA9F5]/10 transition-colors" />
                      <p className="text-[11px] font-black text-[#0B2641] uppercase tracking-wider relative z-10">Standard Hub</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase mt-1 relative z-10">Balanced stats & lists</p>
                      <div className="mt-3 flex gap-1 relative z-10">
                        <div className="w-4 h-1 bg-slate-200 rounded-full" />
                        <div className="w-8 h-1 bg-[#3FA9F5] rounded-full" />
                        <div className="w-4 h-1 bg-slate-200 rounded-full" />
                      </div>
                    </button>

                    <button
                      onClick={() => applyPreset('content_focused')}
                      className="w-full relative bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-[#3FA9F5] transition-all group overflow-hidden shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#3FA9F5]/10 transition-colors" />
                      <p className="text-[11px] font-black text-[#0B2641] uppercase tracking-wider relative z-10">Production Focus</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase mt-1 relative z-10">Heavy on review queues</p>
                      <div className="mt-3 flex gap-1 relative z-10">
                        <div className="w-12 h-1 bg-[#3FA9F5] rounded-full" />
                        <div className="w-4 h-1 bg-slate-200 rounded-full" />
                      </div>
                    </button>

                    <button
                      onClick={() => applyPreset('navigation')}
                      className="w-full relative bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-[#3FA9F5] transition-all group overflow-hidden shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#3FA9F5]/10 transition-colors" />
                      <p className="text-[11px] font-black text-[#0B2641] uppercase tracking-wider relative z-10">Navigation Center</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase mt-1 relative z-10">Quick access to all tools</p>
                      <div className="mt-3 flex gap-2 relative z-10">
                        <LayoutGrid size={12} className="text-[#3FA9F5]" />
                        <Calendar size={12} className="text-slate-200" />
                        <ArrowRight size={12} className="text-slate-200" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Add Modules</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'stat_card', label: 'New Metric', statusIds: [] }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-[#3FA9F5] hover:bg-blue-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#3FA9F5] rounded-lg">
                          <LayoutGrid size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Stat Card</span>
                          <span className="text-[9px] text-slate-400 font-medium">Large numeric metric for mapped stages.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-[#3FA9F5]" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'attention_list', label: 'Action Required', statusIds: [] }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-violet-500 hover:bg-violet-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-50 text-violet-500 rounded-lg">
                          <ListFilter size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Item List</span>
                          <span className="text-[9px] text-slate-400 font-medium">Scrollable queue of items needing attention.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-violet-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'pipeline_analysis', label: 'Pipeline Analysis', statusIds: [] }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                          <BarChart3 size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Pipeline Bar</span>
                          <span className="text-[9px] text-slate-400 font-medium">Visual distribution of content stages.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-amber-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'navigation_grid', label: 'Navigation Center' }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                          <ExternalLink size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Quick Links</span>
                          <span className="text-[9px] text-slate-400 font-medium">Button grid to jump between pages.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-emerald-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'ai_insights', label: 'AI Brand Insights' }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-pink-500 hover:bg-pink-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 text-pink-500 rounded-lg">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">AI Insights</span>
                          <span className="text-[9px] text-slate-400 font-medium">Smart alerts and brand suggestions.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-pink-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'platform_stats', label: 'Platform Stats' }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-500 hover:bg-sky-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-50 text-sky-500 rounded-lg">
                          <Globe size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Social Platforms</span>
                          <span className="text-[9px] text-slate-400 font-medium">Content distribution across channels.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-sky-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'upcoming_schedule', label: 'Schedule Focus' }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">7-Day Schedule</span>
                          <span className="text-[9px] text-slate-400 font-medium">Compact view of upcoming posts.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-indigo-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'tag_velocity', label: 'Topic Velocity' }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                          <Tags size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Content Tags</span>
                          <span className="text-[9px] text-slate-400 font-medium">Fastest growing topics in your workspace.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-amber-500" />
                    </button>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        widgets: [...localSettings.widgets, { id: Date.now().toString(), type: 'activity_log', label: 'Activity Logs', logsCount: 10 }]
                      })}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 text-teal-500 rounded-lg">
                          <Activity size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#0B2641] uppercase tracking-widest block">Activity Log</span>
                          <span className="text-[9px] text-slate-400 font-medium">Recent company audit activity.</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-teal-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Area: List of added widgets for global overview */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/20">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Hub Composition</h3>
                    <div className="text-[10px] font-black text-slate-400 uppercase">{localSettings.widgets.length} Modules Active</div>
                  </div>

                  {localSettings.widgets.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <LayoutDashboard size={40} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No modules added to your hub yet</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={localSettings.widgets.map((w: any) => w.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {localSettings.widgets.map((w: any, idx: number) => (
                            <SortableWidgetRow
                              key={w.id}
                              widget={w}
                              index={idx}
                              setEditingWidget={setEditingWidget}
                              onDelete={async () => {
                                const nw = localSettings.widgets.filter((_: any, i: number) => i !== idx);
                                const newSettings = { ...localSettings, widgets: nw };
                                setLocalSettings(newSettings);

                                // Silent background save for better UX in library
                                if (activeCompanyId) {
                                  authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ dashboard_settings: newSettings })
                                  });
                                }
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex h-2 w-2 rounded-full bg-[#3FA9F5] animate-pulse" />
                Live Sync Active
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsConfiguring(false)}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Close Library
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleSaveSettings}
                  className="px-8 py-3 bg-[#0B2641] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3"
                >
                  {isSaving ? <TrendingUp className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Save Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function SortableWidgetRow({ widget, onDelete, setEditingWidget }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between group shadow-sm ${isDragging ? 'shadow-2xl border-[#3FA9F5] cursor-grabbing' : 'hover:border-[#3FA9F5]/30'}`}
    >
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="p-1 text-slate-300 hover:text-[#3FA9F5] cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
        <div className={`p-2 rounded-lg transition-colors ${widget.type === 'stat_card' ? 'bg-blue-50 text-[#3FA9F5]' :
          widget.type === 'attention_list' ? 'bg-violet-50 text-violet-500' :
            widget.type === 'ai_insights' ? 'bg-pink-50 text-pink-500' :
              widget.type === 'platform_stats' ? 'bg-sky-50 text-sky-500' :
                widget.type === 'upcoming_schedule' ? 'bg-indigo-50 text-indigo-500' :
                  widget.type === 'tag_velocity' ? 'bg-amber-50 text-amber-500' :
                    widget.type === 'activity_log' ? 'bg-teal-50 text-teal-500' :
                      'bg-slate-50 text-slate-400'
          }`}>
          {widget.type === 'stat_card' ? <LayoutGrid size={16} /> :
            widget.type === 'attention_list' ? <ListFilter size={16} /> :
              widget.type === 'ai_insights' ? <Sparkles size={16} /> :
                widget.type === 'platform_stats' ? <Globe size={16} /> :
                  widget.type === 'upcoming_schedule' ? <Calendar size={16} /> :
                    widget.type === 'tag_velocity' ? <Tags size={16} /> :
                      widget.type === 'activity_log' ? <Activity size={16} /> :
                        <BarChart3 size={16} />}
        </div>
        <div>
          <p className="text-[11px] font-black text-[#0B2641] uppercase tracking-tight">{widget.label}</p>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{widget.type.replace('_', ' ')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setEditingWidget(widget)}
          className="p-2 text-slate-300 hover:text-[#3FA9F5] hover:bg-blue-50 rounded-lg transition-all"
        >
          <Settings2 size={16} />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function WidgetRenderer({ widget, columns, navigate, activeCompanyId, calendarRows, activeCompany, authedFetch, backendBaseUrl }: any) {
  if (widget.type === 'activity_log') {
    return (
      <ActivityLogWidget
        widget={widget}
        activeCompanyId={activeCompanyId}
        authedFetch={authedFetch}
        backendBaseUrl={backendBaseUrl}
      />
    );
  }

  if (widget.type === 'navigation_grid') {
    const navs = [
      { label: 'Workboard', icon: LayoutGrid, path: `/company/${activeCompanyId}/workboard`, color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Content Studio', icon: Wand2, path: `/company/${activeCompanyId}/studio`, color: 'text-purple-500', bg: 'bg-purple-50' },
      { label: 'Content Board', icon: Calendar, path: `/company/${activeCompanyId}/calendar`, color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'Image Hub', icon: ImageIcon, path: `/company/${activeCompanyId}/images`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Intelligence', icon: Target, path: `/company/${activeCompanyId}/brand`, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{widget.label || 'Quick Navigation'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {navs.map((n: any) => (
            <button
              key={n.label}
              onClick={() => navigate(n.path)}
              className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-slate-100 hover:border-[#3FA9F5] hover:bg-blue-50/30 transition-all"
            >
              <div className={`w-12 h-12 ${n.bg} ${n.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <n.icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1E3A5F]">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (widget.type === 'pipeline_analysis') {
    const hasPreciseMapping = (widget.planningIds || []).length > 0 ||
      (widget.executionIds || []).length > 0 ||
      (widget.successIds || []).length > 0;

    const categorize = (status: any) => {
      const sRaw = getStatusValue(status);
      const sLow = sRaw.toLowerCase();

      // Find the Kanban column that corresponds to this status
      // We check ID and Title, both case-insensitively, and handle common variations like Draft vs Drafts
      const matchedCol = columns.find((c: any) => {
        const cId = String(c.id).toLowerCase();
        const cTitle = String(c.title || '').toLowerCase();
        return cId === sLow ||
          cTitle === sLow ||
          (sLow === 'draft' && (cId === 'drafts' || cTitle === 'drafts')) ||
          (sLow === 'drafts' && (cId === 'draft' || cTitle === 'draft'));
      });

      const effectiveId = matchedCol?.id || sRaw;

      if (hasPreciseMapping) {
        if ((widget.successIds || []).includes(effectiveId)) return 'done';
        if ((widget.executionIds || []).includes(effectiveId)) return 'active';
        if ((widget.planningIds || []).includes(effectiveId)) return 'planning';
        return null; // Don't count if not matched in any stage
      }

      // Robust heuristic fallback (using normalized ID or title)
      const colTitle = matchedCol?.title?.toLowerCase() || sLow;

      if (['approved', 'published', 'posted', 'ready', 'final', 'scheduled'].some(k => colTitle.includes(k))) return 'done';
      if (['review', 'attention', 'waiting', 'process', 'studio', 'lab', 'design', 'generating', 'caption'].some(k => colTitle.includes(k))) return 'active';
      return 'planning';
    };

    const doneCount = (widget.items || []).filter((i: any) => categorize(i.status) === 'done').length;
    const activeCount = (widget.items || []).filter((i: any) => categorize(i.status) === 'active').length;
    const planCount = (widget.items || []).filter((i: any) => categorize(i.status) === 'planning').length;
    const total = (widget.items || []).length;

    const healthScore = total > 0 ? Math.round(((doneCount * 1 + activeCount * 0.5) / total) * 100) : 0;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full relative overflow-hidden group/pipe">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{widget.label || 'Pipeline Analysis'}</h3>
            <p className="text-[9px] text-slate-400 font-medium italic">
              {hasPreciseMapping ? 'Manual Stage Configuration' : 'Smart Auto-categorization'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-xl font-black ${healthScore > 70 ? 'text-[#3FA9F5]' : healthScore > 30 ? 'text-amber-500' : 'text-slate-400'}`}>
              {healthScore}%
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Hub Health</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Visual Bar */}
          <div className="relative">
            <div className="h-6 w-full bg-slate-50 rounded-xl overflow-hidden flex shadow-inner border border-slate-100 p-1">
              <div
                className="h-full bg-slate-200 rounded-l-lg transition-all duration-700"
                style={{ width: `${total > 0 ? (planCount / total) * 100 : 33}%` }}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-700 mx-0.5"
                style={{ width: `${total > 0 ? (activeCount / total) * 100 : 33}%` }}
              />
              <div
                className="h-full bg-[#3FA9F5] rounded-r-lg transition-all duration-700"
                style={{ width: `${total > 0 ? (doneCount / total) * 100 : 34}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 px-2 border-l-2 border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{widget.planningLabel || 'Planning'}</p>
              <p className="text-sm font-black text-[#1E3A5F]">{planCount}</p>
              <p className="text-[8px] text-slate-300 font-medium leading-none">Drafts & Ideas</p>
            </div>
            <div className="space-y-2 px-2 border-l-2 border-amber-400">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{widget.executionLabel || 'Execution'}</p>
              <p className="text-sm font-black text-[#1E3A5F]">{activeCount}</p>
              <p className="text-[8px] text-slate-300 font-medium leading-none">In Production</p>
            </div>
            <div className="space-y-2 px-2 border-l-2 border-[#3FA9F5]">
              <p className="text-[9px] font-black text-[#3FA9F5] uppercase tracking-widest">{widget.successLabel || 'Success'}</p>
              <p className="text-sm font-black text-[#1E3A5F]">{doneCount}</p>
              <p className="text-[8px] text-slate-300 font-medium leading-none">Finalized Items</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex items-center gap-2 opacity-50 group-hover/pipe:opacity-100 transition-opacity">
            <AlertCircle size={10} className="text-slate-400" />
            <p className="text-[8px] text-slate-400 font-medium">Pipeline logic intelligently groups content as it moves through your board towards completion.</p>
          </div>
        </div>
      </div>
    );
  }

  if (widget.type === 'stat_card') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm hover:shadow-md transition-all group h-full">
        <div className="flex justify-between items-start mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{widget.label || 'Metric'}</p>
          <div className="p-2 bg-blue-50 text-[#3FA9F5] rounded-lg">
            <TrendingUp size={14} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-black text-[#1E3A5F] group-hover:text-[#3FA9F5] transition-colors">{widget.count || 0}</div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Selected Statuses</p>
        </div>
      </div>
    );
  }

  if (widget.type === 'attention_list') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{widget.label || 'Action Required'}</h3>
        <div className="space-y-3">
          {widget.items && widget.items.length > 0 ? widget.items.slice(0, 4).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-[#3FA9F5] transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                {(() => {
                  const s = item.status?.id || item.status?.state || item.status;
                  const col = columns.find((c: any) => c.id === s || c.title === s);
                  return (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col?.color || '#fbbf24' }} />
                  );
                })()}
                <span className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-tight line-clamp-1">
                  {item.title || item.theme || item.cardName || item.contentType || 'Untitled Content'}
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-[#3FA9F5]" />
            </div>
          )) : (
            <div className="py-10 text-center text-slate-300 italic text-[10px] uppercase font-black">All Caught Up</div>
          )}
        </div>
      </div>
    );
  }

  if (widget.type === 'ai_insights') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full relative overflow-hidden group/ai">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-pink-500" />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{widget.label || 'AI Brand Insights'}</h3>
            <p className="text-[9px] text-slate-400 font-medium italic">Powered by Brand Intelligence</p>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-4 bg-pink-50/50 border border-pink-100/50 rounded-2xl flex gap-3 group-hover/ai:bg-pink-50 transition-colors">
              <Target size={16} className="text-pink-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-pink-600 tracking-wider">Voice Alignment</p>
                <p className="text-[11px] text-pink-800/80 font-medium leading-relaxed mt-1">
                  {(() => {
                    const withCaptions = widget.items?.filter((i: any) => i.caption || i.final_caption).length || 0;
                    const total = widget.count || 1;
                    const rate = Math.round((withCaptions / total) * 100);
                    return `Consistency is lookin' good! ${rate}% of your recent posts have AI-generated captions aligned with your persona.`;
                  })()}
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex gap-3 group-hover/ai:bg-blue-50 transition-colors">
              <TrendingUp size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Topic Suggestion</p>
                <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed mt-1">
                  {(() => {
                    const allTags = widget.items?.flatMap((r: any) => r.tags || []) || [];
                    const tagCounts: Record<string, number> = {};
                    allTags.forEach((t: any) => {
                      const tagId = typeof t === 'object' ? t.id : t;
                      const tagData = activeCompany?.company_settings?.tags?.find((sysTag: any) => sysTag.id === tagId);
                      const label = tagData?.name || tagId;
                      tagCounts[label] = (tagCounts[label] || 0) + 1;
                    });
                    const topTag = Object.entries(tagCounts).sort(([, a], [, b]) => b - a)[0];
                    return topTag
                      ? `Your audience is engaging more with "${topTag[0]}" recently. Consider generating more content in this category.`
                      : "Start adding tags to your content to see personalized topic suggestions!";
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50">
            <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-pink-500 transition-colors">
              Detailed Intelligence Hub <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (widget.type === 'platform_stats') {
    const getPlatformIcon = (provider: string) => {
      const p = provider?.toLowerCase();
      if (p === 'linkedin') return <Linkedin className="w-5 h-5" />;
      if (p === 'facebook') return <Facebook className="w-5 h-5" />;
      if (p === 'instagram') return <Instagram className="w-5 h-5" />;
      if (p === 'twitter' || p === 'x') return <Twitter className="w-5 h-5" />;
      return <Globe className="w-5 h-5" />;
    };

    const providers = ['Linkedin', 'Facebook', 'Instagram', 'Twitter'].filter(p => !(widget.disabledPlatforms || []).includes(p));
    const distribution = providers.map(p => {
      const count = widget.items?.filter((i: any) => i.account_provider?.toLowerCase() === p).length || 0;
      return { provider: p.charAt(0).toUpperCase() + p.slice(1), count };
    });
    const total = widget.items?.length || 1;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{widget.label || 'Social Channels'}</h3>
        <div className="space-y-6">
          {distribution.map(d => {
            const perc = Math.round((d.count / total) * 100);
            return (
              <div key={d.provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 group-hover:text-sky-500 transition-colors">
                      {getPlatformIcon(d.provider)}
                    </div>
                    <span className="text-[10px] font-black text-[#1E3A5F] uppercase tracking-widest">{d.provider}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{d.count} items</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-1000"
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (widget.type === 'upcoming_schedule') {
    const now = new Date();
    const daysLimit = widget.daysCount || 7;
    const futureLimit = new Date();
    futureLimit.setDate(now.getDate() + daysLimit);

    const next7Days = widget.items
      ?.filter((r: any) => r.date && new Date(r.date) >= now && new Date(r.date) <= futureLimit)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10) || [];

    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full flex flex-col">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{widget.label || `Next ${daysLimit} Days`}</h3>
        <div className="space-y-4 flex-1">
          {next7Days.length > 0 ? next7Days.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-indigo-400 transition-all">
              <div className="flex flex-col items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-lg shrink-0 shadow-sm text-center">
                <span className="text-[8px] font-black uppercase text-indigo-500 leading-none">{format(new Date(item.date), 'MMM')}</span>
                <span className="text-xs font-black text-[#1E3A5F]">{format(new Date(item.date), 'dd')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-tight truncate">
                  {item.title || item.theme || 'Untitled Post'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {format(new Date(item.date), 'HH:mm')} • {item.account_provider || 'Global'}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center opacity-30">
              <Calendar size={32} className="mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Clear Calendar</p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-50">
          <button className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100">
            Open Content Board
          </button>
        </div>
      </div>
    );
  }

  if (widget.type === 'tag_velocity') {
    // Extract tags from widget.items instead of global calendarRows
    const allTags = widget.items?.flatMap((r: any) => r.tags || []) || [];
    const tagCounts: Record<string, number> = {};
    allTags.forEach((t: any) => {
      const tagId = typeof t === 'object' ? t.id : t;
      const tagData = activeCompany?.company_settings?.tags?.find((sysTag: any) => sysTag.id === tagId);
      const label = tagData?.name || tagId;
      tagCounts[label] = (tagCounts[label] || 0) + 1;
    });

    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm h-full">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{widget.label || 'Trending Topics'}</h3>
        <div className="space-y-5">
          {sortedTags.length > 0 ? sortedTags.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between group/tag">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center group-hover/tag:bg-amber-100 transition-colors">
                  <Tags size={14} />
                </div>
                <span className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-tight">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400">{count} items</span>
                <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase">Trending</div>
              </div>
            </div>
          )) : (
            <div className="py-10 text-center text-slate-300 italic text-[10px] uppercase font-black">No Tags Found</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl text-center text-[10px] font-black uppercase text-slate-300">
      Unknown Module Type
    </div>
  );
}

// ─── Activity Log Widget (top-level) ───────────────────────────────────────────
function ActivityLogWidget({ widget, activeCompanyId, authedFetch, backendBaseUrl }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const logsCount = widget.logsCount ?? 10;

  useEffect(() => {
    if (!activeCompanyId || !authedFetch || !backendBaseUrl) return;
    setLoading(true);
    authedFetch(`${backendBaseUrl}/api/audit/${activeCompanyId}?pageSize=${logsCount}`)
      .then((r: Response) => r.json())
      .then((data: any) => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [activeCompanyId, authedFetch, backendBaseUrl, logsCount]);

  const getActionStyle = (action: string) => {
    const a = (action || '').toUpperCase();
    if (a.includes('DELETE') || a.includes('REMOVE')) return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-400' };
    if (a.includes('CREATE') || a.includes('ADD') || a.includes('INVITE')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' };
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('ASSIGN')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-400' };
    if (a.includes('PUBLISH') || a.includes('APPROVE')) return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-400' };
    if (a.includes('LOGIN') || a.includes('IMPERSONATE')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' };
    return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', dot: 'bg-slate-400' };
  };

  const formatRelative = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
            <Activity size={16} className="text-teal-500" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{widget.label || 'Activity Log'}</h3>
            <p className="text-[9px] text-slate-400 font-medium">Showing last {logsCount} events</p>
          </div>
        </div>
        {loading && <Loader2 size={14} className="text-teal-400 animate-spin" />}
      </div>

      {/* Log List */}
      <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
        {loading && logs.length === 0 ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="text-slate-200 animate-spin mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Activity…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <ShieldCheck size={32} className="text-slate-200 mb-3" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Activity Recorded</p>
            <p className="text-[9px] text-slate-300 mt-1">Team actions will appear here.</p>
          </div>
        ) : (
          logs.map((log: any, i: number) => {
            const style = getActionStyle(log.action);
            return (
              <div key={log.id || i} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors group">
                {/* Timeline dot */}
                <div className="flex flex-col items-center mt-1 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  {i < logs.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1.5" style={{ minHeight: '16px' }} />}
                </div>

                {/* Actor avatar */}
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <User size={12} className="text-slate-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-slate-700 truncate max-w-[140px]">
                      {log.actorEmail || 'Unknown'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
                      {(log.action || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {log.action === 'ROLE_ASSIGN' && `Assigned role "${log.details?.role}" to teammate`}
                    {log.action === 'ROLES_UPDATE' && 'Updated custom role definitions'}
                    {log.action === 'CREATE_CONTENT' && `Created content: ${log.details?.title || 'Untitled'}`}
                    {log.action === 'UPDATE_CONTENT' && `Updated content: ${log.details?.title || 'Untitled'}`}
                    {log.action === 'DELETE_CONTENT' && `Deleted a content entry`}
                    {!['ROLE_ASSIGN', 'ROLES_UPDATE', 'CREATE_CONTENT', 'UPDATE_CONTENT', 'DELETE_CONTENT'].includes(log.action) &&
                      (log.details?.description || `Performed: ${log.action?.replace(/_/g, ' ').toLowerCase() || 'action'}`)}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-[9px] font-black text-slate-300 shrink-0 mt-1">
                  {formatRelative(log.created_at)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


function StatCard({ label, value, subLabel, trend, trendColor, trendBg }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${trendBg} ${trendColor}`}>
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-4xl font-black text-[#1E3A5F] group-hover:text-[#3FA9F5] transition-colors">{value}</div>
        <p className="text-[11px] font-medium text-slate-400">{subLabel}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label, percentage }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label} ({percentage}%)</span>
    </div>
  );
}

function MinimalStat({ label, value }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="text-2xl font-black text-[#1E3A5F]">{value}</div>
    </div>
  );
}


