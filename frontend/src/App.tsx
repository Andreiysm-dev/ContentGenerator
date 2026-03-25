import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  ShieldCheck,
  Megaphone,
  Moon,
  Sun,
} from 'lucide-react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LegalPage } from './pages/LegalPage';
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
import { SettingsPage, type CompanySettingsShellProps, type CompanySettingsTab } from '@/pages/SettingsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { PostInsightsPage } from '@/pages/PostInsightsPage';
import { AIToolboxPage } from '@/pages/AIToolboxPage';
import { LeadMagnetsPage } from '@/pages/LeadMagnetsPage';
import { LoginPage } from '@/pages/LoginPage';
import { MediaLibraryPage } from '@/pages/MediaLibraryPage';
import { ContentPlannerPage } from '@/pages/ContentPlannerPage';
import Faq from "@/pages/Faq";
import { ImageHubPage } from '@/pages/ImageHubPage';
import { SOKMED_COLUMNS } from './pages/Workboard/types';
import { WorkboardPage } from './pages/Workboard/WorkboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { SchedulerPage } from '@/pages/SchedulerPage';
import { AppOverlays } from '@/app/AppOverlays';
import { ADMIN_ROUTES, buildAdminDashboardProps, buildSettingsPageProps, COMPANY_SETTINGS_ROUTES } from '@/app/routeBuilders';



import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import './App.css';
import { NotificationProvider } from '@/contexts/NotificationContext';
import {
  audienceRoleOptions,
  backendBaseUrl,
  defaultCompanyId,
  industryOptions,
  noSayOptions,
  painPointOptions,
  revisionWebhookUrl,
  statusOptions,
} from '@/constants/app';
import { useAuthedFetch } from '@/hooks/useAuthedFetch';
import { useAuth } from '@/hooks/useAuth';
import { useBrandIntelligence } from '@/hooks/useBrandIntelligence';
import { useCalendarBoard } from '@/hooks/useCalendarBoard';
import { useCompanyLifecycle } from '@/hooks/useCompanyLifecycle';
import { useCompany } from '@/hooks/useCompany';
import { useContentActions } from '@/hooks/useContentActions';
import { useTeamAndIntegrations } from '@/hooks/useTeamAndIntegrations';
import type { FormState } from '@/types/app';
import {
  getAttachedDesignUrls,
  getImageGeneratedSignature,
  getImageGeneratedUrl,
  getStatusValue as getStatusValueForColumns,
} from '@/utils/contentUtils';


function BrandRedirect() {
  const params = useParams();
  const decodedId = decodeURIComponent(params.companyId || '');
  const safeId = encodeURIComponent(decodedId);
  return <Navigate to={`/company/${safeId}/settings/brand-intelligence`} replace />;
}


import { supabase } from '@/lib/supabase';

function App() {
  useEffect(() => {
    // Strictly Force Light Mode: ignore system preferences
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  // --- Auth: session, profile, onboarding, product tour ---
  // useAuth runs first so we have a real session before constructing authedFetch.
  const {
    session,
    authLoading,
    userProfile,
    setUserProfile,
    isOnboardingOpen,
    setIsOnboardingOpen,
    showProductTour,
    setShowProductTour,
  } = useAuth(backendBaseUrl);

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
    cardName: '',
    caption: '',
  });


  const [publicSettings, setPublicSettings] = useState<{ maintenance_mode?: boolean; system_announcement?: string }>({});

  // Stable callback — only recreated if setPublicSettings identity changes (never).
  const onMaintenanceDetected = useCallback(() => {
    setPublicSettings(prev => ({ ...prev, maintenance_mode: true }));
  }, []);

  // authedFetch is stable (useCallback inside hook) and uses the live session
  // token from useAuth above. Safe to use as a useEffect dependency.
  const { authedFetch } = useAuthedFetch({ session, userProfile, onMaintenanceDetected });

  // Background ping every 5 minutes to keep last_seen updated.
  // Kept here (not inside useAuth) so it uses the session-aware authedFetch.
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      authedFetch(`${backendBaseUrl}/api/profile`).catch(() => { });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, authedFetch, backendBaseUrl]);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/api/public/settings`);
        const data = await res.json();
        if (data.settings) {
          setPublicSettings(data.settings);
        }
      } catch (e) {
        console.error('Failed to fetch public settings:', e);
      }
    };
    fetchPublicSettings();
  }, [backendBaseUrl]);




  // ── Company, permissions, product tour ───────────────────────────────────
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [preDefinedPlan, setPreDefinedPlan] = useState<any[] | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' | 'info' } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
    thirdLabel?: string;
    thirdVariant?: 'primary' | 'danger' | 'ghost';
  } | null>(null);
  const confirmResolverRef = useRef<((value: boolean | 'third') => void) | null>(null);

  const notify = useCallback((message: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, tone });
  }, []);

  const requestConfirm = useCallback((config: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
    thirdLabel?: string;
    thirdVariant?: 'primary' | 'danger' | 'ghost';
  }) => {
    setConfirmConfig({
      title: config.title,
      description: config.description,
      confirmLabel: config.confirmLabel,
      cancelLabel: config.cancelLabel,
      confirmVariant: config.confirmVariant,
      thirdLabel: config.thirdLabel,
      thirdVariant: config.thirdVariant,
    });
    setIsConfirmOpen(true);
    return new Promise<boolean | 'third'>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const resolveConfirm = useCallback((value: boolean | 'third') => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    setIsConfirmOpen(false);
    setConfirmConfig(null);
  }, []);

  const routeCompanyId = useMemo(() => {
    const match = location.pathname.match(/^\/company\/([^/]+)(?:\/|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }, [location.pathname]);

  const {
    collaborators,
    customRoles,
    connectedAccounts,
    newCollaboratorEmail,
    setNewCollaboratorEmail,
    handleAddCollaborator,
    handleUpdateCustomRoles,
    handleAssignRole,
    handleRemoveCollaborator,
    handleConnectLinkedIn,
    handleConnectFacebook,
    handleDisconnectAccount,
  } = useTeamAndIntegrations({
    companyId: routeCompanyId,
    pathname: location.pathname,
    session,
    authedFetch,
    backendBaseUrl,
    notify,
    requestConfirm,
  });

  const {
    companies,
    activeCompanyId,
    setActiveCompanyId: setActiveCompanyIdWithPersistence,
    recentCompanyIds,
    activeCompany,
    userPermissions,
    automations,
  } = useCompany({
    session,
    userProfile,
    collaborators,
    customRoles,
    isOnboardingOpen,
    setShowProductTour,
    authedFetch,
    backendBaseUrl,
  });

  const {
    isCreatingCompany,
    isAddCompanyModalOpen,
    setIsAddCompanyModalOpen,
    newCompanyName,
    setNewCompanyName,
    newCompanyDescription,
    setNewCompanyDescription,
    companyName,
    setCompanyName,
    companyDescription,
    setCompanyDescription,
    handleAddCompany,
    handleOnboardingComplete,
    handleLogout,
    handleUpdateCompany,
    handleDeleteCompany,
    handleTransferOwnership,
  } = useCompanyLifecycle({
    session,
    userProfile,
    setUserProfile,
    setIsOnboardingOpen,
    companies,
    collaborators,
    activeCompanyId,
    authedFetch,
    backendBaseUrl,
    supabase,
    notify,
    requestConfirm,
    setActiveCompanyIdWithPersistence,
  });

  const {
    brandKbId,
    setBrandKbId,
    brandPack,
    setBrandPack,
    brandCapability,
    setBrandCapability,
    emojiRule,
    setEmojiRule,
    systemInstruction,
    setSystemInstruction,
    aiWriterSystemPrompt,
    setAiWriterSystemPrompt,
    aiWriterUserPrompt,
    setAiWriterUserPrompt,
    brandSetupMode,
    setBrandSetupMode,
    brandSetupLevel,
    setBrandSetupLevel,
    brandSetupStep,
    setBrandSetupStep,
    brandIntelligenceReady,
    isEditingBrandSetup,
    setIsEditingBrandSetup,
    brandEditingRef,
    formAnswerCache,
    brandBasicsName,
    setBrandBasicsName,
    brandBasicsIndustry,
    setBrandBasicsIndustry,
    brandBasicsType,
    setBrandBasicsType,
    brandBasicsOffer,
    setBrandBasicsOffer,
    brandBasicsGoal,
    setBrandBasicsGoal,
    audienceRole,
    setAudienceRole,
    audienceIndustry,
    setAudienceIndustry,
    audiencePainPoints,
    setAudiencePainPoints,
    audienceOutcome,
    setAudienceOutcome,
    toneFormal,
    setToneFormal,
    toneEnergy,
    setToneEnergy,
    toneBold,
    setToneBold,
    emojiUsage,
    setEmojiUsage,
    writingLength,
    setWritingLength,
    ctaStrength,
    setCtaStrength,
    absoluteTruths,
    setAbsoluteTruths,
    noSayRules,
    setNoSayRules,
    regulatedIndustry,
    setRegulatedIndustry,
    legalReview,
    setLegalReview,
    advancedPositioning,
    setAdvancedPositioning,
    advancedDifferentiators,
    setAdvancedDifferentiators,
    advancedPillars,
    setAdvancedPillars,
    advancedCompetitors,
    setAdvancedCompetitors,
    advancedProofPoints,
    setAdvancedProofPoints,
    advancedRequiredPhrases,
    setAdvancedRequiredPhrases,
    advancedForbiddenPhrases,
    setAdvancedForbiddenPhrases,
    advancedComplianceNotes,
    setAdvancedComplianceNotes,
    writerRulesUnlocked,
    reviewerRulesUnlocked,
    activeBrandRuleEdit,
    brandRuleDraft,
    setBrandRuleDraft,
    isBrandWebhookCoolingDown,
    brandWebhookCooldownSecondsLeft,
    buildFormAnswer,
    saveBrandSetup,
    loadBrandKB,
    sendBrandWebhook,
    startBrandRuleEdit,
    cancelBrandRuleEdit,
    saveBrandRuleEdit,
  } = useBrandIntelligence({
    activeCompanyId,
    session,
    authedFetch,
    backendBaseUrl,
    notify,
    pathname: location.pathname,
  });

  const getStatusValue = useCallback((status: any): string => {
    const columns = ((activeCompany as any)?.kanban_settings?.columns || []) as Array<{ id?: string; title?: string }>;
    return getStatusValueForColumns(status, columns);
  }, [activeCompany]);

  const {
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
  } = useCalendarBoard({
    session,
    activeCompanyId,
    activeCompany,
    pathname: location.pathname,
    authedFetch,
    backendBaseUrl,
    supabase,
    getStatusValue,
    notify,
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setForm((prev) => ({ ...prev, date: today }));
  }, []);
  const refreshAppData = async () => {
    const promises: Promise<any>[] = [
      loadCalendar(),
      loadBrandKB(false, false)
    ];
    if (selectedRow?.contentCalendarId) {
      promises.push(refreshCalendarRow(selectedRow.contentCalendarId));
    }
    await Promise.all(promises);
  };

  // Load calendar when company changes — debounced 300ms so rapid
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  // ── useContentActions: all write-side content operations ──────────────────
  const {
    isAdding, isImporting, isBatchGenerating, isBatchGeneratingImages, isBatchDeleting,
    copiedField,
    bulkText, setBulkText,
    bulkPreview, setBulkPreview,
    showPreview, setShowPreview,
    isBulkModalOpen, setIsBulkModalOpen,
    csvFieldDefinitions, csvFieldSelection, setCsvFieldSelection, csvScope, setCsvScope,
    isCsvModalOpen, setIsCsvModalOpen,
    copyFieldDefinitions, copyFieldSelection, setCopyFieldSelection,
    copySuccessMessage, setCopySuccessMessage,
    isCopyModalOpen, setIsCopyModalOpen,
    parseBulkText,
    handleCopy,
    handleAdd: handleAddRow,
    handleBulkImport,
    handleDeleteSelected,
    refreshCalendarRow,
    handleBatchGenerate,
    handleBatchGenerateImages,
    openCsvModal,
    handleExportCsv,
    openCopyModal,
    handleCopySpreadsheet,
  } = useContentActions({
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
  });

  // Wrapper so callers that pass no args still work (form is closed-over from App state)
  const handleAdd = () => handleAddRow(form);

  const activeNavKey = useMemo(() => {
    const path = location.pathname;
    if (/^\/company\/[^/]+\/dashboard(?:\/|$)/.test(path)) return 'dashboard';
    if (/^\/company\/[^/]+\/generate(?:\/|$)/.test(path)) return 'generate';
    if (/^\/company\/[^/]+\/plan(?:\/|$)/.test(path)) return 'planner';
    if (/^\/company\/[^/]+\/calendar\/published(?:\/|$)/.test(path)) return 'published';
    if (/^\/company\/[^/]+\/calendar(?:\/|$)/.test(path)) return 'calendar';
    if (/^\/company\/[^/]+\/studio(?:\/|$)/.test(path)) return 'studio';
    if (/^\/company\/[^/]+\/integrations(?:\/|$)/.test(path)) return 'integrations';
    if (/^\/company\/[^/]+\/insights(?:\/|$)/.test(path)) return 'insights';
    if (/^\/company\/[^/]+\/toolbox(?:\/|$)/.test(path)) return 'toolbox';
    if (/^\/company\/[^/]+\/leads(?:\/|$)/.test(path)) return 'leads';
    if (/^\/company\/[^/]+\/library(?:\/|$)/.test(path)) return 'library';
    if (/^\/company\/[^/]+\/image-hub(?:\/|$)/.test(path)) return 'image-hub';
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
      const statusValue = getStatusValue(row.status).toLowerCase();
      const rawId = typeof row.status === 'string' ? row.status.toLowerCase() : (row.status?.state?.toLowerCase() || "");
      const isArchived = statusValue === 'archived' || rawId === 'archived';

      if (isArchived) return; // Exclude from dashboard stats

      const status = statusValue.trim();
      if (status === 'ready' || status === 'approved') counts.approved += 1;
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

  const settingsPageSharedProps: Omit<CompanySettingsShellProps, 'tab'> = {
    notify,
    authedFetch,
    setActiveCompanyIdWithPersistence,
    brandIntelligenceReady,
    brandSetupMode,
    setBrandSetupMode,
    brandSetupLevel,
    setBrandSetupLevel,
    brandSetupStep,
    setBrandSetupStep,
    setIsEditingBrandSetup,
    collaborators,
    companyName,
    setCompanyName,
    companyDescription,
    setCompanyDescription,
    loadBrandKB,
    brandKbId,
    onDeleteCompany: () => handleDeleteCompany(activeCompanyId!),
    onSaveCompanyDetails: handleUpdateCompany,
    brandPack,
    setBrandPack,
    brandCapability,
    setBrandCapability,
    emojiRule,
    setEmojiRule,
    systemInstruction,
    setSystemInstruction,
    aiWriterSystemPrompt,
    setAiWriterSystemPrompt,
    aiWriterUserPrompt,
    setAiWriterUserPrompt,
    activeBrandRuleEdit,
    brandRuleDraft,
    setBrandRuleDraft,
    startBrandRuleEdit,
    cancelBrandRuleEdit,
    saveBrandRuleEdit,
    saveBrandSetup,
    sendBrandWebhook,
    buildFormAnswer,
    industryOptions,
    audienceRoleOptions,
    painPointOptions,
    noSayOptions,
    brandBasicsName,
    setBrandBasicsName,
    brandBasicsIndustry,
    setBrandBasicsIndustry,
    brandBasicsType,
    setBrandBasicsType,
    brandBasicsOffer,
    setBrandBasicsOffer,
    brandBasicsGoal,
    setBrandBasicsGoal,
    audienceRole,
    setAudienceRole,
    audienceIndustry,
    setAudienceIndustry,
    audiencePainPoints,
    setAudiencePainPoints,
    audienceOutcome,
    setAudienceOutcome,
    toneFormal,
    setToneFormal,
    toneEnergy,
    setToneEnergy,
    toneBold,
    setToneBold,
    emojiUsage,
    setEmojiUsage,
    writingLength,
    setWritingLength,
    ctaStrength,
    setCtaStrength,
    absoluteTruths,
    setAbsoluteTruths,
    noSayRules,
    setNoSayRules,
    regulatedIndustry,
    setRegulatedIndustry,
    legalReview,
    setLegalReview,
    advancedPositioning,
    setAdvancedPositioning,
    advancedDifferentiators,
    setAdvancedDifferentiators,
    advancedPillars,
    setAdvancedPillars,
    advancedCompetitors,
    setAdvancedCompetitors,
    advancedProofPoints,
    setAdvancedProofPoints,
    advancedRequiredPhrases,
    setAdvancedRequiredPhrases,
    advancedForbiddenPhrases,
    setAdvancedForbiddenPhrases,
    advancedComplianceNotes,
    setAdvancedComplianceNotes,
    writerRulesUnlocked,
    reviewerRulesUnlocked,
    newCollaboratorEmail,
    setNewCollaboratorEmail,
    onAddCollaborator: handleAddCollaborator,
    onRemoveCollaborator: handleRemoveCollaborator,
    onTransferOwnership: handleTransferOwnership,
    userPermissions,
    customRoles,
    onUpdateCustomRoles: handleUpdateCustomRoles,
    onAssignRole: handleAssignRole,
    isBrandWebhookCoolingDown,
    brandWebhookCooldownSecondsLeft,
    isEditingBrandSetup,
    brandEditingRef,
    formAnswerCache,
    connectedAccounts,
    onConnectLinkedIn: handleConnectLinkedIn,
    onConnectFacebook: handleConnectFacebook,
    onDisconnectAccount: handleDisconnectAccount,
    backendBaseUrl,
  };

  const adminDashboardSharedProps: Omit<React.ComponentProps<typeof AdminDashboardPage>, 'tab'> = {
    authedFetch,
    backendBaseUrl,
    notify,
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChannelsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, channels: values }));
  };

  const handleModalCopy = useCallback((fieldKey: string, text?: string | null) => {
    handleCopy(text ?? '', fieldKey);
  }, [handleCopy]);

  const handleModalUploadDesigns = useCallback((files: FileList | null) => (
    Promise.resolve(handleUploadDesigns(files))
  ), [handleUploadDesigns]);

  if (authLoading) {
    return (
      <div className="auth-screen">
        <AuthLoadingSkeleton />
      </div>
    );
  }


  if (!session) {
    return (
      <Routes>
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/deletion" element={<LegalPage type="deletion" />} />
        <Route path="*" element={<LoginPage supabase={supabase} notify={notify} />} />
      </Routes>
    );
  }

  if (!authLoading && publicSettings.maintenance_mode && userProfile?.role !== 'ADMIN') {
    return <MaintenancePage />;
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
          userRole={userProfile?.role}
          authedFetch={authedFetch}
          backendBaseUrl={backendBaseUrl}
        />

        {publicSettings.system_announcement && (
          <div className="bg-gradient-to-r from-brand-primary to-indigo-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-wider shadow-lg animate-in slide-in-from-top duration-500 border-b border-white/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
            <Megaphone className="w-4 h-4 text-brand-primary bg-white rounded-full p-0.5" />
            <span>{publicSettings.system_announcement}</span>
          </div>
        )}

        <div className="flex h-[calc(100vh-64px)] relative">
          {location.pathname.toLowerCase().startsWith('/admin') ? (
            <AdminSidebar
              key="admin-sidebar"
              isNavDrawerOpen={isNavDrawerOpen}
              setIsNavDrawerOpen={setIsNavDrawerOpen}
            />
          ) : (
            <Sidebar
              key="main-sidebar"
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
              userRole={userProfile?.role}
            />
          )}

          <div className={`flex-1 ml-0 lg:ml-[280px] transition-all duration-300 ${isAiAssistantOpen ? 'lg:mr-[400px]' : 'mr-0'} overflow-hidden h-full flex flex-col bg-gray-50`}>
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <Routes>
                <Route
                  path="/"
                  element={
                    activeCompanyId
                      ? <Navigate to={`/company/${encodeURIComponent(activeCompanyId)}/calendar`} replace />
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
                <Route path="/privacy" element={<LegalPage type="privacy" />} />
                <Route path="/terms" element={<LegalPage type="terms" />} />
                <Route path="/deletion" element={<LegalPage type="deletion" />} />
                <Route
                  path="/company/:companyId/dashboard"
                  element={
                    <DashboardPage
                      activeCompany={activeCompany}
                      activeCompanyId={activeCompanyId}
                      dashboardStats={dashboardStats}
                      brandIntelligenceReady={brandIntelligenceReady}
                      calendarRows={calendarRows}
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      notify={notify}
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
                  path="/company/:companyId/plan"
                  element={
                    <ContentPlannerPage
                      activeCompanyId={activeCompanyId}
                      authedFetch={authedFetch}
                      notify={notify}
                      userPermissions={userPermissions}
                      backendBaseUrl={backendBaseUrl}
                      calendarRows={calendarRows}
                      initialItems={preDefinedPlan || undefined}
                      onAddToCalendar={async (items: any[]) => {
                        setPreDefinedPlan(null); // Clear once used
                        // Batch create logic
                        // We will add each item to the calendar one by one or in a batch if supported.
                        // For simplicity, we loop here.
                        for (const item of items) {
                          // Mimic form state for handleAdd
                          // But handleAdd uses 'form' state. We should ideally refactor handleAdd or create a new bulkAdd function.
                          // Since we don't have a bulk add function exposed easily without refactoring, we will create a direct specialized fetch here.

                          try {
                            await authedFetch(`${backendBaseUrl}/api/content-calendar`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                companyId: activeCompanyId,
                                date: item.date,
                                brandHighlight: item.brandHighlight,
                                crossPromo: item.crossPromo,
                                theme: item.theme,
                                contentType: item.contentType,
                                channels: item.channels || [],
                                targetAudience: item.targetAudience,
                                primaryGoal: item.primaryGoal,
                                cta: item.cta,
                                promoType: item.promoType,
                                status: 'Draft'
                              })
                            });
                          } catch (e) {
                            console.error('Failed to add plan item', e);
                          }
                        }
                        notify('Plan added to calendar!', 'success');

                        // Refresh calendar manually
                        if (activeCompanyId) {
                          try {
                            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${activeCompanyId}?t=${Date.now()}`, { cache: 'no-store' });
                            if (res.ok) {
                              const data = await res.json();
                              const list = (data.contentCalendars || data) as any[];
                              setCalendarRows(Array.isArray(list) ? list : []);
                            }
                          } catch (e) { console.error(e); }
                        }
                      }}
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
                      isBatchGeneratingImages={isBatchGeneratingImages}
                      isBatchDeleting={isBatchDeleting}
                      handleBatchGenerate={handleBatchGenerate}
                      handleBatchGenerateImages={handleBatchGenerateImages}
                      openCsvModal={openCsvModal}
                      openCopyModal={openCopyModal}
                      handleDeleteSelected={handleDeleteSelected}
                      isBackendWaking={isBackendWaking}
                      calendarError={calendarError}
                      isLoadingCalendar={isLoadingCalendar}
                      calendarRows={calendarRows}
                      setCalendarRows={setCalendarRows}
                      filteredCalendarRows={filteredCalendarRows}
                      activeCompanyId={activeCompanyId}
                      activeCompany={activeCompany}
                      isPageFullySelected={isPageFullySelected}
                      toggleSelectAllOnPage={toggleSelectAllOnPage}
                      toggleSelectOne={toggleSelectOne}
                      getStatusValue={getStatusValue}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      isViewModalOpen={isViewModalOpen}
                      selectedRow={selectedRow}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                      page={page}
                      setPage={setPage}
                      currentPageRows={currentPageRows}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      notify={notify}
                      onStatusMoved={(postId, status, originalStatus) => {
                        recentStatusMoves.current.set(postId, { status, originalStatus, ts: Date.now() });
                      }}
                      requestConfirm={requestConfirm}
                      userPermissions={userPermissions}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/workboard"
                  element={
                    <WorkboardPage
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      notify={notify}
                      onStatusMoved={(postId, status, originalStatus) => {
                        recentStatusMoves.current.set(postId, { status, originalStatus, ts: Date.now() });
                      }}
                      userPermissions={userPermissions}
                      activeCompany={activeCompany}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/scheduler"
                  element={
                    <SchedulerPage
                      calendarRows={calendarRows}
                      setCalendarRows={setCalendarRows}
                      activeCompanyId={activeCompanyId || undefined}
                      activeCompany={activeCompany}
                      getStatusValue={getStatusValue}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      isViewModalOpen={isViewModalOpen}
                      selectedRow={selectedRow}
                      notify={notify}
                      navigate={navigate}
                      userPermissions={userPermissions}
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      imagePreviewNonce={imagePreviewNonce}
                      handleCopy={handleCopy}
                      copiedField={copiedField}
                      setIsDraftModalOpen={setIsDraftModalOpen}
                      setDraftPublishIntent={setDraftPublishIntent}
                      requestConfirm={requestConfirm}
                      isGeneratingCaption={isGeneratingCaption}
                      setIsGeneratingCaption={setIsGeneratingCaption}
                      refreshCalendarRow={refreshCalendarRow}
                      setIsImageModalOpen={setIsImageModalOpen}
                      setBrandKbId={setBrandKbId}
                      setSystemInstruction={setSystemInstruction}
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
                      isBatchGeneratingImages={isBatchGeneratingImages}
                      isBatchDeleting={isBatchDeleting}
                      handleBatchGenerate={handleBatchGenerate}
                      handleBatchGenerateImages={handleBatchGenerateImages}
                      openCsvModal={openCsvModal}
                      openCopyModal={openCopyModal}
                      handleDeleteSelected={handleDeleteSelected}
                      isBackendWaking={isBackendWaking}
                      calendarError={calendarError}
                      isLoadingCalendar={isLoadingCalendar}
                      calendarRows={calendarRows}
                      setCalendarRows={setCalendarRows}
                      filteredCalendarRows={filteredCalendarRows}
                      activeCompanyId={activeCompanyId}
                      activeCompany={activeCompany}
                      isPageFullySelected={isPageFullySelected}
                      toggleSelectAllOnPage={toggleSelectAllOnPage}
                      toggleSelectOne={toggleSelectOne}
                      getStatusValue={getStatusValue}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      isViewModalOpen={isViewModalOpen}
                      selectedRow={selectedRow}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                      page={page}
                      setPage={setPage}
                      currentPageRows={currentPageRows}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      notify={notify}
                      onStatusMoved={(postId, status, originalStatus) => {
                        recentStatusMoves.current.set(postId, { status, originalStatus, ts: Date.now() });
                      }}
                      userPermissions={userPermissions}
                      requestConfirm={requestConfirm}
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
                      activeCompany={activeCompany}
                      connectedAccounts={connectedAccounts}
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      userPermissions={userPermissions}
                      requestConfirm={requestConfirm}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/library"
                  element={
                    <MediaLibraryPage
                      calendarRows={calendarRows}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      getAttachedDesignUrls={getAttachedDesignUrls}
                      setSelectedRow={setSelectedRow}
                      setIsViewModalOpen={setIsViewModalOpen}
                      activeCompanyId={activeCompanyId}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/image-hub"
                  element={
                    <ImageHubPage
                      calendarRows={calendarRows}
                      setCalendarRows={setCalendarRows}
                      authedFetch={authedFetch}
                      notify={notify}
                      activeCompanyId={activeCompanyId}
                      brandKbId={brandKbId}
                      systemInstruction={systemInstruction}
                      setSystemInstruction={setSystemInstruction}
                      backendBaseUrl={backendBaseUrl}
                      getStatusValue={getStatusValue}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      getImageGeneratedSignature={getImageGeneratedSignature}
                      requestConfirm={requestConfirm}
                      setSelectedRow={setSelectedRow}
                      userPermissions={userPermissions}
                      activeCompany={activeCompany}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/insights"
                  element={
                    <PostInsightsPage
                      calendarRows={calendarRows}
                      getStatusValue={getStatusValue}
                      activeCompanyId={activeCompanyId}
                      authedFetch={authedFetch}
                      backendBaseUrl={backendBaseUrl}
                      connectedAccounts={connectedAccounts}
                    />
                  }
                />

                <Route
                  path="/company/:companyId/toolbox"
                  element={<AIToolboxPage />}
                />

                <Route
                  path="/company/:companyId/leads"
                  element={<LeadMagnetsPage />}
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
                      backendBaseUrl={backendBaseUrl}
                      notify={notify}
                      authedFetch={authedFetch}
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
                      customRoles={customRoles}
                      onUpdateCustomRoles={handleUpdateCustomRoles}
                      onAssignRole={handleAssignRole}
                      companyName={companyName}
                      setCompanyName={setCompanyName}
                      companyDescription={companyDescription}
                      setCompanyDescription={setCompanyDescription}
                      loadBrandKB={loadBrandKB}
                      brandKbId={brandKbId}
                      onSaveCompanyDetails={handleUpdateCompany}
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
                      onDisconnectAccount={handleDisconnectAccount}
                      userPermissions={userPermissions}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/studio/:contentId"
                  element={
                    <StudioEditorPage
                      activeCompanyId={activeCompanyId || ''}
                      activeCompany={activeCompany}
                      backendBaseUrl={backendBaseUrl}
                      authedFetch={authedFetch}
                      notify={notify}
                      getImageGeneratedUrl={getImageGeneratedUrl}
                      setIsImageModalOpen={setIsImageModalOpen}
                      setSelectedRow={setSelectedRow}
                      selectedRow={selectedRow}
                    />
                  }
                />
                <Route
                  path="/company/:companyId/settings"
                  element={<Navigate to="brand-intelligence" replace />}
                />
                {COMPANY_SETTINGS_ROUTES.map(({ path, tab }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<SettingsPage {...buildSettingsPageProps(tab, settingsPageSharedProps)} />}
                  />
                ))}
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/overview" replace />}
                />
                {ADMIN_ROUTES.map(({ path, tab }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<AdminDashboardPage {...buildAdminDashboardProps(tab, adminDashboardSharedProps)} />}
                  />
                ))}
                <Route path="/profile" element={<ProfilePage session={session} supabase={supabase} notify={notify} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </div>
        <AppOverlays
          isOnboardingOpen={isOnboardingOpen}
          handleOnboardingComplete={handleOnboardingComplete}
          notify={notify}
          isAiAssistantOpen={isAiAssistantOpen}
          isCreatingCompany={isCreatingCompany}
          isAddCompanyModalOpen={isAddCompanyModalOpen}
          setIsAddCompanyModalOpen={setIsAddCompanyModalOpen}
          newCompanyName={newCompanyName}
          setNewCompanyName={setNewCompanyName}
          newCompanyDescription={newCompanyDescription}
          setNewCompanyDescription={setNewCompanyDescription}
          handleAddCompany={handleAddCompany}
          isCsvModalOpen={isCsvModalOpen}
          setIsCsvModalOpen={setIsCsvModalOpen}
          csvScope={csvScope}
          setCsvScope={setCsvScope}
          csvFieldSelection={csvFieldSelection}
          setCsvFieldSelection={setCsvFieldSelection}
          csvFieldDefinitions={csvFieldDefinitions}
          handleExportCsv={handleExportCsv}
          isCopyModalOpen={isCopyModalOpen}
          setIsCopyModalOpen={setIsCopyModalOpen}
          setCopySuccessMessage={setCopySuccessMessage}
          copyFieldSelection={copyFieldSelection}
          setCopyFieldSelection={setCopyFieldSelection}
          copyFieldDefinitions={copyFieldDefinitions}
          copySuccessMessage={copySuccessMessage}
          handleCopySpreadsheet={handleCopySpreadsheet}
          isDraftModalOpen={isDraftModalOpen}
          setIsDraftModalOpen={setIsDraftModalOpen}
          selectedRow={selectedRow}
          activeCompany={activeCompany}
          draftPublishIntent={draftPublishIntent}
          setDraftPublishIntent={setDraftPublishIntent}
          handleDraftPublishIntent={handleDraftPublishIntent}
          imagePreviewNonce={imagePreviewNonce}
          handleCopy={handleModalCopy}
          copiedField={copiedField}
          handleUploadDesigns={handleModalUploadDesigns}
          isUploadingDesigns={isUploadingDesigns}
          isBulkModalOpen={isBulkModalOpen}
          setIsBulkModalOpen={setIsBulkModalOpen}
          bulkText={bulkText}
          setBulkText={setBulkText}
          bulkPreview={bulkPreview}
          setBulkPreview={setBulkPreview}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          isImporting={isImporting}
          parseBulkText={parseBulkText}
          handleBulkImport={handleBulkImport}
          isViewModalOpen={isViewModalOpen}
          setIsViewModalOpen={setIsViewModalOpen}
          getStatusValue={getStatusValue}
          requestConfirm={requestConfirm}
          isGeneratingCaption={isGeneratingCaption}
          setIsGeneratingCaption={setIsGeneratingCaption}
          authedFetch={authedFetch}
          backendBaseUrl={backendBaseUrl}
          refreshCalendarRow={refreshCalendarRow}
          setIsImageModalOpen={setIsImageModalOpen}
          activeCompanyId={activeCompanyId}
          setBrandKbId={setBrandKbId}
          setSystemInstruction={setSystemInstruction}
          collaborators={collaborators}
          automations={automations}
          userPermissions={userPermissions}
          filteredCalendarRows={filteredCalendarRows}
          setSelectedRow={setSelectedRow}
          isImageModalOpen={isImageModalOpen}
          isEditingDmp={isEditingDmp}
          setIsEditingDmp={setIsEditingDmp}
          dmpDraft={dmpDraft}
          setDmpDraft={setDmpDraft}
          isGeneratingImage={isGeneratingImage}
          setIsGeneratingImage={setIsGeneratingImage}
          imagePollError={imagePollError}
          setCalendarRows={setCalendarRows}
          brandKbId={brandKbId}
          systemInstruction={systemInstruction}
          reopenImageModalOnImageReadyRef={reopenImageModalOnImageReadyRef}
          imageModalReopenTimeoutRef={imageModalReopenTimeoutRef}
          startWaitingForImageUpdate={startWaitingForImageUpdate}
          toast={toast}
          isConfirmOpen={isConfirmOpen}
          confirmConfig={confirmConfig}
          resolveConfirm={resolveConfirm}
          showProductTour={showProductTour}
          setShowProductTour={setShowProductTour}
          userProfile={userProfile}
          navigate={navigate}
          setPreDefinedPlan={setPreDefinedPlan}
          refreshAppData={refreshAppData}
          setIsAiAssistantOpen={setIsAiAssistantOpen}
        />
      </div >
    </NotificationProvider >
  );
}

export default App;



