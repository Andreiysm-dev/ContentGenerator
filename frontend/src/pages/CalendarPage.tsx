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

function statusKey(status: string) {
    return (status || 'Draft').toLowerCase().replace(/\s+/g, '-');
}

function statusBadgeClasses(key: string) {
    // You can tweak colors here freely; these are calm + readable.
    switch (key) {
        case 'approved':
            return 'bg-[#3fa9f5]/10 text-[#3fa9f5] border-[#3fa9f5]/20';
        case 'review':
        case 'needs-review':
            return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
        case 'needs-revision':
            return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        case 'design-complete':
        case 'design-completed':
            return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
        case 'generating':
        case 'generate':
            return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
        case 'pending':
            return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
        case 'draft':
        default:
            return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
    }
}

function rowAccentClasses(key: string) {
    // Left accent bar colors similar to your CSS.
    switch (key) {
        case 'approved':
            return 'border-l-[#3fa9f5]';
        case 'review':
        case 'needs-review':
            return 'border-l-purple-500';
        case 'design-complete':
        case 'design-completed':
            return 'border-l-indigo-500';
        case 'generating':
        case 'generate':
            return 'border-l-sky-500';
        case 'pending':
            return 'border-l-amber-500';
        case 'approved-with-edits':
            return 'border-l-violet-500';
        case 'draft':
        default:
            return 'border-l-slate-300';
    }
}

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

    const showClear = Boolean(calendarSearch) || calendarStatusFilter !== 'all';

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
            <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6">
                <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:border-brand-primary/20 hover:shadow-lg transition-all duration-300">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-dark tracking-tight font-display">
                                Content Calendar
                            </h2>
                            <p className="mt-1 text-sm text-brand-dark/60 font-medium">
                                Plan, generate, review, and track content status.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            {showClear && (
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white text-rose-600 border border-slate-200/70 shadow-sm transition hover:bg-rose-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2"
                                    onClick={() => {
                                        setCalendarSearch('');
                                        setCalendarStatusFilter('all');
                                    }}
                                >
                                    <FilterX className="h-4 w-4" />
                                    Clear filters
                                </button>
                            )}

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="search"
                                    className="w-full sm:w-[320px] focus:sm:w-[400px] transition-all rounded-xl border border-slate-200/70 bg-white pl-10 pr-3 py-2.5 text-sm font-medium text-brand-dark placeholder:text-slate-400 outline-none focus:border-[#3fa9f5]/50 focus:ring-4 focus:ring-[#3fa9f5]/10"
                                    placeholder="Search calendar..."
                                    value={calendarSearch}
                                    onChange={(e) => setCalendarSearch(e.target.value)}
                                />
                            </div>

                            {/* Status filter */}
                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 shadow-sm">
                                <span className="inline-flex items-center gap-2 text-[0.78rem] font-bold text-brand-dark/60 whitespace-nowrap">
                                    <Filter className="h-4 w-4" />
                                    Status
                                </span>

                                <div className="relative">
                                    <select
                                        className="appearance-none bg-transparent pr-7 pl-2 py-1 text-sm font-semibold text-brand-dark outline-none cursor-pointer"
                                        value={calendarStatusFilter}
                                        onChange={(e) => setCalendarStatusFilter(e.target.value)}
                                    >
                                        {calendarStatusOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt === 'all' ? 'All' : opt}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 shadow-sm">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="flex items-start gap-3">
                                    <div className="text-sm font-bold text-brand-dark">Selected actions</div>
                                    <span className="inline-flex items-center rounded-full bg-[#3fa9f5]/10 px-2.5 py-1 text-xs font-bold text-[#3fa9f5]">
                                        {selectedIds.length} selected
                                    </span>
                                </div>

                                <div className="lg:ml-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    {/* Workflow */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleBatchGenerate}
                                            disabled={isBatchGenerating}
                                        >
                                            {isBatchGenerating ? 'Generating…' : 'Generate'}
                                        </button>

                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleBatchReview}
                                            disabled={isBatchReviewing}
                                        >
                                            {isBatchReviewing ? 'Reviewing…' : 'Review'}
                                        </button>

                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleBatchGenerateImages}
                                            disabled={isBatchGeneratingImages}
                                        >
                                            {isBatchGeneratingImages ? 'Generating…' : 'Generate Image'}
                                        </button>
                                    </div>

                                    {/* Utilities */}
                                    <div className="h-px w-full bg-slate-200/70 sm:hidden" />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
                                            onClick={openCsvModal}
                                        >
                                            Export CSV
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
                                            onClick={openCopyModal}
                                        >
                                            Copy for Sheets
                                        </button>
                                    </div>

                                    {/* Destructive */}
                                    <div className="h-px w-full bg-slate-200/70 sm:hidden" />
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-rose-700 border border-slate-200/70 shadow-sm transition hover:bg-rose-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2"
                                        onClick={handleDeleteSelected}
                                    >
                                        Delete ({selectedIds.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Backend waking / errors */}
                    {isBackendWaking && (
                        <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-3">
                            <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" aria-hidden="true" />
                            <div className="text-sm font-medium text-brand-dark/70">Loading system…</div>
                        </div>
                    )}

                    {calendarError && !isBackendWaking && (
                        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
                            {calendarError}
                        </div>
                    )}

                    {/* Loading */}
                    {isLoadingCalendar && !calendarError && <CalendarTableSkeleton />}

                    {/* Empty states */}
                    {!isLoadingCalendar && !calendarError && calendarRows.length === 0 && (
                        <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                                <FileText className="h-6 w-6 text-brand-dark/60" aria-hidden />
                            </div>
                            <div className="text-base font-bold text-brand-dark">No content yet</div>
                            <p className="mt-1 text-sm text-brand-dark/60">
                                Import rows or generate content to get started. Your calendar will appear here.
                            </p>
                            <div className="mt-6 flex justify-center">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#3fa9f5] text-white shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-[#2f97e6] active:bg-[#2b8bd3] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/35 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={() =>
                                        activeCompanyId &&
                                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`)
                                    }
                                    disabled={!activeCompanyId}
                                >
                                    <Plus className="h-4 w-4" />
                                    Go to Content Generator
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLoadingCalendar && !calendarError && calendarRows.length > 0 && filteredCalendarRows.length === 0 && (
                        <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                                <SearchX className="h-6 w-6 text-brand-dark/60" aria-hidden />
                            </div>
                            <div className="text-base font-bold text-brand-dark">No matching rows</div>
                            <p className="mt-1 text-sm text-brand-dark/60">
                                Try adjusting your search or filter to see more content.
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    {!isLoadingCalendar && !calendarError && filteredCalendarRows.length > 0 && (
                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-fixed text-sm">
                                    <thead className="sticky top-0 z-10 bg-white">
                                        <tr className="border-b border-slate-200/70">
                                            <th className="w-11 px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={isPageFullySelected}
                                                    onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                                                    className="h-4 w-4 accent-[#3fa9f5]"
                                                />
                                            </th>

                                            <th className="w-[120px] px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                <span className="inline-flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 opacity-70" />
                                                    Date
                                                </span>
                                            </th>

                                            <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                <span className="inline-flex items-center gap-2">
                                                    <Wand2 className="h-4 w-4 opacity-70" />
                                                    Theme / Content
                                                </span>
                                            </th>

                                            <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                Brand / Promo
                                            </th>

                                            <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                <span className="inline-flex items-center gap-2">
                                                    <Target className="h-4 w-4 opacity-70" />
                                                    Channel / Target
                                                </span>
                                            </th>

                                            <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                <span className="inline-flex items-center gap-2">
                                                    <Rocket className="h-4 w-4 opacity-70" />
                                                    Primary / CTA
                                                </span>
                                            </th>

                                            <th className="w-[140px] px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                <span className="inline-flex items-center gap-2">
                                                    <Activity className="h-4 w-4 opacity-70" />
                                                    Status
                                                </span>
                                            </th>

                                            <th className="w-[120px] px-4 py-3 text-center text-[0.72rem] font-bold uppercase tracking-widest text-brand-dark/60">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {currentPageRows.map((row) => {
                                            const currentStatus = getStatusValue(row.status) || 'Draft';
                                            const key = statusKey(currentStatus);

                                            return (
                                                <tr
                                                    key={row.contentCalendarId}
                                                    className={[
                                                        'border-b border-slate-200/50 align-top',
                                                        'hover:bg-[#3fa9f5]/[0.06] transition-colors',
                                                        'border-l-4',
                                                        rowAccentClasses(key),
                                                    ].join(' ')}
                                                >
                                                    <td className="w-11 px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(row.contentCalendarId)}
                                                            onChange={(e) => toggleSelectOne(row.contentCalendarId, e.target.checked)}
                                                            className="h-4 w-4 accent-[#3fa9f5]"
                                                        />
                                                    </td>

                                                    <td className="w-[120px] px-4 py-3">
                                                        <div className="text-sm font-medium text-brand-dark/80">
                                                            {row.date ?? '—'}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-semibold text-brand-dark">
                                                                {row.theme || '—'}
                                                            </span>
                                                            {row.contentType ? (
                                                                <span className="text-xs text-brand-dark/60">{row.contentType}</span>
                                                            ) : null}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1 text-brand-dark/80">
                                                            {row.brandHighlight ? (
                                                                <span className="text-xs text-brand-dark/60">{row.brandHighlight}</span>
                                                            ) : null}

                                                            {(row.crossPromo || row.promoType) ? (
                                                                <span className="text-xs text-brand-dark/60">
                                                                    {[row.crossPromo, row.promoType].filter(Boolean).join(' • ')}
                                                                </span>
                                                            ) : null}

                                                            {!row.brandHighlight && !row.crossPromo && !row.promoType && (
                                                                <span className="text-sm text-brand-dark/30">—</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            {row.channels ? (
                                                                <span className="text-sm font-semibold text-brand-dark">{row.channels}</span>
                                                            ) : null}
                                                            {row.targetAudience ? (
                                                                <span className="text-xs text-brand-dark/60">{row.targetAudience}</span>
                                                            ) : null}
                                                            {!row.channels && !row.targetAudience && (
                                                                <span className="text-sm text-brand-dark/30">—</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            {row.primaryGoal ? (
                                                                <span className="text-sm font-semibold text-brand-dark">{row.primaryGoal}</span>
                                                            ) : null}
                                                            {row.cta ? (
                                                                <span className="text-xs text-brand-dark/60">{row.cta}</span>
                                                            ) : null}
                                                            {!row.primaryGoal && !row.cta && (
                                                                <span className="text-sm text-brand-dark/30">—</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="w-[140px] px-4 py-3">
                                                        <span
                                                            className={[
                                                                'inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold capitalize whitespace-nowrap',
                                                                statusBadgeClasses(key),
                                                            ].join(' ')}
                                                        >
                                                            {currentStatus}
                                                        </span>
                                                    </td>

                                                    <td className="w-[120px] px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold bg-white text-brand-dark border border-slate-200/70 shadow-sm transition hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2"
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
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/70 bg-slate-50 px-5 py-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-brand-dark/60 whitespace-nowrap">
                                            Rows per page
                                        </span>

                                        <div className="relative">
                                            <select
                                                className="appearance-none rounded-lg border border-slate-200/70 bg-white px-3 py-2 pr-8 text-sm font-semibold text-brand-dark shadow-sm transition hover:border-[#3fa9f5]/30 focus:outline-none focus:ring-2 focus:ring-[#3fa9f5]/20"
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
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="hidden sm:block h-5 w-px bg-slate-200/70" />

                                    <div className="text-sm text-brand-dark/60">
                                        Showing <strong className="text-brand-dark">{currentPageRows.length}</strong> of{' '}
                                        {filteredCalendarRows.length}
                                    </div>
                                </div>

                                {pageSize !== 'all' && (
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm">
                                        <button
                                            type="button"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-dark/70 transition hover:bg-[#3fa9f5]/10 hover:text-[#3fa9f5] disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={page <= 1}
                                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                            title="Previous page"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        <div className="px-2 text-sm font-semibold">
                                            <span className="text-[#3fa9f5]">{page}</span>{' '}
                                            <span className="text-slate-400 font-medium">of</span>{' '}
                                            <span className="text-brand-dark">
                                                {Math.max(1, Math.ceil(filteredCalendarRows.length / (pageSize || 1)))}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-dark/70 transition hover:bg-[#3fa9f5]/10 hover:text-[#3fa9f5] disabled:opacity-30 disabled:cursor-not-allowed"
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
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
