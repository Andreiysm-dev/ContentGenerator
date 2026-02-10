import { useNavigate } from 'react-router-dom';
import { Wand2, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
    activeCompany: { companyId: string; companyName: string } | null;
    activeCompanyId: string | undefined;
    dashboardStats: {
        total: number;
        approved: number;
        review: number;
        generate: number;
        draft: number;
        upcoming7: number;
        approvalRate: number;
    };
}

export function DashboardPage({ activeCompany, activeCompanyId, dashboardStats }: DashboardProps) {
    const navigate = useNavigate();

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
            <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6">
                <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:border-brand-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-dark tracking-tight font-display">
                                {activeCompany?.companyName ?? 'Company'} Dashboard
                            </h2>
                            <p className="mt-1 text-sm text-brand-dark/60 font-medium">Overview & system health.</p>
                        </div>

                        {/* FIXED CTA BUTTON: uses arbitrary brand color so it will NOT render white */}
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => {
                                if (!activeCompanyId) return;
                                navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`);
                            }}
                            disabled={!activeCompanyId}
                        >
                            <Wand2 className="h-4 w-4 opacity-90" strokeWidth={2.25} />
                            Create Content
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                        <div className="p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-brand-primary/20 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex flex-col gap-1.5 group md:col-span-2 lg:col-span-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[0.7rem] uppercase tracking-wider font-bold text-brand-dark/50">Next 7 Days</div>
                                    <div className="text-[1.6rem] font-bold text-brand-dark font-display leading-tight">{dashboardStats.upcoming7}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-brand-dark/60 font-medium mb-1">Scheduled content volume</div>
                                    <span className="inline-flex items-center text-[0.72rem] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        +8% vs last week
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Distribution Bar */}
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
                                    <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-slate-100 mb-4">
                                        <div className="h-full bg-brand-dark/60 transition-all duration-700 ease-out" style={{ width: `${draftPct}%` }} title={`Draft: ${dashboardStats.draft}`} />
                                        <div className="h-full bg-pink-400 transition-all duration-700 ease-out" style={{ width: `${reviewPct}%` }} title={`Review: ${dashboardStats.review}`} />
                                        <div className="h-full bg-sky-400 transition-all duration-700 ease-out" style={{ width: `${genPct}%` }} title={`Generating: ${dashboardStats.generate}`} />
                                        <div className="h-full bg-brand-primary transition-all duration-700 ease-out" style={{ width: `${approvedPct}%` }} title={`Approved: ${dashboardStats.approved}`} />
                                    </div>

                                    <div className="flex flex-wrap gap-4 md:gap-6">
                                        <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                                            <div className="w-2 h-2 rounded-full bg-brand-dark/60" />
                                            <span>Draft ({Math.round(draftPct)}%)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                                            <div className="w-2 h-2 rounded-full bg-pink-400" />
                                            <span>Review ({Math.round(reviewPct)}%)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                                            <div className="w-2 h-2 rounded-full bg-sky-400" />
                                            <span>Generating ({Math.round(genPct)}%)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/70">
                                            <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                            <span>Approved ({Math.round(approvedPct)}%)</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
                            <div className="text-[0.75rem] uppercase tracking-wider font-bold text-brand-dark/70 mb-3">Status Breakdown</div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Draft</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.draft}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Review</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.review}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Generate</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.generate}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Approved</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.approved}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
                            <div className="text-[0.75rem] uppercase tracking-wider font-bold text-brand-dark/70 mb-3">Schedule Health</div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Total planned</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.total}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Next 7 days</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.upcoming7}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Approval rate</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.approvalRate}%</strong>
                                </div>
                                <div>
                                    <span className="block text-xs text-brand-dark/60">Needs attention</span>
                                    <strong className="text-base font-bold text-brand-dark">{dashboardStats.review + dashboardStats.generate}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
