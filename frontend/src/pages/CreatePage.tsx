import { FileText, Target, Rocket, Plus } from 'lucide-react';
import type { ChangeEventHandler } from 'react';

interface FormState {
    date: string;
    brandHighlight: string;
    crossPromo: string;
    theme: string;
    contentType: string;
    channels: string[];
    targetAudience: string;
    primaryGoal: string;
    cta: string;
    promoType: string;
}

interface CreatePageProps {
    form: FormState;
    handleChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
    handleAdd: () => Promise<void>;
    isAdding: boolean;
    setBulkText: (value: string) => void;
    setBulkPreview: (value: string[][]) => void;
    setShowPreview: (value: boolean) => void;
    setIsBulkModalOpen: (value: boolean) => void;
}

export function CreatePage({
    form,
    handleChange,
    handleAdd,
    isAdding,
    setBulkText,
    setBulkPreview,
    setShowPreview,
    setIsBulkModalOpen,
}: CreatePageProps) {
    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
            <section className="w-full max-w-[1000px] mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                <div className="px-6 py-5 border-b border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark tracking-tight font-display">Content Generator</h2>
                        <p className="mt-1 text-sm text-brand-dark/60 font-medium">Create captions and content drafts for your calendar.</p>
                    </div>
                    <div>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-bold text-brand-dark bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-brand-primary/30 transition-all duration-200"
                            onClick={() => {
                                setBulkText('');
                                setBulkPreview([]);
                                setShowPreview(false);
                                setIsBulkModalOpen(true);
                            }}
                        >
                            Bulk paste
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="flex flex-col gap-8">
                        <div className="group p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-brand-dark flex items-center gap-2.5 mb-1.5">
                                    <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                                        <FileText className="w-4.5 h-4.5" />
                                    </div>
                                    Content Brief
                                </h3>
                                <p className="text-sm text-brand-dark/60 font-medium ml-[42px]">Define what the post is about and the core theme.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Brand Highlight (80%)</label>
                                    <input
                                        type="text"
                                        name="brandHighlight"
                                        placeholder="e.g., Coworking Space"
                                        value={form.brandHighlight}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Cross-Promo (20%)</label>
                                    <input
                                        type="text"
                                        name="crossPromo"
                                        placeholder="e.g., Zen Café"
                                        value={form.crossPromo}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Theme</label>
                                    <input
                                        type="text"
                                        name="theme"
                                        placeholder="e.g., Your Startup's First Home"
                                        value={form.theme}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="group p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-brand-dark flex items-center gap-2.5 mb-1.5">
                                    <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                                        <Target className="w-4.5 h-4.5" />
                                    </div>
                                    Distribution
                                </h3>
                                <p className="text-sm text-brand-dark/60 font-medium ml-[42px]">Choose where the content will go and who it serves.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Content Type</label>
                                    <div className="relative">
                                        <select
                                            name="contentType"
                                            value={form.contentType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white appearance-none cursor-pointer"
                                        >
                                            <option value="">Select content type</option>
                                            <option value="Promo">Promo</option>
                                            <option value="Educational">Educational</option>
                                            <option value="Story">Story</option>
                                            <option value="Testimonial">Testimonial</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/50">
                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Target Audience</label>
                                    <input
                                        type="text"
                                        name="targetAudience"
                                        placeholder="e.g., Startup Founders"
                                        value={form.targetAudience}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Primary Goal</label>
                                    <div className="relative">
                                        <select
                                            name="primaryGoal"
                                            value={form.primaryGoal}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white appearance-none cursor-pointer"
                                        >
                                            <option value="">Select a goal</option>
                                            <option value="Awareness">Awareness</option>
                                            <option value="Engagement">Engagement</option>
                                            <option value="Traffic">Traffic</option>
                                            <option value="Leads">Leads</option>
                                            <option value="Sales">Sales</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/50">
                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-brand-dark flex items-center gap-2.5 mb-1.5">
                                    <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                                        <Rocket className="w-4.5 h-4.5" />
                                    </div>
                                    Call to Action
                                </h3>
                                <p className="text-sm text-brand-dark/60 font-medium ml-[42px]">Define the action and promotional angle.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Call to Action</label>
                                    <input
                                        type="text"
                                        name="cta"
                                        placeholder="e.g., Book a Tour"
                                        value={form.cta}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Promo Type</label>
                                    <div className="relative">
                                        <select
                                            name="promoType"
                                            value={form.promoType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 text-sm font-medium text-brand-dark bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm hover:bg-white appearance-none cursor-pointer"
                                        >
                                            <option value="">Select promo type</option>
                                            <option value="Launch">Launch</option>
                                            <option value="Discount">Discount</option>
                                            <option value="Evergreen">Evergreen</option>
                                            <option value="Event">Event</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/50">
                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 z-10 px-6 py-4 bg-gradient-to-t from-white via-white/95 to-white/0 flex justify-end shrink-0 pointer-events-none">
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="pointer-events-auto inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-brand-primary to-[#5bb8f7] hover:to-brand-primary border border-brand-primary/20 shadow-[0_4px_12px_rgba(63,169,245,0.25)] hover:shadow-[0_8px_20px_rgba(63,169,245,0.35)] hover:-translate-y-0.5"
                    >
                        {isAdding ? (
                            <>
                                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                Adding…
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Calendar
                            </>
                        )}
                    </button>
                </div>
            </section>
        </main>
    );
}
