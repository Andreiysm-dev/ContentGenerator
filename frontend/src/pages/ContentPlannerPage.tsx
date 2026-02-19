import React, { useState } from "react";
import { Calendar as CalendarIcon, Wand2, Plus, Trash2, Check, ArrowRight, Save, Layout, Target, Zap, Megaphone } from "lucide-react";
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

export function ContentPlannerPage({ activeCompanyId, onAddToCalendar, authedFetch, initialItems }: {
    activeCompanyId?: string,
    onAddToCalendar?: (items: any[]) => Promise<void>,
    authedFetch?: (url: string, options?: RequestInit) => Promise<Response>,
    initialItems?: any[]
}) {
    const navigate = useNavigate();
    const [goal, setGoal] = useState("");
    const [duration, setDuration] = useState("1 day");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<PlannedItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
                </div>
            </section>
        </main>
    );
}
