import React, { useState } from "react";
import { Calendar as CalendarIcon, Wand2, Plus, Trash2, Check, ArrowRight, Save, Layout, Target, Zap, Megaphone, Lightbulb, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlannedItem {
    id: string;
    date: string;
    brandHighlight: string;
    crossPromo: string;
    theme: string;
    contentType: string;
    targetAudience: string;
    channels: string;
    primaryGoal: string;
    cta: string;
    promoType: string;
}

export function ContentPlannerPage({ activeCompanyId, onAddToCalendar, authedFetch, initialItems, notify, backendBaseUrl, calendarRows }: {
    activeCompanyId?: string,
    onAddToCalendar?: (items: any[]) => Promise<void>,
    authedFetch?: (url: string, options?: RequestInit) => Promise<Response>,
    initialItems?: any[],
    notify: (message: string, tone: "success" | "error" | "info") => void,
    backendBaseUrl?: string,
    calendarRows?: any[]
}) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'planner' | 'ideas'>('planner');
    const [goal, setGoal] = useState("");
    const [duration, setDuration] = useState("1 day");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<PlannedItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newIdea, setNewIdea] = useState('');
    const [isCreatingIdea, setIsCreatingIdea] = useState(false);

    React.useEffect(() => {
        if (initialItems && initialItems.length > 0) {
            setItems(initialItems.map((item, idx) => ({
                ...item,
                id: item.id || (Date.now().toString() + idx)
            })));
        }
    }, [initialItems]);

    const handleGenerate = async () => {
        if (!goal.trim()) return;
        setIsGenerating(true);

        try {
            const prompt = `
        Act as a professional content strategist.
        Create a detailed content calendar plan starting from ${startDate} covering a duration of "${duration}".
        The campaign goal is: "${goal}".
        
        Return the result ONLY as a valid JSON array of objects. Do not include markdown formatting or backticks.
        Each object must have these exact keys:
        - date (Format: "Mon, Feb 5")
        - brandHighlight (The main topic or brand pillar, catchily phrased)
        - crossPromo (Secondary mention or "None")
        - theme (Short catchy headline for the post)
        - contentType (e.g. Static Post, Reel, Carousel, Story)
        - channels (Comma separated, e.g. "FB, LI, IG")
        - targetAudience (Short segment name, e.g. "SMEs", "Founders")
        - primaryGoal (e.g. Lead Gen, Awareness)
        - cta (Short call to action text)
        - promoType (e.g. Soft Sell, Value, Hard Sell)

        Generate items appropriate for the duration (e.g. 1 item for 1 day, 3-5 for a week).
      `;

            const fetcher = authedFetch || fetch;
            const response = await fetcher(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/generate-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    noStream: true
                })
            });

            const data = await response.json();
            let content = data.content || data.result || "[]";
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const parsedItems = JSON.parse(content);
                const secureItems = (Array.isArray(parsedItems) ? parsedItems : []).map((item: any, idx: number) => ({
                    ...item,
                    id: Date.now().toString() + idx,
                    crossPromo: item.crossPromo || "",
                    channels: item.channels || "Socials",
                }));
                setItems(secureItems);
            } catch (e) {
                console.error("Failed to parse AI response", e);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const handleSaveToCalendar = async () => {
        if (!activeCompanyId) return;
        setIsSaving(true);
        if (onAddToCalendar) {
            await onAddToCalendar(items);
            navigate(`/company/${activeCompanyId}/calendar`);
        } else {
            setTimeout(() => {
                setIsSaving(false);
                navigate(`/company/${activeCompanyId}/calendar`);
            }, 1000);
        }
    };

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
            } else {
                notify('Failed to save idea', 'error');
            }
        } catch (err) {
            notify('Error creating idea', 'error');
        } finally {
            setIsCreatingIdea(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-bl from-[#3fa9f5]/15 to-transparent rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-gradient-to-tr from-[#ec4899]/10 to-[#8b5cf6]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1000ms' }} />
            </div>

            <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
                {/* Header Section */}
                <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
                    <Target className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20 mb-3">
                            Content Strategy
                        </div>
                        <h2 className="text-2xl font-black text-white">AI Content Planner</h2>
                        <p className="mt-1 text-sm font-medium text-slate-400">Define your goal, choose your timeline, and let AI structure your campaign strategy.</p>
                    </div>

                    {(items.length > 0) && (
                        <button
                            onClick={handleSaveToCalendar}
                            disabled={isSaving}
                            className="relative z-10 flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg transition hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save {items.length} to Calendar
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">

                    {/* Tabs */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('planner')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'planner'
                                ? 'bg-white text-indigo-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <CalendarIcon size={16} />
                            Campaign Planner
                        </button>
                        <button
                            onClick={() => setActiveTab('ideas')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ideas'
                                ? 'bg-white text-indigo-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Lightbulb size={16} />
                            Idea Scratchpad
                        </button>
                    </div>

                    {activeTab === 'ideas' ? (
                        <div className="space-y-8">
                            {/* Ideas Scratchpad Creator */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                                <Zap className="absolute top-[-20px] right-[-20px] w-40 h-40 text-amber-200/20 rotate-12 pointer-events-none group-hover:rotate-45 transition-transform duration-1000" />
                                <div className="relative z-10 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            Quick Idea Scratchpad
                                        </h3>
                                        <p className="text-xs font-semibold text-amber-800/60 mb-3">Not ready for a full campaign? Jot down a raw idea and it will appear here.</p>
                                        <textarea
                                            placeholder="What's your next big content move? Jot down a theme, a hook, or a rough thought..."
                                            value={newIdea}
                                            onChange={(e) => setNewIdea(e.target.value)}
                                            className="w-full bg-white/60 border border-amber-200/50 rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder:text-amber-900/30 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all resize-none h-24 backdrop-blur-sm shadow-inner"
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
                                                <>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                            Save Idea
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Ideas List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(calendarRows || [])
                                    .filter(row => row.status === 'IDEA')
                                    .map(idea => (
                                        <div key={idea.contentCalendarId} className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative">
                                            <div className="absolute top-4 right-4 text-amber-900/20 group-hover:text-amber-500/50 transition-colors">
                                                <Lightbulb size={24} />
                                            </div>
                                            <div className="mb-3">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                                    Idea
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-lg mb-2 pr-8 line-clamp-2">
                                                {idea.theme || "Untitled Idea"}
                                            </h4>
                                            <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                                                {idea.brandHighlight || "No details yet"}
                                            </p>

                                            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mt-auto">
                                                <span>{idea.date ? new Date(idea.date).toLocaleDateString() : 'No date'}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                                {(calendarRows || []).filter(row => row.status === 'IDEA').length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                        <Lightbulb className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>No ideas yet. Start documenting your thoughts above!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Input Grid */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-indigo-900">
                                    <Wand2 size={200} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-end">
                                    <div className="md:col-span-5 space-y-2">
                                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Campaign Goal / Topic</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={goal}
                                                onChange={(e) => setGoal(e.target.value)}
                                                placeholder="e.g., Launching our new summer menu"
                                                className="w-full pl-5 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Duration</label>
                                        <div className="relative">
                                            <select
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm appearance-none"
                                            >
                                                <option value="1 day">1 Day</option>
                                                <option value="3 days">3 Days</option>
                                                <option value="1 week">1 Week</option>
                                                <option value="2 weeks">2 Weeks</option>
                                                <option value="1 month">1 Month</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ArrowRight size={16} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !goal.trim()}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-[60px] rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {isGenerating ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Wand2 size={18} />
                                                    <span>Generate</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Table */}
                            {items.length > 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/50 border-b border-slate-100 items-center">
                                        <div className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <CalendarIcon size={12} /> Date
                                        </div>
                                        <div className="col-span-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Zap size={12} /> Theme / Content
                                        </div>
                                        <div className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Target size={12} /> Brand / Promo
                                        </div>
                                        <div className="col-span-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Megaphone size={12} /> Channel / Target
                                        </div>
                                        <div className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Layout size={12} /> Primary / CTA
                                        </div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-slate-100">
                                        {items.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-6 px-8 py-6 hover:bg-slate-50/50 transition relative group items-start">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 rounded-full hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* Date */}
                                                <div className="col-span-2 pt-1">
                                                    <span className="font-bold text-slate-700 text-sm bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                                                        {item.date}
                                                    </span>
                                                </div>

                                                {/* Theme / Content */}
                                                <div className="col-span-3 flex flex-col gap-1">
                                                    <span className="font-bold text-slate-900 text-base leading-tight">
                                                        {item.theme}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        {item.contentType}
                                                    </span>
                                                </div>

                                                {/* Brand / Promo */}
                                                <div className="col-span-2 flex flex-col gap-1">
                                                    <span className="font-medium text-slate-700 text-sm">
                                                        {item.brandHighlight}
                                                    </span>
                                                    {item.crossPromo && item.crossPromo !== "None" && (
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            {item.crossPromo} • {item.promoType}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Channel / Target */}
                                                <div className="col-span-3 flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {item.channels}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {item.targetAudience}
                                                    </span>
                                                </div>

                                                {/* Primary / CTA */}
                                                <div className="col-span-2 flex flex-col gap-1">
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        {item.primaryGoal}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-medium break-words">
                                                        {item.cta}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-24 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Layout size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Your plan awaits</h3>
                                    <p className="text-slate-500 max-w-md mx-auto mt-3 text-lg leading-relaxed">
                                        Enter your campaign goal above, set the start date, and watch AI build your perfect schedule.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
