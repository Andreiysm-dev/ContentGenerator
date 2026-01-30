import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './App.css';

type FormState = {
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
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const supabaseBaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
const defaultCompanyId = import.meta.env.VITE_COMPANY_ID as string | undefined;
const revisionWebhookUrl = (import.meta.env as any).VITE_MAKE_REVISION_WEBHOOK || '';
const imageFromExistingDmpWebhookUrl =
  (import.meta.env as any).VITE_MAKE_IMAGE_EXISTING_DMP_WEBHOOK ||
  'https://hook.eu2.make.com/nxgq2dxlwhaaa2dmnye8nbe2us8nili6';
const VIEW_MODAL_POLL_MS = 1500;
const CALENDAR_POLL_MS = 5000;

function App() {
  const [form, setForm] = useState<FormState>({
    date: '',
    brandHighlight: '',
    crossPromo: '',
    theme: '',
    contentType: '',
    channels: [],
    targetAudience: '',
    primaryGoal: '',
    cta: '',
    promoType: '',
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratorCollapsed, setIsGeneratorCollapsed] = useState(true);
  const [calendarRows, setCalendarRows] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>(defaultCompanyId);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [brandKbId, setBrandKbId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [brandPack, setBrandPack] = useState('');
  const [brandCapability, setBrandCapability] = useState('');
  const [emojiRule, setEmojiRule] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [aiWriterSystemPrompt, setAiWriterSystemPrompt] = useState('');
  const [aiWriterUserPrompt, setAiWriterUserPrompt] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const viewModalPollRef = useRef<number | null>(null);
  const imageModalPollRef = useRef<number | null>(null);
  const suppressImageModalCloseCleanupRef = useRef<boolean>(false);
  const reopenImageModalOnImageReadyRef = useRef<boolean>(false);
  const imageModalReopenTimeoutRef = useRef<number | null>(null);
  const [imagePollError, setImagePollError] = useState<string | null>(null);
  const [imagePreviewNonce, setImagePreviewNonce] = useState<number>(0);
  const [isImageGeneratingOverlayOpen, setIsImageGeneratingOverlayOpen] = useState<boolean>(false);
  const [isEditingDmp, setIsEditingDmp] = useState<boolean>(false);
  const [dmpDraft, setDmpDraft] = useState<string>('');

  const statusOptions = [
    '',
    'Generate',
    'Approved',
    'Revisioned',
    'Design Completed',
    'Scheduled',
  ];

  const getStatusValue = (status: any): string => {
    if (status === null || status === undefined) return '';
    if (typeof status === 'string') return status;
    if (typeof status === 'object') {
      if (typeof status.value === 'string') return status.value;
      if (typeof status.status === 'string') return status.status;
    }
    try {
      return String(status);
    } catch {
      return '';
    }
  };

  const getImageGeneratedUrl = (row: any | null): string | null => {
    if (!row) return null;
    const ig = (row as any).imageGenerated;
    if (!ig) return null;
    const base = typeof supabaseBaseUrl === 'string' ? supabaseBaseUrl.replace(/\/$/, '') : '';

    const normalize = (value: string): string => {
      const v = value.trim();
      if (!v) return v;
      if (v.startsWith('http://') || v.startsWith('https://')) return v;
      // If the DB stores a storage key/path instead of a full URL, build a public URL
      // Supported examples:
      // - generated-images/<path>
      // - <path> (already within bucket)
      if (!base) return v;
      if (v.startsWith('storage/v1/object/public/')) return `${base}/${v}`;
      if (v.startsWith('/storage/v1/object/public/')) return `${base}${v}`;
      if (v.startsWith('generated-images/')) return `${base}/storage/v1/object/public/${v}`;
      return `${base}/storage/v1/object/public/generated-images/${v}`;
    };

    if (typeof ig === 'string') {
      const trimmed = ig.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            if (typeof (parsed as any).url === 'string') return normalize((parsed as any).url);
            if (typeof (parsed as any).imageUrl === 'string') return normalize((parsed as any).imageUrl);
            if (typeof (parsed as any).path === 'string') return normalize((parsed as any).path);
          }
        } catch {
          // fall through
        }
      }
      return normalize(trimmed);
    }
    if (typeof ig === 'object') {
      if (typeof (ig as any).url === 'string') return normalize((ig as any).url);
      if (typeof (ig as any).imageUrl === 'string') return normalize((ig as any).imageUrl);
      if (typeof (ig as any).path === 'string') return normalize((ig as any).path);
    }
    return null;
  };

  const getImageGeneratedSignature = (row: any | null): string | null => {
    if (!row) return null;
    const ig = (row as any).imageGenerated;
    if (ig === null || ig === undefined) return null;
    try {
      return typeof ig === 'string' ? ig : JSON.stringify(ig);
    } catch {
      return String(ig);
    }
  };

  const fetchLatestContentRow = async (rowId: any): Promise<any | null> => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/content-calendar/${rowId}?t=${Date.now()}`, {
        cache: 'no-store' as RequestCache,
      });
      if (res.ok) {
        const data = await res.json();
        const unwrapped = (data && (data.contentCalendar || data)) as any;
        return Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;
      }
    } catch (_) {
      // ignore
    }

    // Fallback: fetch by company and find the row
    try {
      if (!activeCompanyId) return null;
      const listRes = await fetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`, {
        cache: 'no-store' as RequestCache,
      });
      if (!listRes.ok) return null;
      const listData = await listRes.json();
      const unwrappedList = (listData && (listData.contentCalendars || listData)) as any;
      const rows = Array.isArray(unwrappedList) ? unwrappedList : [];
      return Array.isArray(rows) ? rows.find((r: any) => r.contentCalendarId === rowId) || null : null;
    } catch (_) {
      return null;
    }
  };

  const startWaitingForImageUpdate = (baseSignature: string | null) => {
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
          prev.map((r) => (r.contentCalendarId === rowId ? { ...r, ...latest } : r)),
        );

        // Always refresh the preview URL while generating, even if the DB stores the same path.
        // This forces the browser to re-fetch the image bytes when Make overwrites a file.
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

        // Timeout after 2 minutes to avoid infinite spinner
        if (Date.now() - startedAt > 2 * 60 * 1000) {
          if (imageModalPollRef.current) {
            clearInterval(imageModalPollRef.current);
            imageModalPollRef.current = null;
          }
          setIsGeneratingImage(false);
          setImagePollError('Timed out waiting for image. Please try Refresh image.');
        }
      } catch (err) {
        if (canceled) return;
        setImagePollError('Error while waiting for image. Please try Refresh image.');
      }
    };

    tick();
    imageModalPollRef.current = window.setInterval(tick, VIEW_MODAL_POLL_MS);

    // cleanup handled by modal close effect
    return () => {
      canceled = true;
    };
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setForm((prev) => ({ ...prev, date: today }));
  }, []);

  useEffect(() => {
    if (!isImageModalOpen) return;
    setImagePreviewNonce(Date.now());
  }, [isImageModalOpen]);

  useEffect(() => {
    if (!isImageModalOpen) return;
    const rowId = selectedRow?.contentCalendarId;
    if (!rowId) return;

    (async () => {
      const latest = await fetchLatestContentRow(rowId);
      if (!latest) return;
      setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
      setCalendarRows((prev) =>
        prev.map((r) => (r.contentCalendarId === rowId ? { ...r, ...latest } : r)),
      );
      setIsEditingDmp(false);
      setDmpDraft(typeof (latest as any).dmp === 'string' ? (latest as any).dmp : '');
      setImagePreviewNonce(Date.now());
    })();
  }, [isImageModalOpen, selectedRow?.contentCalendarId]);

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

// Load companies for selector
useEffect(() => {
  const loadCompanies = async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/company`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const list = (data && (data.companies || data)) as any;
      const rows = Array.isArray(list) ? list : [];
      setCompanies(rows);

      if (!activeCompanyId) {
        const fallbackId = rows[0]?.companyId as string | undefined;
        setActiveCompanyId(fallbackId || defaultCompanyId);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  loadCompanies();
}, [activeCompanyId, defaultCompanyId]);

// Load existing content calendar entries for this company
useEffect(() => {
  const loadCalendar = async () => {
    if (!activeCompanyId) return;
    setIsLoadingCalendar(true);
    setCalendarError(null);
    try {
      const res = await fetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load content calendar');
      }
      setCalendarRows(data.contentCalendars || data);
    } catch (err: any) {
      console.error('Error loading content calendar:', err);
      setCalendarError(err.message || 'Failed to load content calendar');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  loadCalendar();
}, [activeCompanyId]);

// Auto-refresh the content calendar table periodically
useEffect(() => {
  if (!activeCompanyId) return;
  let canceled = false;
  const fetchList = async () => {
    try {
      const res = await fetch(
        `${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`,
        { cache: 'no-store' as RequestCache },
      );
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const unwrapped = (data && (data.contentCalendars || data)) as any;
      if (!canceled) {
        setCalendarRows(Array.isArray(unwrapped) ? unwrapped : []);
      }
    } catch (err) {
      // ignore polling errors
    }
  };

  const id = window.setInterval(fetchList, CALENDAR_POLL_MS);
  // initial tick
  fetchList();
  return () => {
    canceled = true;
    clearInterval(id);
  };
}, [activeCompanyId]);

// Load company profile details
useEffect(() => {
  const loadCompany = async () => {
    if (!activeCompanyId) return;
    setCompanyName('');
    setCompanyDescription('');
    try {
      const res = await fetch(`${backendBaseUrl}/api/company/${activeCompanyId}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const company = (data && (data.company || data)) as any;
      if (company && typeof company.companyName === 'string') {
        setCompanyName(company.companyName);
      }
      if (company && typeof company.companyDescription === 'string') {
        setCompanyDescription(company.companyDescription);
      }
    } catch (err) {
      console.error('Error loading company profile:', err);
    }
  };

  loadCompany();
}, [activeCompanyId]);

// Load existing brand knowledge base (company settings) for this company
useEffect(() => {
  const loadBrandKB = async () => {
    if (!activeCompanyId) return;
    setBrandKbId(null);
    setBrandPack('');
    setBrandCapability('');
    setEmojiRule('');
    setSystemInstruction('');
    setAiWriterSystemPrompt('');
    try {
      const res = await fetch(
        `${backendBaseUrl}/api/brandkb/company/${activeCompanyId}`,
      );
      const data = await res.json();
      const list = Array.isArray(data.brandKBs) ? data.brandKBs : data;
      const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
      if (first) {
        if (typeof first.brandKbId === 'string') {
          setBrandKbId(first.brandKbId);
        }
        if (typeof first.brandPack === 'string') {
          setBrandPack(first.brandPack);
        }
        if (typeof first.brandCapability === 'string') {
          setBrandCapability(first.brandCapability);
        }
        if (typeof first.emojiRule === 'string') {
          setEmojiRule(first.emojiRule);
        }
        if (typeof first.systemInstruction === 'string') {
          setSystemInstruction(first.systemInstruction);
        }
        if (typeof first.writerAgent === 'string') {
          setAiWriterSystemPrompt(first.writerAgent);
        }
        if (typeof first.reviewPrompt1 === 'string') {
          setAiWriterUserPrompt(first.reviewPrompt1);
        }
      }
    } catch (err) {
      console.error('Error loading brandKB/company settings:', err);
    }
  };

  loadBrandKB();
}, [activeCompanyId]);

// Clamp current page if data length changes
useEffect(() => {
  const totalPages = Math.max(1, Math.ceil(calendarRows.length / pageSize));
  if (page > totalPages) setPage(totalPages);
}, [calendarRows.length]);

const totalPages = useMemo(() => Math.max(1, Math.ceil(calendarRows.length / pageSize)), [calendarRows.length]);
const currentPageRows = useMemo(() => {
  const start = (page - 1) * pageSize;
  return calendarRows.slice(start, start + pageSize);
}, [calendarRows, page]);

const isPageFullySelected = useMemo(() => {
  const ids = currentPageRows.map((r) => r.contentCalendarId);
  return ids.length > 0 && ids.every((id) => selectedIds.includes(id));
}, [currentPageRows, selectedIds]);

const toggleSelectAllOnPage = (checked: boolean) => {
  const ids = currentPageRows.map((r) => r.contentCalendarId).filter(Boolean);
  setSelectedIds((prev) => {
    const set = new Set(prev);
    if (checked) {
      ids.forEach((id) => set.add(id));
    } else {
      ids.forEach((id) => set.delete(id));
    }
    return Array.from(set);
  });
};

const toggleSelectOne = (id: string, checked: boolean) => {
  setSelectedIds((prev) => {
    const set = new Set(prev);
    if (checked) set.add(id);
    else set.delete(id);
    return Array.from(set);
  });
};

const activeCompany = useMemo(
  () => companies.find((c) => c.companyId === activeCompanyId) || null,
  [companies, activeCompanyId],
);

const handleDeleteSelected = async () => {
  if (selectedIds.length === 0) return;
  const proceed = window.confirm(`Delete ${selectedIds.length} selected row(s)? This cannot be undone.`);
  if (!proceed) return;

  const idsToDelete = new Set(selectedIds);
  setCalendarRows((prev) => prev.filter((r) => !idsToDelete.has(r.contentCalendarId)));
  setSelectedIds([]);

  for (const id of idsToDelete) {
    try {
      const res = await fetch(`${backendBaseUrl}/api/content-calendar/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        console.error('Delete failed', id, res.status, msg);
      }
    } catch (e) {
      console.error('Delete error', id, e);
    }
  }
};

// Auto-refresh currently viewed row while modal is open
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
      let latest: any | null = null;
      const res = await fetch(
        `${backendBaseUrl}/api/content-calendar/${rowId}?t=${Date.now()}`,
        { cache: 'no-store' as RequestCache },
      );
      if (res.ok) {
        const data = await res.json();
        const unwrapped = (data && (data.contentCalendar || data)) as any;
        latest = Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;
      }

      if (!latest && activeCompanyId) {
        const listRes = await fetch(
          `${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`,
          { cache: 'no-store' as RequestCache },
        );
        if (listRes.ok) {
          const listData = await listRes.json();
          const unwrappedList = (listData && (listData.contentCalendars || listData)) as any;
          const rows = Array.isArray(unwrappedList) ? unwrappedList : [];
          latest = rows.find((r: any) => r.contentCalendarId === rowId) || null;
        }
      }

      if (canceled || !latest) return;
      setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
      setCalendarRows((prev) =>
        prev.map((r) => (r.contentCalendarId === rowId ? { ...r, ...latest } : r)),
      );
    } catch (_) {
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
}, [isViewModalOpen, selectedRow?.contentCalendarId, activeCompanyId]);

// Stop image modal polling when modal closes
useEffect(() => {
  if (isImageModalOpen) return;
  if (imageModalPollRef.current) {
    clearInterval(imageModalPollRef.current);
    imageModalPollRef.current = null;
  }
  setIsGeneratingImage(false);
  setImagePollError(null);
}, [isImageModalOpen]);

// When image modal opens, fetch the latest row once so the preview uses fresh DB data
useEffect(() => {
  if (!isImageModalOpen) return;
  const rowId = selectedRow?.contentCalendarId;
  if (!rowId) return;
  let canceled = false;
  (async () => {
    const latest = await fetchLatestContentRow(rowId);
    if (canceled || !latest) return;
    setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
    setCalendarRows((prev) =>
      prev.map((r) => (r.contentCalendarId === rowId ? { ...r, ...latest } : r)),
    );
  })();
  return () => {
    canceled = true;
  };
}, [isImageModalOpen, selectedRow?.contentCalendarId]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChannelsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, channels: values }));
  };

  const handleCopy = async (fieldKey: string, text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleAdd = async () => {
    if (!activeCompanyId) {
      alert('Please select a company first.');
      return;
    }
    if (isAdding) return;
    setIsAdding(true);
    try {
      const channelsValue = Array.isArray(form.channels) && form.channels.length
        ? form.channels.join(', ')
        : null;
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
        companyId: activeCompanyId,
      } as any;

      const res = await fetch(`${backendBaseUrl}/api/content-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Add failed:', data);
        alert('Failed to add row. Check console for details.');
        return;
      }
      alert('Row added.');
      setForm((prev) => ({
        ...prev,
        brandHighlight: '',
        crossPromo: '',
        theme: '',
        contentType: '',
        channels: [],
        targetAudience: '',
        primaryGoal: '',
        cta: '',
        promoType: '',
      }));
    } catch (err) {
      console.error('Add error:', err);
      alert('Failed to add row. Check console for details.');
    } finally {
      setIsAdding(false);
    }
  };

  const parseBulkText = (text: string): string[][] => {
    if (!text.trim()) return [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.map((line) => {
      let cols = line.split('\t');
      if (cols.length === 1) {
        cols = line.split(',');
      }
      return cols.map((c) => c.trim());
    });
  };

  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="company-trigger"
              >
                <span className="max-w-[260px] truncate">
                  {activeCompany?.companyName || 'Select company'}
                </span>
                <span className="company-trigger-caret">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="company-menu"
            >
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.companyId}
                  onSelect={() => setActiveCompanyId(company.companyId)}
                  className={
                    company.companyId === activeCompanyId
                      ? 'rounded-lg bg-blue-50 font-semibold text-blue-600'
                      : 'rounded-lg'
                  }
                >
                  {company.companyName || company.companyId}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg text-blue-600"
                onSelect={() => {
                  setNewCompanyName('');
                  setNewCompanyDescription('');
                  setIsAddCompanyModalOpen(true);
                }}
              >
                + Add company…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="header-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
              disabled={!activeCompanyId}
              aria-label="Company settings"
              className="header-settings-btn"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="app-root">
        <main className="app-main">
          <section className="card">
            <div className="card-header">
              <div>
                <h1 className="card-title">
                  {activeCompany?.companyName ? `${activeCompany.companyName} Content Generator` : 'Content Generator'}
                </h1>
                <p className="card-subtitle">Plan, generate, and review content across your channels.</p>
              </div>
              <div className="card-header-actions">
                <button
                  type="button"
                  onClick={() => setIsGeneratorCollapsed((v) => !v)}
                  className="btn btn-secondary btn-sm"
                  title={isGeneratorCollapsed ? 'Open form' : 'Hide form'}
                >
                  {isGeneratorCollapsed ? 'Open' : 'Hide'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                >
                  Bulk paste
                </button>
              </div>
            </div>

            {!isGeneratorCollapsed && (
              <div className="generator-form">
                <div className="form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Content Brief</h3>
                    <p className="form-section-desc">Define what the post is about and the core theme.</p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="field-label">Date</label>
                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label">Brand Highlight (80%)</label>
                      <input
                        type="text"
                        name="brandHighlight"
                        placeholder="e.g., Coworking Space"
                        value={form.brandHighlight}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label">Cross-Promo (20%)</label>
                      <input
                        type="text"
                        name="crossPromo"
                        placeholder="e.g., Zen Café"
                        value={form.crossPromo}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label">Theme</label>
                      <input
                        type="text"
                        name="theme"
                        placeholder="e.g., Your Startup's First Home"
                        value={form.theme}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Distribution</h3>
                    <p className="form-section-desc">Choose where the content will go and who it serves.</p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="field-label">Content Type</label>
                      <select
                        name="contentType"
                        value={form.contentType}
                        onChange={handleChange}
                        className="field-input select-input"
                      >
                        <option value="">Select content type</option>
                        <option value="Post">Post</option>
                        <option value="Story">Story</option>
                        <option value="Reel">Reel</option>
                        <option value="Video">Video</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="field-label">Channels</label>
                      <select
                        multiple
                        size={5}
                        name="channels"
                        value={form.channels}
                        onChange={handleChannelsChange}
                        className="field-input channels-input"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Twitter">Twitter</option>
                        <option value="TikTok">TikTok</option>
                      </select>
                      <div className="field-caption">Hold Ctrl/Cmd to select multiple</div>
                    </div>
                    <div className="form-group">
                      <label className="field-label">Target Audience</label>
                      <input
                        type="text"
                        name="targetAudience"
                        placeholder="e.g., Founders, Freelancers"
                        value={form.targetAudience}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label">Primary Goal</label>
                      <select
                        name="primaryGoal"
                        value={form.primaryGoal}
                        onChange={handleChange}
                        className="field-input select-input"
                      >
                        <option value="">Select a goal</option>
                        <option value="Awareness">Awareness</option>
                        <option value="Engagement">Engagement</option>
                        <option value="Traffic">Traffic</option>
                        <option value="Leads">Leads</option>
                        <option value="Sales">Sales</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Call to Action</h3>
                    <p className="form-section-desc">Define the action and promotional angle.</p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="field-label">Call to Action</label>
                      <input
                        type="text"
                        name="cta"
                        placeholder="e.g., Book a Tour"
                        value={form.cta}
                        onChange={handleChange}
                        className="field-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label">Promo Type</label>
                      <select
                        name="promoType"
                        value={form.promoType}
                        onChange={handleChange}
                        className="field-input select-input"
                      >
                        <option value="">Select promo type</option>
                        <option value="Launch">Launch</option>
                        <option value="Discount">Discount</option>
                        <option value="Evergreen">Evergreen</option>
                        <option value="Event">Event</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-footer">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isAdding}
                    className="btn btn-primary"
                  >
                    {isAdding ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}

      {isAddCompanyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Company</h2>
              <button
                type="button"
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-grid">
                <div className="form-group">
                  <label className="field-label">Company Name</label>
                  <input
                    className="field-input"
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Company Description</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={newCompanyDescription}
                    onChange={(e) => setNewCompanyDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAddCompanyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!newCompanyName.trim()) {
                    alert('Company name is required.');
                    return;
                  }
                  try {
                    const res = await fetch(`${backendBaseUrl}/api/company`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        companyName: newCompanyName.trim(),
                        companyDescription: newCompanyDescription.trim() || null,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      alert(`Failed to create company (${res.status}).`);
                      return;
                    }
                    const created = (data && (data.company || data)) as any;
                    const createdId = created?.companyId as string | undefined;

                    if (createdId) {
                      try {
                        await fetch(`${backendBaseUrl}/api/brandkb`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ companyId: createdId }),
                        });
                      } catch (err) {
                        console.error('Failed to create BrandKB for company', err);
                      }
                    }
                    setIsAddCompanyModalOpen(false);
                    setNewCompanyName('');
                    setNewCompanyDescription('');
                    if (createdId) {
                      setActiveCompanyId(createdId);
                    }
                    // refresh companies list
                    const listRes = await fetch(`${backendBaseUrl}/api/company`);
                    if (listRes.ok) {
                      const listData = await listRes.json().catch(() => ({}));
                      const list = (listData && (listData.companies || listData)) as any;
                      setCompanies(Array.isArray(list) ? list : []);
                    }
                  } catch (err) {
                    console.error('Failed to create company', err);
                    alert('Failed to create company. Check console for details.');
                  }
                }}
              >
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageGeneratingOverlayOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Generating image…</h2>
            </div>
            <div className="modal-body">
              <div className="empty-state">Your image is being generated. This may take around 30 seconds.</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" disabled>
                Please wait…
              </button>
            </div>
          </div>
        </div>
      )}
          </section>

          {/* Company Settings moved into modal */}

          <section className="card card-secondary">
            <div className="card-header card-header-compact" style={{ alignItems: 'center' }}>
              <h2 className="card-title">Content Calendar</h2>
              {selectedIds.length > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDeleteSelected}
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {calendarError && (
              <div className="empty-state" style={{ color: '#b91c1c' }}>
                {calendarError}
              </div>
            )}

      {isSettingsModalOpen && (
        <div className="modal-backdrop">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h2 className="modal-title">Company Settings</h2>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-grid">
                <div className="form-group">
                  <label className="field-label">Company Name</label>
                  <input
                    className="field-input"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Company Description</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Company Brand Pack</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={brandPack}
                    onChange={(e) => setBrandPack(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Company Brand Capability</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={brandCapability}
                    onChange={(e) => setBrandCapability(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Emoji Rule</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={emojiRule}
                    onChange={(e) => setEmojiRule(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">System Instruction</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    placeholder="Additional company-specific instructions for AI (used in image generation)."
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">AI Writer Agent – System Prompt</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={aiWriterSystemPrompt}
                    onChange={(e) => setAiWriterSystemPrompt(e.target.value)}
                  />
                </div>
                <div className="form-group settings-full-width">
                  <label className="field-label">Review Prompt</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={aiWriterUserPrompt}
                    onChange={(e) => setAiWriterUserPrompt(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!activeCompanyId) {
                    alert('Please select a company first.');
                    return;
                  }

                  try {
                    const companyRes = await fetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        companyName: companyName || null,
                        companyDescription: companyDescription || null,
                      }),
                    });

                    if (!companyRes.ok) {
                      const companyText = await companyRes.text().catch(() => '');
                      alert(`Failed to save company profile (${companyRes.status}). ${companyText}`);
                      return;
                    }
                  } catch (err) {
                    console.error('Error saving company profile:', err);
                    alert('Error saving company profile. Check console for details.');
                    return;
                  }

                  const payload = {
                    brandPack: brandPack || null,
                    brandCapability: brandCapability || null,
                    emojiRule: emojiRule || null,
                    systemInstruction: systemInstruction || null,
                    writerAgent: aiWriterSystemPrompt || null,
                    reviewPrompt1: aiWriterUserPrompt || null,
                    companyId: activeCompanyId,
                  };

                  try {
                    const isUpdate = !!brandKbId;
                    const url = isUpdate
                      ? `${backendBaseUrl}/api/brandkb/${brandKbId}`
                      : `${backendBaseUrl}/api/brandkb`;
                    const method = isUpdate ? 'PUT' : 'POST';

                    const res = await fetch(url, {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      console.error('Failed to save company settings', data);
                      alert('Failed to save company settings. Check console for details.');
                      return;
                    }

                    const kb = (data && (data.brandKB || data)) as any;
                    if (kb && typeof kb.brandKbId === 'string') {
                      setBrandKbId(kb.brandKbId);
                    }

                    alert('Company settings saved.');
                  } catch (err) {
                    console.error('Error saving company settings:', err);
                    alert('Error saving company settings. Check console for details.');
                  }
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  if (!activeCompanyId) return;
                  const proceed = window.confirm('Delete this company? This will remove its settings and data.');
                  if (!proceed) return;
                  try {
                    const res = await fetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                      method: 'DELETE',
                    });
                    if (!res.ok) {
                      const txt = await res.text().catch(() => '');
                      alert(`Failed to delete company (${res.status}). ${txt}`);
                      return;
                    }

                    setCompanies((prev) => prev.filter((c) => c.companyId !== activeCompanyId));
                    const nextCompany = companies.find((c) => c.companyId !== activeCompanyId);
                    setActiveCompanyId(nextCompany?.companyId);
                    setIsSettingsModalOpen(false);
                  } catch (err) {
                    console.error('Failed to delete company', err);
                    alert('Failed to delete company. Check console for details.');
                  }
                }}
              >
                Delete Company
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && (
        <div className="modal-backdrop">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h2 className="modal-title">Generate Image</h2>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="section">
                <h3 className="section-title">Preview</h3>
                {imagePollError && <div className="error-banner">{imagePollError}</div>}
                {isGeneratingImage && (
                  <div className="empty-state">Generating image… waiting for database update.</div>
                )}
                {!isGeneratingImage && !getImageGeneratedUrl(selectedRow) && (
                  <div className="empty-state">
                    {selectedRow?.dmp ? 'Gemini Unavailable.' : 'No image generated yet.'}
                  </div>
                )}
                {getImageGeneratedUrl(selectedRow) && (
                  <div className="image-preview">
                    <div style={{ marginBottom: 8 }}>
                      <a
                        href={`${getImageGeneratedUrl(selectedRow) as string}${(getImageGeneratedUrl(selectedRow) as string).includes('?') ? '&' : '?'}t=${encodeURIComponent(String(imagePreviewNonce || Date.now()))}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open image in new tab
                      </a>
                    </div>
                    <img
                      key={`${getImageGeneratedUrl(selectedRow) as string}::${String(imagePreviewNonce)}`}
                      src={`${getImageGeneratedUrl(selectedRow) as string}${(getImageGeneratedUrl(selectedRow) as string).includes('?') ? '&' : '?'}t=${encodeURIComponent(String(imagePreviewNonce || Date.now()))}`}
                      alt="Generated"
                      style={{ maxWidth: '100%', borderRadius: 8 }}
                      onError={() => {
                        const url = getImageGeneratedUrl(selectedRow);
                        setImagePollError(
                          `Failed to load preview image. Try opening the link in a new tab. URL: ${url || ''}`,
                        );
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="section">
                <h3 className="section-title">Design Mega Prompt</h3>
                <div className="form-group settings-full-width">
                  <textarea
                    className="field-input field-textarea"
                    rows={6}
                    value={isEditingDmp ? dmpDraft : typeof selectedRow?.dmp === 'string' ? selectedRow.dmp : ''}
                    readOnly={!isEditingDmp}
                    onChange={(e) => setDmpDraft(e.target.value)}
                    style={{ resize: 'vertical', maxHeight: '200px', overflowY: 'auto' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {!isEditingDmp && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setDmpDraft(typeof selectedRow?.dmp === 'string' ? selectedRow.dmp : '');
                        setIsEditingDmp(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {isEditingDmp && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          const rowId = selectedRow?.contentCalendarId;
                          if (!rowId) return;
                          try {
                            const res = await fetch(`${backendBaseUrl}/api/content-calendar/${rowId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ dmp: dmpDraft || null }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              console.error('Failed to save Design Mega Prompt', data);
                              alert('Failed to save Design Mega Prompt. Check console for details.');
                              return;
                            }

                            const updated = (data && (data.contentCalendar || data)) as any;
                            const merged = updated && typeof updated === 'object' ? updated : { dmp: dmpDraft || null };

                            setSelectedRow((prev: any) => (prev ? { ...prev, ...merged } : merged));
                            setCalendarRows((prev) =>
                              prev.map((r) =>
                                r.contentCalendarId === rowId ? { ...r, ...merged } : r,
                              ),
                            );

                            // After saving, trigger the "use existing DMP" image generation webhook (Gemini only)
                            const baseSig = getImageGeneratedSignature(selectedRow);
                            setIsGeneratingImage(true);
                            setImagePollError(null);

                            const whRes = await fetch(imageFromExistingDmpWebhookUrl, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                contentCalendarId: rowId,
                                companyId: selectedRow?.companyId ?? activeCompanyId ?? null,
                                dmp: dmpDraft || null,
                              }),
                            });

                            if (!whRes.ok) {
                              const whText = await whRes.text().catch(() => '');
                              setIsGeneratingImage(false);
                              alert(`Image webhook failed (${whRes.status}). ${whText}`);
                              return;
                            }

                            startWaitingForImageUpdate(baseSig);

                            setIsEditingDmp(false);
                            suppressImageModalCloseCleanupRef.current = true;
                            setIsImageGeneratingOverlayOpen(true);
                            setIsImageModalOpen(false);

                            if (imageModalReopenTimeoutRef.current) {
                              clearTimeout(imageModalReopenTimeoutRef.current);
                              imageModalReopenTimeoutRef.current = null;
                            }

                            imageModalReopenTimeoutRef.current = window.setTimeout(() => {
                              setIsImageGeneratingOverlayOpen(false);
                              setIsImageModalOpen(true);
                              setImagePreviewNonce(Date.now());
                              imageModalReopenTimeoutRef.current = null;
                            }, 30_000);
                          } catch (err) {
                            console.error('Error saving Design Mega Prompt', err);
                            alert('Error saving Design Mega Prompt. Check console for details.');
                          }
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setDmpDraft(typeof selectedRow?.dmp === 'string' ? selectedRow.dmp : '');
                          setIsEditingDmp(false);
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer content-modal-footer">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isGeneratingImage}
                onClick={async () => {
                  if (!activeCompanyId) {
                    alert('Please select a company first.');
                    return;
                  }

                  if (!brandKbId) {
                    alert('BrandKB is not loaded yet. Please try again.');
                    return;
                  }

                  if (isEditingDmp) {
                    alert('Please save or cancel your Design Mega Prompt edits before generating a new image.');
                    return;
                  }

                  if (getImageGeneratedUrl(selectedRow)) {
                    const proceed = window.confirm('Generate a new image? This will replace the current preview once finished.');
                    if (!proceed) return;
                  }

                  const baseSig = getImageGeneratedSignature(selectedRow);
                  setIsGeneratingImage(true);
                  setImagePollError(null);
                  try {
                    const whRes = await fetch(
                      'https://hook.eu2.make.com/ms8ivolxdradx79w0nh6x96yuejq0o6a',
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contentCalendarId: selectedRow?.contentCalendarId ?? null,
                          companyId: selectedRow?.companyId ?? activeCompanyId ?? null,
                          systemInstruction: systemInstruction || null,
                          finalCaption: selectedRow?.finalCaption || null,
                          date: selectedRow?.date ?? null,
                          brandHighlight: selectedRow?.brandHighlight ?? null,
                          crossPromo: selectedRow?.crossPromo ?? null,
                          theme: selectedRow?.theme ?? null,
                          cta: selectedRow?.cta ?? null,
                          targetAudience: selectedRow?.targetAudience ?? null,
                        }),
                      },
                    );

                    if (!whRes.ok) {
                      const whText = await whRes.text().catch(() => '');
                      alert(`Image webhook failed (${whRes.status}). ${whText}`);
                      return;
                    }

                    // Wait for DB update so we can show the preview
                    startWaitingForImageUpdate(baseSig);

                    // UX: close the modal and show a loading modal; reopen after a fixed delay.
                    // Keep polling running in the background while closed.
                    reopenImageModalOnImageReadyRef.current = false;
                    suppressImageModalCloseCleanupRef.current = true;
                    setIsImageGeneratingOverlayOpen(true);
                    setIsImageModalOpen(false);

                    if (imageModalReopenTimeoutRef.current) {
                      clearTimeout(imageModalReopenTimeoutRef.current);
                      imageModalReopenTimeoutRef.current = null;
                    }

                    imageModalReopenTimeoutRef.current = window.setTimeout(() => {
                      setIsImageGeneratingOverlayOpen(false);
                      setIsImageModalOpen(true);
                      setImagePreviewNonce(Date.now());
                      imageModalReopenTimeoutRef.current = null;
                    }, 30_000);
                  } catch (whErr) {
                    console.error('Failed to trigger image webhook', whErr);
                    alert('Failed to trigger image generation webhook.');
                  } finally {
                    // isGeneratingImage is turned off when the DB field changes (polling)
                  }
                }}
              >
                {isGeneratingImage ? 'Generating…' : getImageGeneratedUrl(selectedRow) ? 'Generate New Image' : 'Generate Image'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsImageModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
            {isLoadingCalendar && !calendarError && (
              <div className="empty-state">Loading content calendar…</div>
            )}
            {!isLoadingCalendar && !calendarError && calendarRows.length === 0 && (
              <div className="empty-state">
                <p>No content yet. Imported rows will appear here.</p>
              </div>
            )}
            {!isLoadingCalendar && calendarRows.length > 0 && (
              <div className="calendar-table-wrapper">
                <table className="calendar-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={isPageFullySelected}
                          onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        />
                      </th>
                      <th>Date</th>
                      <th>Brand Highlight</th>
                      <th>Cross Promo</th>
                      <th>Theme</th>
                      <th>Content Type</th>
                      <th>Channels</th>
                      <th>Target Audience</th>
                      <th>Primary Goal</th>
                      <th>CTA</th>
                      <th>Promo Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageRows.map((row) => (
                      <tr key={row.contentCalendarId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.contentCalendarId)}
                            onChange={(e) => toggleSelectOne(row.contentCalendarId, e.target.checked)}
                          />
                        </td>
                        <td>{row.date ?? ''}</td>
                        <td>{row.brandHighlight ?? ''}</td>
                        <td>{row.crossPromo ?? ''}</td>
                        <td>{row.theme ?? ''}</td>
                        <td>{row.contentType ?? ''}</td>
                        <td>{row.channels ?? ''}</td>
                        <td>{row.targetAudience ?? ''}</td>
                        <td>{row.primaryGoal ?? ''}</td>
                        <td>{row.cta ?? ''}</td>
                        <td>{row.promoType ?? ''}</td>
                        <td>
                          {(() => {
                            const currentStatus = getStatusValue(row.status);
                            const optionsForRow =
                              currentStatus && !statusOptions.includes(currentStatus)
                                ? [currentStatus, ...statusOptions]
                                : statusOptions;
                            return (
                              <select
                                className="status-select"
                                value={currentStatus}
                                onChange={async (e) => {
                                  const previousStatus = currentStatus || null;
                                  const newStatus = e.target.value || null;

                                  if (newStatus === 'Generate' && previousStatus !== 'Generate') {
                                    const proceed = window.confirm(
                                      'Do you want to trigger caption generation for this row now?',
                                    );
                                    if (!proceed) {
                                      // Revert selection in the UI
                                      setCalendarRows((prev) =>
                                        prev.map((r) =>
                                          r.contentCalendarId === row.contentCalendarId
                                            ? { ...r, status: previousStatus }
                                            : r,
                                        ),
                                      );
                                      return;
                                    }
                                  }

                                  setCalendarRows((prev) =>
                                    prev.map((r) =>
                                      r.contentCalendarId === row.contentCalendarId
                                        ? { ...r, status: newStatus }
                                        : r,
                                    ),
                                  );

                                  try {
                                    const res = await fetch(
                                      `${backendBaseUrl}/api/content-calendar/${row.contentCalendarId}`,
                                      {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: newStatus }),
                                      },
                                    );
                                    if (!res.ok) {
                                      const msg = await res.text().catch(() => '');
                                      // rollback
                                      setCalendarRows((prev) =>
                                        prev.map((r) =>
                                          r.contentCalendarId === row.contentCalendarId
                                            ? { ...r, status: previousStatus }
                                            : r,
                                        ),
                                      );
                                      alert(`Failed to update status (${res.status}). ${msg}`);
                                      return;
                                    }

                                    if (newStatus === 'Generate') {
                                      try {
                                        const whRes = await fetch(
                                          'https://hook.eu2.make.com/09mj7o8vwfsp8ju11xmcn4riaace5teb',
                                          {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              contentCalendarId: row.contentCalendarId,
                                              companyId: row.companyId ?? activeCompanyId ?? null,
                                            }),
                                          },
                                        );
                                        if (!whRes.ok) {
                                          const whText = await whRes.text().catch(() => '');
                                          alert(`Make webhook failed (${whRes.status}). ${whText}`);
                                        }
                                      } catch (webhookErr) {
                                        console.error('Failed to call Make webhook', webhookErr);
                                        alert('Failed to call Make webhook. Check console for details.');
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Failed to update status', err);
                                    alert('Failed to update status due to a network error.');
                                  }
                                }}
                              >
                                {optionsForRow.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt || ''}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedRow(row);
                              setIsViewModalOpen(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: '#555' }}>
                    {(() => {
                      const start = (page - 1) * pageSize + 1;
                      const end = Math.min(page * pageSize, calendarRows.length);
                      return `Showing ${start}-${end} of ${calendarRows.length}`;
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: 12, alignSelf: 'center' }}>{`Page ${page} of ${totalPages}`}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {isBulkModalOpen && (
        <div className="modal-backdrop">
          <div className="modal modal-bulk">
            <div className="modal-header bulk-header">
              <div>
                <p className="bulk-kicker">Bulk Import</p>
                <h2 className="modal-title">Paste from Sheet</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body bulk-modal-body">
              <div className="bulk-content">
                <p className="modal-description">
                  Paste rows from your sheet. We’ll parse them into rows and let you preview before import.
                </p>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBulkText(value);
                  }}
                  className="bulk-textarea"
                  placeholder="Paste your table rows here (tab- or comma-separated)"
                />
                <div className="form-footer bulk-actions" style={{ justifyContent: 'flex-start', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={!bulkText.trim()}
                    onClick={() => {
                      if (!showPreview) {
                        setBulkPreview(parseBulkText(bulkText));
                      }
                      setShowPreview((prev) => !prev);
                    }}
                  >
                    {showPreview ? 'Hide preview' : 'Preview'}
                  </button>
                </div>
                {showPreview && bulkPreview.length > 0 && (
                  <div className="bulk-preview">
                    <div className="bulk-preview-title">Preview</div>
                    <div className="bulk-preview-table-wrapper">
                      <table className="bulk-preview-table">
                        <tbody>
                          {bulkPreview.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={async () => {
                  if (!activeCompanyId) {
                    alert('Please select a company first.');
                    return;
                  }

                  const rows = parseBulkText(bulkText);
                  if (!rows.length) {
                    alert('No rows to import.');
                    return;
                  }

                  setIsImporting(true);
                  try {
                    let successCount = 0;
                    for (const row of rows) {
                      const [
                        date,
                        brandHighlight,
                        crossPromo,
                        theme,
                        contentType,
                        channels,
                        targetAudience,
                        primaryGoal,
                        cta,
                        promoType,
                      ] = row;

                      const payload = {
                        date: date || null,
                        brandHighlight: brandHighlight || null,
                        crossPromo: crossPromo || null,
                        theme: theme || null,
                        contentType: contentType || null,
                        channels: channels || null,
                        targetAudience: targetAudience || null,
                        primaryGoal: primaryGoal || null,
                        cta: cta || null,
                        promoType: promoType || null,
                        companyId: activeCompanyId,
                      };

                      const res = await fetch(`${backendBaseUrl}/api/content-calendar`, {
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

                    alert(`Imported ${successCount} of ${rows.length} rows.`);
                    if (successCount > 0) {
                      setBulkText('');
                      setBulkPreview([]);
                      setIsBulkModalOpen(false);
                    }
                  } catch (error) {
                    console.error('Bulk import failed:', error);
                    alert('Bulk import failed. Check console for details.');
                  } finally {
                    setIsImporting(false);
                  }
                }}
                className="btn btn-primary btn-sm"
              >
                {isImporting ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedRow && (
        <div className="modal-backdrop">
          <div className="modal modal-wide content-modal">
            <div className="modal-header content-modal-header">
              <div className="content-modal-title">
                <h2>Content Details</h2>
                <p>Review inputs, generated outputs, and final approvals.</p>
              </div>
              <div className="content-modal-actions">
                <span className="status-pill">
                  {getStatusValue(selectedRow.status) || 'Draft'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="modal-close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="modal-body content-modal-body">
              <div className="section content-section">
                <div className="section-title-row">
                  <h3 className="section-title">Overview</h3>
                  <span className="section-hint">Core inputs captured for this row.</span>
                </div>
                <div className="kv-grid">
                  <div className="kv-item">
                    <div className="kv-label">Date</div>
                    <div className="kv-value">{selectedRow.date ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Brand Highlight</div>
                    <div className="kv-value">{selectedRow.brandHighlight ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Cross Promo</div>
                    <div className="kv-value">{selectedRow.crossPromo ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Theme</div>
                    <div className="kv-value">{selectedRow.theme ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Content Type</div>
                    <div className="kv-value">{selectedRow.contentType ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Channels</div>
                    <div className="kv-value">{selectedRow.channels ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Target Audience</div>
                    <div className="kv-value">{selectedRow.targetAudience ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Primary Goal</div>
                    <div className="kv-value">{selectedRow.primaryGoal ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">CTA</div>
                    <div className="kv-value">{selectedRow.cta ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Promo Type</div>
                    <div className="kv-value">{selectedRow.promoType ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Framework Used</div>
                    <div className="kv-value">{selectedRow.frameworkUsed ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Status</div>
                    <div className="kv-value">{getStatusValue(selectedRow.status)}</div>
                  </div>
                </div>
              </div>

              <div className="section content-section">
                <div className="section-title-row">
                  <h3 className="section-title">Generated Outputs</h3>
                  <span className="section-hint">AI-generated drafts ready for review.</span>
                </div>
                <div className="content-grid">
                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Caption Output</div>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy('captionOutput', selectedRow.captionOutput)}
                      >
                        {copiedField === 'captionOutput' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="content-box">{selectedRow.captionOutput ?? ''}</div>
                  </div>

                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">CTA Output</div>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy('ctaOuput', selectedRow.ctaOuput)}
                      >
                        {copiedField === 'ctaOuput' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="content-box">{selectedRow.ctaOuput ?? ''}</div>
                  </div>

                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Hashtags Output</div>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy('hastagsOutput', selectedRow.hastagsOutput)}
                      >
                        {copiedField === 'hastagsOutput' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="content-box">{selectedRow.hastagsOutput ?? ''}</div>
                  </div>
                </div>
              </div>

              <div className="section content-section">
                <div className="section-title-row">
                  <h3 className="section-title">Review & Final</h3>
                  <span className="section-hint">Approval notes and final outputs.</span>
                </div>
                <div className="content-grid">
                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Review Decision</div>
                    </div>
                    <div className="content-box">{selectedRow.reviewDecision ?? ''}</div>
                  </div>
                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Review Notes</div>
                    </div>
                    <div className="content-box">{selectedRow.reviewNotes ?? ''}</div>
                  </div>

                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Final Caption</div>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy('finalCaption', selectedRow.finalCaption)}
                      >
                        {copiedField === 'finalCaption' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="content-box">{selectedRow.finalCaption ?? ''}</div>
                  </div>
                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Final CTA</div>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy('finalCTA', selectedRow.finalCTA)}
                      >
                        {copiedField === 'finalCTA' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="content-box">{selectedRow.finalCTA ?? ''}</div>
                  </div>
                  <div className="content-card">
                    <div className="content-card-header">
                      <div className="content-card-title">Final Hashtags</div>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags)}
                      >
                        {copiedField === 'finalHashtags' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="content-box">{selectedRow.finalHashtags ?? ''}</div>
                  </div>
                </div>
              </div>

              <div className="section content-section">
                <div className="section-title-row">
                  <h3 className="section-title">System</h3>
                  <span className="section-hint">Metadata and internal references.</span>
                </div>
                <div className="kv-grid">
                  <div className="kv-item">
                    <div className="kv-label">DMP</div>
                    <div className="kv-value">
                      <textarea
                        className="field-input field-textarea"
                        rows={6}
                        value={selectedRow.dmp ?? ''}
                        readOnly
                        style={{ resize: 'vertical', maxHeight: '200px', overflowY: 'auto' }}
                      />
                    </div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Attached Design</div>
                    <div className="kv-value">{selectedRow.attachedDesign ? JSON.stringify(selectedRow.attachedDesign) : ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Image Generated</div>
                    <div className="kv-value">{selectedRow.imageGenerated ? JSON.stringify(selectedRow.imageGenerated) : ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Company ID</div>
                    <div className="kv-value">{selectedRow.companyId ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Content Calendar ID</div>
                    <div className="kv-value">{selectedRow.contentCalendarId ?? ''}</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-label">Created At</div>
                    <div className="kv-value">{selectedRow.created_at ?? ''}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!selectedRow) return;
                  const proceed = window.confirm('Trigger caption generation for this row now?');
                  if (!proceed) return;

                  // Optimistically update status to 'Generate' in UI
                  setSelectedRow((prev: any) => (prev ? { ...prev, status: 'Generate' } : prev));
                  setCalendarRows((prev) =>
                    prev.map((r) =>
                      r.contentCalendarId === selectedRow.contentCalendarId
                        ? { ...r, status: 'Generate' }
                        : r,
                    ),
                  );

                  // Persist status change
                  try {
                    const putRes = await fetch(
                      `${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`,
                      {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Generate' }),
                      },
                    );
                    if (!putRes.ok) {
                      const txt = await putRes.text().catch(() => '');
                      alert(`Failed to update status to Generate (${putRes.status}). ${txt}`);
                    }
                  } catch (err) {
                    console.error('Failed to update status to Generate', err);
                    alert('Failed to update status to Generate due to a network error.');
                  }

                  // Trigger Make.com generation webhook
                  try {
                    const whRes = await fetch('https://hook.eu2.make.com/09mj7o8vwfsp8ju11xmcn4riaace5teb', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentCalendarId: selectedRow.contentCalendarId,
                        companyId: selectedRow.companyId ?? activeCompanyId ?? null,
                      }),
                    });
                    if (!whRes.ok) {
                      const whText = await whRes.text().catch(() => '');
                      alert(`Make webhook failed (${whRes.status}). ${whText}`);
                    } else {
                      alert('Generation triggered.');
                    }
                  } catch (err) {
                    console.error('Failed to call generation webhook', err);
                    alert('Failed to trigger generation. Check console for details.');
                  }
                }}
              >
                Generate Caption
              </button>
              <button
                type="button"
                className={`btn btn-${
                  ['review', 'approved'].includes(
                    getStatusValue(selectedRow.status).trim().toLowerCase(),
                  )
                    ? 'primary'
                    : 'secondary'
                } btn-sm`}
                title="Send for revision again"
                disabled={
                  getStatusValue(selectedRow.status).trim().toLowerCase() !== 'review' ||
                  !selectedRow.captionOutput
                }
                onClick={async () => {
                  if (!selectedRow) return;
                  if (getStatusValue(selectedRow.status).trim().toLowerCase() !== 'review') return;
                  if (!selectedRow.captionOutput) return;
                  const proceed = window.confirm('Send this row for AI revision?');
                  if (!proceed) return;

                  if (!revisionWebhookUrl) {
                    alert('Revision webhook URL is not configured. Please set VITE_MAKE_REVISION_WEBHOOK in your .env.');
                    return;
                  }

                  try {
                    await fetch(revisionWebhookUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentCalendarId: selectedRow.contentCalendarId,
                        companyId: selectedRow.companyId ?? activeCompanyId ?? null,
                      }),
                    });
                    alert('Sent for revision.');
                  } catch (err) {
                    console.error('Failed to call revision webhook', err);
                    alert('Failed to trigger revision. Check console for details.');
                  }
                }}
              >
                Revise caption
              </button>
              <button
                type="button"
                className={`btn btn-${
                  getStatusValue(selectedRow.status).trim().toLowerCase() === 'approved'
                    ? 'primary'
                    : 'secondary'
                } btn-sm`}
                title="Generate image (coming soon)"
                disabled={getStatusValue(selectedRow.status).trim().toLowerCase() !== 'approved'}
                onClick={() => {
                  if (getStatusValue(selectedRow.status).trim().toLowerCase() !== 'approved') return;
                  setIsImageModalOpen(true);
                  setIsViewModalOpen(false);
                  // Prefill from BrandKB for this company
                  const companyId = selectedRow?.companyId ?? activeCompanyId;
                  if (companyId) {
                    (async () => {
                      try {
                        const res = await fetch(`${backendBaseUrl}/api/brandkb/company/${companyId}`);
                        const data = await res.json();
                        const list = Array.isArray(data.brandKBs) ? data.brandKBs : data;
                        const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
                        if (first) {
                          if (typeof first.brandKbId === 'string') setBrandKbId(first.brandKbId);
                          if (typeof first.systemInstruction === 'string') setSystemInstruction(first.systemInstruction);
                        }
                      } catch (err) {
                        console.error('Failed to load BrandKB for image generation', err);
                      }
                    })();
                  }
                }}
              >
                Generate Image
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
