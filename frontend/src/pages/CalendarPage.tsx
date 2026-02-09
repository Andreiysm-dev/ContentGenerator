import React from 'react';
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    FilterX,
    Plus,
    Rocket,
    Search,
    SearchX,
    Target,
    Wand2,
    Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarTableSkeleton } from '@/components/LoadingState';

export type CalendarPageProps = {
    calendarSearch: string;
    setCalendarSearch: (val: string) => void;
    calendarStatusFilter: string;
    setCalendarStatusFilter: (val: string) => void;
    calendarStatusOptions: string[];
    selectedIds: string[];
    isBatchGenerating: boolean;
    isBatchReviewing: boolean;
    isBatchGeneratingImages: boolean;
    handleBatchGenerate: () => void;
    handleBatchReview: () => void;
    handleBatchGenerateImages: () => void;
    openCsvModal: () => void;
    openCopyModal: () => void;
    handleDeleteSelected: () => void;
    isBackendWaking: boolean;
    calendarError: string | null;
    isLoadingCalendar: boolean;
    calendarRows: any[];
    filteredCalendarRows: any[];
    activeCompanyId: string | undefined;
    isPageFullySelected: boolean;
    toggleSelectAllOnPage: (checked: boolean) => void;
    toggleSelectOne: (id: string, checked: boolean) => void;
    getStatusValue: (status: any) => string;
    setSelectedRow: (row: any) => void;
    setIsViewModalOpen: (open: boolean) => void;
    pageSize: number | 'all';
    setPageSize: (size: number | 'all') => void;
    page: number;
    setPage: (page: number | ((prev: number) => number)) => void;
    currentPageRows: any[];
};

export function CalendarPage(props: CalendarPageProps) {
    const {
        calendarSearch,
        setCalendarSearch,
        calendarStatusFilter,
        setCalendarStatusFilter,
        calendarStatusOptions,
        selectedIds,
        isBatchGenerating,
        isBatchReviewing,
        isBatchGeneratingImages,
        handleBatchGenerate,
        handleBatchReview,
        handleBatchGenerateImages,
        openCsvModal,
        openCopyModal,
        handleDeleteSelected,
        isBackendWaking,
        calendarError,
        isLoadingCalendar,
        calendarRows,
        filteredCalendarRows,
        activeCompanyId,
        isPageFullySelected,
        toggleSelectAllOnPage,
        toggleSelectOne,
        getStatusValue,
        setSelectedRow,
        setIsViewModalOpen,
        pageSize,
        setPageSize,
        page,
        setPage,
        currentPageRows,
    } = props;

    const navigate = useNavigate();

    return (
        <main className="app-main">
            <section className="card card-secondary calendar-card">
                <div className="card-header card-header-compact" style={{ alignItems: 'center' }}>
                    <h2 className="card-title">Content Calendar</h2>
                    <div className="calendar-controls">
                        {(calendarSearch || calendarStatusFilter !== 'all') && (
                            <button
                                type="button"
                                className="btn-clear-filters"
                                onClick={() => {
                                    setCalendarSearch('');
                                    setCalendarStatusFilter('all');
                                }}
                            >
                                <FilterX style={{ width: '12px', height: '12px' }} />
                                Clear filters
                            </button>
                        )}
                        <div className="calendar-search-group">
                            <Search className="calendar-search-icon" style={{ width: '14px', height: '14px' }} />
                            <input
                                type="search"
                                className="field-input calendar-search-input"
                                placeholder="Search calendar..."
                                value={calendarSearch}
                                onChange={(e) => setCalendarSearch(e.target.value)}
                            />
                        </div>
                        <div className="calendar-filter-group">
                            <span className="calendar-filter-label">
                                <Filter style={{ width: '14px', height: '14px' }} />
                                Status
                            </span>
                            <select
                                className="field-input select-input calendar-filter-select"
                                value={calendarStatusFilter}
                                onChange={(e) => setCalendarStatusFilter(e.target.value)}
                            >
                                {calendarStatusOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt === 'all' ? 'All' : opt}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--ink-400)' }} />
                        </div>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="bulk-actions-bar">
                        <div className="bulk-actions-label">
                            Selected actions
                            <span className="bulk-actions-count">{selectedIds.length} selected</span>
                        </div>
                        <div className="bulk-actions-spacer" />
                        <div className="bulk-actions-group bulk-actions-group--workflow">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm bulk-action-primary"
                                onClick={handleBatchGenerate}
                                disabled={isBatchGenerating}
                            >
                                {isBatchGenerating ? 'Generating…' : 'Generate'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm bulk-action-secondary"
                                onClick={handleBatchReview}
                                disabled={isBatchReviewing}
                            >
                                {isBatchReviewing ? 'Reviewing…' : 'Review'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm bulk-action-secondary"
                                onClick={handleBatchGenerateImages}
                                disabled={isBatchGeneratingImages}
                            >
                                {isBatchGeneratingImages ? 'Generating…' : 'Generate Image'}
                            </button>
                        </div>
                        <div className="bulk-actions-group bulk-actions-group--utilities">
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm bulk-action-utility"
                                onClick={openCsvModal}
                            >
                                Export CSV
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm bulk-action-utility"
                                onClick={openCopyModal}
                            >
                                Copy for Sheets
                            </button>
                        </div>
                        <div className="bulk-actions-group bulk-actions-group--destructive">
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm bulk-action-destructive"
                                onClick={handleDeleteSelected}
                            >
                                Delete ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                )}

                {isBackendWaking && (
                    <div className="empty-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="loading-spinner" aria-hidden="true"></span>
                        Loading system..
                    </div>
                )}

                {calendarError && !isBackendWaking && (
                    <div className="empty-state" style={{ color: '#b91c1c' }}>
                        {calendarError}
                    </div>
                )}

                {isLoadingCalendar && !calendarError && (
                    <CalendarTableSkeleton />
                )}
                {!isLoadingCalendar && !calendarError && calendarRows.length === 0 && (
                    <div className="empty-state">
                        <FileText className="empty-state-icon" aria-hidden />
                        <span className="empty-state-title">No content yet</span>
                        <p>Import rows or generate content to get started. Your calendar will appear here.</p>
                        <div className="empty-state-cta">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => activeCompanyId && navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`)}
                                disabled={!activeCompanyId}
                            >
                                <Plus className="h-4 w-4" />
                                Go to Content Generator
                            </button>
                        </div>
                    </div>
                )}
                {!isLoadingCalendar && !calendarError && calendarRows.length > 0 && filteredCalendarRows.length === 0 && (
                    <div className="empty-state">
                        <SearchX className="empty-state-icon" aria-hidden />
                        <span className="empty-state-title">No matching rows</span>
                        <p>Try adjusting your search or filter to see more content.</p>
                    </div>
                )}
                {!isLoadingCalendar && filteredCalendarRows.length > 0 && (
                    <div className="calendar-table-wrapper">
                        <table className="calendar-table">
                            <thead>
                                <tr>
                                    <th className="calendar-col calendar-col--checkbox">
                                        <input
                                            type="checkbox"
                                            checked={isPageFullySelected}
                                            onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                                        />
                                    </th>
                                    <th className="calendar-col calendar-col--primary">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <CalendarDays style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                                            Date
                                        </div>
                                    </th>
                                    <th className="calendar-col calendar-col--primary calendar-col--theme">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Wand2 style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                                            Theme / Content
                                        </div>
                                    </th>
                                    <th className="calendar-col calendar-col--muted">Brand / Promo</th>
                                    <th className="calendar-col">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Target style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                                            Channel / Target
                                        </div>
                                    </th>
                                    <th className="calendar-col">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Rocket style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                                            Primary / CTA
                                        </div>
                                    </th>
                                    <th className="calendar-col calendar-col--status">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Activity style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                                            Status
                                        </div>
                                    </th>
                                    <th className="calendar-col calendar-col--actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPageRows.map((row) => {
                                    const currentStatus = getStatusValue(row.status) || 'Draft';
                                    const statusClass = currentStatus.toLowerCase().replace(/\s+/g, '-');
                                    return (
                                        <tr key={row.contentCalendarId} className={`calendar-row calendar-row--${statusClass}`}>
                                            <td className="calendar-cell calendar-cell--checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(row.contentCalendarId)}
                                                    onChange={(e) => toggleSelectOne(row.contentCalendarId, e.target.checked)}
                                                />
                                            </td>
                                            <td className="calendar-cell calendar-cell--primary">
                                                <div className="calendar-cell-date">{row.date ?? '—'}</div>
                                            </td>
                                            <td className="calendar-cell calendar-cell--theme">
                                                <div className="calendar-cell-stack">
                                                    <span className="calendar-cell-title">{row.theme || '—'}</span>
                                                    {row.contentType && (
                                                        <span className="calendar-cell-meta">{row.contentType}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="calendar-cell">
                                                <div className="calendar-cell-stack calendar-cell-stack--muted">
                                                    {row.brandHighlight && (
                                                        <span className="calendar-cell-meta">{row.brandHighlight}</span>
                                                    )}
                                                    {(row.crossPromo || row.promoType) && (
                                                        <span className="calendar-cell-meta">
                                                            {[row.crossPromo, row.promoType].filter(Boolean).join(' • ')}
                                                        </span>
                                                    )}
                                                    {!row.brandHighlight && !row.crossPromo && !row.promoType && (
                                                        <span className="calendar-cell-empty">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="calendar-cell">
                                                <div className="calendar-cell-stack">
                                                    {row.channels && (
                                                        <span className="calendar-cell-title">{row.channels}</span>
                                                    )}
                                                    {row.targetAudience && (
                                                        <span className="calendar-cell-meta">{row.targetAudience}</span>
                                                    )}
                                                    {!row.channels && !row.targetAudience && (
                                                        <span className="calendar-cell-empty">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="calendar-cell">
                                                <div className="calendar-cell-stack">
                                                    {row.primaryGoal && (
                                                        <span className="calendar-cell-title">{row.primaryGoal}</span>
                                                    )}
                                                    {row.cta && (
                                                        <span className="calendar-cell-meta">{row.cta}</span>
                                                    )}
                                                    {!row.primaryGoal && !row.cta && (
                                                        <span className="calendar-cell-empty">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="calendar-cell calendar-cell--status">
                                                {(() => {
                                                    const currentStatus = getStatusValue(row.status) || 'Draft';
                                                    const statusClass = currentStatus.toLowerCase().replace(/\s+/g, '-');
                                                    return (
                                                        <span className={`status-badge ${statusClass}`}>
                                                            {currentStatus}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="calendar-cell calendar-cell--actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm calendar-action-btn"
                                                    onClick={() => {
                                                        setSelectedRow(row);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="calendar-pagination">
                            <div className="calendar-pagination-left">
                                <div className="pagination-rows-size">
                                    <span className="pagination-label">
                                        Rows per page
                                    </span>
                                    <div className="pagination-select-container">
                                        <select
                                            className="pagination-select"
                                            value={pageSize}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setPage(1);
                                                setPageSize(value === 'all' ? 'all' : Number(value));
                                            }}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value="all">All</option>
                                        </select>
                                        <ChevronDown className="pagination-select-icon" />
                                    </div>
                                </div>
                                <div className="pagination-divider" />
                                <span className="pagination-summary">
                                    Showing <strong>{currentPageRows.length}</strong> of {filteredCalendarRows.length}
                                </span>
                            </div>

                            <div className="calendar-pagination-right">
                                {pageSize !== 'all' && (
                                    <>
                                        <div className="pagination-controls">
                                            <button
                                                type="button"
                                                className="pagination-btn"
                                                disabled={page <= 1}
                                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                                title="Previous page"
                                            >
                                                <ChevronLeft style={{ width: '16px', height: '16px' }} />
                                            </button>
                                            <div className="pagination-page-info">
                                                <span className="current-page">{page}</span>
                                                <span className="page-separator">of</span>
                                                <span className="total-pages">{Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1)))}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="pagination-btn"
                                                disabled={page >= Math.ceil(filteredCalendarRows.length / (pageSize || 1))}
                                                onClick={() =>
                                                    setPage((prev) =>
                                                        Math.min(
                                                            Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1))),
                                                            prev + 1,
                                                        ),
                                                    )
                                                }
                                                title="Next page"
                                            >
                                                <ChevronRight style={{ width: '16px', height: '16px' }} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
