import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
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
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseBaseUrl && supabaseAnonKey
  ? createClient(supabaseBaseUrl, supabaseAnonKey)
  : null;
const revisionWebhookUrl = (import.meta.env as any).VITE_MAKE_REVISION_WEBHOOK || '';
const publishWebhookUrl = (import.meta.env as any).VITE_MAKE_PUBLISH_WEBHOOK || '';
const imageFromExistingDmpWebhookUrl =
  (import.meta.env as any).VITE_MAKE_IMAGE_EXISTING_DMP_WEBHOOK ||
  'https://hook.eu2.make.com/ms8ivolxdradx79w0nh6x96yuejq0o6a';
const VIEW_MODAL_POLL_MS = 1500;
const CALENDAR_POLL_MS = 2500;

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [calendarRows, setCalendarRows] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isBackendWaking, setIsBackendWaking] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarStatusFilter, setCalendarStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUserSettingsModalOpen, setIsUserSettingsModalOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRevisingCaption, setIsRevisingCaption] = useState(false);
  const [isUploadingDraftImage, setIsUploadingDraftImage] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const [collaborators, setCollaborators] = useState<Array<{ id: string; email: string; role: 'owner' | 'collaborator' }>>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');

  const fetchCollaborators = async (companyId: string) => {
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${companyId}`);
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to load collaborators.', 'error');
        return;
      }
      setCollaborators(data.collaborators || []);
    } catch (err) {
      notify('Failed to load collaborators.', 'error');
    }
  };

  const parseDraftImages = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
          if (typeof parsed === 'string') return [parsed];
        } catch {
          return [trimmed];
        }
      }
      return [trimmed];
    }
    return [];
  };

  const serializeDraftImages = (images: string[]): string | null => {
    const cleaned = images.filter(Boolean);
    if (cleaned.length === 0) return null;
    if (cleaned.length === 1) return cleaned[0];
    return JSON.stringify(cleaned);
  };

  const channelOptions = ['facebook', 'linkedin', 'instagram'];
  const toLocalInputValue = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail || !activeCompanyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${activeCompanyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newCollaboratorEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          notify('User with this email not found or not registered.', 'error');
        } else if (res.status === 409) {
          notify('User is already a collaborator.', 'error');
        } else {
          notify(data.error || 'Failed to add collaborator.', 'error');
        }
        return;
      }
      notify('Collaborator added.', 'success');
      setNewCollaboratorEmail('');
      await fetchCollaborators(activeCompanyId);
    } catch (err) {
      notify('Failed to add collaborator.', 'error');
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    if (!activeCompanyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${activeCompanyId}/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to remove collaborator.', 'error');
        return;
      }
      notify('Collaborator removed.', 'success');
      await fetchCollaborators(activeCompanyId);
    } catch (err) {
      notify('Failed to remove collaborator.', 'error');
    }
  };

  const authedFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = session?.access_token;
    const headers = {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(input, { ...init, headers });
  };

  const handleDraftImageUpload = async (files: FileList | File[]) => {
    if (!supabase) {
      notify('Supabase is not configured.', 'error');
      return;
    }
    if (!selectedRow) return;
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;
    const localPreviewUrls = fileList.map((file) => URL.createObjectURL(file));
    setDraftImagePreviewUrls((prev) => [...prev, ...localPreviewUrls]);
    setIsDraftDirty(true);
    setIsUploadingDraftImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileList) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `drafts/${selectedRow.contentCalendarId}-${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
          .from('generated-images')
          .upload(path, file, { upsert: true });
        if (error) {
          notify('Failed to upload image.', 'error');
          return;
        }
        const { data } = supabase.storage.from('generated-images').getPublicUrl(path);
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
      }
      const existing = parseDraftImages(selectedRow.draft_image_url);
      const merged = [...existing, ...uploadedUrls];
      const serialized = serializeDraftImages(merged);
      setSelectedRow((prev: any) => (prev ? { ...prev, draft_image_url: serialized } : prev));
      setDraftPreviewNonce(Date.now());
      setCalendarRows((prev) =>
        prev.map((r) =>
          r.contentCalendarId === selectedRow.contentCalendarId
            ? { ...r, draft_image_url: serialized }
            : r,
        ),
      );
      notify('Draft image(s) uploaded.', 'success');
    } catch (err) {
      console.error('Draft image upload failed', err);
      notify('Failed to upload image.', 'error');
    } finally {
      setIsUploadingDraftImage(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedRow) return;
    try {
      const computedDraftCaption =
        selectedRow.draft_caption ??
        `${selectedRow.finalCaption ?? ''}${selectedRow.finalHashtags ? `\n\n${selectedRow.finalHashtags}` : ''}`;
      const mergedDraftImages = [
        ...parseDraftImages(selectedRow.draft_image_url),
        ...draftImagePreviewUrls,
      ].filter(Boolean);
      const serializedDraftImages = serializeDraftImages(mergedDraftImages);
      const payload = {
        draft_caption: computedDraftCaption,
        draft_image_url: serializedDraftImages,
        channels: selectedRow.channels ?? [],
        post_status: selectedRow.post_status ?? 'draft',
        scheduled_at: selectedRow.scheduled_at ?? null,
      };
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        notify(`Failed to save draft. ${msg}`, 'error');
        return;
      }
      setCalendarRows((prev) =>
        prev.map((r) =>
          r.contentCalendarId === selectedRow.contentCalendarId
            ? { ...r, ...payload }
            : r,
        ),
      );
      setSelectedRow((prev: any) => (prev ? { ...prev, ...payload } : prev));
      setDraftImagePreviewUrls([]);
      setIsDraftDirty(false);
      notify('Draft saved.', 'success');
    } catch (err) {
      notify('Failed to save draft.', 'error');
    }
  };

  const handleCloseDraftModal = async () => {
    if (isDraftDirty) {
      await handleSaveDraft();
    }
    setIsDraftModalOpen(false);
  };

  const handlePublishNow = async () => {
    if (!selectedRow) return;
    if (!publishWebhookUrl) {
      notify('Publish webhook is not configured. Set VITE_MAKE_PUBLISH_WEBHOOK.', 'error');
      return;
    }
    try {
      const res = await fetch(publishWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentCalendarId: selectedRow.contentCalendarId,
          companyId: selectedRow.companyId ?? activeCompanyId ?? null,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        notify(`Publish webhook failed (${res.status}). ${msg}`, 'error');
        return;
      }
      notify('Publish triggered.', 'success');
    } catch (err) {
      notify('Failed to trigger publish.', 'error');
    }
  };

  const handleSchedulePublish = async () => {
    if (!selectedRow) return;
    const scheduledAt = selectedRow.scheduled_at;
    if (!scheduledAt) {
      notify('Please select a schedule time.', 'error');
      return;
    }
    setSelectedRow((prev: any) => (prev ? { ...prev, post_status: 'scheduled' } : prev));
    await handleSaveDraft();
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  // Custom setter for activeCompanyId that persists to localStorage
  const setActiveCompanyIdWithPersistence = (companyId: string | undefined) => {
    setActiveCompanyId(companyId);
    if (companyId) {
      localStorage.setItem('activeCompanyId', companyId);
    } else {
      localStorage.removeItem('activeCompanyId');
    }
  };

  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>(() => {
    // Try to get from localStorage first, fallback to defaultCompanyId
    const saved = localStorage.getItem('activeCompanyId');
    return saved || defaultCompanyId;
  });
  useEffect(() => {
    if (isSettingsModalOpen && activeCompanyId) {
      fetchCollaborators(activeCompanyId);
    }
  }, [isSettingsModalOpen, activeCompanyId]);
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
  const [isEditingDmp, setIsEditingDmp] = useState<boolean>(false);
  const [dmpDraft, setDmpDraft] = useState<string>('');
  const [draftImagePreviewUrls, setDraftImagePreviewUrls] = useState<string[]>([]);
  const [draftPreviewNonce, setDraftPreviewNonce] = useState<number>(0);
  const [isDraftPreviewExpanded, setIsDraftPreviewExpanded] = useState(false);
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' | 'info' } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

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
    // Check all possible field names for images
    const ig = (row as any).imageGenerated || 
               (row as any).imageGeneratedUrl || 
               (row as any).imageUrl || 
               (row as any).image || 
               (row as any).generatedImage;
    
    if (!ig) {
      console.log('No image field found in row. Available fields:', Object.keys(row));
      return null;
    }

    // If it's already a full URL, return as-is
    if (typeof ig === 'string' && (ig.startsWith('http://') || ig.startsWith('https://'))) {
      console.log('Found full URL:', ig);
      return ig;
    }

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
      const normalized = normalize(trimmed);
      console.log('Normalized path to URL:', normalized);
      return normalized;
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
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${rowId}?t=${Date.now()}`, {
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
      const listRes = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`, {
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
    if (!isImageModalOpen) return;
    if (!selectedRow) return;
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

// Load companies for selector
useEffect(() => {
  const loadCompanies = async () => {
    if (!session) return;
    try {
      setIsBackendWaking(true);
      const res = await authedFetch(`${backendBaseUrl}/api/company`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const list = (data && (data.companies || data)) as any;
      const rows = Array.isArray(list) ? list : [];
      setCompanies(rows);
      setIsBackendWaking(false);

      if (!activeCompanyId) {
        const fallbackId = rows[0]?.companyId as string | undefined;
        setActiveCompanyIdWithPersistence(fallbackId || defaultCompanyId);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setIsBackendWaking(true);
      window.setTimeout(loadCompanies, 3000);
    }
  };

  loadCompanies();
}, [activeCompanyId, defaultCompanyId, session]);

// Load existing content calendar entries for this company
useEffect(() => {
  const loadCalendar = async () => {
    if (!session) return;
    if (!activeCompanyId) return;
    setIsLoadingCalendar(true);
    setCalendarError(null);
    try {
      setIsBackendWaking(true);
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load content calendar');
      }
      setCalendarRows(data.contentCalendars || data);
      setIsBackendWaking(false);
    } catch (err: any) {
      console.error('Error loading content calendar:', err);
      setCalendarError(err.message || 'Failed to load content calendar');
      setIsBackendWaking(true);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  loadCalendar();
}, [activeCompanyId, session]);

// Auto-refresh the content calendar table periodically
useEffect(() => {
  if (!activeCompanyId || !session) return;
  let canceled = false;
  const fetchList = async () => {
    try {
      const listRes = await authedFetch(
        `${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`,
        { cache: 'no-store' as RequestCache },
      );
      if (!listRes.ok) return;
      const data = await listRes.json().catch(() => ({}));
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
}, [activeCompanyId, session]);

// Load company profile details
useEffect(() => {
  const loadCompany = async () => {
    if (!session) return;
    if (!activeCompanyId) return;
    setCompanyName('');
    setCompanyDescription('');
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`);
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
}, [activeCompanyId, session]);

// Load existing brand knowledge base (company settings) for this company
useEffect(() => {
  const loadBrandKB = async () => {
    if (!session) return;
    if (!activeCompanyId) return;
    setBrandKbId(null);
    setBrandPack('');
    setBrandCapability('');
    setEmojiRule('');
    setSystemInstruction('');
    setAiWriterSystemPrompt('');
    setAiWriterUserPrompt('');
    try {
      const res = await authedFetch(
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
}, [activeCompanyId, session]);

const filteredCalendarRows = useMemo(() => {
  const search = calendarSearch.trim().toLowerCase();
  const statusFilter = calendarStatusFilter.toLowerCase();
  return calendarRows.filter((row) => {
    const statusValue = getStatusValue(row.status).toLowerCase();
    if (statusFilter !== 'all' && statusValue !== statusFilter) return false;
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
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search);
  });
}, [calendarRows, calendarSearch, calendarStatusFilter]);

const calendarStatusOptions = useMemo(() => {
  const base = statusOptions.filter((opt) => opt && opt.trim());
  return ['all', ...base];
}, []);

// Clamp current page if data length changes
useEffect(() => {
  const totalPages = Math.max(1, Math.ceil(filteredCalendarRows.length / pageSize));
  if (page > totalPages) setPage(totalPages);
}, [filteredCalendarRows.length]);

useEffect(() => {
  setPage(1);
}, [calendarSearch, calendarStatusFilter]);

const currentPageRows = useMemo(() => {
  const start = (page - 1) * pageSize;
  return filteredCalendarRows.slice(start, start + pageSize);
}, [filteredCalendarRows, page]);

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

const notify = (message: string, tone: 'success' | 'error' | 'info' = 'info') => {
  setToast({ message, tone });
};

const requestConfirm = (message: string): Promise<boolean> => {
  setConfirmMessage(message);
  setIsConfirmOpen(true);
  return new Promise((resolve) => {
    confirmResolverRef.current = resolve;
  });
};

const resolveConfirm = (value: boolean) => {
  if (confirmResolverRef.current) {
    confirmResolverRef.current(value);
    confirmResolverRef.current = null;
  }
  setIsConfirmOpen(false);
};

useEffect(() => {
  if (!toast) return;
  const id = window.setTimeout(() => setToast(null), 2600);
  return () => window.clearTimeout(id);
}, [toast]);

const handleExportCsv = () => {
  const headers = [
    'Date',
    'Brand Highlight',
    'Cross Promo',
    'Theme',
    'Content Type',
    'Channels',
    'Target Audience',
    'Primary Goal',
    'CTA',
    'Promo Type',
    'Status',
  ];
  const rows = filteredCalendarRows.map((row) => [
    row.date ?? '',
    row.brandHighlight ?? '',
    row.crossPromo ?? '',
    row.theme ?? '',
    row.contentType ?? '',
    row.channels ?? '',
    row.targetAudience ?? '',
    row.primaryGoal ?? '',
    row.cta ?? '',
    row.promoType ?? '',
    getStatusValue(row.status) ?? '',
  ]);

  const escapeCell = (value: string) => {
    const normalized = value?.toString() ?? '';
    if (/[,"\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const fileStamp = now.toISOString().slice(0, 10);
  link.href = url;
  link.download = `content-calendar-${fileStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

const dashboardStats = useMemo(() => {
  const counts = {
    total: calendarRows.length,
    approved: 0,
    review: 0,
    generate: 0,
    draft: 0,
    upcoming7: 0,
  };
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() + 7);

  calendarRows.forEach((row) => {
    const status = getStatusValue(row.status).trim().toLowerCase();
    if (status === 'approved') counts.approved += 1;
    else if (status === 'review') counts.review += 1;
    else if (status === 'generate') counts.generate += 1;
    else counts.draft += 1;

    if (row.date) {
      const date = new Date(row.date);
      if (!Number.isNaN(date.getTime()) && date >= now && date <= cutoff) {
        counts.upcoming7 += 1;
      }
    }
  });

  const approvalRate = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;
  return { ...counts, approvalRate };
}, [calendarRows]);

const handleDeleteSelected = async () => {
  if (selectedIds.length === 0) return;
  const proceed = await requestConfirm(`Delete ${selectedIds.length} selected row(s)? This cannot be undone.`);
  if (!proceed) return;

  const idsToDelete = new Set(selectedIds);
  setCalendarRows((prev) => prev.filter((r) => !idsToDelete.has(r.contentCalendarId)));
  setSelectedIds([]);

  for (const id of idsToDelete) {
    try {
      // Get the row data to find the image filename before deleting
      const row = calendarRows.find((r) => r.contentCalendarId === id);
      if (row?.imageGeneratedUrl) {
        // Extract filename from the URL (remove query params and cache busting)
        const url = new URL(row.imageGeneratedUrl);
        let filename = url.pathname.split('/').pop() || '';
        // Remove any cache busting query params from filename
        filename = filename.split('?')[0];
        
        if (filename) {
          try {
            // Delete the image from the bucket
            const deleteRes = await authedFetch(`${backendBaseUrl}/api/storage/delete/${encodeURIComponent(filename)}`, {
              method: 'DELETE',
            });
            if (!deleteRes.ok) {
              const errText = await deleteRes.text().catch(() => '');
              console.warn('Storage delete endpoint returned error:', deleteRes.status, errText);
            } else {
              console.log('Deleted image from storage:', filename);
            }
          } catch (storageErr) {
            console.error('Failed to delete image from storage', filename, storageErr);
            // Continue with row deletion even if image deletion fails
          }
        } else {
          console.warn('Could not extract filename from image URL:', row.imageGeneratedUrl);
        }
      }

      // Delete the row from Supabase
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        console.error('Delete failed', id, res.status, msg);
        // Re-add the row to UI if delete failed
        setCalendarRows((prev) => {
          const deletedRow = calendarRows.find((r) => r.contentCalendarId === id);
          return deletedRow ? [...prev, deletedRow] : prev;
        });
      }
    } catch (e) {
      console.error('Delete error', id, e);
      // Re-add the row to UI if error
      const deletedRow = calendarRows.find((r) => r.contentCalendarId === id);
      if (deletedRow) {
        setCalendarRows((prev) => [...prev, deletedRow]);
      }
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
      const res = await authedFetch(
        `${backendBaseUrl}/api/content-calendar/${rowId}?t=${Date.now()}`,
        { cache: 'no-store' as RequestCache },
      );
      if (res.ok) {
        const data = await res.json();
        const unwrapped = (data && (data.contentCalendar || data)) as any;
        latest = Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;
      }

      if (!latest && activeCompanyId) {
        const listRes = await authedFetch(
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
      
      // Check if status changed from "Generate" to something else
      const prevStatus = selectedRow ? getStatusValue(selectedRow.status) : null;
      const newStatus = getStatusValue(latest.status);
      
      console.log('Status check:', { prevStatus, newStatus, isGeneratingCaption });
      
      setSelectedRow((prev: any) => (prev ? { ...prev, ...latest } : latest));
      setCalendarRows((prev) =>
        prev.map((r) => (r.contentCalendarId === rowId ? { ...r, ...latest } : r)),
      );
      
      // Stop loading if status changed from "Generate" to something else
      if (isGeneratingCaption && prevStatus === 'Generate' && newStatus !== 'Generate') {
        console.log('Stopping generate caption loading');
        setIsGeneratingCaption(false);
      }
      
      // Stop loading if status changed from "review" to something else (revision completed)
      if (isRevisingCaption && prevStatus === 'review' && newStatus !== 'review') {
        console.log('Stopping revise caption loading');
        setIsRevisingCaption(false);
      }
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
      notify('Please select a company first.', 'error');
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
      notify('Failed to add row. Check console for details.', 'error');
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

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="loading-spinner" aria-hidden="true"></span>
          <p>Loading system..</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p>Sign in with Google to continue.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              if (!supabase) {
                notify('Supabase is not configured.', 'error');
                return;
              }
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
              });
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

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
                  onSelect={() => setActiveCompanyIdWithPersistence(company.companyId)}
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
                className="rounded-lg text-blue-600 company-dropdown-item add-company"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="btn btn-secondary btn-sm">
                  {session?.user?.user_metadata?.full_name || session?.user?.email || 'Profile'}
                  <span className="company-trigger-caret">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="company-menu">
                <DropdownMenuItem
                  onSelect={() => setIsUserSettingsModalOpen(true)}
                  className="rounded-lg"
                >
                  User settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await supabase?.auth.signOut();
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="app-root">
        {isBackendWaking && (
          <div className="empty-state" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="loading-spinner" aria-hidden="true"></span>
            Loading system..
          </div>
        )}
        <main className="app-main">
          <section className="card dashboard-card">
            <div className="card-header card-header-compact">
              <div>
                <h2 className="card-title">Company Dashboard</h2>
                <p className="card-subtitle">Quick health check of your content pipeline.</p>
              </div>
              <div className="card-header-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsSettingsModalOpen(true)}
                  disabled={!activeCompanyId}
                >
                  <Settings className="h-4 w-4" />
                  Company settings
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm dashboard-toggle"
                  onClick={() => setIsDashboardExpanded((prev) => !prev)}
                >
                  {isDashboardExpanded ? 'Hide details' : 'View details'}
                </button>
              </div>
            </div>
            <div className="dashboard-grid">
              <div className="metric-card">
                <div className="metric-label">Total Posts</div>
                <div className="metric-value">{dashboardStats.total}</div>
                <div className="metric-sub">Across all statuses</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Approved</div>
                <div className="metric-value">{dashboardStats.approved}</div>
                <div className="metric-sub">Approval rate {dashboardStats.approvalRate}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">In Review</div>
                <div className="metric-value">{dashboardStats.review}</div>
                <div className="metric-sub">Pending feedback</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Generating</div>
                <div className="metric-value">{dashboardStats.generate}</div>
                <div className="metric-sub">Active AI jobs</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Next 7 Days</div>
                <div className="metric-value">{dashboardStats.upcoming7}</div>
                <div className="metric-sub">Scheduled content</div>
              </div>
            </div>
            {isDashboardExpanded && (
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

              


            )}

      {isAddCompanyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal settings-modal">
            <div className="modal-header settings-header">
              <div>
                <p className="modal-kicker">Company</p>
                <h2 className="modal-title">Add Company</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsAddCompanyModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body settings-body">
              <div className="settings-section">
                <div className="settings-grid">
                  <div className="form-group">
                    <label className="field-label">Company Name</label>
                    <input
                      type="text"
                      className="field-input"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="e.g., Moonshot Studios"
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">Company Description</label>
                    <input
                      type="text"
                      className="field-input"
                      value={newCompanyDescription}
                      onChange={(e) => setNewCompanyDescription(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer settings-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddCompanyModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!newCompanyName.trim()) {
                    notify('Company name is required.', 'error');
                    return;
                  }
                  try {
                    const res = await authedFetch(`${backendBaseUrl}/api/company`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        companyName: newCompanyName.trim(),
                        companyDescription: newCompanyDescription.trim(),
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      notify(data.error || 'Failed to create company.', 'error');
                      return;
                    }
                    notify('Company created.', 'success');
                    setIsAddCompanyModalOpen(false);
                    await new Promise((r) => setTimeout(r, 200));
                    setCompanies((prev) => [data.company, ...prev]);
                    if (data.company?.companyId) {
                      setActiveCompanyIdWithPersistence(data.company.companyId);
                    }
                  } catch (err) {
                    console.error('Failed to create company', err);
                    notify('Failed to create company. Check console for details.', 'error');
                  }
                }}
              >
                Create Company
              </button>
            </div>
          </div>
        </div>
      )}

      {isUserSettingsModalOpen && (
        <div className="modal-backdrop">
          <div className="modal settings-modal">
            <div className="modal-header settings-header">
              <div>
                <p className="modal-kicker">User</p>
                <h2 className="modal-title">User Settings</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsUserSettingsModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body settings-body">
              <div className="settings-section">
                <div className="section-title-row">
                  <h3 className="section-title">Social Accounts</h3>
                  <span className="section-hint">Connect social profiles for publishing.</span>
                </div>
                <div className="content-box" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 600 }}>Facebook</div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => notify('Facebook connect flow coming next.', 'info')}
                  >
                    Connect Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDraftModalOpen && selectedRow && (
        <div className="modal-backdrop modal-backdrop-top">
          <div className="modal modal-wide content-modal">
            <div className="modal-header content-modal-header">
              <div className="content-modal-title">
                <h2>Draft & Publish</h2>
                <p>Edit draft content, upload image, and schedule or publish.</p>
              </div>
              <button type="button" className="modal-close" onClick={handleCloseDraftModal}>
                ×
              </button>
            </div>
            <div className="modal-body content-modal-body draft-modal-body">
              <div className="draft-modal-editor">
                <div className="section content-section">
                  <div className="section-title-row">
                    <h3 className="section-title">Draft Caption</h3>
                  </div>
                  <textarea
                    className="field-input field-textarea"
                    rows={8}
                    value={
                      selectedRow.draft_caption ??
                      `${selectedRow.finalCaption ?? ''}${selectedRow.finalHashtags ? `\n\n${selectedRow.finalHashtags}` : ''}`
                    }
                    onChange={(e) =>
                      setSelectedRow((prev: any) => (prev ? { ...prev, draft_caption: e.target.value } : prev))
                    }
                    onBlur={() => setIsDraftDirty(true)}
                  />
                </div>

                <div className="section content-section">
                  <div className="section-title-row">
                    <h3 className="section-title">Channels</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {channelOptions.map((channel) => {
                      const checked = Array.isArray(selectedRow.channels)
                        ? selectedRow.channels.includes(channel)
                        : false;
                      return (
                        <label key={channel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(selectedRow.channels || []), channel]
                                : (selectedRow.channels || []).filter((c: string) => c !== channel);
                              setSelectedRow((prev: any) => (prev ? { ...prev, channels: next } : prev));
                              setIsDraftDirty(true);
                            }}
                          />
                          {channel}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="section content-section">
                  <div className="section-title-row">
                    <h3 className="section-title">Draft Image</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {(() => {
                      const savedImages = parseDraftImages(selectedRow.draft_image_url);
                      const allImages = [...draftImagePreviewUrls, ...savedImages].filter(Boolean);
                      if (allImages.length === 0) return null;
                      return (
                        <div className="draft-image-grid">
                          {allImages.map((url, idx) => (
                            <img key={`${url}-${idx}`} src={url} alt={`Draft ${idx + 1}`} />
                          ))}
                        </div>
                      );
                    })()}
                    <label className="btn btn-secondary btn-sm">
                      {isUploadingDraftImage ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) handleDraftImageUpload(files);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="section content-section">
                  <div className="section-title-row">
                    <h3 className="section-title">Schedule</h3>
                  </div>
                  <input
                    type="datetime-local"
                    className="field-input"
                    value={toLocalInputValue(selectedRow.scheduled_at)}
                    onChange={(e) =>
                      setSelectedRow((prev: any) =>
                        prev ? { ...prev, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null } : prev,
                      )
                    }
                    onBlur={() => setIsDraftDirty(true)}
                  />
                  <div className="content-box" style={{ marginTop: 8 }}>
                    Status: {selectedRow.post_status ?? 'draft'}
                  </div>
                </div>
              </div>

              <div className="draft-modal-preview">
                <div className="draft-preview-shell">
                  <div className="draft-preview-title">Preview</div>
                  <div className="draft-preview-card">
                    <div className="draft-preview-meta">
                      <div className="draft-preview-avatar">W</div>
                      <div className="draft-preview-meta-text">
                        <div className="draft-preview-name">Page Name</div>
                        <div className="draft-preview-subtitle">Just now · 🌍</div>
                      </div>
                      <div className="draft-preview-more">•••</div>
                    </div>
                    <div className="draft-preview-caption">
                      {(() => {
                        const captionText =
                          selectedRow.draft_caption ??
                          `${selectedRow.finalCaption ?? ''}${selectedRow.finalHashtags ? `\n\n${selectedRow.finalHashtags}` : ''}`;
                        const lines = captionText.split('\n');
                        const limit = 3;
                        const shouldTruncate = lines.length > limit;
                        const visibleLines = isDraftPreviewExpanded ? lines : lines.slice(0, limit);

                        return (
                          <>
                            {visibleLines.map((line: string, idx: number) => (
                              <p key={idx}>{line}</p>
                            ))}
                            {shouldTruncate && !isDraftPreviewExpanded && <span className="draft-preview-ellipsis">…</span>}
                            {shouldTruncate && (
                              <button
                                type="button"
                                className="draft-preview-more-btn"
                                onClick={() => setIsDraftPreviewExpanded((prev) => !prev)}
                              >
                                {isDraftPreviewExpanded ? 'See less' : 'See more'}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="draft-preview-image">
                      {(() => {
                        const savedImages = parseDraftImages(selectedRow.draft_image_url);
                        const allImages = [...draftImagePreviewUrls, ...savedImages].filter(Boolean);
                        if (allImages.length === 0) {
                          return <div className="draft-preview-placeholder">No image selected</div>;
                        }
                        return (
                          <div className={`draft-preview-grid draft-preview-grid-${Math.min(allImages.length, 4)}`}>
                            {allImages.slice(0, 4).map((url, idx) => (
                              <img
                                key={`${url}-${idx}`}
                                src={(() => {
                                  if (url.startsWith('blob:')) return url;
                                  return `${url}${url.includes('?') ? '&' : '?'}v=${draftPreviewNonce}`;
                                })()}
                                alt={`Preview ${idx + 1}`}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="draft-preview-actions">
                      <span>Like</span>
                      <span>Comment</span>
                      <span>Share</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSaveDraft}>
                Save Draft
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSchedulePublish}>
                Schedule
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handlePublishNow}>
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
          </section>
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
          </section>

          <section className="card card-secondary calendar-card">
            <div className="card-header card-header-compact" style={{ alignItems: 'center' }}>
              <h2 className="card-title">Content Calendar</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="search"
                  className="field-input"
                  placeholder="Search rows..."
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
                <select
                  className="field-input select-input"
                  value={calendarStatusFilter}
                  onChange={(e) => setCalendarStatusFilter(e.target.value)}
                  style={{ maxWidth: 160 }}
                >
                  {calendarStatusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'all' ? 'All statuses' : opt}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
                  Export CSV
                </button>
              </div>
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
              <div className="empty-state">Loading content calendar…</div>
            )}
            {!isLoadingCalendar && !calendarError && calendarRows.length === 0 && (
              <div className="empty-state">
                <p>No content yet. Imported rows will appear here.</p>
              </div>
            )}
            {!isLoadingCalendar && !calendarError && calendarRows.length > 0 && filteredCalendarRows.length === 0 && (
              <div className="empty-state">
                <p>No rows match your search or filter.</p>
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
                      <th className="calendar-col calendar-col--primary">Date</th>
                      <th className="calendar-col calendar-col--primary">Brand Highlight</th>
                      <th className="calendar-col calendar-col--muted">Cross Promo</th>
                      <th className="calendar-col calendar-col--primary">Theme</th>
                      <th className="calendar-col">Content Type</th>
                      <th className="calendar-col calendar-col--muted">Channels</th>
                      <th className="calendar-col calendar-col--muted">Target Audience</th>
                      <th className="calendar-col">Primary Goal</th>
                      <th className="calendar-col calendar-col--muted">CTA</th>
                      <th className="calendar-col calendar-col--muted">Promo Type</th>
                      <th className="calendar-col calendar-col--status">Status</th>
                      <th className="calendar-col calendar-col--actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageRows.map((row) => (
                      <tr key={row.contentCalendarId}>
                        <td className="calendar-cell calendar-cell--checkbox">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.contentCalendarId)}
                            onChange={(e) => toggleSelectOne(row.contentCalendarId, e.target.checked)}
                          />
                        </td>
                        <td className="calendar-cell calendar-cell--primary">{row.date ?? ''}</td>
                        <td className="calendar-cell calendar-cell--primary">{row.brandHighlight ?? ''}</td>
                        <td className="calendar-cell calendar-cell--muted">{row.crossPromo ?? ''}</td>
                        <td className="calendar-cell calendar-cell--primary">{row.theme ?? ''}</td>
                        <td className="calendar-cell">{row.contentType ?? ''}</td>
                        <td className="calendar-cell calendar-cell--muted">{row.channels ?? ''}</td>
                        <td className="calendar-cell calendar-cell--muted">{row.targetAudience ?? ''}</td>
                        <td className="calendar-cell">{row.primaryGoal ?? ''}</td>
                        <td className="calendar-cell calendar-cell--muted">{row.cta ?? ''}</td>
                        <td className="calendar-cell calendar-cell--muted">{row.promoType ?? ''}</td>
                        <td className="calendar-cell calendar-cell--status">
                          {(() => {
                            const currentStatus = getStatusValue(row.status);
                            const optionsForRow =
                              currentStatus && !statusOptions.includes(currentStatus)
                                ? [currentStatus, ...statusOptions]
                                : statusOptions;
                            return (
                              <select
                                className={`status-select status-select--${
                                  (currentStatus || 'unset')
                                    .toString()
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                }`}
                                value={currentStatus}
                                onChange={async (e) => {
                                  const previousStatus = currentStatus || null;
                                  const newStatus = e.target.value || null;

                                  if (newStatus === 'Generate' && previousStatus !== 'Generate') {
                                    const proceed = await requestConfirm(
                                      'Do you want to trigger caption generation for this row now?',
                                    );
                                    if (!proceed) {
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
                                    const res = await authedFetch(
                                      `${backendBaseUrl}/api/content-calendar/${row.contentCalendarId}`,
                                      {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: newStatus }),
                                      },
                                    );
                                    if (!res.ok) {
                                      const msg = await res.text().catch(() => '');
                                      setCalendarRows((prev) =>
                                        prev.map((r) =>
                                          r.contentCalendarId === row.contentCalendarId
                                            ? { ...r, status: previousStatus }
                                            : r,
                                        ),
                                      );
                                      notify(`Failed to update status (${res.status}). ${msg}`, 'error');
                                      return;
                                    }

                                    if (newStatus === 'Generate') {
                                      if (!row.companyId) {
                                        notify(
                                          'Cannot trigger generation: missing company ID for this row.',
                                          'error',
                                        );
                                        return;
                                      }
                                      if (activeCompanyId && row.companyId !== activeCompanyId) {
                                        notify(
                                          'Cannot trigger generation: row company does not match the active company. Please refresh or switch to the correct company.',
                                          'error',
                                        );
                                        return;
                                      }
                                      try {
                                        const whRes = await fetch(
                                          'https://hook.eu2.make.com/09mj7o8vwfsp8ju11xmcn4riaace5teb',
                                          {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              contentCalendarId: row.contentCalendarId,
                                              companyId: row.companyId,
                                              brandKbId: brandKbId ?? null,
                                            }),
                                          },
                                        );
                                        if (!whRes.ok) {
                                          const whText = await whRes.text().catch(() => '');
                                          notify(`Make webhook failed (${whRes.status}). ${whText}`, 'error');
                                        }
                                      } catch (webhookErr) {
                                        console.error('Failed to call Make webhook', webhookErr);
                                        notify('Failed to call Make webhook. Check console for details.', 'error');
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Failed to update status', err);
                                    notify('Failed to update status due to a network error.', 'error');
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
                        <td className="calendar-cell calendar-cell--actions">
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
              </div>
            )}
            
            {/* Pagination Navigation */}
            {!isLoadingCalendar && !calendarError && filteredCalendarRows.length > pageSize && (
              <div className="calendar-pagination">
                <div className="pagination-info">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredCalendarRows.length)} of {filteredCalendarRows.length} results
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    First
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-pages">
                    Page {page} of {Math.ceil(filteredCalendarRows.length / pageSize)}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(filteredCalendarRows.length / pageSize)}
                  >
                    Next
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(Math.ceil(filteredCalendarRows.length / pageSize))}
                    disabled={page >= Math.ceil(filteredCalendarRows.length / pageSize)}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </section>

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
                        notify('Please select a company first.', 'error');
                        return;
                      }

                      const rows = parseBulkText(bulkText);
                      if (!rows.length) {
                        notify('No rows to import.', 'error');
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
                        }
                      } catch (error) {
                        console.error('Bulk import failed:', error);
                        notify('Bulk import failed. Check console for details.', 'error');
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

          {isSettingsModalOpen && (
            <div className="modal-backdrop">
              <div className="modal settings-modal">
                <div className="modal-header settings-header">
                  <div>
                    <p className="modal-kicker">Company Settings</p>
                    <h2 className="modal-title">Brand & AI Prompts</h2>
                  </div>
                  <button type="button" className="modal-close" onClick={() => setIsSettingsModalOpen(false)}>
                    ×
                  </button>
                </div>
                <div className="settings-body">
                  <div className="settings-section">
                    <div className="settings-section-title">Company Profile</div>
                    <div className="settings-grid">
                      <div className="form-group">
                        <label className="field-label">Company Name</label>
                        <input
                          type="text"
                          className="field-input"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div className="form-group settings-full-width">
                        <label className="field-label">Company Description</label>
                        <textarea
                          className="field-input field-textarea"
                          rows={3}
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">Brand Rules</div>
                    <div className="settings-grid">
                      <div className="form-group">
                        <label className="field-label">Brand Pack</label>
                        <textarea
                          className="field-input field-textarea"
                          rows={3}
                          value={brandPack}
                          onChange={(e) => setBrandPack(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="field-label">Brand Capability</label>
                        <textarea
                          className="field-input field-textarea"
                          rows={3}
                          value={brandCapability}
                          onChange={(e) => setBrandCapability(e.target.value)}
                        />
                      </div>
                      <div className="form-group settings-full-width">
                        <label className="field-label">Emoji Rule</label>
                        <input
                          type="text"
                          className="field-input"
                          value={emojiRule}
                          onChange={(e) => setEmojiRule(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">Image Prompts</div>
                    <div className="settings-grid">
                      <div className="form-group settings-full-width">
                        <label className="field-label">System Instruction</label>
                        <textarea
                          className="field-input field-textarea"
                          rows={4}
                          value={systemInstruction}
                          onChange={(e) => setSystemInstruction(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">Writer Prompts</div>
                    <div className="settings-grid">
                      <div className="form-group">
                        <label className="field-label">Writer System Prompt</label>
                        <textarea
                          className="field-input field-textarea"
                          rows={4}
                          value={aiWriterSystemPrompt}
                          onChange={(e) => setAiWriterSystemPrompt(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="field-label">Review Prompt</label>
                        <textarea
                          className="field-input field-textarea"
                          rows={4}
                          value={aiWriterUserPrompt}
                          onChange={(e) => setAiWriterUserPrompt(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">Collaborators</div>
                    <div className="settings-grid">
                      <div className="form-group settings-full-width">
                        <label className="field-label">Add collaborator (email)</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="email"
                            className="field-input"
                            placeholder="user@example.com"
                            value={newCollaboratorEmail}
                            onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleAddCollaborator}
                            disabled={!newCollaboratorEmail}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="form-group settings-full-width">
                        <label className="field-label">Current collaborators</label>
                        <div className="collaborators-list">
                          {collaborators.length === 0 ? (
                            <p style={{ color: 'var(--ink-500)', fontSize: '0.875rem' }}>No collaborators added yet.</p>
                          ) : (
                            collaborators.map((c) => (
                              <div key={c.id} className="collaborator-item">
                                <span>{c.email}</span>
                                <span className="collaborator-role">{c.role}</span>
                                {c.role !== 'owner' && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => handleRemoveCollaborator(c.id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="settings-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsSettingsModalOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={isDeletingCompany}
                    onClick={async () => {
                      if (!activeCompanyId) return;
                      const proceed = await requestConfirm('Delete this company? This action cannot be undone.');
                      if (!proceed) return;

                      try {
                        setIsDeletingCompany(true);
                        const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
                          method: 'DELETE',
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          console.error('Delete failed:', data);
                          notify('Failed to delete company. Check console for details.', 'error');
                          return;
                        }
                        notify('Company deleted.', 'success');
                        setIsSettingsModalOpen(false);
                        setActiveCompanyIdWithPersistence(undefined);
                      } catch (err) {
                        console.error('Failed to delete company', err);
                        notify('Failed to delete company. Check console for details.', 'error');
                      } finally {
                        setIsDeletingCompany(false);
                      }
                    }}
                  >
                    {isDeletingCompany ? 'Deleting…' : 'Delete Company'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={isSavingSettings}
                    onClick={async () => {
                      if (!activeCompanyId) return;
                      try {
                        setIsSavingSettings(true);
                        const companyRes = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`,
                          {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              companyName,
                              companyDescription,
                            }),
                          },
                        );
                        if (!companyRes.ok) {
                          const data = await companyRes.json().catch(() => ({}));
                          console.error('Company save failed:', data);
                          notify('Failed to save company settings. Check console for details.', 'error');
                          return;
                        }

                        const brandPayload = {
                          companyId: activeCompanyId,
                          brandPack,
                          brandCapability,
                          emojiRule,
                          systemInstruction,
                          writerAgent: aiWriterSystemPrompt,
                          reviewPrompt1: aiWriterUserPrompt,
                        };
                        const brandUrl = brandKbId
                          ? `${backendBaseUrl}/api/brandkb/${brandKbId}`
                          : `${backendBaseUrl}/api/brandkb`;
                        const brandMethod = brandKbId ? 'PUT' : 'POST';
                        const brandRes = await authedFetch(brandUrl, {
                          method: brandMethod,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(brandPayload),
                        });
                        const brandData = await brandRes.json().catch(() => ({}));
                        if (!brandRes.ok) {
                          console.error('BrandKB save failed:', brandData);
                          notify('Failed to save brand settings. Check console for details.', 'error');
                          return;
                        }
                        if (!brandKbId && brandData?.brandKB?.brandKbId) {
                          setBrandKbId(brandData.brandKB.brandKbId);
                        }

                        notify('Company settings saved.', 'success');
                        setIsSettingsModalOpen(false);
                      } catch (err) {
                        console.error('Failed to save company settings', err);
                        notify('Failed to save company settings. Check console for details.', 'error');
                      } finally {
                        setIsSavingSettings(false);
                      }
                    }}
                  >
                    {isSavingSettings ? 'Saving…' : 'Save Settings'}
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
                  className={`btn btn-sm ${getStatusValue(selectedRow?.status) === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={getStatusValue(selectedRow?.status) !== 'Approved'}
                  onClick={() => setIsDraftModalOpen(true)}
                >
                  Draft & Publish
                </button>
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
                    <div className="kv-value">
                      {getImageGeneratedUrl(selectedRow) ? (
                        (() => {
                          const imageUrl = getImageGeneratedUrl(selectedRow);
                          const separator = imageUrl?.includes('?') ? '&' : '?';
                          return (
                            <img
                              src={`${imageUrl}${separator}v=${imagePreviewNonce}`}
                              alt="Generated"
                              style={{ maxWidth: '220px', borderRadius: 8 }}
                            />
                          );
                        })()
                      ) : (
                        <span>{selectedRow.imageGenerated ? JSON.stringify(selectedRow.imageGenerated) : ''}</span>
                      )}
                    </div>
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
                  const proceed = await requestConfirm('Trigger caption generation for this row now?');
                  if (!proceed) return;

                  setIsGeneratingCaption(true);
                  // Optimistically update status to 'Generate' in UI
                  setSelectedRow((prev: any) => (prev ? { ...prev, status: 'Generate' } : prev));
                  setCalendarRows((prev) =>
                    prev.map((row) =>
                      row.contentCalendarId === selectedRow.contentCalendarId
                        ? { ...row, status: 'Generate' }
                        : row,
                    ),
                  );

                  // Trigger Make.com generation webhook
                  if (!selectedRow.companyId) {
                    notify('Cannot trigger generation: missing company ID for this row.', 'error');
                  } else if (activeCompanyId && selectedRow.companyId !== activeCompanyId) {
                    notify(
                      'Cannot trigger generation: row company does not match the active company. Please refresh or switch to the correct company.',
                      'error',
                    );
                    setIsGeneratingCaption(false);
                    return;
                  }
                  try {
                    const whRes = await fetch('https://hook.eu2.make.com/09mj7o8vwfsp8ju11xmcn4riaace5teb', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentCalendarId: selectedRow.contentCalendarId,
                        companyId: selectedRow.companyId,
                        brandKbId: brandKbId ?? null,
                        date: selectedRow.date ?? null,
                        brandHighlight: selectedRow.brandHighlight ?? null,
                        crossPromo: selectedRow.crossPromo ?? null,
                        theme: selectedRow.theme ?? null,
                        contentType: selectedRow.contentType ?? null,
                        channels: selectedRow.channels ?? null,
                        targetAudience: selectedRow.targetAudience ?? null,
                        primaryGoal: selectedRow.primaryGoal ?? null,
                        cta: selectedRow.cta ?? null,
                        promoType: selectedRow.promoType ?? null,
                        emojiRule: emojiRule ?? null,
                        brandPack: brandPack ?? null,
                        brandCapability: brandCapability ?? null,
                      }),
                    });
                    if (!whRes.ok) {
                      const whText = await whRes.text().catch(() => '');
                      notify(`Make webhook failed (${whRes.status}). ${whText}`, 'error');
                    } else {
                      notify('Generation triggered.', 'success');
                    }
                  } catch (err) {
                    console.error('Failed to call generation webhook', err);
                    notify('Failed to trigger generation. Check console for details.', 'error');
                    setIsGeneratingCaption(false);
                  }

                  // Auto-stop loading after 6 seconds
                  setTimeout(() => {
                    setIsGeneratingCaption(false);
                  }, 6000);
                }}
              >
                {isGeneratingCaption ? 'Generating…' : 'Generate Caption'}
                {isGeneratingCaption && <span className="loading-spinner"></span>}
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
                  const proceed = await requestConfirm('Send this row for AI revision?');
                  if (!proceed) return;

                  if (!revisionWebhookUrl) {
                    notify(
                      'Revision webhook URL is not configured. Please set VITE_MAKE_REVISION_WEBHOOK in your .env.',
                      'error',
                    );
                    return;
                  }
                  if (!aiWriterUserPrompt || !aiWriterUserPrompt.trim()) {
                    notify(
                      'Review prompt is empty. Please fill in Review Prompt in Company Settings before revising.',
                      'error',
                    );
                    return;
                  }

                  setIsRevisingCaption(true);
                  try {
                    await fetch(revisionWebhookUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentCalendarId: selectedRow.contentCalendarId,
                        companyId: selectedRow.companyId ?? activeCompanyId ?? null,
                      }),
                    });
                    notify('Sent for revision.', 'success');
                  } catch (err) {
                    console.error('Failed to call revision webhook', err);
                    notify('Failed to trigger revision. Check console for details.', 'error');
                    setIsRevisingCaption(false);
                  }

                  // Auto-stop loading after 6 seconds
                  setTimeout(() => {
                    setIsRevisingCaption(false);
                  }, 6000);
                }}
              >
                {isRevisingCaption ? 'Revising…' : 'Revise caption'}
                {isRevisingCaption && <span className="loading-spinner"></span>}
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
                        const res = await authedFetch(`${backendBaseUrl}/api/brandkb/company/${companyId}`);
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

      {isImageModalOpen && selectedRow && (
        <div className="modal-backdrop">
          <div className="modal modal-wide image-modal">
            <div className="modal-header">
              <div>
                <p className="modal-kicker">Image Generation</p>
                <h2 className="modal-title">Generate Visual</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsImageModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="image-modal-grid">
                <div className="image-modal-panel">
                  <div className="panel-header">
                    <h3>Design Mega Prompt</h3>
                    <div className="panel-actions">
                      {!isEditingDmp ? (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditingDmp(true)}>
                          Custom
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setIsEditingDmp(false);
                              setDmpDraft(selectedRow.dmp ?? '');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={async () => {
                              const rowId = selectedRow?.contentCalendarId;
                              if (!rowId) return;
                              const trimmedDmp = dmpDraft.trim();
                              if (!trimmedDmp) {
                                notify('Design Mega Prompt cannot be empty.', 'error');
                                return;
                              }
                              // Disable generate button immediately to prevent double triggers
                              setIsGeneratingImage(true);
                              try {
                                // Save to backend first
                                const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${rowId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    dmp: trimmedDmp,
                                  }),
                                });
                                const data = await res.json().catch(() => ({}));
                                if (!res.ok) {
                                  console.error('Failed to save Design Mega Prompt', data);
                                  notify('Failed to save Design Mega Prompt. Check console for details.', 'error');
                                  setIsGeneratingImage(false); // Re-enable on error
                                  return;
                                }
                                setSelectedRow((prev: any) => (prev ? { ...prev, dmp: trimmedDmp } : prev));
                                setCalendarRows((prev) =>
                                  prev.map((r) =>
                                    r.contentCalendarId === rowId ? { ...r, dmp: trimmedDmp } : r,
                                  ),
                                );
                                setIsEditingDmp(false);
                                notify('Design Mega Prompt saved.', 'success');

                                // Trigger DMP webhook
                                try {
                                  await fetch('https://hook.eu2.make.com/nxgq2dxlwhaaa2dmnye8nbe2us8nili6', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      contentCalendarId: selectedRow.contentCalendarId,
                                      companyId: selectedRow.companyId ?? activeCompanyId,
                                      brandKbId,
                                      dmp: trimmedDmp,
                                    }),
                                  });
                                  // Set generating state to prevent double webhook triggers
                                  // setIsGeneratingImage(true); // Already set above
                                  // Auto close/reopen modal after 15 seconds
                                  setTimeout(() => {
                                    setIsImageModalOpen(false);
                                    setTimeout(() => setIsImageModalOpen(true), 200);
                                  }, 15000);
                                } catch (webhookErr) {
                                  console.error('Failed to trigger DMP webhook', webhookErr);
                                  // Silently ignore webhook failure; the DMP was saved
                                }

                                // Auto-stop loading after 15 seconds
                                setTimeout(() => {
                                  setIsGeneratingImage(false);
                                }, 15000);
                              } catch (err) {
                                console.error('Failed to save Design Mega Prompt', err);
                                notify('Failed to save Design Mega Prompt. Check console for details.', 'error');
                                setIsGeneratingImage(false); // Re-enable on error
                              }
                            }}
                          >
                            {isGeneratingImage ? 'Saving & Generating…' : 'Save & Generate'}
                            {isGeneratingImage && <span className="loading-spinner"></span>}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    className="field-input field-textarea"
                    rows={10}
                    value={isEditingDmp ? dmpDraft : selectedRow.dmp ?? ''}
                    onChange={(e) => setDmpDraft(e.target.value)}
                    readOnly={!isEditingDmp}
                  />
                </div>
                <div className="image-modal-panel">
                  <div className="panel-header">
                    <h3>Preview</h3>
                  </div>
                  <div className="image-preview">
                    {getImageGeneratedUrl(selectedRow) ? (
                      (() => {
                        const imageUrl = getImageGeneratedUrl(selectedRow);
                        const separator = imageUrl?.includes('?') ? '&' : '?';
                        return (
                          <img
                            src={`${imageUrl}${separator}v=${imagePreviewNonce}`}
                            alt="Generated preview"
                          />
                        );
                      })()
                    ) : (
                      <div className="empty-state">No image yet. Generate an image to see the preview.</div>
                    )}
                    {imagePollError && (
                      <div className="empty-state" style={{ color: '#b91c1c', marginTop: 8 }}>
                        {imagePollError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer image-modal-footer">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!activeCompanyId) {
                    notify('Please select a company first.', 'error');
                    return;
                  }
                  if (!brandKbId) {
                    notify('BrandKB is not loaded yet. Please try again.', 'error');
                    return;
                  }
                  if (isEditingDmp) {
                    notify('Please save or cancel your Design Mega Prompt edits before generating a new image.', 'error');
                    return;
                  }
                  if (getImageGeneratedUrl(selectedRow)) {
                    const proceed = await requestConfirm(
                      'Generate a new image? This will replace the current preview once finished.',
                    );
                    if (!proceed) return;
                  }

                  try {
                    setIsGeneratingImage(true);
                    reopenImageModalOnImageReadyRef.current = true;
                    const baseSignature = getImageGeneratedSignature(selectedRow);
                    if (imageModalReopenTimeoutRef.current) {
                      clearTimeout(imageModalReopenTimeoutRef.current);
                      imageModalReopenTimeoutRef.current = null;
                    }
                    imageModalReopenTimeoutRef.current = window.setTimeout(() => {
                      if (!reopenImageModalOnImageReadyRef.current) return;
                      setIsImageModalOpen(false);
                      window.setTimeout(() => {
                        if (reopenImageModalOnImageReadyRef.current) {
                          setIsImageModalOpen(true);
                        }
                      }, 200);
                    }, 30000);

                    const response = await fetch(imageFromExistingDmpWebhookUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentCalendarId: selectedRow.contentCalendarId,
                        companyId: selectedRow.companyId ?? activeCompanyId,
                        brandKbId,
                        systemInstruction: systemInstruction ?? '',
                        finalPrompt: selectedRow.captionOutput ?? '',
                        finalCaption: selectedRow.finalCaption ?? '',
                        brandHighlight: selectedRow.brandHighlight ?? '',
                        crossPromo: selectedRow.crossPromo ?? '',
                        theme: selectedRow.theme ?? '',
                        cta: selectedRow.cta ?? '',
                        targetAudience: selectedRow.targetAudience ?? '',
                      }),
                    });
                    if (!response.ok) {
                      const text = await response.text().catch(() => '');
                      notify(`Image webhook failed (${response.status}). ${text}`, 'error');
                      setIsGeneratingImage(false);
                      reopenImageModalOnImageReadyRef.current = false;
                      return;
                    }
                    notify('Image generation triggered. Waiting for preview…', 'success');
                    startWaitingForImageUpdate(baseSignature);
                  } catch (err) {
                    console.error('Failed to trigger image generation', err);
                    notify('Failed to trigger image generation. Check console for details.', 'error');
                    setIsGeneratingImage(false);
                    reopenImageModalOnImageReadyRef.current = false;
                  }

                  // Auto-stop loading after 30 seconds
                  setTimeout(() => {
                    setIsGeneratingImage(false);
                  }, 30000);
                }}
              >
                {isGeneratingImage ? 'Generating…' : 'Generate Image'}
                {isGeneratingImage && <span className="loading-spinner"></span>}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsImageModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

      {toast && (
        <div className={`toast toast--${toast.tone || 'info'}`} role="status">
          {toast.message}
        </div>
      )}

      {isConfirmOpen && (
        <div className="modal-backdrop confirm-backdrop">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h2 className="modal-title">Please confirm</h2>
            </div>
            <div className="modal-body">
              <p className="modal-description">{confirmMessage}</p>
            </div>
            <div className="modal-footer confirm-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => resolveConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => resolveConfirm(true)}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
