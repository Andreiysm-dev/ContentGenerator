/**
 * useContentActions
 *
 * Encapsulates all "write" operations for calendar rows:
 * - Add a single row (handleAdd)
 * - Delete selected rows (handleDeleteSelected)
 * - Bulk-import rows from pasted text (handleBulkImport, parseBulkText)
 * - Batch-generate captions (handleBatchGenerate)
 * - Batch-generate images (handleBatchGenerateImages)
 * - Refresh a single calendar row (refreshCalendarRow)
 * - Copy field to clipboard (handleCopy)
 * - CSV export (handleExportCsv, openCsvModal)
 * - Spreadsheet copy (handleCopySpreadsheet, openCopyModal)
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { backendBaseUrl } from '@/constants/app';
import { type FormState } from '@/types/app';

interface UseContentActionsParams {
  activeCompanyId: string | null | undefined;
  session: any;
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
  calendarRows: any[];
  setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedRow: any | null;
  setSelectedRow: React.Dispatch<React.SetStateAction<any | null>>;
  brandKbId: string | null;
  systemInstruction: string;
  getStatusValue: (status: any) => string;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
  requestConfirm: (config: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
    thirdLabel?: string;
    thirdVariant?: 'primary' | 'danger' | 'ghost';
  }) => Promise<boolean | 'third'>;
}

export function useContentActions({
  activeCompanyId,
  session,
  authedFetch,
  calendarRows,
  setCalendarRows,
  selectedIds,
  setSelectedIds,
  selectedRow,
  setSelectedRow,
  brandKbId,
  systemInstruction,
  getStatusValue,
  notify,
  requestConfirm,
}: UseContentActionsParams) {
  const queryClient = useQueryClient();

  // ── Loading states ────────────────────────────────────────────────────────
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── Bulk import form state ────────────────────────────────────────────────
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<string[][]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // ── CSV export state ──────────────────────────────────────────────────────
  const csvFieldDefinitions = [
    { key: 'date', label: 'Date' },
    { key: 'brandHighlight', label: 'Brand Highlight' },
    { key: 'crossPromo', label: 'Cross Promo' },
    { key: 'theme', label: 'Theme' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'channels', label: 'Channels' },
    { key: 'targetAudience', label: 'Target Audience' },
    { key: 'primaryGoal', label: 'Primary Goal' },
    { key: 'cta', label: 'CTA' },
    { key: 'promoType', label: 'Promo Type' },
    { key: 'status', label: 'Status' },
    { key: 'frameworkUsed', label: 'Framework Used' },
    { key: 'captionOutput', label: 'Caption Output' },
    { key: 'ctaOuput', label: 'CTA Output' },
    { key: 'hastagsOutput', label: 'Hashtags Output' },
    { key: 'reviewDecision', label: 'Review Decision' },
    { key: 'reviewNotes', label: 'Review Notes' },
    { key: 'finalCaption', label: 'Final Caption' },
    { key: 'finalCTA', label: 'Final CTA' },
    { key: 'finalHashtags', label: 'Final Hashtags' },
  ];
  const csvFieldDefaults: Record<string, boolean> = csvFieldDefinitions.reduce(
    (acc, field) => ({ ...acc, [field.key]: true }),
    {},
  );
  const [csvFieldSelection, setCsvFieldSelection] = useState<Record<string, boolean>>({});
  const [csvScope, setCsvScope] = useState<'selected' | 'all'>('selected');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // ── Copy-to-clipboard (spreadsheet) state ─────────────────────────────────
  const copyFieldDefaults: Record<string, boolean> = {
    companyName: true,
    date: true,
    finalCaption: true,
    finalHashtags: true,
    finalCTA: true,
    status: true,
    internalNotes: false,
    captionOutput: false,
    hastagsOutput: false,
    dmp: false,
    metadata: false,
  };
  const copyFieldDefinitions = [
    { key: 'companyName', label: 'Company name' },
    { key: 'date', label: 'Date' },
    { key: 'finalCaption', label: 'Caption (final)' },
    { key: 'finalHashtags', label: 'Hashtags' },
    { key: 'finalCTA', label: 'CTA' },
    { key: 'status', label: 'Status' },
    { key: 'internalNotes', label: 'Internal notes' },
    { key: 'captionOutput', label: 'Generated caption' },
    { key: 'hastagsOutput', label: 'Generated hashtags' },
    { key: 'dmp', label: 'Image prompt' },
    { key: 'metadata', label: 'Metadata fields' },
  ];
  const [copyFieldSelection, setCopyFieldSelection] = useState<Record<string, boolean>>({});
  const [copySuccessMessage, setCopySuccessMessage] = useState('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // ── Actions ───────────────────────────────────────────────────────────────

  const parseBulkText = useCallback((text: string): string[][] => {
    if (!text.trim()) return [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((line) => {
      let cols = line.split('\t');
      if (cols.length === 1) cols = line.split(',');
      return cols.map((c) => c.trim());
    });
  }, []);

  const handleCopy = useCallback(async (fieldKey: string, text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, []);

  const handleAdd = useCallback(async (form: FormState) => {
    if (!activeCompanyId) {
      notify('Please select a company first.', 'error');
      return;
    }
    if (isAdding) return;
    setIsAdding(true);
    try {
      const channelsValue =
        Array.isArray(form.channels) && form.channels.length ? form.channels.join(', ') : null;
      const payload = {
        date: form.date || null,
        brandHighlight: form.brandHighlight || null,
        crossPromo: form.crossPromo || null,
        theme: form.theme || null,
        contentType: form.contentType || null,
        channels: channelsValue,
        targetAudience: form.targetAudience || null,
        primaryGoal: form.primaryGoal || null,
        cta: form.cta || null,
        promoType: form.promoType || null,
        card_name: form.cardName || null,
        finalCaption: form.caption || null,
        companyId: activeCompanyId,
      } as any;
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Add failed:', data);
        notify('Failed to add row. Check console for details.', 'error');
        return;
      }
      notify('Row added.', 'success');
      queryClient.invalidateQueries({ queryKey: ['calendar', activeCompanyId] });
    } catch (err) {
      console.error('Add error:', err);
      notify('Failed to add row. Check console for details.', 'error');
    } finally {
      setIsAdding(false);
    }
  }, [activeCompanyId, isAdding, authedFetch, notify, queryClient]);

  const handleBulkImport = useCallback(async () => {
    if (!activeCompanyId) {
      notify('Please select a company first.', 'error');
      return;
    }
    const rows = bulkPreview.filter((row) => row.some((cell) => cell && cell.trim() !== ''));
    if (!rows.length) {
      notify('No data found in rows. Please paste or type some content.', 'error');
      return;
    }
    setIsImporting(true);
    try {
      let successCount = 0;
      for (const row of rows) {
        const [
          date, brandHighlight, crossPromo, theme, contentType,
          targetAudience, primaryGoal, cta, promoType, caption,
        ] = row;
        const payload = {
          date: date || null, brandHighlight: brandHighlight || null,
          crossPromo: crossPromo || null, theme: theme || null,
          contentType: contentType || null, channels: null,
          targetAudience: targetAudience || null, primaryGoal: primaryGoal || null,
          cta: cta || null, promoType: promoType || null,
          finalCaption: caption || null, companyId: activeCompanyId,
        };
        const res = await authedFetch(`${backendBaseUrl}/api/content-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          successCount += 1;
        } else {
          const data = await res.json().catch(() => ({}));
          console.error('Import error for row', row, data);
        }
      }
      notify(`Imported ${successCount} of ${rows.length} rows.`, 'success');
      if (successCount > 0) {
        setBulkText('');
        setBulkPreview([]);
        setIsBulkModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['calendar', activeCompanyId] });
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      notify('Bulk import failed. Check console for details.', 'error');
    } finally {
      setIsImporting(false);
    }
  }, [activeCompanyId, bulkPreview, authedFetch, notify, queryClient]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const proceed = await requestConfirm({
      title: 'Delete content items?',
      description: `You're about to delete ${selectedIds.length} content items from your content board. This action is permanent and cannot be undone.`,
      confirmLabel: `Delete ${selectedIds.length} items`,
      cancelLabel: 'Keep items',
      confirmVariant: 'danger',
    });
    if (!proceed) return;
    setIsBatchDeleting(true);
    notify(`Deleting ${selectedIds.length} items...`, 'info');
    const idsToDelete = [...selectedIds];
    const successes: string[] = [];
    const failures: { id: string; error: any }[] = [];

    const deleteSingleItem = async (id: string) => {
      try {
        const row = calendarRows.find((r) => r.contentCalendarId === id);
        if (row?.imageGeneratedUrl) {
          try {
            const url = new URL(row.imageGeneratedUrl);
            let filename = url.pathname.split('/').pop() || '';
            filename = filename.split('?')[0];
            if (filename) {
              await authedFetch(`${backendBaseUrl}/api/storage/delete/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
              });
            }
          } catch (storageErr) {
            console.error('Failed to delete image from storage for row', id, storageErr);
          }
        }
        const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${id}`, { method: 'DELETE' });
        if (res.ok) {
          successes.push(id);
        } else {
          const data = await res.json().catch(() => ({}));
          failures.push({ id, error: data.error || 'Operation failed' });
        }
      } catch (e) {
        failures.push({ id, error: e });
      }
    };

    await Promise.all(idsToDelete.map((id) => deleteSingleItem(id)));

    const successSet = new Set(successes);
    setCalendarRows((prev) => prev.filter((r) => !successSet.has(r.contentCalendarId)));
    queryClient.invalidateQueries({ queryKey: ['calendar', activeCompanyId] });
    setSelectedIds([]);
    setIsBatchDeleting(false);

    if (failures.length > 0) {
      const uniqueErrors = [...new Set(failures.map((f) => f.error))];
      const errorMsg = uniqueErrors.length === 1 ? uniqueErrors[0] : `${failures.length} items failed.`;
      notify(`Deleted ${successes.length} items. Error: ${errorMsg}`, 'error');
    } else {
      notify(`Successfully deleted all ${successes.length} selected items.`, 'success');
    }
  }, [selectedIds, calendarRows, authedFetch, setCalendarRows, queryClient, setSelectedIds, notify, requestConfirm, activeCompanyId]);

  const refreshCalendarRow = useCallback(async (contentCalendarId: string) => {
    if (!session || !contentCalendarId) return;
    try {
      const res = await authedFetch(
        `${backendBaseUrl}/api/content-calendar/${contentCalendarId}?t=${Date.now()}`,
        { cache: 'no-store' as RequestCache },
      );
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const row = (data && (data.contentCalendar || data)) as any;
      if (!row || !row.contentCalendarId) return;
      setCalendarRows((prev) => prev.map((r) => (r.contentCalendarId === row.contentCalendarId ? row : r)));
      setSelectedRow((prev: any) => (prev && prev.contentCalendarId === row.contentCalendarId ? row : prev));
    } catch (err) {
      // ignore refresh errors
    }
  }, [session, authedFetch, setCalendarRows, setSelectedRow]);

  const handleBatchGenerate = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const proceed = await requestConfirm({
      title: 'Generate & Review selected content?',
      description: `You're about to trigger caption generation followed by an automatic review for ${selectedIds.length} content items.`,
      confirmLabel: `Generate & Review ${selectedIds.length} items`,
      cancelLabel: 'Go back',
      confirmVariant: 'primary',
    });
    if (!proceed) return;
    setIsBatchGenerating(true);
    const rowsToProcess = calendarRows.filter((row) => selectedIds.includes(row.contentCalendarId));
    const validRows = rowsToProcess.filter(
      (row) => row.companyId && (!activeCompanyId || row.companyId === activeCompanyId),
    );
    if (validRows.length === 0) {
      notify('No selected rows are eligible for generation. Check company alignment.', 'error');
      setIsBatchGenerating(false);
      return;
    }
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/generate-captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentCalendarIds: validRows.map((r) => r.contentCalendarId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || 'Failed to trigger caption generation.', 'error');
      } else {
        const summary = data.summary as any;
        const successCount = Array.isArray(summary?.success) ? summary.success.length : 0;
        const failedCount = Array.isArray(summary?.failed) ? summary.failed.length : 0;
        const skippedCount = Array.isArray(summary?.skipped) ? summary.skipped.length : 0;
        notify(`Generation & Review triggered: ${successCount} success, ${skippedCount} skipped, ${failedCount} failed.`, 'success');
      }
    } catch (err) {
      console.error('Bulk generate captions failed', err);
      notify('Failed to trigger generation due to a network error.', 'error');
    }
    setIsBatchGenerating(false);
  }, [selectedIds, calendarRows, activeCompanyId, authedFetch, notify, requestConfirm]);

  const handleBatchGenerateImages = useCallback(async () => {
    const proceed = await requestConfirm({
      title: 'Generate images for selected content?',
      description: `You're about to generate images for ${selectedIds.length} content items. Existing previews will be replaced once finished.`,
      confirmLabel: `Generate ${selectedIds.length} images`,
      cancelLabel: 'Keep items',
      confirmVariant: 'primary',
    });
    if (!proceed) return;
    setIsBatchGeneratingImages(true);
    if (!brandKbId) {
      notify('BrandKB is not loaded yet. Please try again.', 'error');
      setIsBatchGeneratingImages(false);
      return;
    }
    const rowsToProcess = calendarRows.filter((row) => selectedIds.includes(row.contentCalendarId));
    const validRows = rowsToProcess.filter((row) => {
      if (!row.companyId) return false;
      if (activeCompanyId && row.companyId !== activeCompanyId) return false;
      const s = getStatusValue(row.status).trim().toLowerCase();
      return s === 'ready' || s === 'approved';
    });
    if (validRows.length === 0) {
      notify('Only Approved items can generate images.', 'error');
      setIsBatchGeneratingImages(false);
      return;
    }
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/batch-generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIds: validRows.map((row) => row.contentCalendarId),
          brandKbId,
          systemInstruction: systemInstruction ?? '',
          provider: 'fal',
          model: 'fal-ai/nano-banana-pro',
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        notify(`Image generation failed (${res.status}). ${msg}`, 'error');
        setIsBatchGeneratingImages(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const successCount = data?.successCount ?? validRows.length;
      notify(`Image generation triggered for ${successCount} row(s).`, 'success');
    } catch (err) {
      console.error('Failed to trigger batch image generation', err);
      notify('Failed to trigger image generation. Check console for details.', 'error');
    } finally {
      setIsBatchGeneratingImages(false);
    }
  }, [selectedIds, calendarRows, activeCompanyId, brandKbId, systemInstruction, authedFetch, notify, requestConfirm, getStatusValue]);

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const openCsvModal = useCallback(() => {
    setCsvFieldSelection((prev) => (Object.keys(prev).length ? prev : { ...csvFieldDefaults }));
    setCsvScope(selectedIds.length > 0 ? 'selected' : 'all');
    setIsCsvModalOpen(true);
  }, [selectedIds.length]);

  const fetchAllCsvRows = useCallback(async () => {
    if (!activeCompanyId) {
      notify('Please select a company first.', 'error');
      return null;
    }
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`);
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        notify(`Failed to load rows for export (${res.status}). ${msg}`, 'error');
        return null;
      }
      const data = await res.json().catch(() => ({}));
      const unwrapped = (data && (data.contentCalendars || data)) as any;
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch (err) {
      console.error('Failed to load export rows', err);
      notify('Failed to load rows for export. Check console for details.', 'error');
      return null;
    }
  }, [activeCompanyId, authedFetch, notify]);

  const handleExportCsv = useCallback(async () => {
    if (!Object.values(csvFieldSelection).some(Boolean)) {
      notify('Choose at least one field to export.', 'error');
      return;
    }
    if (csvScope === 'selected' && selectedIds.length === 0) {
      notify('Select at least one row to export, or choose all rows.', 'error');
      return;
    }
    let exportRows: any[] = [];
    if (csvScope === 'selected') {
      const selectedSet = new Set(selectedIds);
      exportRows = calendarRows.filter((row) => selectedSet.has(row.contentCalendarId));
    } else {
      const fetched = await fetchAllCsvRows();
      if (!fetched) return;
      exportRows = fetched;
    }
    if (!exportRows.length) {
      notify('No rows available to export.', 'error');
      return;
    }
    const activeFields = csvFieldDefinitions.filter((field) => csvFieldSelection[field.key]);
    const headers = activeFields.map((field) => field.label);
    const rows = exportRows.map((row) =>
      activeFields.map((field) => {
        if (field.key === 'status') return getStatusValue(row.status) ?? '';
        const value = (row as Record<string, any>)[field.key];
        return value ?? '';
      }),
    );
    const escapeCell = (value: string) => {
      const normalized = value?.toString() ?? '';
      return `"${normalized.replace(/"/g, '""')}"`;
    };
    const csv = [headers, ...rows].map((row) => row.map((cell) => escapeCell(cell)).join(',')).join('\r\n');
    const bom = '\ufeff';
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    link.href = url;
    link.download = `content-calendar-${now.toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [csvFieldSelection, csvScope, selectedIds, calendarRows, fetchAllCsvRows, getStatusValue, notify]);

  // ── Spreadsheet Copy ──────────────────────────────────────────────────────

  const openCopyModal = useCallback(() => {
    if (selectedIds.length === 0) return;
    setCopyFieldSelection((prev) => (Object.keys(prev).length ? prev : { ...copyFieldDefaults }));
    setCopySuccessMessage('');
    setIsCopyModalOpen(true);
  }, [selectedIds.length]);

  const handleCopySpreadsheet = useCallback(async () => {
    if (selectedIds.length === 0) {
      notify('Select at least one row to copy.', 'error');
      return;
    }
    if (!Object.values(copyFieldSelection).some(Boolean)) {
      notify('Choose at least one field to copy.', 'error');
      return;
    }
    const selectedSet = new Set(selectedIds);
    const rowsToCopy = calendarRows.filter((row) => selectedSet.has(row.contentCalendarId));
    if (!rowsToCopy.length) {
      notify('No rows available to copy.', 'error');
      return;
    }
    const headers = copyFieldDefinitions.filter((f) => copyFieldSelection[f.key]).map((f) => f.label);
    const rows = rowsToCopy.map((row) =>
      copyFieldDefinitions
        .filter((f) => copyFieldSelection[f.key])
        .map((field) => {
          switch (field.key) {
            case 'companyName': return row.companyName ?? '';
            case 'date': return row.date ?? '';
            case 'finalCaption': return row.finalCaption ?? '';
            case 'finalHashtags': return row.finalHashtags ?? '';
            case 'finalCTA': return row.finalCTA ?? '';
            case 'status': return getStatusValue(row.status) ?? '';
            case 'internalNotes': return row.reviewNotes ?? '';
            case 'captionOutput': return row.captionOutput ?? '';
            case 'hastagsOutput': return row.hastagsOutput ?? '';
            case 'dmp': return row.dmp ?? '';
            case 'metadata':
              return [row.companyId, row.contentCalendarId, row.created_at].filter(Boolean).join(' | ');
            default: return '';
          }
        }),
    );
    const tsv = [headers, ...rows].map((row) => row.map((cell) => (cell ?? '').toString()).join('\t')).join('\n');
    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const buildHtmlCell = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br/>');
    const htmlTable = `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${buildHtmlCell((cell ?? '').toString())}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    try {
      if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([tsv], { type: 'text/plain;charset=utf-8' }),
            'text/html': new Blob([htmlTable], { type: 'text/html;charset=utf-8' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(tsv);
      }
      setCopySuccessMessage('Copied. Paste directly into Excel or Google Sheets.');
    } catch (err) {
      console.error('Failed to copy export rows', err);
      notify('Failed to copy rows. Check browser permissions.', 'error');
    }
  }, [selectedIds, calendarRows, copyFieldSelection, getStatusValue, notify]);

  return {
    // Loading state
    isAdding,
    isImporting,
    isBatchGenerating,
    isBatchGeneratingImages,
    isBatchDeleting,
    copiedField,
    // Bulk import
    bulkText, setBulkText,
    bulkPreview, setBulkPreview,
    showPreview, setShowPreview,
    isBulkModalOpen, setIsBulkModalOpen,
    // CSV export
    csvFieldDefinitions,
    csvFieldSelection, setCsvFieldSelection,
    csvScope, setCsvScope,
    isCsvModalOpen, setIsCsvModalOpen,
    // Spreadsheet copy
    copyFieldDefinitions,
    copyFieldSelection, setCopyFieldSelection,
    copySuccessMessage, setCopySuccessMessage,
    isCopyModalOpen, setIsCopyModalOpen,
    // Actions
    parseBulkText,
    handleCopy,
    handleAdd,
    handleBulkImport,
    handleDeleteSelected,
    refreshCalendarRow,
    handleBatchGenerate,
    handleBatchGenerateImages,
    openCsvModal,
    handleExportCsv,
    openCopyModal,
    handleCopySpreadsheet,
  };
}
