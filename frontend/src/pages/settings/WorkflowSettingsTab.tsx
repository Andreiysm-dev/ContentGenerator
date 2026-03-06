import React, { useState, useEffect } from 'react';
import { Layout, Plus, Trash2, ArrowRight, Save, Wand2, ImageIcon, CheckCircle2, RotateCcw, GripVertical, ShieldCheck, Pencil, Calendar, Loader2 } from 'lucide-react';
import { Card, SectionTitle, Input, Select } from '../SettingsPage';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableColumnItem = ({ col, isEditing, updateColumn, removeColumn, setEditingColorId, editingColorId, PRESET_COLORS }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: col.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:border-blue-200"
        >
            {isEditing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-slate-300 group-hover:text-slate-400 transition-colors p-1"
                >
                    <GripVertical size={18} />
                </div>
            )}
            <div className="relative">
                <button
                    onClick={() => isEditing && setEditingColorId(editingColorId === col.id ? null : col.id)}
                    disabled={!isEditing}
                    className={`w-4 h-4 rounded-full border shadow-sm shrink-0 transition-transform ${isEditing ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                    style={{ backgroundColor: col.color }}
                />
                {isEditing && editingColorId === col.id && (
                    <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-white border border-slate-200 shadow-xl rounded-xl flex gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                        {PRESET_COLORS.map((c: string) => (
                            <button
                                key={c}
                                onClick={() => {
                                    updateColumn(col.id, { color: c });
                                    setEditingColorId(null);
                                }}
                                className={`w-4 h-4 rounded-full border ${col.color === c ? 'border-slate-900 border-2' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-1">
                <input
                    value={col.title}
                    disabled={!isEditing}
                    onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                    placeholder="Column Title"
                    className={`w-full bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 p-0 ${!isEditing ? 'cursor-default' : ''}`}
                />
            </div>
            {isEditing && (
                <button
                    onClick={() => removeColumn(col.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

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
    const [isEditing, setIsEditing] = useState(false);

    const [isAddingStatus, setIsAddingStatus] = useState(false);
    const [newStatusTitle, setNewStatusTitle] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#6366f1');

    const PRESET_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#1e293b'];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setColumns((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

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

    useEffect(() => {
        fetchSettings();
    }, [companyId]);

    const handleCancel = () => {
        setIsEditing(false);
        fetchSettings(); // Revert by re-fetching
    };

    const addColumn = () => {
        if (!newStatusTitle.trim()) return;
        const newId = `custom-${Date.now()}`;
        setColumns([...columns, { id: newId, title: newStatusTitle.trim(), color: newStatusColor }]);
        setNewStatusTitle('');
        setIsAddingStatus(false);
    };

    const removeColumn = (id: string) => {
        if (columns.length <= 1) return;
        setColumns(columns.filter(c => c.id !== id));
    };

    const updateColumn = (id: string, updates: any) => {
        setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const [editingColorId, setEditingColorId] = useState<string | null>(null);

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
                setIsEditing(false);
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
        <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Layout className="w-5 h-5 text-blue-500" />
                        Workflow & Statuses
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Define the lifecycle of your content and automate movement between stages.</p>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={!userPermissions?.canEditSettings}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 font-bold"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Workflow
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {/* Column Management */}
                <div className="space-y-6">
                    <div>
                        <SectionTitle>Content Statuses</SectionTitle>
                        <Card className="mt-4 bg-white border-slate-200 shadow-sm overflow-visible p-6">
                            <div className="space-y-3">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4 px-1">Configure columns for the board and universal lifecycle states.</p>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={columns.map(c => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {columns.map((col) => (
                                                <SortableColumnItem
                                                    key={col.id}
                                                    col={col}
                                                    isEditing={isEditing}
                                                    updateColumn={updateColumn}
                                                    removeColumn={removeColumn}
                                                    setEditingColorId={setEditingColorId}
                                                    editingColorId={editingColorId}
                                                    PRESET_COLORS={PRESET_COLORS}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                                {isEditing && (
                                    isAddingStatus ? (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-blue-100 animate-in zoom-in-95 duration-200 mt-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">New Status Details</p>
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    autoFocus
                                                    value={newStatusTitle}
                                                    onChange={e => setNewStatusTitle(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addColumn()}
                                                    placeholder="Status title..."
                                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <button
                                                    onClick={addColumn}
                                                    disabled={!newStatusTitle.trim()}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase transition-all hover:bg-blue-700 disabled:opacity-40"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Colour</p>
                                            <div className="flex gap-2 flex-wrap mb-4">
                                                {PRESET_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setNewStatusColor(c)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newStatusColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setIsAddingStatus(false)}
                                                className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingStatus(true)}
                                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-xs font-bold mt-2"
                                        >
                                            <Plus size={14} /> Add Column
                                        </button>
                                    )
                                )}
                            </div>
                        </Card>
                    </div>

                    <div>
                        <SectionTitle>Triggers</SectionTitle>
                        <Card className="mt-4 bg-white border-slate-200 shadow-sm p-6">
                            <div className="space-y-4">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1 mb-2">Automate actions when cards move or system events occur.</p>

                                {automations.map((rule: any) => {
                                    if (rule.type === 'move_to') {
                                        return (
                                            <div key={rule.id} className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col gap-3 relative transition-all hover:bg-indigo-50/60">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                                                        <RotateCcw size={12} className="rotate-90" />
                                                        Move Trigger
                                                    </div>
                                                    {isEditing && (
                                                        <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                                    <span className="shrink-0">When moved to</span>
                                                    <Select
                                                        disabled={!isEditing}
                                                        value={rule.targetColumn}
                                                        onChange={(e: any) => updateAutomation(rule.id, { targetColumn: e.target.value })}
                                                        className="flex-1 h-9 bg-white"
                                                    >
                                                        {columns.map((c: any) => (
                                                            <option key={c.id} value={c.id}>{c.title}</option>
                                                        ))}
                                                    </Select>
                                                    <ArrowRight size={14} className="text-slate-300 shrink-0" />
                                                    <Select
                                                        disabled={!isEditing}
                                                        value={rule.action}
                                                        onChange={(e: any) => updateAutomation(rule.id, { action: e.target.value })}
                                                        className="flex-1 h-9 bg-white"
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
                                            <div key={rule.id} className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 flex flex-col gap-3 relative transition-all hover:bg-amber-50/60">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 tracking-wider">
                                                        <ShieldCheck size={12} />
                                                        Lock Rule
                                                    </div>
                                                    {isEditing && (
                                                        <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                                    <span className="shrink-0">Lock</span>
                                                    <Select
                                                        disabled={!isEditing}
                                                        value={rule.columnId}
                                                        onChange={(e: any) => updateAutomation(rule.id, { columnId: e.target.value })}
                                                        className="flex-1 h-9 bg-white"
                                                    >
                                                        {columns.map((c: any) => (
                                                            <option key={c.id} value={c.id}>{c.title}</option>
                                                        ))}
                                                    </Select>
                                                    <span className="shrink-0 text-[10px]">to</span>
                                                    <Select
                                                        disabled={!isEditing}
                                                        value={rule.roleName}
                                                        onChange={(e: any) => updateAutomation(rule.id, { roleName: e.target.value })}
                                                        className="flex-1 h-9 bg-white"
                                                    >
                                                        <option value="">Select Role</option>
                                                        {customRoles?.map((r: any) => (
                                                            <option key={r.name} value={r.name}>{r.name}</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={rule.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-3 relative transition-all hover:bg-slate-100/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                    <Wand2 size={12} className="text-blue-500" />
                                                    Event Trigger
                                                </div>
                                                {isEditing && (
                                                    <button onClick={() => removeAutomation(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Select
                                                    disabled={!isEditing}
                                                    value={rule.event}
                                                    onChange={(e: any) => updateAutomation(rule.id, { event: e.target.value })}
                                                    className="flex-1 h-10 bg-white"
                                                >
                                                    <option value="caption_generated">AI Caption Generated</option>
                                                    <option value="image_generated">AI Image Generated</option>
                                                    <option value="comment_added">New Comment Added</option>
                                                    <option value="revision_requested">Revision Requested</option>
                                                    <option value="content_approved">Content Approved</option>
                                                    <option value="content_scheduled">When a post is scheduled</option>
                                                    <option value="content_posted">When a post is live</option>
                                                    <option value="content_unscheduled">When a post is unscheduled</option>
                                                </Select>
                                                <ArrowRight size={16} className="text-slate-300 shrink-0" />
                                                <Select
                                                    disabled={!isEditing}
                                                    value={rule.targetStatus}
                                                    onChange={(e: any) => updateAutomation(rule.id, { targetStatus: e.target.value })}
                                                    className="flex-1 h-10 bg-white"
                                                >
                                                    {columns.map((c: any) => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>
                                    );
                                })}



                                {isEditing && (
                                    <div className="relative pt-2">
                                        <button
                                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                                            className="w-full py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
                                        >
                                            <Plus size={18} className={`transition-transform duration-300 ${isAddMenuOpen ? 'rotate-45' : ''}`} />
                                            Add Trigger
                                        </button>

                                        {isAddMenuOpen && (
                                            <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 grid grid-cols-1 gap-1">
                                                <button onClick={() => { addMoveToAutomation(); setIsAddMenuOpen(false); }} className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><RotateCcw size={16} /></div>
                                                    <div><div className="text-xs font-black uppercase">Move Trigger</div><div className="text-[9px] text-slate-400 font-bold uppercase underline decoration-indigo-200">On column change</div></div>
                                                </button>
                                                <button onClick={() => { addEventAutomation(); setIsAddMenuOpen(false); }} className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Wand2 size={16} /></div>
                                                    <div><div className="text-xs font-black uppercase">Event Trigger</div><div className="text-[9px] text-slate-400 font-bold uppercase underline decoration-blue-200">On AI/User event</div></div>
                                                </button>
                                                <button onClick={() => { addAccessRule(); setIsAddMenuOpen(false); }} className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><ShieldCheck size={16} /></div>
                                                    <div><div className="text-xs font-black uppercase">Lock Rule</div><div className="text-[9px] text-slate-400 font-bold uppercase underline decoration-amber-200">Restrict access</div></div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="mt-6 p-5 rounded-2xl bg-blue-50/40 border border-blue-100 flex gap-4">
                            <Wand2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-700/80 font-medium leading-relaxed">
                                <strong>Smart Automation:</strong> Triggers help keep your team in sync without manual updates. Move to "Review" to auto-notify or "Approved" to trigger scheduling.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Studio Layout & System Mapping */}
                <div className="space-y-6">
                    <div>
                        <SectionTitle>Studio Tabs (Dashboard)</SectionTitle>
                        <Card className="mt-4 bg-white border-slate-200 shadow-sm overflow-visible p-6">
                            <div className="space-y-4">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4 px-1">Define which statuses show in each dashboard section.</p>

                                {studioSettings.studioTabs.map((tab: any, tIdx: number) => (
                                    <div key={tab.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-4 transition-all hover:bg-slate-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    disabled={!isEditing}
                                                    value={tab.label}
                                                    onChange={(e) => {
                                                        const newTabs = [...studioSettings.studioTabs];
                                                        newTabs[tIdx].label = e.target.value;
                                                        setStudioSettings({ ...studioSettings, studioTabs: newTabs });
                                                    }}
                                                    className="h-8 font-black uppercase text-[10px] w-48 shadow-none border-slate-200"
                                                />
                                                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[8px] text-slate-400 font-black uppercase tracking-tighter">ID: {tab.id}</span>
                                            </div>
                                            {isEditing && (
                                                <button onClick={() => {
                                                    const newTabs = studioSettings.studioTabs.filter((_: any, i: number) => i !== tIdx);
                                                    setStudioSettings({ ...studioSettings, studioTabs: newTabs });
                                                }} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {columns.map(col => {
                                                const isSelected = tab.statuses.includes(col.id);
                                                return (
                                                    <button
                                                        key={col.id}
                                                        disabled={!isEditing}
                                                        onClick={() => {
                                                            const newTabs = [...studioSettings.studioTabs];
                                                            if (isSelected) newTabs[tIdx].statuses = tab.statuses.filter((s: string) => s !== col.id);
                                                            else newTabs[tIdx].statuses = [...tab.statuses, col.id];
                                                            setStudioSettings({ ...studioSettings, studioTabs: newTabs });
                                                        }}
                                                        className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${isSelected
                                                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                                            : `bg-white border-slate-200 text-slate-400 ${isEditing ? 'hover:border-slate-300 cursor-pointer' : 'cursor-default opacity-50'}`
                                                            }`}
                                                    >
                                                        {col.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            setStudioSettings({
                                                ...studioSettings,
                                                studioTabs: [
                                                    ...studioSettings.studioTabs,
                                                    { id: `tab-${Date.now()}`, label: 'New Section', icon: 'Edit', statuses: [] }
                                                ]
                                            });
                                        }}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                    >
                                        <Plus size={14} /> Add Dashboard Tab
                                    </button>
                                )}
                            </div>
                        </Card>
                    </div>

                </div>
            </div >
        </div >
    );
};
