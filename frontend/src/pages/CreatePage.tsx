import { FileText, Target, Rocket, Plus, Clipboard, Wand2 } from "lucide-react";
import type { ChangeEventHandler } from "react";

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

export function CreatePage({ form, handleChange, handleAdd, isAdding, setBulkText, setBulkPreview, setShowPreview, setIsBulkModalOpen }: CreatePageProps) {
  return (
    <main className="flex-1 overflow-y-auto p-2.5 md:p-6 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-8%] w-[45%] h-[45%] bg-gradient-to-bl from-[#3fa9f5]/22 to-[#a78bfa]/18 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute bottom-[-12%] left-[-6%] w-[42%] h-[42%] bg-gradient-to-tr from-[#e5a4e6]/16 to-[#6fb6e8]/14 rounded-full blur-[105px] animate-pulse" style={{ animationDelay: '500ms' }} />
      </div>
      <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
        <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
          <Wand2 className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
              Content Studio
            </div>
            <h2 className="text-2xl font-black text-white">Content Generator</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">Generate high-converting captions and visual ideas in seconds.</p>
          </div>

          <button
            type="button"
            className="relative z-10 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-sm transition hover:bg-white/20 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={() => {
              setBulkText("");
              setBulkPreview([]);
              setShowPreview(false);
              setIsBulkModalOpen(true);
            }}
          >
            <Clipboard className="w-4 h-4 mr-1" />
            Bulk Paste mode
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="group p-4 md:p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
              <div className="mb-4 md:mb-6">
                <h3 className="text-base font-bold flex items-center gap-2.5 mb-1.5">
                  <div className="rounded-lg">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  Content Brief
                </h3>
                <p className="text-sm">Define what the post is about and the core theme.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider ml-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider ml-1">Brand Highlight (80%)</label>
                  <input
                    type="text"
                    name="brandHighlight"
                    placeholder="e.g., Coworking Space"
                    value={form.brandHighlight}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider ml-1">Cross-Promo (20%)</label>
                  <input
                    type="text"
                    name="crossPromo"
                    placeholder="e.g., Zen Café"
                    value={form.crossPromo}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl"
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
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="group p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-base font-bold flex items-center gap-2.5 mb-1.5">
                  <div className="rounded-lg">
                    <Target className="w-4.5 h-4.5" />
                  </div>
                  Distribution
                </h3>
                <p className="text-sm">Choose where the content will go and who it serves.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Content Type</label>
                  <div className="relative">
                    <select
                      name="contentType"
                      value={form.contentType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="">Select content type</option>
                      <option value="Promo">Promo</option>
                      <option value="Educational">Educational</option>
                      <option value="Story">Story</option>
                      <option value="Testimonial">Testimonial</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/50">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
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
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold text-brand-dark/70 uppercase tracking-wider ml-1">Primary Goal</label>
                  <div className="relative">
                    <select
                      name="primaryGoal"
                      value={form.primaryGoal}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="">Select a goal</option>
                      <option value="Awareness">Awareness</option>
                      <option value="Engagement">Engagement</option>
                      <option value="Traffic">Traffic</option>
                      <option value="Leads">Leads</option>
                      <option value="Sales">Sales</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/50">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-base font-bold flex items-center gap-2.5 mb-1.5">
                  <Rocket className="w-4.5 h-4.5" />
                  Call to Action
                </h3>
                <p className="text-sm">Define the action and promotional angle.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1">Call to Action</label>
                  <input
                    type="text"
                    name="cta"
                    placeholder="e.g., Book a Tour"
                    value={form.cta}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider ml-1">Promo Type</label>
                  <div className="relative">
                    <select
                      name="promoType"
                      value={form.promoType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-200 rounded-xl appearance-none cursor-pointer"
                    >
                      <option value="">Select promo type</option>
                      <option value="Launch">Launch</option>
                      <option value="Discount">Discount</option>
                      <option value="Evergreen">Evergreen</option>
                      <option value="Event">Event</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/50">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 px-4 md:px-6 py-4 flex justify-end shrink-0 pointer-events-none">
          <button type="button" onClick={handleAdd} disabled={isAdding} className="pointer-events-auto btn btn-primary">
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
