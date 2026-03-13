import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SOKMED_COLUMNS } from '@/pages/Workboard/types';
import { VIEW_MODAL_POLL_MS } from '@/constants/app';
import { useCalendarQuery } from '@/hooks/useCalendarQuery';
import { getAttachedDesignUrls, getImageGeneratedSignature } from '@/utils/contentUtils';

type Notify = (message: string, tone?: 'success' | 'error' | 'info') => void;

interface UseCalendarBoardOptions {
  session: Session | null;
  activeCompanyId?: string | null;
  activeCompany?: any;
  pathname: string;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  supabase: any;
  getStatusValue: (status: any) => string;
  notify: Notify;
}

export function useCalendarBoard({
  session,
  activeCompanyId,
  activeCompany,
  pathname,
  authedFetch,
  backendBaseUrl,
  supabase,
  getStatusValue,
  notify,
}: UseCalendarBoardOptions) {
  const [calendarRows, setCalendarRows] = useState<any[]>([]);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarStatusFilter, setCalendarStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagePreviewNonce, setImagePreviewNonce] = useState(0);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftPublishIntent, setDraftPublishIntent] = useState<'draft' | 'ready'>('draft');
  const [isUploadingDesigns, setIsUploadingDesigns] = useState(false);
  const [imagePollError, setImagePollError] = useState<string | null>(null);
  const [isEditingDmp, setIsEditingDmp] = useState(false);
  const [dmpDraft, setDmpDraft] = useState('');

  const imageModalPollRef = useRef<number | null>(null);
  const suppressImageModalCloseCleanupRef = useRef(false);
  const reopenImageModalOnImageReadyRef = useRef(false);
  const imageModalReopenTimeoutRef = useRef<number | null>(null);
  const viewModalPollRef = useRef<number | null>(null);
  const recentStatusMoves = useRef<Map<string, { status: string; originalStatus?: any; ts: number }>>(new Map());
  const calendarQuery = useCalendarQuery(
    authedFetch,
    backendBaseUrl,
    activeCompanyId ?? undefined,
    !!session,
    recentStatusMoves,
    getStatusValue,
  );

  const isLoadingCalendar = calendarQuery.isLoading && calendarRows.length === 0;
  const calendarError = calendarQuery.error instanceof Error ? calendarQuery.error.message : null;
  const isBackendWaking = calendarQuery.isLoading && calendarRows.length === 0;

  const handleUploadDesigns = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return;
    const client = supabase;
    if (!client) {
      notify('Supabase is not configured.', 'error');
      return;
    }
    if (!selectedRow) return;
    setIsUploadingDesigns(true);
    try {
      const uploads = Array.from(files).map(async (file) => {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large (max 50MB)`);
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `designs/${selectedRow.contentCalendarId}-${Date.now()}-${safeName}`;
        const { error } = await client.storage.from('generated-images').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = client.storage.from('generated-images').getPublicUrl(path);
        return data?.publicUrl || '';
      });

      const uploadedUrls = (await Promise.all(uploads)).filter(Boolean);
      const existing = getAttachedDesignUrls(selectedRow);
      const nextDesigns = [...existing, ...uploadedUrls];

      const payload = { attachedDesign: nextDesigns };
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        notify(`Failed to save designs. ${msg}`, 'error');
        return;
      }
      setSelectedRow((prev: any) => (prev ? { ...prev, attachedDesign: nextDesigns } : prev));
      setCalendarRows((prev) =>
        prev.map((row) => (row.contentCalendarId === selectedRow.contentCalendarId ? { ...row, attachedDesign: nextDesigns } : row)),
      );
      notify('Designs uploaded.', 'success');
    } catch (err: any) {
      console.error('Design upload failed', err);
      const errorMsg = err.message || 'Failed to upload designs';
      notify(errorMsg, 'error');
      if (errorMsg.toLowerCase().includes('size') || errorMsg.toLowerCase().includes('limit')) {
        notify('Hint: Check your Supabase Storage bucket max file size settings.', 'info');
      }
    } finally {
      setIsUploadingDesigns(false);
    }
  }, [authedFetch, backendBaseUrl, notify, selectedRow, supabase]);

  const handleDraftPublishIntent = useCallback(async (overrideStatus?: string) => {
    if (!selectedRow) return;

    const studioSettings = activeCompany?.kanban_settings?.studio_settings;
    const nextStatus = overrideStatus || (draftPublishIntent === 'ready'
      ? (studioSettings?.postedStatus || 'Ready')
      : (selectedRow.status ?? ''));

    const nextPostStatus = draftPublishIntent === 'ready' ? 'ready' : 'draft';
    const payload = { status: nextStatus, post_status: nextPostStatus };
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        notify(`Failed to update status. ${msg}`, 'error');
        return;
      }
      setSelectedRow((prev: any) => (prev ? { ...prev, ...payload } : prev));
      setCalendarRows((prev) =>
        prev.map((row) => (row.contentCalendarId === selectedRow.contentCalendarId ? { ...row, ...payload } : row)),
      );
      setIsDraftModalOpen(false);
      notify(draftPublishIntent === 'ready' ? 'Marked as ready to publish.' : 'Saved as draft.', 'success');
    } catch {
      notify('Failed to update status.', 'error');
    }
  }, [activeCompany, authedFetch, backendBaseUrl, draftPublishIntent, notify, selectedRow]);

  const fetchLatestContentRow = useCallback(async (rowId: any): Promise<any | null> => {
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${rowId}?t=${Date.now()}`, {
        cache: 'no-store' as RequestCache,
      });
      if (res.ok) {
        const data = await res.json();
        const unwrapped = (data && (data.contentCalendar || data)) as any;
        return Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;
      }
    } catch {
      // ignore
    }

    try {
      if (!activeCompanyId) return null;
      const listRes = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`, {
        cache: 'no-store' as RequestCache,
      });
      if (!listRes.ok) return null;
      const listData = await listRes.json();
      const unwrappedList = (listData && (listData.contentCalendars || listData)) as any;
      const rows = Array.isArray(unwrappedList) ? unwrappedList : [];
      return Array.isArray(rows) ? rows.find((row: any) => row.contentCalendarId === rowId) || null : null;
    } catch {
      return null;
    }
  }, [activeCompanyId, authedFetch, backendBaseUrl]);

  const startWaitingForImageUpdate = useCallback((baseSignature: string | null) => {
    const rowId = selectedRow?.contentCalendarId;
    if (!rowId) return;
    setImagePollError(null);

    if (imageModalPollRef.current) {
      clearInterval(imageModalPollRef.current);
      imageModalPollRef.current = null;
    }

    let canceled = false;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const latest = await fetchLatestContentRow(rowId);
        if (canceled || !latest) return;

        setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
        setCalendarRows((prev) =>
          prev.map((row) => (row.contentCalendarId === rowId ? { ...row, ...latest } : row)),
        );

        if (isGeneratingImage) {
          setImagePreviewNonce(Date.now());
        }

        const sig = getImageGeneratedSignature(latest);
        const hasNew = sig && sig !== baseSignature;
        if (hasNew) {
          if (imageModalPollRef.current) {
            clearInterval(imageModalPollRef.current);
            imageModalPollRef.current = null;
          }
          setImagePreviewNonce(Date.now());
          setIsGeneratingImage(false);
          reopenImageModalOnImageReadyRef.current = false;
        }

        if (Date.now() - startedAt > 2 * 60 * 1000) {
          if (imageModalPollRef.current) {
            clearInterval(imageModalPollRef.current);
            imageModalPollRef.current = null;
          }
          setIsGeneratingImage(false);
          setImagePollError('Timed out waiting for image. Please try Refresh image.');
        }
      } catch {
        if (canceled) return;
        setImagePollError('Error while waiting for image. Please try Refresh image.');
      }
    };

    tick();
    imageModalPollRef.current = window.setInterval(tick, VIEW_MODAL_POLL_MS);
    return () => {
      canceled = true;
    };
  }, [fetchLatestContentRow, isGeneratingImage, selectedRow?.contentCalendarId]);

  const loadCalendar = useCallback(async () => {
    if (!session || !activeCompanyId) return;
    await calendarQuery.refetch();
  }, [activeCompanyId, calendarQuery, session]);

  const filteredCalendarRows = useMemo(() => {
    const isArchivesTab = pathname.includes('/calendar/published');
    const search = calendarSearch.trim().toLowerCase();
    const statusFilter = calendarStatusFilter.toLowerCase();
    const kanbanCols = (activeCompany as any)?.kanban_settings?.columns || SOKMED_COLUMNS;

    const filtered = calendarRows.filter((row) => {
      const statusValue = getStatusValue(row.status).toLowerCase();
      const rawId = typeof row.status === 'string' ? row.status.toLowerCase() : (row.status?.state?.toLowerCase() || '');
      const isArchived = statusValue === 'archived' || rawId === 'archived';

      const colMatch = kanbanCols.find((column: any) =>
        column.id.toLowerCase() === statusValue || column.title.toLowerCase() === statusValue,
      );
      const displayStatus = colMatch ? colMatch.title.toLowerCase() : statusValue;

      if (isArchivesTab) {
        if (!isArchived) return false;
      } else if (isArchived) {
        return false;
      }

      if (statusFilter !== 'all' && displayStatus !== statusFilter) return false;

      if (!search) return true;
      const haystack = [
        row.brandHighlight,
        row.crossPromo,
        row.theme,
        row.contentType,
        row.channels,
        row.targetAudience,
        row.primaryGoal,
        row.cta,
        row.promoType,
        row.date,
        row.finalCaption,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(search);
    });

    return filtered.sort((a, b) => {
      const parseDate = (row: any): number => {
        if (row.date) {
          const dateStr = row.date.toString().trim();
          let parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();
          const currentYear = new Date().getFullYear();
          parsedDate = new Date(`${dateStr} ${currentYear}`);
          if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();
        }
        if (row.created_at) {
          const createdDate = new Date(row.created_at);
          if (!isNaN(createdDate.getTime())) return createdDate.getTime();
        }
        return 0;
      };
      return parseDate(a) - parseDate(b);
    });
  }, [activeCompany, calendarRows, calendarSearch, calendarStatusFilter, getStatusValue, pathname]);

  const calendarStatusOptions = useMemo(() => {
    const columns = (activeCompany as any)?.kanban_settings?.columns || SOKMED_COLUMNS;
    return ['all', ...columns.map((column: any) => column.title)];
  }, [activeCompany]);

  const currentPageRows = useMemo(() => {
    if (pageSize === 'all') return filteredCalendarRows;
    const start = (page - 1) * pageSize;
    return filteredCalendarRows.slice(start, start + pageSize);
  }, [filteredCalendarRows, page, pageSize]);

  const isPageFullySelected = useMemo(() => {
    const ids = currentPageRows.map((row) => row.contentCalendarId);
    return ids.length > 0 && ids.every((id) => selectedIds.includes(id));
  }, [currentPageRows, selectedIds]);

  const toggleSelectAllOnPage = useCallback((checked: boolean) => {
    const ids = currentPageRows.map((row) => row.contentCalendarId).filter(Boolean);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return Array.from(next);
    });
  }, [currentPageRows]);

  const toggleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });
  }, []);

  useEffect(() => {
    setCalendarRows([]);
    setSelectedIds([]);
  }, [activeCompanyId]);

  useEffect(() => {
    if (!isImageModalOpen) return;
    setImagePreviewNonce(Date.now());
  }, [isImageModalOpen]);

  useEffect(() => {
    const queryRows = Array.isArray(calendarQuery.data) ? calendarQuery.data : [];
    if (!activeCompanyId) {
      setCalendarRows([]);
      return;
    }
    if (!queryRows.length && !calendarQuery.isSuccess) return;
    setCalendarRows((prev) => (JSON.stringify(prev) === JSON.stringify(queryRows) ? prev : queryRows));
  }, [activeCompanyId, calendarQuery.data, calendarQuery.isSuccess]);

  useEffect(() => {
    const rowId = selectedRow?.contentCalendarId;
    if (!isViewModalOpen || !rowId) {
      if (viewModalPollRef.current) {
        clearInterval(viewModalPollRef.current);
        viewModalPollRef.current = null;
      }
      return;
    }

    let canceled = false;

    const fetchLatest = async () => {
      try {
        const latest = await fetchLatestContentRow(rowId);
        if (canceled || !latest) return;

        const prevStatus = selectedRow ? getStatusValue(selectedRow.status) : null;
        const newStatus = getStatusValue(latest.status);

        setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
        setCalendarRows((prev) =>
          prev.map((row) => (row.contentCalendarId === rowId ? { ...row, ...latest } : row)),
        );

        if (isGeneratingCaption && prevStatus === 'Generate' && newStatus !== 'Generate') {
          setIsGeneratingCaption(false);
        }
      } catch {
        // ignore polling errors
      }
    };

    fetchLatest();
    viewModalPollRef.current = window.setInterval(fetchLatest, VIEW_MODAL_POLL_MS);

    return () => {
      canceled = true;
      if (viewModalPollRef.current) {
        clearInterval(viewModalPollRef.current);
        viewModalPollRef.current = null;
      }
    };
  }, [fetchLatestContentRow, getStatusValue, isGeneratingCaption, isViewModalOpen, selectedRow, selectedRow?.contentCalendarId]);

  useEffect(() => {
    if (!isImageModalOpen) return;
    const rowId = selectedRow?.contentCalendarId;
    if (!rowId) return;

    (async () => {
      const latest = await fetchLatestContentRow(rowId);
      if (!latest) return;
      setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
      setCalendarRows((prev) => prev.map((row) => (row.contentCalendarId === rowId ? { ...row, ...latest } : row)));
      setIsEditingDmp(false);
      setDmpDraft(typeof (latest as any).dmp === 'string' ? (latest as any).dmp : '');
      setImagePreviewNonce(Date.now());
    })();
  }, [fetchLatestContentRow, isImageModalOpen, selectedRow?.contentCalendarId]);

  useEffect(() => {
    if (!selectedRow || !isImageModalOpen || isEditingDmp) return;
    if (selectedRow.dmp !== dmpDraft) {
      setDmpDraft(selectedRow.dmp || '');
    }
  }, [selectedRow?.dmp, isImageModalOpen, isEditingDmp, dmpDraft]);

  useEffect(() => {
    if (!isImageModalOpen || !selectedRow) return;
    setImagePreviewNonce(Date.now());
  }, [isImageModalOpen, selectedRow?.imageGenerated]);

  useEffect(() => {
    if (isImageModalOpen) return;
    if (suppressImageModalCloseCleanupRef.current) {
      suppressImageModalCloseCleanupRef.current = false;
      return;
    }
    if (imageModalPollRef.current) {
      clearInterval(imageModalPollRef.current);
      imageModalPollRef.current = null;
    }
    setIsGeneratingImage(false);
    setImagePollError(null);
  }, [isImageModalOpen]);

  useEffect(() => {
    return () => {
      if (imageModalReopenTimeoutRef.current) {
        clearTimeout(imageModalReopenTimeoutRef.current);
        imageModalReopenTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isViewModalOpen || !selectedRow || !calendarRows.length) return;
    const currentInList = calendarRows.find((row: any) => row.contentCalendarId === selectedRow.contentCalendarId);
    if (!currentInList) return;
    const hasChanged =
      currentInList.status !== selectedRow.status ||
      currentInList.finalCaption !== selectedRow.finalCaption ||
      currentInList.imageGenerated !== selectedRow.imageGenerated;
    if (hasChanged) {
      setSelectedRow((prev: any) => (prev ? { ...prev, ...currentInList } : prev));
    }
  }, [calendarRows, isViewModalOpen, selectedRow]);

  useEffect(() => {
    const effectivePageSize = pageSize === 'all' ? filteredCalendarRows.length || 1 : pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredCalendarRows.length / effectivePageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filteredCalendarRows.length, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [calendarSearch, calendarStatusFilter]);

  return {
    calendarRows,
    setCalendarRows,
    isLoadingCalendar,
    calendarError,
    isBackendWaking,
    calendarSearch,
    setCalendarSearch,
    calendarStatusFilter,
    setCalendarStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    setSelectedIds,
    isViewModalOpen,
    setIsViewModalOpen,
    selectedRow,
    setSelectedRow,
    isImageModalOpen,
    setIsImageModalOpen,
    imagePreviewNonce,
    setImagePreviewNonce,
    isGeneratingCaption,
    setIsGeneratingCaption,
    isGeneratingImage,
    setIsGeneratingImage,
    isDraftModalOpen,
    setIsDraftModalOpen,
    draftPublishIntent,
    setDraftPublishIntent,
    isUploadingDesigns,
    imagePollError,
    isEditingDmp,
    setIsEditingDmp,
    dmpDraft,
    setDmpDraft,
    handleUploadDesigns,
    handleDraftPublishIntent,
    fetchLatestContentRow,
    startWaitingForImageUpdate,
    loadCalendar,
    filteredCalendarRows,
    calendarStatusOptions,
    currentPageRows,
    isPageFullySelected,
    toggleSelectAllOnPage,
    toggleSelectOne,
    recentStatusMoves,
    imageModalPollRef,
    suppressImageModalCloseCleanupRef,
    reopenImageModalOnImageReadyRef,
    imageModalReopenTimeoutRef,
  };
}
