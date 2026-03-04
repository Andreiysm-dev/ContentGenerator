import React, { useState, useEffect } from 'react';
import { Layout, Plus, Trash2, ArrowRight, Save, Wand2, ImageIcon, CheckCircle2, RotateCcw, GripVertical, ShieldCheck } from 'lucide-react';
import { Card, SectionTitle, Input, Select } from '../SettingsPage';

export const WorkflowSettingsTab = ({ companyId, backendBaseUrl, authedFetch, notify, customRoles, userPermissions }: any) => {
    const [columns, setColumns] = useState([
        { id: 'Drafts', title: 'Drafts', color: '#94a3b8' },
        { id: 'To Do', title: 'To Do', color: '#6366f1' },
        { id: 'Caption Generated', title: 'Caption Generated', color: '#3fa9f5' },
        { id: 'Design Generated', title: 'Design Generated', color: '#8b5cf6' },
        { id: 'Revision', title: 'Revision', color: '#f59e0b' },
        { id: 'For Approval', title: 'For Approval', color: '#ec4899' },
        { id: 'Approved', title: 'Approved', color: '#10b981' },
        { id: 'Scheduled', title: 'Scheduled', color: '#0ea5e9' },
        { id: 'Published', title: 'Published', color: '#1e293b' },
    ]);

    const [automations, setAutomations] = useState<any[]>([]);
    const [studioSettings, setStudioSettings] = useState<any>({
        studioTabs: [
            { id: 'drafts', label: 'Post Drafts', icon: 'Edit', statuses: ['Draft', 'Drafts', 'To Do', 'Caption Generated', 'Design Generated', 'Revision', 'For Approval'] },
            { id: 'scheduled', label: 'Scheduled', icon: 'Clock', statuses: ['Approved', 'Scheduled'] },
            { id: 'published', label: 'Published', icon: 'CheckCircle2', statuses: ['Published'] }
        ],
        schedulingStatus: 'Scheduled',
        postedStatus: 'Published',
        unscheduledStatus: 'Drafts'
    });
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);


    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!companyId) return;
            setIsLoading(true);
            try {
                const res = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.company?.kanban_settings) {
                        const { columns: savedCols, automations: savedAutos, studio_settings: savedStudio } = data.company.kanban_settings;
                        if (savedCols && savedCols.length > 0) setColumns(savedCols);
                        if (savedAutos) setAutomations(savedAutos);
                        if (savedStudio) setStudioSettings(savedStudio);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch kanban settings', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [companyId]);

    const addColumn = () => {
        const newId = `custom-${Date.now()}`;
        setColumns([...columns, { id: newId, title: 'New Category', color: '#cbd5e1' }]);
    };

    const removeColumn = (id: string) => {
        if (columns.length <= 1) return;
        setColumns(columns.filter(c => c.id !== id));
    };

    const updateColumn = (id: string, updates: any) => {
        setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const addEventAutomation = () => {
        setAutomations([...automations as any[], { id: Date.now().toString(), type: 'event', event: 'caption_generated', targetStatus: columns[0].id }]);
    };

    const addMoveToAutomation = () => {
        setAutomations([...automations as any[], { id: Date.now().toString(), type: 'move_to', targetColumn: columns[0].id, action: 'generate_caption' }]);
    };

    const addAccessRule = () => {
        setAutomations([...automations as any[], {
            id: Date.now().toString(),
            type: 'access_rule',
            columnId: columns[0].id,
            roleName: customRoles?.[0]?.name || ''
        }]);
    };

    const removeAutomation = (id: string) => {
        setAutomations((automations as any[]).filter((a: any) => a.id !== id));
    };

    const updateAutomation = (id: string, updates: any) => {
        setAutomations((automations as any[]).map((a: any) => a.id === id ? { ...a, ...updates } : a));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kanban_settings: { columns, automations, studio_settings: studioSettings } })
            });

            if (res.ok) {
                notify('Workflow settings saved successfully!', 'success');
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            notify('Failed to save workflow settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <RotateCcw className="w-8 h-8 animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest">Loading Workflow Settings...</p>
            </div>
        );
    }

    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${!userPermissions?.canEditSettings ? 'opacity-70 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Workflow & Statuses</h3>
                    {!userPermissions?.canEditSettings && <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">View Only Mode</div>}
                    <p className="text-sm text-slate-500 font-medium">Define the lifecycle of your content and how it moves between stages.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !userPermissions?.canEditSettings}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                    {isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Workflow
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column Management */}
                <div className="space-y-4">
                    <SectionTitle>Content Statuses</SectionTitle>
                    <Card className="bg-white border-slate-200 shadow-sm overflow-visible">
                        <div className="space-y-3">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 px-1">Configure columns for the board and universal lifecycle states.</p>
                            {columns.map((col, index) => (
                                <div key={col.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                                    <div className="cursor-grab text-slate-300 group-hover:text-slate-400 transition-colors">
                                        <GripVertical size={18} />
                                    </div>
                                    <div
                                        className="w-4 h-4 rounded-full border shadow-sm shrink-0"
                                        style={{ backgroundColor: col.color }}
                                    />
                                    <div className="flex-1">
                                        <input
                                            value={col.title}
                                            onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                                            placeholder="Column Title"
                                            className="w-full bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 p-0"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeColumn(col.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addColumn}
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Plus size={14} /> Add Column
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Studio Layout & System Mapping */}
                <div className="space-y-4">
                    <SectionTitle>Studio Tabs (Dashboard)</SectionTitle>
                    <Card className="bg-white border-slate-200 shadow-sm overflow-visible">
                        <div className="space-y-4">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 px-1">Configure which statuses are grouped into each Studio tab.</p>

                            {studioSettings.studioTabs.map((tab: any, tIdx: number) => (
                                <div key={tab.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={tab.label}
                                                onChange={(e) => {
                                                    const newTabs = [...studioSettings.studioTabs];
                                                    newTabs[tIdx].label = e.target.value;
                                                    setStudioSettings({ ...studioSettings, studioTabs: newTabs });
                                                }}
                                                className="h-8 font-black uppercase text-[10px] w-40"
                                            />
                                            <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 font-bold uppercase">
                                                ID: {tab.id}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newTabs = studioSettings.studioTabs.filter((_: any, i: number) => i !== tIdx);
                                                setStudioSettings({ ...studioSettings, studioTabs: newTabs });
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {columns.map(col => {
                                            const isSelected = tab.statuses.includes(col.id);
                                            return (
                                                <button
                                                    key={col.id}
                                                    onClick={() => {
                                                        const newTabs = [...studioSettings.studioTabs];
                                                        if (isSelected) {
                                                            newTabs[tIdx].statuses = tab.statuses.filter((s: string) => s !== col.id);
                                                        } else {
                                                            newTabs[tIdx].statuses = [...tab.statuses, col.id];
                                                        }
                                                        setStudioSettings({ ...studioSettings, studioTabs: newTabs });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isSelected
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {col.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => {
                                    setStudioSettings({
                                        ...studioSettings,
                                        studioTabs: [
                                            ...studioSettings.studioTabs,
                                            { id: `tab-${Date.now()}`, label: 'New Tab', icon: 'Edit', statuses: [] }
                                        ]
                                    });
                                }}
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Plus size={14} /> Add Studio Tab
                            </button>
                        </div>
                    </Card>

                    <SectionTitle>System Status Mappings</SectionTitle>
                    <Card className="bg-white border-slate-200 shadow-sm overflow-visible">
                        <div className="space-y-6">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">Define how statuses change automatically based on system events.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Target status when scheduled (date set)</label>
                                    <Select
                                        value={studioSettings.schedulingStatus || ''}
                                        onChange={(e: any) => setStudioSettings({ ...studioSettings, schedulingStatus: e.target.value })}
                                        className="h-10"
                                    >
                                        <option value="">Manual Only (No change)</option>
                                        {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Target status when posted to social media</label>
                                    <Select
                                        value={studioSettings.postedStatus || ''}
                                        onChange={(e: any) => setStudioSettings({ ...studioSettings, postedStatus: e.target.value })}
                                        className="h-10"
                                    >
                                        <option value="">Manual Only (No change)</option>
                                        {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Target status when Unscheduled (Undo Schedule)</label>
                                    <Select
                                        value={studioSettings.unscheduledStatus || ''}
                                        onChange={(e: any) => setStudioSettings({ ...studioSettings, unscheduledStatus: e.target.value })}
                                        className="h-10"
                                    >
                                        <option value="">Manual Only (No change)</option>
                                        {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Triggers */}
                <div className="space-y-4">
                    <SectionTitle>Triggers</SectionTitle>
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <div className="space-y-4">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">Configure automated actions and approval workflows.</p>

                            {(automations as any[]).map((rule: any) => {
                                if (rule.type === 'move_to') {
                                    // Move-to trigger: drag card to column → trigger action
                                    return (
                                        <div key={rule.id} className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col gap-3 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                                                    <Wand2 size={12} />
                                                    Move Card Trigger
                                                </div>
                                                <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                                <span className="shrink-0">When moved to</span>
                                                <Select
                                                    value={rule.targetColumn}
                                                    onChange={(e: any) => updateAutomation(rule.id, { targetColumn: e.target.value })}
                                                    className="flex-1 h-9"
                                                >
                                                    {columns.map((c: any) => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </Select>
                                                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                                                <Select
                                                    value={rule.action}
                                                    onChange={(e: any) => updateAutomation(rule.id, { action: e.target.value })}
                                                    className="flex-1 h-9"
                                                >
                                                    <option value="generate_caption">Generate Caption</option>
                                                    <option value="generate_image">Generate Image</option>
                                                </Select>
                                            </div>
                                        </div>
                                    );
                                }
                                if (rule.type === 'access_rule') {
                                    return (
                                        <div key={rule.id} className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 flex flex-col gap-3 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-wider">
                                                    <ShieldCheck size={12} />
                                                    Approval / Locking Rule
                                                </div>
                                                <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                                <span className="shrink-0">Lock Column</span>
                                                <Select
                                                    value={rule.columnId}
                                                    onChange={(e: any) => updateAutomation(rule.id, { columnId: e.target.value })}
                                                    className="flex-1 h-9"
                                                >
                                                    {columns.map((c: any) => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </Select>
                                                <span className="shrink-0">to Role</span>
                                                <Select
                                                    value={rule.roleName}
                                                    onChange={(e: any) => updateAutomation(rule.id, { roleName: e.target.value })}
                                                    className="flex-1 h-9"
                                                >
                                                    <option value="">Select Role</option>
                                                    {customRoles?.map((r: any) => (
                                                        <option key={r.name} value={r.name}>{r.name}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <p className="text-[10px] text-amber-700/70 font-medium italic">
                                                * Only users with this role and the Owner can move or edit cards in this column.
                                            </p>
                                        </div>
                                    );
                                }
                                // Default: event → status rule
                                return (
                                    <div key={rule.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-3 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                <Wand2 size={12} className="text-blue-500" />
                                                Event Trigger
                                            </div>
                                            <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={rule.event}
                                                onChange={(e: any) => updateAutomation(rule.id, { event: e.target.value })}
                                                className="flex-1 h-10"
                                            >
                                                <option value="caption_generated">AI Caption Generated</option>
                                                <option value="image_generated">AI Image Generated</option>
                                                <option value="comment_added">New Comment Added</option>
                                                <option value="revision_requested">Revision Requested</option>
                                                <option value="content_approved">Content Approved</option>
                                            </Select>
                                            <ArrowRight size={16} className="text-slate-300 shrink-0" />
                                            <Select
                                                value={rule.targetStatus}
                                                onChange={(e: any) => updateAutomation(rule.id, { targetStatus: e.target.value })}
                                                className="flex-1 h-10"
                                            >
                                                {columns.map((c: any) => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="relative">
                                <button
                                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                                    className="w-full py-3.5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
                                >
                                    <Plus size={18} className={`transition-transform duration-300 ${isAddMenuOpen ? 'rotate-45' : ''}`} />
                                    Add Workflow Trigger
                                </button>

                                {isAddMenuOpen && (
                                    <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 grid grid-cols-1 gap-1">
                                        <button
                                            onClick={() => { addMoveToAutomation(); setIsAddMenuOpen(false); }}
                                            className="flex items-center gap-3 w-full p-3 hover:bg-indigo-50 rounded-xl transition-colors group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                                <RotateCcw size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Move Trigger</div>
                                                <div className="text-[10px] text-slate-500 font-medium leading-tight">When a card enters a specific column</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => { addEventAutomation(); setIsAddMenuOpen(false); }}
                                            className="flex items-center gap-3 w-full p-3 hover:bg-blue-50 rounded-xl transition-colors group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                <Wand2 size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Event Trigger</div>
                                                <div className="text-[10px] text-slate-500 font-medium leading-tight">By AI generation or user comments</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => { addAccessRule(); setIsAddMenuOpen(false); }}
                                            className="flex items-center gap-3 w-full p-3 hover:bg-amber-50 rounded-xl transition-colors group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                                <ShieldCheck size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Approval Rule</div>
                                                <div className="text-[10px] text-slate-500 font-medium leading-tight">Lock a column to a specific member role</div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Guide Card */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 shrink-0">
                            <RotateCcw size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1">Smart Workflow Automation</h4>
                            <p className="text-[11px] text-blue-700/80 font-medium leading-relaxed">
                                Automating card movement reduces manual status updates. For example, moving a card to "Approved" can automatically trigger its scheduled post to the social channels.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
