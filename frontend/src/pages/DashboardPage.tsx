import { useNavigate, useParams } from 'react-router-dom';
import { Wand2, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
    activeCompany: { companyId: string; companyName: string } | null;
    activeCompanyId: string | null;
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
    const params = useParams();

    return (
        <main className="app-main">
            <section className="card dashboard-card">
                <div className="card-header card-header-compact">
                    <div>
                        <h2 className="card-title">{activeCompany?.companyName ?? 'Company'} Dashboard</h2>
                        <p className="card-subtitle">Overview & system health.</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            if (!activeCompanyId) return;
                            navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`);
                        }}
                        disabled={!activeCompanyId}
                    >
                        <Wand2 style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                        Create Content
                    </button>
                </div>
                <div className="dashboard-grid">
                    <div className="metric-card metric-card--primary">
                        <div className="metric-label">Total Posts</div>
                        <div className="metric-value">{dashboardStats.total}</div>
                        <div className="metric-sub">
                            Across all statuses
                            <span className="metric-trend trend-up">
                                <TrendingUp style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                +12%
                            </span>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Approved</div>
                        <div className="metric-value">{dashboardStats.approved}</div>
                        <div className="metric-sub">
                            Approval rate {dashboardStats.approvalRate}%
                            <span className="metric-trend trend-up">
                                <TrendingUp style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                +5%
                            </span>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">In Review</div>
                        <div className="metric-value">{dashboardStats.review}</div>
                        <div className="metric-sub">
                            Pending feedback
                            <span className="metric-trend trend-down">
                                <TrendingDown style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                -2%
                            </span>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Generating</div>
                        <div className="metric-value">{dashboardStats.generate}</div>
                        <div className="metric-sub">
                            Active AI jobs
                            <span className="metric-trend " style={{ color: 'var(--ink-400)' }}>
                                Stable
                            </span>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Next 7 Days</div>
                        <div className="metric-value">{dashboardStats.upcoming7}</div>
                        <div className="metric-sub">
                            Scheduled content
                            <span className="metric-trend trend-up">
                                <TrendingUp style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                +8%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Distribution Bar */}
                <div className="status-dist-wrapper">
                    <div className="status-dist-title">Pipeline Analysis</div>
                    {(() => {
                        const total = dashboardStats.total || 1;
                        const draftPct = (dashboardStats.draft / total) * 100;
                        const reviewPct = (dashboardStats.review / total) * 100;
                        const genPct = (dashboardStats.generate / total) * 100;
                        const approvedPct = (dashboardStats.approved / total) * 100;

                        return (
                            <>
                                <div className="status-dist-bar">
                                    <div className="status-dist-segment" style={{ width: `${draftPct}%`, background: 'var(--status-draft)' }} title={`Draft: ${dashboardStats.draft}`} />
                                    <div className="status-dist-segment" style={{ width: `${reviewPct}%`, background: 'var(--status-review)' }} title={`Review: ${dashboardStats.review}`} />
                                    <div className="status-dist-segment" style={{ width: `${genPct}%`, background: 'var(--status-generating)' }} title={`Generating: ${dashboardStats.generate}`} />
                                    <div className="status-dist-segment" style={{ width: `${approvedPct}%`, background: 'var(--status-approved)' }} title={`Approved: ${dashboardStats.approved}`} />
                                </div>
                                <div className="status-dist-legend">
                                    <div className="legend-item">
                                        <div className="legend-color" style={{ background: 'var(--status-draft)' }} />
                                        <span>Draft ({Math.round(draftPct)}%)</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color" style={{ background: 'var(--status-review)' }} />
                                        <span>Review ({Math.round(reviewPct)}%)</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color" style={{ background: 'var(--status-generating)' }} />
                                        <span>Generating ({Math.round(genPct)}%)</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color" style={{ background: 'var(--status-approved)' }} />
                                        <span>Approved ({Math.round(approvedPct)}%)</span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>

                <div className="dashboard-details">
                    <div className="details-card">
                        <div className="details-title">Status Breakdown</div>
                        <div className="details-grid">
                            <div>
                                <span>Draft</span>
                                <strong>{dashboardStats.draft}</strong>
                            </div>
                            <div>
                                <span>Review</span>
                                <strong>{dashboardStats.review}</strong>
                            </div>
                            <div>
                                <span>Generate</span>
                                <strong>{dashboardStats.generate}</strong>
                            </div>
                            <div>
                                <span>Approved</span>
                                <strong>{dashboardStats.approved}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="details-card">
                        <div className="details-title">Schedule Health</div>
                        <div className="details-grid">
                            <div>
                                <span>Total planned</span>
                                <strong>{dashboardStats.total}</strong>
                            </div>
                            <div>
                                <span>Next 7 days</span>
                                <strong>{dashboardStats.upcoming7}</strong>
                            </div>
                            <div>
                                <span>Approval rate</span>
                                <strong>{dashboardStats.approvalRate}%</strong>
                            </div>
                            <div>
                                <span>Needs attention</span>
                                <strong>{dashboardStats.review + dashboardStats.generate}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
