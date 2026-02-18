import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Wand2, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardProps {
  activeCompany: { companyId: string; companyName: string } | null;
  activeCompanyId: string | undefined;
  dashboardStats: {
    total: number;
    approved: number;
    review: number;
    generate: number;
    draft: number;
    scheduled: number;
    upcoming7: number;
    approvalRate: number;
  };
  brandIntelligenceReady: boolean;
}

export function DashboardPage({ activeCompany, activeCompanyId, dashboardStats, brandIntelligenceReady }: DashboardProps) {
  const navigate = useNavigate();

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 min-w-0 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/20 to-[#6fb6e8]/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/15 to-[#e5a4e6]/12 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-gradient-to-bl from-[#81bad1]/12 to-transparent rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1400ms' }} />
      </div>
      <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
        <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
          <LayoutDashboard className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
              Workspace Overview
            </div>
            <h2 className="text-2xl font-black text-white">{activeCompany?.companyName ?? "Company"} Dashboard</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">Monitor content performance and workflow status.</p>
          </div>

          <button
            type="button"
            className="relative z-10 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
            onClick={() => {
              if (!activeCompanyId) return;
              navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`);
            }}
            disabled={!activeCompanyId}
          >
            <Wand2 className="h-4 w-4" />
            Create Content
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Action Required Section */}
          {!brandIntelligenceReady && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Action Required
                </h3>
                <p className="mt-1 text-sm text-amber-700 max-w-2xl">
                  Your Brand Intelligence is not fully set up yet. Complete the setup to unlock AI-powered content generation tailored to your brand voice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => activeCompanyId && navigate(`/company/${activeCompanyId}/settings/brand-intelligence`)}
                className="whitespace-nowrap rounded-lg bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-200 transition-colors"
              >
                Setup Brand Intelligence →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">Total Posts</div>
              <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.total}</div>
              <div className="text-xs text-brand-dark/60 flex items-center justify-between font-medium">
                Across all statuses
                <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">Approved</div>
              <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.approved}</div>
              <div className="text-xs text-brand-dark/60 flex items-center justify-between font-medium">
                Approval rate {dashboardStats.approvalRate}%
                <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">In Review</div>
              <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.review}</div>
              <div className="text-xs text-brand-dark/60 flex items-center justify-between font-medium">
                Pending feedback
                <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -2%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">Generating</div>
              <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.generate}</div>
              <div className="text-xs text-brand-dark/60 flex items-center justify-between font-medium">
                Active AI jobs
                <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md text-brand-dark/40">Stable</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">Scheduled</div>
              <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.scheduled}</div>
              <div className="text-xs text-brand-dark/60 flex items-center justify-between font-medium">
                Ready to publish
                <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group sm:col-span-2 lg:col-span-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">Next 7 Days</div>
                  <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.upcoming7}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-brand-dark/60 font-medium mb-1">Scheduled content volume</div>
                  <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8% vs last week
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-bold text-brand-dark/70 uppercase tracking-widest mb-4">Pipeline Analysis</div>

            {(() => {
              const total = dashboardStats.total || 1;
              const draftPct = (dashboardStats.draft / total) * 100;
              const reviewPct = (dashboardStats.review / total) * 100;
              const genPct = (dashboardStats.generate / total) * 100;
              const approvedPct = (dashboardStats.approved / total) * 100;

              return (
                <>
                  <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100 mb-4">
                    <div className="h-full bg-gray-400 transition-all duration-700" style={{ width: `${draftPct}%` }} />
                    <div className="h-full bg-yellow-400 transition-all duration-700" style={{ width: `${reviewPct}%` }} />
                    <div className="h-full bg-sky-400 transition-all duration-700" style={{ width: `${genPct}%` }} />
                    <div className="h-full bg-green-400 transition-all duration-700" style={{ width: `${approvedPct}%` }} />
                  </div>

                  <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      Draft ({Math.round(draftPct)}%)
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      Review ({Math.round(reviewPct)}%)
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                      Generating ({Math.round(genPct)}%)
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      Approved ({Math.round(approvedPct)}%)
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="text-[0.75rem] uppercase tracking-wider font-bold text-brand-dark/70 mb-3">Status Breakdown</div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="block text-xs text-brand-dark/60">Draft</span>
                  <strong>{dashboardStats.draft}</strong>
                </div>
                <div>
                  <span className="block text-xs text-brand-dark/60">Review</span>
                  <strong>{dashboardStats.review}</strong>
                </div>
                <div>
                  <span className="block text-xs text-brand-dark/60">Generate</span>
                  <strong>{dashboardStats.generate}</strong>
                </div>
                <div>
                  <span className="block text-xs text-brand-dark/60">Approved</span>
                  <strong>{dashboardStats.approved}</strong>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="text-[0.75rem] uppercase tracking-wider font-bold text-brand-dark/70 mb-3">Schedule Health</div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="block text-xs text-brand-dark/60">Total planned</span>
                  <strong>{dashboardStats.total}</strong>
                </div>
                <div>
                  <span className="block text-xs text-brand-dark/60">Next 7 days</span>
                  <strong>{dashboardStats.upcoming7}</strong>
                </div>
                <div>
                  <span className="block text-xs text-brand-dark/60">Approval rate</span>
                  <strong>{dashboardStats.approvalRate}%</strong>
                </div>
                <div>
                  <span className="block text-xs text-brand-dark/60">Needs attention</span>
                  <strong>{dashboardStats.review + dashboardStats.generate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
