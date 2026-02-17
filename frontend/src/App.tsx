import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import {

  Plug,
  CheckCircle2,
  XCircle,
  Info,
  SearchX,
  TrendingUp,
  TrendingDown,
  Target,
  Rocket,
  Send,
  Search,
  Filter,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Activity,
  Eye,
  Copy,
  Download,
} from 'lucide-react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarTableSkeleton, AuthLoadingSkeleton } from '@/components/LoadingState';
import { DashboardPage } from '@/pages/DashboardPage';
import { CreatePage } from '@/pages/CreatePage';
import { StudioEditorPage } from '@/pages/StudioEditorPage';
import { StudioPage } from '@/pages/StudioPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage, type CompanySettingsTab } from '@/pages/SettingsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { LoginPage } from '@/pages/LoginPage';
import Faq from "@/pages/Faq";

import {
  AddCompanyModal,
  CsvExportModal,
  CopyModal,
  DraftPublishModal,
  BulkImportModal,
  ConfirmModal,
  ViewContentModal,
  ImageGenerationModal,
  OnboardingModal,
  type OnboardingData,
} from '@/modals';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ProductTour } from '@/components/ProductTour';
import './App.css';
import { NotificationProvider } from '@/contexts/NotificationContext';


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


function BrandRedirect() {
  const params = useParams();
  const decodedId = decodeURIComponent(params.companyId || '');
  const safeId = encodeURIComponent(decodedId);
  return <Navigate to={`/company/${safeId}/settings/brand-intelligence`} replace />;
}


import { supabase } from '@/lib/supabase';

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const supabaseBaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
const revisionWebhookUrl = (import.meta.env as any).VITE_MAKE_REVISION_WEBHOOK || '';
const defaultCompanyId = import.meta.env.VITE_COMPANY_ID || '';
const VIEW_MODAL_POLL_MS = 1500;
const CALENDAR_POLL_MS = 2500;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showProductTour, setShowProductTour] = useState(false);

  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
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
  const [calendarRows, setCalendarRows] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isBackendWaking, setIsBackendWaking] = useState(false);
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
  const [isRevisingCaption, setIsRevisingCaption] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftPublishIntent, setDraftPublishIntent] = useState<'draft' | 'ready'>('draft');
  const [isUploadingDesigns, setIsUploadingDesigns] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isBatchReviewing, setIsBatchReviewing] = useState(false);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyFieldSelection, setCopyFieldSelection] = useState<Record<string, boolean>>({});
  const [copySuccessMessage, setCopySuccessMessage] = useState('');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFieldSelection, setCsvFieldSelection] = useState<Record<string, boolean>>({});
  const [csvScope, setCsvScope] = useState<'selected' | 'all'>('selected');

  const [collaborators, setCollaborators] = useState<Array<{ id: string; email: string; role: 'owner' | 'collaborator' }>>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
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

  // Check if user just completed onboarding to trigger product tour
  useEffect(() => {
    if (!userProfile?.id) return;

    // Key tour completion by user ID so multiple users on same device get it
    const STORAGE_KEY = `productTourCompleted_${userProfile.id}`;
    const tourCompleted = localStorage.getItem(STORAGE_KEY);
    const justOnboarded = sessionStorage.getItem('justCompletedOnboarding');

    // Only start tour if onboarding is NOT open
    if (justOnboarded && !tourCompleted && !isOnboardingOpen) {
      // Small delay to ensure navigation/animations complete
      const timer = setTimeout(() => {
        setShowProductTour(true);
        sessionStorage.removeItem('justCompletedOnboarding');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, userProfile?.id, isOnboardingOpen]);

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

    // Debug logging
    if (!token) {
      console.warn('[authedFetch] No access token available. Session:', session ? 'exists but no token' : 'null');
    }

    const headers = {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(input, { ...init, headers });
  };

  const getAttachedDesignUrls = (row: any): string[] => {
    if (!row?.attachedDesign) return [];
    const raw = row.attachedDesign;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.urls)) return parsed.urls.filter(Boolean);
      } catch {
        return raw ? [raw] : [];
      }
    }
    if (typeof raw === 'object' && Array.isArray((raw as any).urls)) return (raw as any).urls.filter(Boolean);
    return [];
  };

  const handleUploadDesigns = async (files: FileList | null) => {
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
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `designs/${selectedRow.contentCalendarId}-${Date.now()}-${safeName}`;
        const { error } = await client.storage
          .from('generated-images')
          .upload(path, file, { upsert: true });
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
        prev.map((row) =>
          row.contentCalendarId === selectedRow.contentCalendarId
            ? { ...row, attachedDesign: nextDesigns }
            : row,
        ),
      );
      notify('Designs uploaded.', 'success');
    } catch (err) {
      console.error('Design upload failed', err);
      notify('Failed to upload designs.', 'error');
    } finally {
      setIsUploadingDesigns(false);
    }
  };

  const handleDraftPublishIntent = async () => {
    if (!selectedRow) return;
    const nextStatus = draftPublishIntent === 'ready' ? 'Approved' : selectedRow.status ?? '';
    const nextPostStatus = draftPublishIntent === 'ready' ? 'ready' : 'draft';
    const payload = {
      status: nextStatus,
      post_status: nextPostStatus,
    };
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
        prev.map((row) =>
          row.contentCalendarId === selectedRow.contentCalendarId ? { ...row, ...payload } : row,
        ),
      );
      setIsDraftModalOpen(false);
      notify(
        draftPublishIntent === 'ready' ? 'Marked as ready to publish.' : 'Saved as draft.',
        'success',
      );
    } catch (err) {
      notify('Failed to update status.', 'error');
    }
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

  // Fetch user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!session) return;
      try {
        const res = await authedFetch(`${backendBaseUrl}/api/profile`);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        setUserProfile(data.profile || null);

        // Show onboarding if not completed
        if (data.profile && !data.profile.onboarding_completed) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };

    loadProfile();
  }, [session]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>(() => {
    // Try to get from localStorage first, fallback to defaultCompanyId
    const saved = localStorage.getItem('activeCompanyId');
    return saved || defaultCompanyId;
  });
  const [recentCompanyIds, setRecentCompanyIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recentCompanyIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom setter for activeCompanyId that persists to localStorage
  const setActiveCompanyIdWithPersistence = (companyId: string | undefined) => {
    setActiveCompanyId(companyId);
    if (companyId) {
      localStorage.setItem('activeCompanyId', companyId);
    } else {
      localStorage.removeItem('activeCompanyId');
    }
  };

  const routeCompanyId = useMemo(() => {
    const match = location.pathname.match(/^\/company\/([^/]+)(?:\/|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }, [location.pathname]);

  useEffect(() => {
    if (!routeCompanyId) return;
    if (routeCompanyId === activeCompanyId) return;
    setActiveCompanyIdWithPersistence(routeCompanyId);
  }, [routeCompanyId, activeCompanyId]);

  // Update recent companies when activeCompanyId changes
  useEffect(() => {
    if (!activeCompanyId) return;
    setRecentCompanyIds((prev) => {
      const filtered = prev.filter((id) => id !== activeCompanyId);
      const next = [activeCompanyId, ...filtered].slice(0, 3);
      localStorage.setItem('recentCompanyIds', JSON.stringify(next));
      return next;
    });
  }, [activeCompanyId]);

  useEffect(() => {
    const isTeamRoute = /^\/company\/[^/]+\/settings\/team\/?$/.test(location.pathname);
    if (!isTeamRoute) return;
    if (!activeCompanyId) return;
    fetchCollaborators(activeCompanyId);
  }, [location.pathname, activeCompanyId]);

  const fetchConnectedAccounts = async (companyId: string) => {
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/social/${companyId}/accounts`);
      const data = await res.json();
      if (!res.ok) {
        // notify(data.error || 'Failed to load social accounts.', 'error');
        return;
      }
      setConnectedAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load social accounts.', err);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!activeCompanyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/auth/linkedin/connect?companyId=${activeCompanyId}`);
      if (!res.ok) {
        notify('Failed to initiate LinkedIn connection.', 'error');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('LinkedIn connect error:', e);
      notify('Failed to connect LinkedIn.', 'error');
    }
  };

  const handleConnectFacebook = async () => {
    if (!activeCompanyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/auth/facebook/connect?companyId=${activeCompanyId}`);
      if (!res.ok) {
        notify('Failed to initiate Facebook connection.', 'error');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Facebook connection error', e);
      notify('An error occurred. Please try again.', 'error');
    }
  };

  useEffect(() => {
    const isIntegrationsRoute = /^\/company\/[^/]+\/settings\/integrations\/?$/.test(location.pathname);
    if (!isIntegrationsRoute) return;
    if (!activeCompanyId) return;
    fetchConnectedAccounts(activeCompanyId);
  }, [location.pathname, activeCompanyId]);
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
  const [brandSetupMode, setBrandSetupMode] = useState<'quick' | 'advanced' | 'custom' | null>(null);
  const [brandSetupLevel, setBrandSetupLevel] = useState<'quick' | 'advanced' | 'custom' | null>(null);
  const [brandSetupStep, setBrandSetupStep] = useState(0);
  const [brandIntelligenceReady, setBrandIntelligenceReady] = useState(false);
  const [isEditingBrandSetup, setIsEditingBrandSetup] = useState(false);
  const brandEditingRef = useRef(false);
  const [formAnswerCache, setFormAnswerCache] = useState<any | null>(null);
  const [brandWebhookCooldownUntil, setBrandWebhookCooldownUntil] = useState<number>(0);
  const [brandWebhookCooldownTick, setBrandWebhookCooldownTick] = useState<number>(0);
  const [brandBasicsName, setBrandBasicsName] = useState('');
  const [brandBasicsIndustry, setBrandBasicsIndustry] = useState('');
  const [brandBasicsType, setBrandBasicsType] = useState('B2B');
  const [brandBasicsOffer, setBrandBasicsOffer] = useState('');
  const [brandBasicsGoal, setBrandBasicsGoal] = useState('Leads');
  const [audienceRole, setAudienceRole] = useState('');
  const [audienceIndustry, setAudienceIndustry] = useState('');
  const [audiencePainPoints, setAudiencePainPoints] = useState<string[]>([]);
  const [audienceOutcome, setAudienceOutcome] = useState('');
  const [toneFormal, setToneFormal] = useState(50);
  const [toneEnergy, setToneEnergy] = useState(50);
  const [toneBold, setToneBold] = useState(50);
  const [emojiUsage, setEmojiUsage] = useState('Light');
  const [writingLength, setWritingLength] = useState('Balanced');
  const [ctaStrength, setCtaStrength] = useState('Medium');
  const [absoluteTruths, setAbsoluteTruths] = useState('');
  const [noSayRules, setNoSayRules] = useState<string[]>([]);
  const [regulatedIndustry, setRegulatedIndustry] = useState('No');
  const [legalReview, setLegalReview] = useState('No');
  const [advancedPositioning, setAdvancedPositioning] = useState('');
  const [advancedDifferentiators, setAdvancedDifferentiators] = useState('');
  const [advancedPillars, setAdvancedPillars] = useState('');
  const [advancedCompetitors, setAdvancedCompetitors] = useState('');
  const [advancedProofPoints, setAdvancedProofPoints] = useState('');
  const [advancedRequiredPhrases, setAdvancedRequiredPhrases] = useState('');
  const [advancedForbiddenPhrases, setAdvancedForbiddenPhrases] = useState('');
  const [advancedComplianceNotes, setAdvancedComplianceNotes] = useState('');
  const [writerRulesUnlocked, setWriterRulesUnlocked] = useState(false);
  const [reviewerRulesUnlocked, setReviewerRulesUnlocked] = useState(false);
  const [activeBrandRuleEdit, setActiveBrandRuleEdit] = useState<
    'pack' | 'capabilities' | 'writer' | 'reviewer' | 'visual' | null
  >(null);
  const [brandRuleDraft, setBrandRuleDraft] = useState<{
    pack: string;
    capabilities: string;
    writer: string;
    reviewer: string;
    visual: string;
  }>({ pack: '', capabilities: '', writer: '', reviewer: '', visual: '' });
  const brandRuleSnapshotRef = useRef<{
    pack: string;
    capabilities: string;
    writer: string;
    reviewer: string;
    visual: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const viewModalPollRef = useRef<number | null>(null);
  const imageModalPollRef = useRef<number | null>(null);
  const suppressImageModalCloseCleanupRef = useRef<boolean>(false);
  const reopenImageModalOnImageReadyRef = useRef<boolean>(false);
  const imageModalReopenTimeoutRef = useRef<number | null>(null);
  const [imagePollError, setImagePollError] = useState<string | null>(null);
  const [isEditingDmp, setIsEditingDmp] = useState<boolean>(false);
  const [dmpDraft, setDmpDraft] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' | 'info' } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
  } | null>(null);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const statusOptions = [
    '',
    'Generate',
    'Approved',
    'Revisioned',
    'Design Completed',
    'Scheduled',
  ];

  const buildFormAnswer = () => ({
    brandBasics: {
      name: brandBasicsName,
      industry: brandBasicsIndustry,
      type: brandBasicsType,
      offer: brandBasicsOffer,
      goal: brandBasicsGoal,
    },
    audience: {
      role: audienceRole,
      industry: audienceIndustry,
      painPoints: audiencePainPoints,
      outcome: audienceOutcome,
    },
    voice: {
      formal: toneFormal,
      energy: toneEnergy,
      bold: toneBold,
      emojiUsage,
      writingLength,
      ctaStrength,
    },
    guardrails: {
      absoluteTruths,
      noSay: noSayRules,
      regulatedIndustry,
      legalReview,
    },
    advanced: {
      positioning: advancedPositioning,
      differentiators: advancedDifferentiators,
      pillars: advancedPillars,
      competitors: advancedCompetitors,
      proofPoints: advancedProofPoints,
      requiredPhrases: advancedRequiredPhrases,
      forbiddenPhrases: advancedForbiddenPhrases,
      complianceNotes: advancedComplianceNotes,
    },
  });

  const saveBrandSetup = async (overrides: any = {}) => {
    if (!activeCompanyId) return null;
    const formAnswer = buildFormAnswer();
    const brandPayload = {
      companyId: activeCompanyId,
      brandPack: overrides.brandPack !== undefined ? overrides.brandPack : brandPack,
      brandCapability: overrides.brandCapability !== undefined ? overrides.brandCapability : brandCapability,
      emojiRule: overrides.emojiRule !== undefined ? overrides.emojiRule : emojiRule,
      systemInstruction: overrides.systemInstruction !== undefined ? overrides.systemInstruction : systemInstruction,
      writerAgent: overrides.writerAgent !== undefined ? overrides.writerAgent : aiWriterSystemPrompt,
      reviewPrompt1: overrides.reviewPrompt1 !== undefined ? overrides.reviewPrompt1 : aiWriterUserPrompt,
      form_answer: formAnswer,
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
      return null;
    }
    const finalId = brandData?.brandKB?.brandKbId || brandKbId;
    if (brandData?.brandKB?.brandKbId) {
      setBrandKbId(brandData.brandKB.brandKbId);
    }
    setFormAnswerCache(formAnswer);
    return finalId;
  };

  const applyFormAnswer = (formAnswer: any) => {
    if (!formAnswer || typeof formAnswer !== 'object') return;
    const basics = formAnswer.brandBasics || {};
    const audience = formAnswer.audience || {};
    const voice = formAnswer.voice || {};
    const guardrails = formAnswer.guardrails || {};
    const advanced = formAnswer.advanced || {};

    const normalizeOptionValue = (
      raw: unknown,
      options: string[],
      allowCustom = false,
    ): string | null => {
      if (typeof raw !== 'string') return null;
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const match = options.find((opt) => opt.toLowerCase() === trimmed.toLowerCase());
      if (match) return match;
      return allowCustom ? trimmed : null;
    };

    const normalizeFixedEnum = (raw: unknown, options: string[]): string | null => {
      const normalized = normalizeOptionValue(raw, options, false);
      return normalized;
    };

    if (typeof basics.name === 'string') setBrandBasicsName(basics.name);
    {
      const nextIndustry = normalizeOptionValue(basics.industry, industryOptions, true);
      if (nextIndustry !== null) setBrandBasicsIndustry(nextIndustry);
    }
    if (typeof basics.type === 'string') setBrandBasicsType(basics.type);
    if (typeof basics.offer === 'string') setBrandBasicsOffer(basics.offer);
    if (typeof basics.goal === 'string') setBrandBasicsGoal(basics.goal);
    if (typeof audience.role === 'string') setAudienceRole(audience.role);
    if (typeof audience.industry === 'string') setAudienceIndustry(audience.industry);
    if (Array.isArray(audience.painPoints)) setAudiencePainPoints(audience.painPoints);
    if (typeof audience.outcome === 'string') setAudienceOutcome(audience.outcome);
    if (typeof voice.formal === 'number') setToneFormal(voice.formal);
    if (typeof voice.energy === 'number') setToneEnergy(voice.energy);
    if (typeof voice.bold === 'number') setToneBold(voice.bold);
    {
      const nextEmojiUsage = normalizeFixedEnum(voice.emojiUsage, ['None', 'Light', 'Medium', 'Heavy']);
      if (nextEmojiUsage !== null) setEmojiUsage(nextEmojiUsage);
    }
    {
      const nextWritingLength = normalizeFixedEnum(voice.writingLength, ['Short', 'Balanced', 'Long']);
      if (nextWritingLength !== null) setWritingLength(nextWritingLength);
    }
    {
      const nextCtaStrength = normalizeFixedEnum(voice.ctaStrength, ['Soft', 'Medium', 'Strong']);
      if (nextCtaStrength !== null) setCtaStrength(nextCtaStrength);
    }
    if (typeof guardrails.absoluteTruths === 'string') setAbsoluteTruths(guardrails.absoluteTruths);
    if (Array.isArray(guardrails.noSay)) setNoSayRules(guardrails.noSay);
    if (typeof guardrails.regulatedIndustry === 'string') setRegulatedIndustry(guardrails.regulatedIndustry);
    if (typeof guardrails.legalReview === 'string') setLegalReview(guardrails.legalReview);
    if (typeof advanced.positioning === 'string') setAdvancedPositioning(advanced.positioning);
    if (typeof advanced.differentiators === 'string') setAdvancedDifferentiators(advanced.differentiators);
    if (typeof advanced.pillars === 'string') setAdvancedPillars(advanced.pillars);
    if (typeof advanced.competitors === 'string') setAdvancedCompetitors(advanced.competitors);
    if (typeof advanced.proofPoints === 'string') setAdvancedProofPoints(advanced.proofPoints);
    if (typeof advanced.requiredPhrases === 'string') setAdvancedRequiredPhrases(advanced.requiredPhrases);
    if (typeof advanced.forbiddenPhrases === 'string') setAdvancedForbiddenPhrases(advanced.forbiddenPhrases);
    if (typeof advanced.complianceNotes === 'string') setAdvancedComplianceNotes(advanced.complianceNotes);
  };

  const nowMs = Date.now() + brandWebhookCooldownTick * 0;
  const isBrandWebhookCoolingDown = brandWebhookCooldownUntil > nowMs;
  const brandWebhookCooldownSecondsLeft = isBrandWebhookCoolingDown
    ? Math.max(1, Math.ceil((brandWebhookCooldownUntil - nowMs) / 1000))
    : 0;

  useEffect(() => {
    if (!isBrandWebhookCoolingDown) return;
    const id = window.setInterval(() => setBrandWebhookCooldownTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [isBrandWebhookCoolingDown]);

  const sendBrandWebhook = async (formAnswer: ReturnType<typeof buildFormAnswer>) => {
    if (brandSetupLevel === 'custom') return;
    if (isBrandWebhookCoolingDown) {
      notify(`Brand Intelligence generation is already running. Try again in ${brandWebhookCooldownSecondsLeft}s.`, 'info');
      return;
    }
    if (!activeCompanyId) {
      notify('Select a company before generating Brand Intelligence.', 'error');
      return;
    }
    const nextCooldownUntil = Date.now() + 60_000;
    setBrandWebhookCooldownUntil(nextCooldownUntil);
    try {
      let effectiveBrandKbId = brandKbId;
      if (!effectiveBrandKbId) {
        const resultId = await saveBrandSetup();
        if (!resultId) {
          throw new Error('Failed to save Brand Intelligence draft');
        }
        effectiveBrandKbId = resultId;
      }
      if (!effectiveBrandKbId) {
        throw new Error('Missing brandKbId');
      }

      const res = await authedFetch(`${backendBaseUrl}/api/brandkb/${effectiveBrandKbId}/generate-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formAnswer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Generation returned ${res.status}`);
      }

      const nextKb = data?.brandKB;
      if (nextKb && typeof nextKb === 'object') {
        const preserveEdits = true;
        await loadBrandKB(false, preserveEdits);
      }
    } catch (err) {
      setBrandWebhookCooldownUntil(0);
      console.error('Brand intelligence webhook failed:', err);
      notify('Brand Intelligence generation failed. Check console for details.', 'error');
    }
  };

  const startBrandRuleEdit = (key: 'pack' | 'capabilities' | 'writer' | 'reviewer' | 'visual') => {
    const snapshot = {
      pack: brandPack,
      capabilities: brandCapability,
      writer: aiWriterSystemPrompt,
      reviewer: aiWriterUserPrompt,
      visual: systemInstruction,
    };
    brandRuleSnapshotRef.current = snapshot;
    setBrandRuleDraft(snapshot);
    if (key === 'writer') setWriterRulesUnlocked(true);
    if (key === 'reviewer') setReviewerRulesUnlocked(true);
    setActiveBrandRuleEdit(key);
  };

  const closeBrandRuleEdit = () => {
    setActiveBrandRuleEdit(null);
  };

  const cancelBrandRuleEdit = () => {
    if (brandRuleSnapshotRef.current) {
      setBrandRuleDraft(brandRuleSnapshotRef.current);
    }
    setActiveBrandRuleEdit(null);
  };

  const saveBrandRuleEdit = async () => {
    if (!activeBrandRuleEdit) return;

    const nextPack = activeBrandRuleEdit === 'pack' ? brandRuleDraft.pack : brandPack;
    const nextCapabilities =
      activeBrandRuleEdit === 'capabilities' ? brandRuleDraft.capabilities : brandCapability;
    const nextWriter = activeBrandRuleEdit === 'writer' ? brandRuleDraft.writer : aiWriterSystemPrompt;
    const nextReviewer = activeBrandRuleEdit === 'reviewer' ? brandRuleDraft.reviewer : aiWriterUserPrompt;
    const nextVisual = activeBrandRuleEdit === 'visual' ? brandRuleDraft.visual : systemInstruction;

    setBrandPack(nextPack);
    setBrandCapability(nextCapabilities);
    setAiWriterSystemPrompt(nextWriter);
    setAiWriterUserPrompt(nextReviewer);
    setSystemInstruction(nextVisual);

    const saved = await saveBrandSetup({
      brandPack: nextPack,
      brandCapability: nextCapabilities,
      writerAgent: nextWriter,
      reviewPrompt1: nextReviewer,
      systemInstruction: nextVisual,
    });
    if (saved) {
      notify('Brand rules saved.', 'success');
      setActiveBrandRuleEdit(null);
    }
  };

  const industryOptions = [
    'Marketing & Advertising',
    'E-commerce',
    'SaaS / Software',
    'Finance',
    'Healthcare',
    'Real Estate',
    'Education',
    'Hospitality',
    'Other',
  ];
  const audienceRoleOptions = [
    'Founder / Owner',
    'Marketing Lead',
    'Sales Leader',
    'Operations',
    'HR / People',
    'Creator / Influencer',
    'Consumer',
  ];
  const painPointOptions = [
    'Need consistent brand voice',
    'Low engagement',
    'Limited internal bandwidth',
    'Hard to prove ROI',
    'Long approval cycles',
    'Need lead quality improvements',
  ];
  const noSayOptions = [
    'No guarantees',
    'No timelines',
    'No income claims',
    'No pricing',
    'No competitor comparisons',
    'No medical/legal promises',
  ];

  const getStatusValue = (status: any): string => {
    if (status === null || status === undefined) return '';
    if (typeof status === 'string') return status;
    if (typeof status === 'object') {
      if (typeof status.state === 'string') return status.state;
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
      return null;
    }

    // If it's already a full URL, return as-is
    if (typeof ig === 'string' && (ig.startsWith('http://') || ig.startsWith('https://'))) {
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
      const requestedCompanyId = activeCompanyId;
      setCompanyName('');
      setCompanyDescription('');
      try {
        const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const company = (data && (data.company || data)) as any;
        if (requestedCompanyId !== activeCompanyId) return;
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

  useEffect(() => {
    brandEditingRef.current =
      isEditingBrandSetup ||
      brandSetupMode !== null ||
      activeBrandRuleEdit !== null ||
      writerRulesUnlocked ||
      reviewerRulesUnlocked;
  }, [
    isEditingBrandSetup,
    brandSetupMode,
    activeBrandRuleEdit,
    writerRulesUnlocked,
    reviewerRulesUnlocked,
  ]);

  const loadBrandKB = async (resetDefaults = true, preserveEdits = false) => {
    if (!session) return;
    if (!activeCompanyId) return;
    const requestedCompanyId = activeCompanyId;
    if (resetDefaults) {
      setBrandKbId(null);
      setBrandPack('');
      setBrandCapability('');
      setEmojiRule('');
      setSystemInstruction('');
      setAiWriterSystemPrompt('');
      setAiWriterUserPrompt('');
      setBrandBasicsName('');
      setBrandBasicsIndustry('');
      setBrandBasicsType('B2B');
      setBrandBasicsOffer('');
      setBrandBasicsGoal('Leads');
      setAudienceRole('');
      setAudienceIndustry('');
      setAudiencePainPoints([]);
      setAudienceOutcome('');
      setToneFormal(50);
      setToneEnergy(50);
      setToneBold(50);
      setEmojiUsage('Light');
      setWritingLength('Balanced');
      setCtaStrength('Medium');
      setAbsoluteTruths('');
      setNoSayRules([]);
      setRegulatedIndustry('No');
      setLegalReview('No');
      setAdvancedPositioning('');
      setAdvancedDifferentiators('');
      setAdvancedPillars('');
      setAdvancedCompetitors('');
      setAdvancedProofPoints('');
      setAdvancedRequiredPhrases('');
      setAdvancedForbiddenPhrases('');
      setAdvancedComplianceNotes('');
      setBrandSetupLevel(null);
    }
    try {
      const res = await authedFetch(
        `${backendBaseUrl}/api/brandkb/company/${activeCompanyId}?t=${Date.now()}`,
        { cache: 'no-store' as RequestCache },
      );
      if (requestedCompanyId !== activeCompanyId) return;
      const data = await res.json();
      if (requestedCompanyId !== activeCompanyId) return;
      const list = Array.isArray(data.brandKBs) ? data.brandKBs : data;
      const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
      const isEditing = preserveEdits && brandEditingRef.current;
      if (first) {
        if (typeof first.brandKbId === 'string') {
          setBrandKbId(first.brandKbId);
        }
        if (!isEditing && typeof first.brandPack === 'string') {
          setBrandPack(first.brandPack);
        }
        if (!isEditing && typeof first.brandCapability === 'string') {
          setBrandCapability(first.brandCapability);
        }
        if (!isEditing && typeof first.emojiRule === 'string') {
          setEmojiRule(first.emojiRule);
        }
        if (!isEditing && typeof first.systemInstruction === 'string') {
          setSystemInstruction(first.systemInstruction);
        }
        if (!isEditing && typeof first.writerAgent === 'string') {
          setAiWriterSystemPrompt(first.writerAgent);
        }
        if (!isEditing && typeof first.reviewPrompt1 === 'string') {
          setAiWriterUserPrompt(first.reviewPrompt1);
        }
        const hasGeneratedRules =
          !!first.brandPack ||
          !!first.brandCapability ||
          !!first.writerAgent ||
          !!first.reviewPrompt1;
        const rawFormAnswer = first.form_answer as any;
        let normalizedFormAnswer = rawFormAnswer;
        if (typeof rawFormAnswer === 'string') {
          try {
            normalizedFormAnswer = JSON.parse(rawFormAnswer);
          } catch (err) {
            console.warn('Unable to parse form_answer JSON string', err);
            normalizedFormAnswer = null;
          }
        }
        const hasFormAnswer = normalizedFormAnswer && typeof normalizedFormAnswer === 'object';
        if (hasFormAnswer) {
          setFormAnswerCache(normalizedFormAnswer);
        }
        if (hasGeneratedRules && !isEditing) {
          setBrandIntelligenceReady(true);
          setBrandSetupMode(null);
          setIsEditingBrandSetup(false);
        }
        if (!isEditing) {
          applyFormAnswer(normalizedFormAnswer);
        }
      }
    } catch (err) {
      console.error('Error loading brandKB/company settings:', err);
    }
  };

  // Load existing brand knowledge base (company settings) for this company
  useEffect(() => {
    loadBrandKB();
  }, [activeCompanyId, session]);

  useEffect(() => {
    setBrandIntelligenceReady(false);
    setBrandSetupMode(null);
    setIsEditingBrandSetup(false);
    setFormAnswerCache(null);
    setBrandKbId(null);
    setBrandPack('');
    setBrandCapability('');
    setEmojiRule('');
    setSystemInstruction('');
    setAiWriterSystemPrompt('');
    setAiWriterUserPrompt('');
    setAdvancedPositioning('');
    setAdvancedDifferentiators('');
    setAdvancedPillars('');
    setAdvancedCompetitors('');
    setAdvancedProofPoints('');
    setAdvancedRequiredPhrases('');
    setAdvancedForbiddenPhrases('');
    setAdvancedComplianceNotes('');
    setBrandSetupLevel(null);
    setBrandSetupStep(0);
    setWriterRulesUnlocked(false);
    setReviewerRulesUnlocked(false);
    setActiveBrandRuleEdit(null);
  }, [activeCompanyId]);

  // Live refresh brand intelligence while on the Brand Intelligence page
  useEffect(() => {
    const isBrandIntelligenceRoute =
      /^\/company\/[^/]+\/(brand-intelligence|brand)\/?$/.test(location.pathname) ||
      /^\/company\/[^/]+\/settings/.test(location.pathname); // Match all settings routes
    if (!isBrandIntelligenceRoute) return;
    if (!activeCompanyId || !session) return;
    if (brandEditingRef.current) return;
    // Only auto-refresh when brand intelligence is actively being generated (during cooldown)
    // This prevents form interference when users are just filling out settings
    if (!isBrandWebhookCoolingDown && (brandIntelligenceReady && !brandSetupMode)) return;
    let canceled = false;
    const poll = async () => {
      if (canceled) return;
      if (brandEditingRef.current) return;
      await loadBrandKB(false, true);
    };
    const id = window.setInterval(poll, 4000);
    poll();
    return () => {
      canceled = true;
      clearInterval(id);
    };
  }, [
    activeCompanyId,
    session,
    location.pathname,
    brandIntelligenceReady,
    brandSetupMode,
    isEditingBrandSetup,
    activeBrandRuleEdit,
    writerRulesUnlocked,
    reviewerRulesUnlocked,
  ]);

  const filteredCalendarRows = useMemo(() => {
    // Detect mode from URL
    const isPublishedTab = location.pathname.includes('/calendar/published');
    const search = calendarSearch.trim().toLowerCase();
    const statusFilter = calendarStatusFilter.toLowerCase();

    const filtered = calendarRows.filter((row) => {
      const statusValue = getStatusValue(row.status).toLowerCase();
      const isPublished = statusValue === 'published';

      // Filter by tab mode
      if (isPublishedTab) {
        if (!isPublished) return false;
      } else {
        if (isPublished) return false;
      }

      // Filter by status dropdown
      if (statusFilter !== 'all' && statusValue !== statusFilter) return false;

      // Filter by search
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
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });

    // Sort by date chronologically (earliest first)
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
  }, [calendarRows, calendarSearch, calendarStatusFilter, location.pathname]);

  const calendarStatusOptions = useMemo(() => {
    const base = statusOptions.filter((opt) => opt && opt.trim());
    return ['all', ...base];
  }, []);

  // Clamp current page if data length changes
  useEffect(() => {
    const effectivePageSize = pageSize === 'all' ? filteredCalendarRows.length || 1 : pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredCalendarRows.length / effectivePageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filteredCalendarRows.length, pageSize, page]);

  useEffect(() => {
    setPage(1);
  }, [calendarSearch, calendarStatusFilter]);

  const currentPageRows = useMemo(() => {
    if (pageSize === 'all') return filteredCalendarRows;
    const start = (page - 1) * pageSize;
    return filteredCalendarRows.slice(start, start + pageSize);
  }, [filteredCalendarRows, page, pageSize]);

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

  const requestConfirm = (config: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
  }): Promise<boolean> => {
    setConfirmConfig({ confirmVariant: 'primary', ...config });
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
    setConfirmConfig(null);
  };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  const openCsvModal = () => {
    setCsvFieldSelection((prev) => (Object.keys(prev).length ? prev : { ...csvFieldDefaults }));
    setCsvScope(selectedIds.length > 0 ? 'selected' : 'all');
    setIsCsvModalOpen(true);
  };

  const fetchAllCsvRows = async () => {
    if (!activeCompanyId) {
      notify('Please select a company first.', 'error');
      return null;
    }
    try {
      const res = await authedFetch(
        `${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`,
      );
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
  };

  const buildExportRows = async (scope: 'selected' | 'all') => {
    let exportRows: any[] = [];
    if (scope === 'selected') {
      const selectedSet = new Set(selectedIds);
      exportRows = calendarRows.filter((row) => selectedSet.has(row.contentCalendarId));
    } else {
      const fetched = await fetchAllCsvRows();
      if (!fetched) return null;
      exportRows = fetched;
    }
    if (!exportRows.length) return null;

    const activeFields = csvFieldDefinitions.filter((field) => csvFieldSelection[field.key]);
    const headers = activeFields.map((field) => field.label);
    const rows = exportRows.map((row) =>
      activeFields.map((field) => {
        if (field.key === 'status') return getStatusValue(row.status) ?? '';
        const value = (row as Record<string, any>)[field.key];
        return value ?? '';
      }),
    );

    return { headers, rows };
  };

  const handleExportCsv = async () => {
    if (!Object.values(csvFieldSelection).some(Boolean)) {
      notify('Choose at least one field to export.', 'error');
      return;
    }
    if (csvScope === 'selected' && selectedIds.length === 0) {
      notify('Select at least one row to export, or choose all rows.', 'error');
      return;
    }
    const exportData = await buildExportRows(csvScope);
    if (!exportData) {
      notify('No rows available to export.', 'error');
      return;
    }
    const { headers, rows } = exportData;

    const escapeCell = (value: string) => {
      const normalized = value?.toString() ?? '';
      return `"${normalized.replace(/"/g, '""')}"`;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(','))
      .join('\r\n');

    const bom = '\ufeff';
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
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

  const openCopyModal = () => {
    if (selectedIds.length === 0) return;
    setCopyFieldSelection((prev) => (Object.keys(prev).length ? prev : { ...copyFieldDefaults }));
    setCopySuccessMessage('');
    setIsCopyModalOpen(true);
  };

  const buildCopyRows = () => {
    const selectedSet = new Set(selectedIds);
    const rowsToCopy = calendarRows.filter((row) => selectedSet.has(row.contentCalendarId));
    if (!rowsToCopy.length) return null;
    const headers = copyFieldDefinitions
      .filter((field) => copyFieldSelection[field.key])
      .map((field) => field.label);

    const rows = rowsToCopy.map((row) =>
      copyFieldDefinitions
        .filter((field) => copyFieldSelection[field.key])
        .map((field) => {
          switch (field.key) {
            case 'companyName':
              return activeCompany?.companyName ?? '';
            case 'date':
              return row.date ?? '';
            case 'finalCaption':
              return row.finalCaption ?? '';
            case 'finalHashtags':
              return row.finalHashtags ?? '';
            case 'finalCTA':
              return row.finalCTA ?? '';
            case 'status':
              return getStatusValue(row.status) ?? '';
            case 'internalNotes':
              return row.reviewNotes ?? '';
            case 'captionOutput':
              return row.captionOutput ?? '';
            case 'hastagsOutput':
              return row.hastagsOutput ?? '';
            case 'dmp':
              return row.dmp ?? '';
            case 'metadata':
              return [row.companyId, row.contentCalendarId, row.created_at].filter(Boolean).join(' | ');
            default:
              return '';
          }
        }),
    );

    return { headers, rows };
  };

  const handleCopySpreadsheet = async () => {
    if (selectedIds.length === 0) {
      notify('Select at least one row to copy.', 'error');
      return;
    }
    if (!Object.values(copyFieldSelection).some(Boolean)) {
      notify('Choose at least one field to copy.', 'error');
      return;
    }
    const exportData = buildCopyRows();
    if (!exportData) {
      notify('No rows available to copy.', 'error');
      return;
    }
    const { headers, rows } = exportData;
    const tsv = [headers, ...rows]
      .map((row) => row.map((cell) => (cell ?? '').toString()).join('\t'))
      .join('\n');
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const buildHtmlCell = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br/>');
    const htmlTable = `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${buildHtmlCell((cell ?? '').toString())}</td>`).join('')}</tr>`)
        .join('')}
      </tbody>
    </table>
  `;
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

  const activeNavKey = useMemo(() => {
    const path = location.pathname;
    if (/^\/company\/[^/]+\/dashboard(?:\/|$)/.test(path)) return 'dashboard';
    if (/^\/company\/[^/]+\/generate(?:\/|$)/.test(path)) return 'generate';
    if (/^\/company\/[^/]+\/calendar(?:\/|$)/.test(path)) return 'calendar';
    if (/^\/company\/[^/]+\/studio(?:\/|$)/.test(path)) return 'studio';
    if (/^\/company\/[^/]+\/integrations(?:\/|$)/.test(path)) return 'integrations';
    if (/^\/company\/[^/]+\/settings(?:\/|$)/.test(path)) return 'settings';
    return null;
  }, [location.pathname]);

  const dashboardStats = useMemo(() => {
    const counts = {
      total: calendarRows.length,
      approved: 0,
      review: 0,
      generate: 0,
      draft: 0,
      scheduled: 0, // Initialize scheduled count
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
      else if (status === 'scheduled') counts.scheduled += 1; // Count scheduled items
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
    const proceed = await requestConfirm({
      title: 'Delete content items?',
      description: `You're about to delete ${selectedIds.length} content items from your content calendar. This action is permanent and cannot be undone.`,
      confirmLabel: `Delete ${selectedIds.length} items`,
      cancelLabel: 'Keep items',
      confirmVariant: 'danger',
    });
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

  const refreshCalendarRow = async (contentCalendarId: string) => {
    if (!session) return;
    if (!contentCalendarId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${contentCalendarId}?t=${Date.now()}`, {
        cache: 'no-store' as RequestCache,
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const row = (data && (data.contentCalendar || data)) as any;
      if (!row || !row.contentCalendarId) return;
      setCalendarRows((prev) => prev.map((r) => (r.contentCalendarId === row.contentCalendarId ? row : r)));
      setSelectedRow((prev: any) => (prev && prev.contentCalendarId === row.contentCalendarId ? row : prev));
    } catch (err) {
      // ignore refresh errors
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedIds.length === 0) return;
    const proceed = await requestConfirm({
      title: 'Generate captions for selected content?',
      description: `You're about to trigger caption generation for ${selectedIds.length} content items.`,
      confirmLabel: `Generate ${selectedIds.length} captions`,
      cancelLabel: 'Go back',
      confirmVariant: 'primary',
    });
    if (!proceed) return;
    setIsBatchGenerating(true);

    const rowsToProcess = calendarRows.filter((row) => selectedIds.includes(row.contentCalendarId));
    const validRows = rowsToProcess.filter((row) => {
      if (!row.companyId) return false;
      if (activeCompanyId && row.companyId !== activeCompanyId) return false;
      return true;
    });

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
        notify(`Generation triggered: ${successCount} success, ${skippedCount} skipped, ${failedCount} failed.`, 'success');
      }
    } catch (err) {
      console.error('Bulk generate captions failed', err);
      notify('Failed to trigger generation due to a network error.', 'error');
    }

    setIsBatchGenerating(false);
  };

  const handleBatchReview = async () => {
    if (selectedIds.length === 0) return;
    const proceed = await requestConfirm({
      title: 'Send selected content for review?',
      description: `You're about to send ${selectedIds.length} content items for review.`,
      confirmLabel: `Send ${selectedIds.length} items`,
      cancelLabel: 'Go back',
      confirmVariant: 'primary',
    });
    if (!proceed) return;
    setIsBatchReviewing(true);

    const rowsToProcess = calendarRows.filter((row) => selectedIds.includes(row.contentCalendarId));
    const reviewEligibleRows = rowsToProcess.filter(
      (row) => getStatusValue(row.status).trim().toLowerCase() === 'review',
    );
    const validRows = reviewEligibleRows.filter((row) => !!row.captionOutput);

    if (validRows.length === 0) {
      notify('Only items already in Review status can be sent for review.', 'error');
      setIsBatchReviewing(false);
      return;
    }

    try {
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/review-content-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentCalendarIds: validRows.map((r) => r.contentCalendarId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || 'Failed to trigger review.', 'error');
      } else {
        const summary = data.summary as any;
        const successCount = Array.isArray(summary?.success) ? summary.success.length : 0;
        const failedCount = Array.isArray(summary?.failed) ? summary.failed.length : 0;
        const skippedCount = Array.isArray(summary?.skipped) ? summary.skipped.length : 0;
        notify(`Review triggered: ${successCount} success, ${skippedCount} skipped, ${failedCount} failed.`, 'success');
      }
    } catch (err) {
      console.error('Bulk review failed', err);
      notify('Failed to trigger review due to a network error.', 'error');
    } finally {
      validRows.forEach((row) => refreshCalendarRow(row.contentCalendarId));
      setIsBatchReviewing(false);
    }
  };

  // ...
  const handleBatchGenerateImages = async () => {
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
      if (getStatusValue(row.status).trim().toLowerCase() !== 'approved') return false;
      return true;
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

  const handleAddCompany = async () => {
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
  };

  const handleBulkImport = async () => {
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
  };

  const handleOnboardingComplete = async (data: OnboardingData | null) => {
    try {
      // Handle skip
      if (!data) {
        // Just mark onboarding as complete without creating company
        const profileRes = await authedFetch(`${backendBaseUrl}/api/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            onboarding_completed: true,
          }),
        });

        if (profileRes.ok) {
          setIsOnboardingOpen(false);
          setUserProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
          notify('You can create a company anytime from the sidebar!', 'info');
        }
        return;
      }

      // 1. Update profile with role and mark onboarding as complete
      const profileRes = await authedFetch(`${backendBaseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: data.role,
          onboarding_completed: true,
        }),
      });

      if (!profileRes.ok) {
        notify('Failed to save profile. Please try again.', 'error');
        return;
      }

      // 2. Check if company with same name already exists
      const existingCompany = companies.find(
        (c) => c.companyName?.toLowerCase() === data.companyName.toLowerCase()
      );

      if (existingCompany) {
        // Company already exists, just close onboarding and navigate
        setIsOnboardingOpen(false);
        setUserProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
        setActiveCompanyIdWithPersistence(existingCompany.companyId);
        notify('Welcome back! Using your existing company.', 'success');
        navigate(`/company/${encodeURIComponent(existingCompany.companyId)}/dashboard`);
        return;
      }

      // 3. Create company
      const companyRes = await authedFetch(`${backendBaseUrl}/api/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          companyDescription: data.companyDescription,
        }),
      });

      const companyData = await companyRes.json().catch(() => ({}));
      if (!companyRes.ok) {
        notify(companyData.error || 'Failed to create company.', 'error');
        return;
      }

      const newCompanyId = companyData.company?.companyId;

      // 4. Initialize Brand Intelligence
      if (newCompanyId) {
        const brandPayload = {
          companyId: newCompanyId,
          form_answer: {
            brandBasics: {
              name: data.companyName,
              industry: data.industry,
              type: data.businessType,
              offer: data.companyDescription,
              goal: data.primaryGoal,
            },
            // Audience data from onboarding
            audience: {
              role: data.audienceRole || '',
              industry: data.audienceIndustry || '',
              painPoints: data.audiencePainPoints?.join(', ') || '',
              outcome: data.audienceOutcome || '',
            },
            // Tone data from onboarding
            tone: {
              formal: data.toneFormal || 5,
              energy: data.toneEnergy || 5,
              bold: data.toneBold || 5,
              emojiUsage: data.emojiUsage || 'Sometimes',
              writingLength: data.writingLength || 'Medium',
              ctaStrength: data.ctaStrength || 'Moderate',
            },
            // Include enhanced brand data if extracted from website (for additional context)
            ...(data.targetAudience && {
              extractedAudience: {
                role: data.targetAudience.role,
                painPoints: data.targetAudience.painPoints?.join(', ') || '',
                outcomes: data.targetAudience.outcomes?.join(', ') || '',
              },
            }),
            ...(data.brandVoice && {
              extractedTone: {
                formality: data.brandVoice.formality,
                energy: data.brandVoice.energy,
                confidence: data.brandVoice.confidence,
              },
            }),
            ...(data.visualIdentity && {
              visualIdentity: {
                colors: data.visualIdentity.primaryColors?.join(', ') || '',
              },
            }),
          },
        };

        await authedFetch(`${backendBaseUrl}/api/brandkb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brandPayload),
        });

        // Update local state - only add if not already in list
        setCompanies((prev) => {
          const exists = prev.some((c) => c.companyId === newCompanyId);
          return exists ? prev : [companyData.company, ...prev];
        });
        setActiveCompanyIdWithPersistence(newCompanyId);
      }

      // 5. Close onboarding and update profile state
      setIsOnboardingOpen(false);
      setUserProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
      notify('Welcome to Moonshot Generator! 🎉', 'success');

      // Mark that user just completed onboarding to trigger tour
      sessionStorage.setItem('justCompletedOnboarding', 'true');

      // Navigate to dashboard
      if (newCompanyId) {
        navigate(`/company/${encodeURIComponent(newCompanyId)}/dashboard`);
      }
    } catch (err) {
      notify('Failed to complete onboarding. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    setActiveCompanyIdWithPersistence(undefined);
    await supabase?.auth.signOut();
    navigate('/');
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      const companyToDelete = companies.find((c) => c.companyId === companyId);
      const confirmed = await requestConfirm({
        title: 'Delete Company?',
        description: `Are you sure you want to delete "${companyToDelete?.companyName}"? This action cannot be undone and all data will be lost.`,
        confirmLabel: 'Delete Company',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
      });

      if (!confirmed) return;

      const res = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete company');
      }

      notify('Company deleted successfully', 'success');

      // Update local state
      const updatedCompanies = companies.filter((c) => c.companyId !== companyId);
      setCompanies(updatedCompanies);

      // If deleted company was active, switch to another or clear
      if (activeCompanyId === companyId) {
        if (updatedCompanies.length > 0) {
          const nextCompanyId = updatedCompanies[0].companyId;
          setActiveCompanyIdWithPersistence(nextCompanyId);
          navigate(`/company/${encodeURIComponent(nextCompanyId)}/dashboard`);
        } else {
          setActiveCompanyIdWithPersistence('');
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Error deleting company:', err);
      notify(err.message || 'Failed to delete company', 'error');
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!activeCompanyId) return;

    try {
      const company = companies.find((c) => c.companyId === activeCompanyId);
      const collaborator = collaborators.find((c: any) => c.id === newOwnerId);

      const confirmed = await requestConfirm({
        title: 'Transfer Ownership?',
        description: `Are you sure you want to transfer ownership of "${company?.companyName}" to ${collaborator?.email || 'this user'}? You will become a collaborator with limited permissions.`,
        confirmLabel: 'Transfer Ownership',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
      });

      if (!confirmed) return;

      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to transfer ownership');
      }

      const responseData = await res.json();
      notify(responseData.message || 'Ownership transferred successfully', 'success');

      // Navigate to dashboard to trigger natural reload of companies and collaborators
      navigate(`/company/${encodeURIComponent(activeCompanyId)}/dashboard`);
      // Force a page refresh to ensure all state updates
      window.location.reload();

    } catch (err: any) {
      console.error('Error transferring ownership:', err);
      notify(err.message || 'Failed to transfer ownership', 'error');
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
        <AuthLoadingSkeleton />
      </div>
    );
  }


  if (!session) {
    return <LoginPage supabase={supabase} notify={notify} />;
  }

  return (
    <NotificationProvider>

      <div className="flex flex-col h-screen w-full bg-[#FAFBFC] text-brand-dark transition-colors duration-300">
        <Header
          isNavDrawerOpen={isNavDrawerOpen}
          setIsNavDrawerOpen={setIsNavDrawerOpen}
          activeCompany={activeCompany}
          notify={notify}
          navigate={navigate}
          session={session}
          supabase={supabase}
          onLogout={handleLogout}
        />

        <div className="flex min-h-[calc(100vh-80px)] relative">
          <Sidebar
            isNavDrawerOpen={isNavDrawerOpen}
            setIsNavDrawerOpen={setIsNavDrawerOpen}
            activeCompany={activeCompany}
            activeCompanyId={activeCompanyId}
            companies={companies}
            isCompanyDropdownOpen={isCompanyDropdownOpen}
            setIsCompanyDropdownOpen={setIsCompanyDropdownOpen}
            navigate={navigate}
            activeNavKey={activeNavKey}
            setActiveCompanyIdWithPersistence={setActiveCompanyIdWithPersistence}
            setIsOnboardingOpen={setIsOnboardingOpen}
            notify={notify}
            recentCompanies={companies.filter((c) => recentCompanyIds.includes(c.companyId))}
          />

          <div className="flex-1 ml-0 lg:ml-[264px] overflow-y-auto h-[calc(100vh-80px)] bg-gray-50">
            <div>
              <Routes>
                <Route
                  path="/"
                  element={
                    activeCompanyId
                      ? <Navigate to={`/company/${encodeURIComponent(activeCompanyId)}/dashboard`} replace />
                      : (
                        <div className="app-main">
                          <div className="empty-state">
                            <p>Select a company to continue.</p>
                          </div>
                        </div>
                      )
                  }
                />

                <Route
                  path="/profile"
                  element={<ProfilePage session={session} supabase={supabase} notify={notify} />}
                />

                <Route path="/faq" element={<Faq />} />
                <Route
                  path="/company/:companyId/dashboard"
                  element={
                    <DashboardPage
                      activeCompany={activeCompany}
                      activeCompanyId={activeCompanyId}
                      dashboardStats={dashboardStats}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/generate"
                  element={
                    <CreatePage
                      form={form}
                      handleChange={handleChange}
                      handleAdd={handleAdd}
                      isAdding={isAdding}
                      setBulkText={setBulkText}
                      setBulkPreview={setBulkPreview}
                      setShowPreview={setShowPreview}
                      setIsBulkModalOpen={setIsBulkModalOpen}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/calendar"
                  element={
                    <CalendarPage
                      viewMode="drafts"
                      calendarSearch={calendarSearch}
                      setCalendarSearch={setCalendarSearch}
                      calendarStatusFilter={calendarStatusFilter}
                      setCalendarStatusFilter={setCalendarStatusFilter}
                      calendarStatusOptions={calendarStatusOptions}
                      selectedIds={selectedIds}
                      isBatchGenerating={isBatchGenerating}
                      isBatchReviewing={isBatchReviewing}
                      isBatchGeneratingImages={isBatchGeneratingImages}
                      handleBatchGenerate={handleBatchGenerate}
                      handleBatchReview={handleBatchReview}
                      handleBatchGenerateImages={handleBatchGenerateImages}
                      openCsvModal={openCsvModal}
                      openCopyModal={openCopyModal}
                      handleDeleteSelected={handleDeleteSelected}
                      isBackendWaking={isBackendWaking}
                      calendarError={calendarError}
                      isLoadingCalendar={isLoadingCalendar}
                      calendarRows={calendarRows}
                      filteredCalendarRows={filteredCalendarRows}
                      activeCompanyId={activeCompanyId}
                      isPageFullySelected={isPageFullySelected}
                      toggleSelectAllOnPage={toggleSelectAllOnPage}
                      toggleSelectOne={toggleSelectOne}
                      getStatusValue={getStatusValue}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                      page={page}
                      setPage={setPage}
                      currentPageRows={currentPageRows}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/calendar/published"
                  element={
                    <CalendarPage
                      viewMode="published"
                      calendarSearch={calendarSearch}
                      setCalendarSearch={setCalendarSearch}
                      calendarStatusFilter={calendarStatusFilter}
                      setCalendarStatusFilter={setCalendarStatusFilter}
                      calendarStatusOptions={calendarStatusOptions}
                      selectedIds={selectedIds}
                      isBatchGenerating={isBatchGenerating}
                      isBatchReviewing={isBatchReviewing}
                      isBatchGeneratingImages={isBatchGeneratingImages}
                      handleBatchGenerate={handleBatchGenerate}
                      handleBatchReview={handleBatchReview}
                      handleBatchGenerateImages={handleBatchGenerateImages}
                      openCsvModal={openCsvModal}
                      openCopyModal={openCopyModal}
                      handleDeleteSelected={handleDeleteSelected}
                      isBackendWaking={isBackendWaking}
                      calendarError={calendarError}
                      isLoadingCalendar={isLoadingCalendar}
                      calendarRows={calendarRows}
                      filteredCalendarRows={filteredCalendarRows}
                      activeCompanyId={activeCompanyId}
                      isPageFullySelected={isPageFullySelected}
                      toggleSelectAllOnPage={toggleSelectAllOnPage}
                      toggleSelectOne={toggleSelectOne}
                      getStatusValue={getStatusValue}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                      page={page}
                      setPage={setPage}
                      currentPageRows={currentPageRows}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/studio"
                  element={
                    <StudioPage
                      calendarRows={calendarRows}
                      getStatusValue={getStatusValue}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      getAttachedDesignUrls={getAttachedDesignUrls}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      notify={notify}
                      activeCompanyId={activeCompanyId}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/brand"
                  element={<BrandRedirect />}
                />



                <Route
                  path="/company/:companyId/settings/overview"
                  element={
                    <SettingsPage
                      tab="overview"
                      setActiveCompanyIdWithPersistence={setActiveCompanyIdWithPersistence}
                      brandIntelligenceReady={brandIntelligenceReady}
                      brandSetupMode={brandSetupMode}
                      setBrandSetupMode={setBrandSetupMode}
                      brandSetupLevel={brandSetupLevel}
                      setBrandSetupLevel={setBrandSetupLevel}
                      brandSetupStep={brandSetupStep}
                      setBrandSetupStep={setBrandSetupStep}
                      setIsEditingBrandSetup={setIsEditingBrandSetup}
                      collaborators={collaborators}
                      companyName={companyName}
                      setCompanyName={setCompanyName}
                      companyDescription={companyDescription}
                      setCompanyDescription={setCompanyDescription}
                      loadBrandKB={loadBrandKB}
                      brandKbId={brandKbId}
                      brandPack={brandPack}
                      setBrandPack={setBrandPack}
                      brandCapability={brandCapability}
                      setBrandCapability={setBrandCapability}
                      emojiRule={emojiRule}
                      setEmojiRule={setEmojiRule}
                      systemInstruction={systemInstruction}
                      setSystemInstruction={setSystemInstruction}
                      aiWriterSystemPrompt={aiWriterSystemPrompt}
                      setAiWriterSystemPrompt={setAiWriterSystemPrompt}
                      aiWriterUserPrompt={aiWriterUserPrompt}
                      setAiWriterUserPrompt={setAiWriterUserPrompt}
                      activeBrandRuleEdit={activeBrandRuleEdit}
                      brandRuleDraft={brandRuleDraft}
                      setBrandRuleDraft={setBrandRuleDraft}
                      startBrandRuleEdit={startBrandRuleEdit}
                      cancelBrandRuleEdit={cancelBrandRuleEdit}
                      saveBrandRuleEdit={saveBrandRuleEdit}
                      saveBrandSetup={saveBrandSetup}
                      sendBrandWebhook={sendBrandWebhook}
                      buildFormAnswer={buildFormAnswer}
                      brandBasicsGoal={brandBasicsGoal}
                      setBrandBasicsGoal={setBrandBasicsGoal}
                      regulatedIndustry={regulatedIndustry}
                      setRegulatedIndustry={setRegulatedIndustry}
                      legalReview={legalReview}
                      setLegalReview={setLegalReview}
                      isBrandWebhookCoolingDown={isBrandWebhookCoolingDown}
                      brandWebhookCooldownSecondsLeft={brandWebhookCooldownSecondsLeft}
                      isEditingBrandSetup={isEditingBrandSetup}
                      brandEditingRef={brandEditingRef}
                      formAnswerCache={formAnswerCache}
                      industryOptions={industryOptions}
                      audienceRoleOptions={audienceRoleOptions}
                      painPointOptions={painPointOptions}
                      noSayOptions={noSayOptions}
                      brandBasicsName={brandBasicsName}
                      setBrandBasicsName={setBrandBasicsName}
                      brandBasicsIndustry={brandBasicsIndustry}
                      setBrandBasicsIndustry={setBrandBasicsIndustry}
                      brandBasicsType={brandBasicsType}
                      setBrandBasicsType={setBrandBasicsType}
                      brandBasicsOffer={brandBasicsOffer}
                      setBrandBasicsOffer={setBrandBasicsOffer}
                      audienceRole={audienceRole}
                      setAudienceRole={setAudienceRole}
                      audienceIndustry={audienceIndustry}
                      setAudienceIndustry={setAudienceIndustry}
                      audiencePainPoints={audiencePainPoints}
                      setAudiencePainPoints={setAudiencePainPoints}
                      audienceOutcome={audienceOutcome}
                      setAudienceOutcome={setAudienceOutcome}
                      toneFormal={toneFormal}
                      setToneFormal={setToneFormal}
                      toneEnergy={toneEnergy}
                      setToneEnergy={setToneEnergy}
                      toneBold={toneBold}
                      setToneBold={setToneBold}
                      emojiUsage={emojiUsage}
                      setEmojiUsage={setEmojiUsage}
                      writingLength={writingLength}
                      setWritingLength={setWritingLength}
                      ctaStrength={ctaStrength}
                      setCtaStrength={setCtaStrength}
                      absoluteTruths={absoluteTruths}
                      setAbsoluteTruths={setAbsoluteTruths}
                      noSayRules={noSayRules}
                      setNoSayRules={setNoSayRules}
                      advancedPositioning={advancedPositioning}
                      setAdvancedPositioning={setAdvancedPositioning}
                      advancedDifferentiators={advancedDifferentiators}
                      setAdvancedDifferentiators={setAdvancedDifferentiators}
                      advancedPillars={advancedPillars}
                      setAdvancedPillars={setAdvancedPillars}
                      advancedCompetitors={advancedCompetitors}
                      setAdvancedCompetitors={setAdvancedCompetitors}
                      advancedProofPoints={advancedProofPoints}
                      setAdvancedProofPoints={setAdvancedProofPoints}
                      advancedRequiredPhrases={advancedRequiredPhrases}
                      setAdvancedRequiredPhrases={setAdvancedRequiredPhrases}
                      advancedForbiddenPhrases={advancedForbiddenPhrases}
                      setAdvancedForbiddenPhrases={setAdvancedForbiddenPhrases}
                      advancedComplianceNotes={advancedComplianceNotes}
                      setAdvancedComplianceNotes={setAdvancedComplianceNotes}
                      writerRulesUnlocked={writerRulesUnlocked}
                      reviewerRulesUnlocked={reviewerRulesUnlocked}
                      newCollaboratorEmail={newCollaboratorEmail}
                      setNewCollaboratorEmail={setNewCollaboratorEmail}
                      onAddCollaborator={handleAddCollaborator}
                      onRemoveCollaborator={handleRemoveCollaborator}
                      onDeleteCompany={() => handleDeleteCompany(activeCompanyId!)}
                      connectedAccounts={connectedAccounts}
                      onConnectLinkedIn={handleConnectLinkedIn}
                      onConnectFacebook={handleConnectFacebook}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/studio/:contentId"
                  element={
                    <StudioEditorPage
                      activeCompanyId={activeCompanyId || ''}
                      backendBaseUrl={backendBaseUrl}
                      authedFetch={authedFetch}
                      notify={notify}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/settings"
                  element={<Navigate to="brand-intelligence" replace />}
                />
                <Route
                  path="/company/:companyId/settings/brand-intelligence"
                  element={
                    <SettingsPage
                      tab="brand-intelligence"
                      setActiveCompanyIdWithPersistence={setActiveCompanyIdWithPersistence}
                      brandIntelligenceReady={brandIntelligenceReady}
                      brandSetupMode={brandSetupMode}
                      setBrandSetupMode={setBrandSetupMode}
                      brandSetupLevel={brandSetupLevel}
                      setBrandSetupLevel={setBrandSetupLevel}
                      brandSetupStep={brandSetupStep}
                      setBrandSetupStep={setBrandSetupStep}
                      setIsEditingBrandSetup={setIsEditingBrandSetup}
                      collaborators={collaborators}
                      companyName={companyName}
                      setCompanyName={setCompanyName}
                      companyDescription={companyDescription}
                      setCompanyDescription={setCompanyDescription}
                      loadBrandKB={loadBrandKB}
                      brandKbId={brandKbId}
                      brandPack={brandPack}
                      setBrandPack={setBrandPack}
                      brandCapability={brandCapability}
                      setBrandCapability={setBrandCapability}
                      emojiRule={emojiRule}
                      setEmojiRule={setEmojiRule}
                      systemInstruction={systemInstruction}
                      setSystemInstruction={setSystemInstruction}
                      aiWriterSystemPrompt={aiWriterSystemPrompt}
                      setAiWriterSystemPrompt={setAiWriterSystemPrompt}
                      aiWriterUserPrompt={aiWriterUserPrompt}
                      setAiWriterUserPrompt={setAiWriterUserPrompt}
                      activeBrandRuleEdit={activeBrandRuleEdit}
                      brandRuleDraft={brandRuleDraft}
                      setBrandRuleDraft={setBrandRuleDraft}
                      startBrandRuleEdit={startBrandRuleEdit}
                      cancelBrandRuleEdit={cancelBrandRuleEdit}
                      saveBrandRuleEdit={saveBrandRuleEdit}
                      saveBrandSetup={saveBrandSetup}
                      connectedAccounts={connectedAccounts}
                      onConnectLinkedIn={handleConnectLinkedIn}
                      onConnectFacebook={handleConnectFacebook}
                      onDeleteCompany={() => handleDeleteCompany(activeCompanyId!)}
                      sendBrandWebhook={sendBrandWebhook}
                      buildFormAnswer={buildFormAnswer}
                      brandBasicsGoal={brandBasicsGoal}
                      setBrandBasicsGoal={setBrandBasicsGoal}
                      regulatedIndustry={regulatedIndustry}
                      setRegulatedIndustry={setRegulatedIndustry}
                      legalReview={legalReview}
                      setLegalReview={setLegalReview}
                      isBrandWebhookCoolingDown={isBrandWebhookCoolingDown}
                      brandWebhookCooldownSecondsLeft={brandWebhookCooldownSecondsLeft}
                      isEditingBrandSetup={isEditingBrandSetup}
                      brandEditingRef={brandEditingRef}
                      formAnswerCache={formAnswerCache}
                      industryOptions={industryOptions}
                      audienceRoleOptions={audienceRoleOptions}
                      painPointOptions={painPointOptions}
                      noSayOptions={noSayOptions}
                      brandBasicsName={brandBasicsName}
                      setBrandBasicsName={setBrandBasicsName}
                      brandBasicsIndustry={brandBasicsIndustry}
                      setBrandBasicsIndustry={setBrandBasicsIndustry}
                      brandBasicsType={brandBasicsType}
                      setBrandBasicsType={setBrandBasicsType}
                      brandBasicsOffer={brandBasicsOffer}
                      setBrandBasicsOffer={setBrandBasicsOffer}
                      audienceRole={audienceRole}
                      setAudienceRole={setAudienceRole}
                      audienceIndustry={audienceIndustry}
                      setAudienceIndustry={setAudienceIndustry}
                      audiencePainPoints={audiencePainPoints}
                      setAudiencePainPoints={setAudiencePainPoints}
                      audienceOutcome={audienceOutcome}
                      setAudienceOutcome={setAudienceOutcome}
                      toneFormal={toneFormal}
                      setToneFormal={setToneFormal}
                      toneEnergy={toneEnergy}
                      setToneEnergy={setToneEnergy}
                      toneBold={toneBold}
                      setToneBold={setToneBold}
                      emojiUsage={emojiUsage}
                      setEmojiUsage={setEmojiUsage}
                      writingLength={writingLength}
                      setWritingLength={setWritingLength}
                      ctaStrength={ctaStrength}
                      setCtaStrength={setCtaStrength}
                      absoluteTruths={absoluteTruths}
                      setAbsoluteTruths={setAbsoluteTruths}
                      noSayRules={noSayRules}
                      setNoSayRules={setNoSayRules}
                      advancedPositioning={advancedPositioning}
                      setAdvancedPositioning={setAdvancedPositioning}
                      advancedDifferentiators={advancedDifferentiators}
                      setAdvancedDifferentiators={setAdvancedDifferentiators}
                      advancedPillars={advancedPillars}
                      setAdvancedPillars={setAdvancedPillars}
                      advancedCompetitors={advancedCompetitors}
                      setAdvancedCompetitors={setAdvancedCompetitors}
                      advancedProofPoints={advancedProofPoints}
                      setAdvancedProofPoints={setAdvancedProofPoints}
                      advancedRequiredPhrases={advancedRequiredPhrases}
                      setAdvancedRequiredPhrases={setAdvancedRequiredPhrases}
                      advancedForbiddenPhrases={advancedForbiddenPhrases}
                      setAdvancedForbiddenPhrases={setAdvancedForbiddenPhrases}
                      advancedComplianceNotes={advancedComplianceNotes}
                      setAdvancedComplianceNotes={setAdvancedComplianceNotes}
                      writerRulesUnlocked={writerRulesUnlocked}
                      reviewerRulesUnlocked={reviewerRulesUnlocked}
                      newCollaboratorEmail={newCollaboratorEmail}
                      setNewCollaboratorEmail={setNewCollaboratorEmail}
                      onAddCollaborator={handleAddCollaborator}
                      onRemoveCollaborator={handleRemoveCollaborator}
                      onTransferOwnership={handleTransferOwnership}
                      isOwner={activeCompany?.user_id === session?.user?.id}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/settings/team"
                  element={
                    <SettingsPage
                      tab="team"
                      setActiveCompanyIdWithPersistence={setActiveCompanyIdWithPersistence}
                      brandIntelligenceReady={brandIntelligenceReady}
                      brandSetupMode={brandSetupMode}
                      setBrandSetupMode={setBrandSetupMode}
                      brandSetupLevel={brandSetupLevel}
                      setBrandSetupLevel={setBrandSetupLevel}
                      brandSetupStep={brandSetupStep}
                      setBrandSetupStep={setBrandSetupStep}
                      setIsEditingBrandSetup={setIsEditingBrandSetup}
                      collaborators={collaborators}
                      companyName={companyName}
                      setCompanyName={setCompanyName}
                      companyDescription={companyDescription}
                      setCompanyDescription={setCompanyDescription}
                      loadBrandKB={loadBrandKB}
                      brandKbId={brandKbId}
                      brandPack={brandPack}
                      setBrandPack={setBrandPack}
                      brandCapability={brandCapability}
                      setBrandCapability={setBrandCapability}
                      emojiRule={emojiRule}
                      setEmojiRule={setEmojiRule}
                      systemInstruction={systemInstruction}
                      setSystemInstruction={setSystemInstruction}
                      aiWriterSystemPrompt={aiWriterSystemPrompt}
                      setAiWriterSystemPrompt={setAiWriterSystemPrompt}
                      aiWriterUserPrompt={aiWriterUserPrompt}
                      setAiWriterUserPrompt={setAiWriterUserPrompt}
                      activeBrandRuleEdit={activeBrandRuleEdit}
                      brandRuleDraft={brandRuleDraft}
                      setBrandRuleDraft={setBrandRuleDraft}
                      startBrandRuleEdit={startBrandRuleEdit}
                      cancelBrandRuleEdit={cancelBrandRuleEdit}
                      saveBrandRuleEdit={saveBrandRuleEdit}
                      saveBrandSetup={saveBrandSetup}
                      sendBrandWebhook={sendBrandWebhook}
                      isBrandWebhookCoolingDown={isBrandWebhookCoolingDown}
                      brandWebhookCooldownSecondsLeft={brandWebhookCooldownSecondsLeft}
                      buildFormAnswer={buildFormAnswer}
                      industryOptions={industryOptions}
                      audienceRoleOptions={audienceRoleOptions}
                      painPointOptions={painPointOptions}
                      noSayOptions={noSayOptions}
                      brandBasicsName={brandBasicsName}
                      setBrandBasicsName={setBrandBasicsName}
                      brandBasicsIndustry={brandBasicsIndustry}
                      setBrandBasicsIndustry={setBrandBasicsIndustry}
                      brandBasicsType={brandBasicsType}
                      setBrandBasicsType={setBrandBasicsType}
                      brandBasicsOffer={brandBasicsOffer}
                      setBrandBasicsOffer={setBrandBasicsOffer}
                      brandBasicsGoal={brandBasicsGoal}
                      setBrandBasicsGoal={setBrandBasicsGoal}
                      audienceRole={audienceRole}
                      setAudienceRole={setAudienceRole}
                      audienceIndustry={audienceIndustry}
                      setAudienceIndustry={setAudienceIndustry}
                      audiencePainPoints={audiencePainPoints}
                      setAudiencePainPoints={setAudiencePainPoints}
                      audienceOutcome={audienceOutcome}
                      setAudienceOutcome={setAudienceOutcome}
                      toneFormal={toneFormal}
                      setToneFormal={setToneFormal}
                      toneEnergy={toneEnergy}
                      setToneEnergy={setToneEnergy}
                      toneBold={toneBold}
                      setToneBold={setToneBold}
                      emojiUsage={emojiUsage}
                      setEmojiUsage={setEmojiUsage}
                      writingLength={writingLength}
                      setWritingLength={setWritingLength}
                      ctaStrength={ctaStrength}
                      setCtaStrength={setCtaStrength}
                      absoluteTruths={absoluteTruths}
                      setAbsoluteTruths={setAbsoluteTruths}
                      noSayRules={noSayRules}
                      setNoSayRules={setNoSayRules}
                      regulatedIndustry={regulatedIndustry}
                      setRegulatedIndustry={setRegulatedIndustry}
                      legalReview={legalReview}
                      setLegalReview={setLegalReview}
                      advancedPositioning={advancedPositioning}
                      setAdvancedPositioning={setAdvancedPositioning}
                      advancedDifferentiators={advancedDifferentiators}
                      setAdvancedDifferentiators={setAdvancedDifferentiators}
                      advancedPillars={advancedPillars}
                      setAdvancedPillars={setAdvancedPillars}
                      advancedCompetitors={advancedCompetitors}
                      setAdvancedCompetitors={setAdvancedCompetitors}
                      advancedProofPoints={advancedProofPoints}
                      setAdvancedProofPoints={setAdvancedProofPoints}
                      advancedRequiredPhrases={advancedRequiredPhrases}
                      setAdvancedRequiredPhrases={setAdvancedRequiredPhrases}
                      advancedForbiddenPhrases={advancedForbiddenPhrases}
                      setAdvancedForbiddenPhrases={setAdvancedForbiddenPhrases}
                      advancedComplianceNotes={advancedComplianceNotes}
                      setAdvancedComplianceNotes={setAdvancedComplianceNotes}
                      writerRulesUnlocked={writerRulesUnlocked}
                      reviewerRulesUnlocked={reviewerRulesUnlocked}
                      newCollaboratorEmail={newCollaboratorEmail}
                      setNewCollaboratorEmail={setNewCollaboratorEmail}
                      onAddCollaborator={handleAddCollaborator}
                      onRemoveCollaborator={handleRemoveCollaborator}
                      onTransferOwnership={handleTransferOwnership}
                      isOwner={activeCompany?.user_id === session?.user?.id}
                      onDeleteCompany={() => handleDeleteCompany(activeCompanyId!)}
                      connectedAccounts={connectedAccounts}
                      onConnectLinkedIn={handleConnectLinkedIn}
                      onConnectFacebook={handleConnectFacebook}
                      isEditingBrandSetup={isEditingBrandSetup}
                      brandEditingRef={brandEditingRef}
                      formAnswerCache={formAnswerCache}
                    />}
                />
                <Route
                  path="/company/:companyId/settings/integrations"
                  element={
                    <SettingsPage
                      tab="integrations"
                      setActiveCompanyIdWithPersistence={setActiveCompanyIdWithPersistence}
                      brandIntelligenceReady={brandIntelligenceReady}
                      brandSetupMode={brandSetupMode}
                      setBrandSetupMode={setBrandSetupMode}
                      brandSetupLevel={brandSetupLevel}
                      setBrandSetupLevel={setBrandSetupLevel}
                      brandSetupStep={brandSetupStep}
                      setBrandSetupStep={setBrandSetupStep}
                      setIsEditingBrandSetup={setIsEditingBrandSetup}
                      collaborators={collaborators}
                      companyName={companyName}
                      setCompanyName={setCompanyName}
                      companyDescription={companyDescription}
                      setCompanyDescription={setCompanyDescription}
                      loadBrandKB={loadBrandKB}
                      brandKbId={brandKbId}
                      brandPack={brandPack}
                      setBrandPack={setBrandPack}
                      brandCapability={brandCapability}
                      setBrandCapability={setBrandCapability}
                      emojiRule={emojiRule}
                      setEmojiRule={setEmojiRule}
                      systemInstruction={systemInstruction}
                      setSystemInstruction={setSystemInstruction}
                      aiWriterSystemPrompt={aiWriterSystemPrompt}
                      setAiWriterSystemPrompt={setAiWriterSystemPrompt}
                      aiWriterUserPrompt={aiWriterUserPrompt}
                      setAiWriterUserPrompt={setAiWriterUserPrompt}
                      activeBrandRuleEdit={activeBrandRuleEdit}
                      brandRuleDraft={brandRuleDraft}
                      setBrandRuleDraft={setBrandRuleDraft}
                      startBrandRuleEdit={startBrandRuleEdit}
                      cancelBrandRuleEdit={cancelBrandRuleEdit}
                      saveBrandRuleEdit={saveBrandRuleEdit}
                      saveBrandSetup={saveBrandSetup}
                      sendBrandWebhook={sendBrandWebhook}
                      isBrandWebhookCoolingDown={isBrandWebhookCoolingDown}
                      brandWebhookCooldownSecondsLeft={brandWebhookCooldownSecondsLeft}
                      buildFormAnswer={buildFormAnswer}
                      industryOptions={industryOptions}
                      audienceRoleOptions={audienceRoleOptions}
                      painPointOptions={painPointOptions}
                      noSayOptions={noSayOptions}
                      brandBasicsName={brandBasicsName}
                      setBrandBasicsName={setBrandBasicsName}
                      brandBasicsIndustry={brandBasicsIndustry}
                      setBrandBasicsIndustry={setBrandBasicsIndustry}
                      brandBasicsType={brandBasicsType}
                      setBrandBasicsType={setBrandBasicsType}
                      brandBasicsOffer={brandBasicsOffer}
                      setBrandBasicsOffer={setBrandBasicsOffer}
                      brandBasicsGoal={brandBasicsGoal}
                      setBrandBasicsGoal={setBrandBasicsGoal}
                      audienceRole={audienceRole}
                      setAudienceRole={setAudienceRole}
                      audienceIndustry={audienceIndustry}
                      setAudienceIndustry={setAudienceIndustry}
                      audiencePainPoints={audiencePainPoints}
                      setAudiencePainPoints={setAudiencePainPoints}
                      audienceOutcome={audienceOutcome}
                      setAudienceOutcome={setAudienceOutcome}
                      toneFormal={toneFormal}
                      setToneFormal={setToneFormal}
                      toneEnergy={toneEnergy}
                      setToneEnergy={setToneEnergy}
                      toneBold={toneBold}
                      setToneBold={setToneBold}
                      emojiUsage={emojiUsage}
                      setEmojiUsage={setEmojiUsage}
                      writingLength={writingLength}
                      setWritingLength={setWritingLength}
                      ctaStrength={ctaStrength}
                      setCtaStrength={setCtaStrength}
                      absoluteTruths={absoluteTruths}
                      setAbsoluteTruths={setAbsoluteTruths}
                      noSayRules={noSayRules}
                      setNoSayRules={setNoSayRules}
                      regulatedIndustry={regulatedIndustry}
                      setRegulatedIndustry={setRegulatedIndustry}
                      legalReview={legalReview}
                      setLegalReview={setLegalReview}
                      advancedPositioning={advancedPositioning}
                      setAdvancedPositioning={setAdvancedPositioning}
                      advancedDifferentiators={advancedDifferentiators}
                      setAdvancedDifferentiators={setAdvancedDifferentiators}
                      advancedPillars={advancedPillars}
                      setAdvancedPillars={setAdvancedPillars}
                      advancedCompetitors={advancedCompetitors}
                      setAdvancedCompetitors={setAdvancedCompetitors}
                      advancedProofPoints={advancedProofPoints}
                      setAdvancedProofPoints={setAdvancedProofPoints}
                      advancedRequiredPhrases={advancedRequiredPhrases}
                      setAdvancedRequiredPhrases={setAdvancedRequiredPhrases}
                      advancedForbiddenPhrases={advancedForbiddenPhrases}
                      setAdvancedForbiddenPhrases={setAdvancedForbiddenPhrases}
                      advancedComplianceNotes={advancedComplianceNotes}
                      setAdvancedComplianceNotes={setAdvancedComplianceNotes}
                      writerRulesUnlocked={writerRulesUnlocked}
                      reviewerRulesUnlocked={reviewerRulesUnlocked}
                      newCollaboratorEmail={newCollaboratorEmail}
                      setNewCollaboratorEmail={setNewCollaboratorEmail}
                      onAddCollaborator={handleAddCollaborator}
                      onRemoveCollaborator={handleRemoveCollaborator}
                      onTransferOwnership={handleTransferOwnership}
                      isOwner={activeCompany?.user_id === session?.user?.id}
                      onDeleteCompany={() => handleDeleteCompany(activeCompanyId!)}
                      connectedAccounts={connectedAccounts}
                      onConnectLinkedIn={handleConnectLinkedIn}
                      onConnectFacebook={handleConnectFacebook}
                      isEditingBrandSetup={isEditingBrandSetup}
                      brandEditingRef={brandEditingRef}
                      formAnswerCache={formAnswerCache}
                    />}
                />
                <Route path="/company/:companyId/integrations" element={<IntegrationsPage />} />
                <Route path="/profile" element={<ProfilePage session={session} supabase={supabase} notify={notify} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </div>



        <OnboardingModal
          isOpen={isOnboardingOpen}
          onComplete={handleOnboardingComplete}
          notify={notify}
        />

        <AddCompanyModal
          isOpen={isAddCompanyModalOpen}
          onClose={() => setIsAddCompanyModalOpen(false)}
          newCompanyName={newCompanyName}
          setNewCompanyName={setNewCompanyName}
          newCompanyDescription={newCompanyDescription}
          setNewCompanyDescription={setNewCompanyDescription}
          onSubmit={handleAddCompany}
          notify={notify}
        />

        <CsvExportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          csvScope={csvScope}
          setCsvScope={setCsvScope}
          csvFieldSelection={csvFieldSelection}
          setCsvFieldSelection={setCsvFieldSelection}
          csvFieldDefinitions={csvFieldDefinitions}
          handleExportCsv={handleExportCsv}
        />

        <CopyModal
          isOpen={isCopyModalOpen}
          onClose={() => {
            setIsCopyModalOpen(false);
            setCopySuccessMessage('');
          }}
          copyFieldSelection={copyFieldSelection}
          setCopyFieldSelection={setCopyFieldSelection}
          copyFieldDefinitions={copyFieldDefinitions}
          copySuccessMessage={copySuccessMessage}
          handleCopySpreadsheet={handleCopySpreadsheet}
        />

        <DraftPublishModal
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          selectedRow={selectedRow}
          activeCompany={activeCompany}
          draftPublishIntent={draftPublishIntent}
          setDraftPublishIntent={setDraftPublishIntent}
          handleDraftPublishIntent={handleDraftPublishIntent}
          getAttachedDesignUrls={getAttachedDesignUrls}
          getImageGeneratedUrl={getImageGeneratedUrl}
          imagePreviewNonce={imagePreviewNonce}
          handleCopy={handleCopy}
          copiedField={copiedField}
          handleUploadDesigns={handleUploadDesigns}
          isUploadingDesigns={isUploadingDesigns}
        />

        <BulkImportModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          bulkText={bulkText}
          setBulkText={setBulkText}
          bulkPreview={bulkPreview}
          setBulkPreview={setBulkPreview}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          isImporting={isImporting}
          parseBulkText={parseBulkText}
          handleBulkImport={handleBulkImport}
        />

        <ViewContentModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          selectedRow={selectedRow}
          getStatusValue={getStatusValue}
          getImageGeneratedUrl={getImageGeneratedUrl}
          imagePreviewNonce={imagePreviewNonce}
          handleCopy={handleCopy}
          copiedField={copiedField}
          notify={notify}
          setIsDraftModalOpen={setIsDraftModalOpen}
          setDraftPublishIntent={setDraftPublishIntent}
          requestConfirm={requestConfirm}
          isGeneratingCaption={isGeneratingCaption}
          setIsGeneratingCaption={setIsGeneratingCaption}
          isRevisingCaption={isRevisingCaption}
          setIsRevisingCaption={setIsRevisingCaption}
          authedFetch={authedFetch}
          backendBaseUrl={backendBaseUrl}
          refreshCalendarRow={refreshCalendarRow}
          setIsImageModalOpen={setIsImageModalOpen}
          setIsViewModalOpen={setIsViewModalOpen}
          activeCompanyId={activeCompanyId}
          setBrandKbId={setBrandKbId}
          setSystemInstruction={setSystemInstruction}
        />

        <ImageGenerationModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          selectedRow={selectedRow}
          isEditingDmp={isEditingDmp}
          setIsEditingDmp={setIsEditingDmp}
          dmpDraft={dmpDraft}
          setDmpDraft={setDmpDraft}
          isGeneratingImage={isGeneratingImage}
          setIsGeneratingImage={setIsGeneratingImage}
          getImageGeneratedUrl={getImageGeneratedUrl}
          imagePreviewNonce={imagePreviewNonce}
          imagePollError={imagePollError}
          notify={notify}
          authedFetch={authedFetch}
          backendBaseUrl={backendBaseUrl}
          setSelectedRow={setSelectedRow}
          setCalendarRows={setCalendarRows}
          setIsImageModalOpen={setIsImageModalOpen}
          activeCompanyId={activeCompanyId}
          brandKbId={brandKbId}
          systemInstruction={systemInstruction}
          requestConfirm={requestConfirm}
          reopenImageModalOnImageReadyRef={reopenImageModalOnImageReadyRef}
          imageModalReopenTimeoutRef={imageModalReopenTimeoutRef}
          getImageGeneratedSignature={getImageGeneratedSignature}
          startWaitingForImageUpdate={startWaitingForImageUpdate}
        />

        {
          toast && (
            <div
              className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border shadow-premium-lg z-[9999] animate-[toast-slide-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-md max-w-[400px] ${toast.tone === 'success' ? 'border-emerald-500/30 bg-emerald-50/95 text-emerald-800' :
                toast.tone === 'error' ? 'border-rose-500/30 bg-rose-50/95 text-rose-800' :
                  'border-brand-primary/30 bg-sky-50/95 text-brand-dark'
                }`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {toast.tone === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" aria-hidden />}
              {toast.tone === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 text-rose-500" aria-hidden />}
              {(toast.tone === 'info' || !toast.tone) && <Info className="w-5 h-5 flex-shrink-0 text-brand-primary" aria-hidden />}
              <span className="text-sm font-semibold leading-tight">{toast.message}</span>
            </div>
          )
        }

        <ConfirmModal
          isOpen={isConfirmOpen}
          config={confirmConfig}
          onResolve={resolveConfirm}
        />

        {/* Product Tour */}
        {showProductTour && (
          <ProductTour
            companyId={activeCompanyId || ''}
            onComplete={() => {
              setShowProductTour(false);
              if (userProfile?.id) {
                localStorage.setItem(`productTourCompleted_${userProfile.id}`, 'true');
              }
            }}
            onSkip={() => {
              setShowProductTour(false);
              if (userProfile?.id) {
                localStorage.setItem(`productTourCompleted_${userProfile.id}`, 'true');
              }
            }}
          />
        )}
      </div >
    </NotificationProvider>
  );
}

export default App;
