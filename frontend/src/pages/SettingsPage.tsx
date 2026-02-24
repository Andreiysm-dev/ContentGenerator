import React, { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { Settings as SettingsIcon, Trash2, Plus, Pencil, Save, X, ShieldCheck, Zap, UserPlus, Users, Check, Info, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BrandCoreTab } from "./settings/BrandCoreTab";

export type CompanySettingsTab = "overview" | "brand-intelligence" | "team" | "integrations" | "audit";

export type CompanySettingsShellProps = {
  tab: CompanySettingsTab;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  setActiveCompanyIdWithPersistence: (companyId: string) => void;
  brandIntelligenceReady: boolean;
  brandSetupMode: "quick" | "advanced" | "custom" | null;
  setBrandSetupMode: (mode: "quick" | "advanced" | "custom" | null) => void;
  brandSetupLevel: "quick" | "advanced" | "custom" | null;
  setBrandSetupLevel: (level: "quick" | "advanced" | "custom" | null) => void;
  brandSetupStep: number;
  setBrandSetupStep: (step: number) => void;
  setIsEditingBrandSetup: (value: boolean) => void;
  collaborators: any[];
  companyName: string;
  setCompanyName: (value: string) => void;
  companyDescription: string;
  setCompanyDescription: (value: string) => void;
  loadBrandKB: (resetDefaults?: boolean, preserveEdits?: boolean) => Promise<void>;
  brandKbId: string | null;
  onDeleteCompany: () => Promise<void>;
  onSaveCompanyDetails: () => Promise<void>;
  brandPack: string;
  setBrandPack: (value: string) => void;
  brandCapability: string;
  setBrandCapability: (value: string) => void;
  emojiRule: string;
  setEmojiRule: (value: string) => void;
  systemInstruction: string;
  setSystemInstruction: (value: string) => void;
  aiWriterSystemPrompt: string;
  setAiWriterSystemPrompt: (value: string) => void;
  aiWriterUserPrompt: string;
  setAiWriterUserPrompt: (value: string) => void;
  activeBrandRuleEdit: "pack" | "capabilities" | "writer" | "reviewer" | "visual" | null;
  brandRuleDraft: { pack: string; capabilities: string; writer: string; reviewer: string; visual: string };
  setBrandRuleDraft: Dispatch<SetStateAction<{ pack: string; capabilities: string; writer: string; reviewer: string; visual: string }>>;
  startBrandRuleEdit: (key: "pack" | "capabilities" | "writer" | "reviewer" | "visual") => void;
  cancelBrandRuleEdit: () => void;
  saveBrandRuleEdit: () => Promise<void>;
  saveBrandSetup: () => Promise<boolean>;
  sendBrandWebhook: (formAnswer: any) => Promise<void>;
  buildFormAnswer: () => any;
  industryOptions: string[];
  audienceRoleOptions: string[];
  painPointOptions: string[];
  noSayOptions: string[];
  brandBasicsName: string;
  setBrandBasicsName: (value: string) => void;
  brandBasicsIndustry: string;
  setBrandBasicsIndustry: (value: string) => void;
  brandBasicsType: string;
  setBrandBasicsType: (value: string) => void;
  brandBasicsOffer: string;
  setBrandBasicsOffer: (value: string) => void;
  brandBasicsGoal: string;
  setBrandBasicsGoal: (value: string) => void;
  audienceRole: string;
  setAudienceRole: (value: string) => void;
  audienceIndustry: string;
  setAudienceIndustry: (value: string) => void;
  audiencePainPoints: string[];
  setAudiencePainPoints: Dispatch<SetStateAction<string[]>>;
  audienceOutcome: string;
  setAudienceOutcome: (value: string) => void;
  toneFormal: number;
  setToneFormal: (value: number) => void;
  toneEnergy: number;
  setToneEnergy: (value: number) => void;
  toneBold: number;
  setToneBold: (value: number) => void;
  emojiUsage: string;
  setEmojiUsage: (value: string) => void;
  writingLength: string;
  setWritingLength: (value: string) => void;
  ctaStrength: string;
  setCtaStrength: (value: string) => void;
  absoluteTruths: string;
  setAbsoluteTruths: (value: string) => void;
  noSayRules: string[];
  setNoSayRules: Dispatch<SetStateAction<string[]>>;
  regulatedIndustry: string;
  setRegulatedIndustry: (value: string) => void;
  legalReview: string;
  setLegalReview: (value: string) => void;
  advancedPositioning: string;
  setAdvancedPositioning: (value: string) => void;
  advancedDifferentiators: string;
  setAdvancedDifferentiators: (value: string) => void;
  advancedPillars: string;
  setAdvancedPillars: (value: string) => void;
  advancedCompetitors: string;
  setAdvancedCompetitors: (value: string) => void;
  advancedProofPoints: string;
  setAdvancedProofPoints: (value: string) => void;
  advancedRequiredPhrases: string;
  setAdvancedRequiredPhrases: (value: string) => void;
  advancedForbiddenPhrases: string;
  setAdvancedForbiddenPhrases: (value: string) => void;
  advancedComplianceNotes: string;
  setAdvancedComplianceNotes: (value: string) => void;
  writerRulesUnlocked: boolean;
  reviewerRulesUnlocked: boolean;
  newCollaboratorEmail: string;
  setNewCollaboratorEmail: (value: string) => void;
  onAddCollaborator: () => void;
  onRemoveCollaborator: (id: string) => void;
  onTransferOwnership?: (newOwnerId: string) => void;
  userPermissions?: {
    canApprove: boolean;
    canGenerate: boolean;
    canCreate: boolean;
    canDelete: boolean;
    isOwner: boolean;
  };
  customRoles: any[];
  onUpdateCustomRoles: (roles: any[]) => void;
  onAssignRole: (userId: string, role: string) => void;
  isBrandWebhookCoolingDown: boolean;
  brandWebhookCooldownSecondsLeft: number;
  isEditingBrandSetup: boolean;
  brandEditingRef: React.RefObject<boolean>;
  formAnswerCache: any;
  connectedAccounts: any[];
  onConnectLinkedIn: () => void;
  onConnectFacebook: () => void;
  onDisconnectAccount: (accountId: string) => Promise<void>;
  onRefreshAccounts?: () => Promise<void>;
  backendBaseUrl: string;
};

const TabLink = ({ to, id, children, pressedTab, onClick }: { to: string; id: CompanySettingsTab; children: React.ReactNode; pressedTab: string | null; onClick: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => {
      const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-bold transition " + "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2";
      const active = "bg-[#3fa9f5]/10 text-[#3fa9f5] border border-[#3fa9f5]/20";
      const inactive = "bg-transparent text-slate-800/80 border border-transparent hover:text-[#3fa9f5] hover:-translate-y-[1px]";
      const pressed = pressedTab === id ? " scale-[0.99]" : "";
      return `${base} ${isActive ? active : inactive}${pressed}`;
    }}
  >
    {children}
  </NavLink>
);

export const Card = ({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={"rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_22px_rgba(11,38,65,0.08)] " + "p-4 sm:p-5 " + className}>
    {(title || subtitle || action) && (
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {title && <div className="text-sm font-extrabold text-slate-900">{title}</div>}
          {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{children}</div>;

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 " + "shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15 " + (props.className ?? "")}
  />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 " + "shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15 " + (props.className ?? "")}
  />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 " + "shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15 " + (props.className ?? "")}
  />
);

export const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
      (active ? "border-[#3fa9f5]/50 bg-[#3fa9f5]/15 text-[#2f97e6]" : "border-slate-200 bg-white text-slate-700 hover:border-[#3fa9f5]/30 hover:bg-[#3fa9f5]/5")
    }
  >
    {children}
  </button>
);

export const StatusPill = ({ tone, children }: { tone: "positive" | "warning" | "muted"; children: React.ReactNode }) => {
  const cls = tone === "positive" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900" : tone === "warning" ? "border-amber-500/30 bg-amber-500/10 text-amber-900" : "border-slate-300/60 bg-slate-100 text-slate-700";
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
};



export function SettingsPage(props: CompanySettingsShellProps) {
  const {
    tab,
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
    onDeleteCompany,
    onSaveCompanyDetails,
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
    brandRuleDraft: _brandRuleDraft, // avoid unused var if needed
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
    onAddCollaborator,
    onRemoveCollaborator,
    isBrandWebhookCoolingDown,
    brandWebhookCooldownSecondsLeft,
    isEditingBrandSetup,
    brandEditingRef,
    formAnswerCache,
    connectedAccounts,
    onConnectLinkedIn,
    onConnectFacebook,
    onDisconnectAccount,
    notify,
    authedFetch,
    customRoles,
    onUpdateCustomRoles,
    onAssignRole,
    onTransferOwnership,
    userPermissions = {
      canApprove: false,
      canGenerate: false,
      canCreate: false,
      canDelete: false,
      isOwner: false
    },
  } = props;

  const isOwner = userPermissions.isOwner;

  const { companyId } = useParams<{ companyId: string }>();
  const [localAccounts, setLocalAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState({
    canApprove: true,
    canGenerate: true,
    canCreate: true,
    canDelete: false
  });
  const [showRolesGuide, setShowRolesGuide] = useState(false);
  const [editingRoleIdx, setEditingRoleIdx] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAccounts = async () => {
    if (!companyId || !supabase) return;
    setLoadingAccounts(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${backendBaseUrl}/api/social/${companyId}/accounts`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLocalAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts in SettingsPage:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (tab === "integrations") {
      fetchAccounts();
    }
  }, [tab, companyId]);

  const navigate = useNavigate();
  const params = useParams();
  const decodedId = decodeURIComponent(params.companyId || "");
  const companyUrlBase = `/company/${encodeURIComponent(decodedId)}/settings`;
  const hasBrandIntelligenceConfigured = !!brandIntelligenceReady;
  const resolvedBrandSetupType = brandSetupLevel || brandSetupMode || null;
  const [pressedTab, setPressedTab] = useState<string | null>(null);


  useEffect(() => {
    if (decodedId) {
      setActiveCompanyIdWithPersistence(decodedId);
    }
  }, [decodedId, setActiveCompanyIdWithPersistence]);

  useEffect(() => {
    if (!pressedTab) return;
    const timeout = window.setTimeout(() => setPressedTab(null), 220);
    return () => window.clearTimeout(timeout);
  }, [pressedTab]);



  // Handle OAuth Redirect Params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error === 'linkedin_auth_failed') {
      alert('Failed to connect LinkedIn. Please try again.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (success === 'linkedin_connected') {
      alert('LinkedIn connected successfully!');
      fetchAccounts();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'facebook_auth_failed') {
      alert('Failed to connect Facebook. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'facebook_no_pages') {
      alert('Facebook account connected, but no managed Pages were found.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (success === 'facebook_connected') {
      alert('Facebook Pages connected successfully!');
      fetchAccounts();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);


  // Handle user search for collaborators
  useEffect(() => {
    const searchUsers = async () => {
      if (!newCollaboratorEmail || newCollaboratorEmail.length < 2) {
        setUserSearchResults([]);
        setShowUserDropdown(false);
        return;
      }

      setIsSearchingUsers(true);
      try {
        const res = await authedFetch(`${props.backendBaseUrl}/api/users/search?email=${encodeURIComponent(newCollaboratorEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
          setShowUserDropdown(data.users && data.users.length > 0);
        }
      } catch (err) {
        console.error("User search error:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [newCollaboratorEmail, props.backendBaseUrl, authedFetch]);

  const fetchAuditLogs = async () => {
    if (!companyId || !authedFetch) return;
    setLoadingAudit(true);
    try {
      const res = await authedFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/audit/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (showAuditLogs) {
      fetchAuditLogs();
    }
  }, [showAuditLogs]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden p-2.5 md:p-6">
        <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-200/60">
          {/* Dark Premium Header */}
          <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 relative overflow-hidden flex flex-col gap-2">
            <SettingsIcon className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
                System Configuration
              </div>
              <h2 className="text-2xl font-black text-white">Company Settings</h2>
              <p className="mt-1 text-sm font-medium text-slate-400">Manage your brand identity, team collaboration, and platform integrations.</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="z-30 bg-white px-4 md:px-6 pt-3 pb-2 shadow-sm border-b border-slate-100">
            <div className="relative flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm">
              <TabLink to={`${companyUrlBase}/overview`} id="overview" pressedTab={pressedTab} onClick={() => setPressedTab("overview")}>
                Overview
              </TabLink>
              <TabLink to={`${companyUrlBase}/brand-intelligence`} id="brand-intelligence" pressedTab={pressedTab} onClick={() => setPressedTab("brand-intelligence")}>
                Brand Core
              </TabLink>
              <TabLink to={`${companyUrlBase}/team`} id="team" pressedTab={pressedTab} onClick={() => setPressedTab("team")}>
                Team
              </TabLink>
              <TabLink to={`${companyUrlBase}/integrations`} id="integrations" pressedTab={pressedTab} onClick={() => setPressedTab("integrations")}>
                Integrations
              </TabLink>
              <TabLink to={`${companyUrlBase}/audit`} id="audit" pressedTab={pressedTab} onClick={() => setPressedTab("audit")}>
                Audit
              </TabLink>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-slate-900/5" />
            </div>
          </div>

          {/* Panel */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div key={tab} className="pt-2 animate-[panelFade_160ms_ease-out] px-4 md:p-6">
              {tab === "overview" && (
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <div className="text-md md:text-xl font-bold">Overview</div>
                      <p className="mt-1 text-sm md:text-[0.875rem] font-medium text-slate-600">Key configuration signals for this company. Review Brand Intelligence before generating content at scale.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                    <div className="space-y-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand Intelligence</div>
                          <div className="mt-2 text-base font-extrabold text-slate-900">
                            <StatusPill tone={hasBrandIntelligenceConfigured ? "positive" : "warning"}>{hasBrandIntelligenceConfigured ? "Configured" : "Not configured"}</StatusPill>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Setup type</div>
                          <div className="mt-2 text-base font-extrabold text-slate-900">{resolvedBrandSetupType ? String(resolvedBrandSetupType) : "—"}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team members</div>
                          <div className="mt-2 text-base font-extrabold text-slate-900">{collaborators.length ? collaborators.length : "—"}</div>
                        </div>
                      </div>

                      <Card title="Company profile" subtitle="Used across AI outputs and collaboration surfaces." className="bg-slate-50/60">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Company Name</label>
                            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700">Company Description</label>
                            <Textarea rows={3} value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={onSaveCompanyDetails}
                            className="btn bg-[#3fa9f5] text-white border border-[#3fa9f5] hover:bg-[#2f97e6] hover:border-[#2f97e6] transition-colors text-sm font-semibold px-4 py-2 rounded-lg shadow-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </Card>

                      {/* Danger Zone */}
                      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm mt-8 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-bold text-red-900">Danger Zone</div>
                            <div className="mt-1 text-xs text-red-700">
                              Permanently delete this company and all its data. This action cannot be undone.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={onDeleteCompany}
                            className="btn bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-semibold px-4 py-2 rounded-lg"
                          >
                            Delete Company
                          </button>
                        </div>
                      </div>
                    </div>

                    <aside className="hidden xl:flex xl:flex-col xl:gap-3 xl:sticky xl:top-[4.5rem]">
                      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                        <div className="text-sm font-extrabold text-slate-900">Next steps</div>
                        <div className="mt-2 text-sm text-slate-600">
                          Keep configuration tight before generating content at scale.
                          <ul className="mt-3 list-disc pl-5 space-y-1">
                            <li>Set up Brand Intelligence rules</li>
                            <li>Add collaborators who approve content</li>
                            <li>Connect integrations when available</li>
                          </ul>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate(`${companyUrlBase}/brand-intelligence`)}>
                              {hasBrandIntelligenceConfigured ? "Review Brand Intelligence" : "Set up Brand Intelligence"}
                            </button>
                            <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate(`${companyUrlBase}/team`)}>
                              Manage team
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                        <div className="text-sm font-extrabold text-slate-900">What Brand Intelligence controls</div>
                        <div className="mt-2 text-sm text-slate-600">
                          Defines AI behavior for this company:
                          <ul className="mt-3 list-disc pl-5 space-y-1">
                            <li>Voice and tone consistency</li>
                            <li>Compliance guardrails</li>
                            <li>Writer and reviewer prompts</li>
                          </ul>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              )}

              {tab === "brand-intelligence" && (
                <BrandCoreTab {...props} />
              )}

              {tab === "team" && (
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                  <div className="mb-5">
                    <div className="text-md md:text-xl font-bold">Team</div>
                    <p className="mt-1 text-sm md:text-[0.875rem] font-medium text-slate-600">Manage collaborators with access to this company.</p>
                  </div>

                  {/* Invite Teammates Card */}
                  <Card className="bg-white border-slate-200/60 shadow-sm" title="Invite Teammates" subtitle="Add coworkers to collaborate on content and branding.">
                    <div className="space-y-4">
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">New Teammate Email</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="colleague@company.com"
                            value={newCollaboratorEmail}
                            onChange={(e) => {
                              setNewCollaboratorEmail(e.target.value);
                              if (e.target.value.length >= 2) setShowUserDropdown(true);
                            }}
                            onKeyPress={(e) => e.key === "Enter" && onAddCollaborator()}
                            className="h-10 rounded-xl border-slate-200 focus:ring-[#3fa9f5]/20"
                          />
                          <button className="h-10 px-6 bg-[#3fa9f5] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#2f97e6] transition-all flex items-center gap-2 shadow-sm" type="button" onClick={onAddCollaborator}>
                            <UserPlus size={14} />
                            Invite
                          </button>
                        </div>

                        {showUserDropdown && userSearchResults.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {userSearchResults.map((user) => (
                              <button
                                key={user.id}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                onClick={() => {
                                  setNewCollaboratorEmail(user.email);
                                  setShowUserDropdown(false);
                                  onAddCollaborator();
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <Users size={14} />
                                  </div>
                                  <span className="text-sm font-semibold text-slate-700">{user.email}</span>
                                </div>
                                <Plus size={14} className="text-[#3fa9f5] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Teammates List Card */}
                  <Card className="bg-white border-slate-200/60 shadow-sm" title="Teammates" subtitle="Users who have access to this company workspace.">
                    <div className="space-y-4">
                      {collaborators.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <Users className="mx-auto text-slate-300 mb-3" size={32} />
                          <p className="text-sm font-medium text-slate-500">No collaborators added yet.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {collaborators.map((c: any) => (
                            <div key={c.id} className="group flex flex-col gap-3 p-4 rounded-2xl border border-slate-200/60 bg-white hover:border-[#3fa9f5]/30 hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-200/50">
                                    {c.email?.[0].toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate">{c.email}</div>
                                    <div className="mt-0.5 flex flex-wrap gap-2 items-center">
                                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${c.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {c.role}
                                      </div>
                                      {/* Simplified Permission Icons */}
                                      {c.role !== 'owner' && (() => {
                                        const roleDef = customRoles.find(r => r.name === c.role);
                                        if (!roleDef) return null;
                                        return (
                                          <div className="flex gap-1.5 ml-1 opacity-70">
                                            {roleDef.permissions?.canApprove && (<span title="Approve"><Check size={10} className="text-green-600" /></span>)}
                                            {roleDef.permissions?.canGenerate && (<span title="Generate"><Zap size={10} className="text-purple-600" /></span>)}
                                            {roleDef.permissions?.canCreate && (<span title="Create"><Plus size={10} className="text-blue-600" /></span>)}
                                            {roleDef.permissions?.canDelete && (<span title="Delete"><Trash2 size={10} className="text-red-600" /></span>)}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isOwner && c.role !== "owner" && (
                                    <div className="flex items-center gap-2">
                                      <select
                                        className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#3fa9f5]/20 focus:border-[#3fa9f5]/40 transition-all outline-none cursor-pointer"
                                        value={c.role}
                                        onChange={(e) => onAssignRole(c.id, e.target.value)}
                                      >
                                        <option value="collaborator">Collaborator</option>
                                        {customRoles.map((r: any) => (
                                          <option key={r.name} value={r.name}>{r.name}</option>
                                        ))}
                                      </select>
                                      <button
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        type="button"
                                        onClick={() => onRemoveCollaborator(c.id)}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Custom Roles Management */}
                  {isOwner && (
                    <Card className="bg-white border-slate-200/60 shadow-sm" title="Custom Roles" subtitle="Define up to 5 granular roles for specialized team members.">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <button
                            onClick={() => setShowRolesGuide(!showRolesGuide)}
                            className="flex items-center gap-2 text-[10px] font-bold text-[#3fa9f5] hover:text-[#3fa9f5]/80 transition-all uppercase tracking-wider"
                          >
                            <Info size={12} />
                            {showRolesGuide ? 'Hide' : 'Show'} Permissions Guide
                          </button>
                        </div>

                        {showRolesGuide && (
                          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                                  <Check size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-black uppercase text-slate-900">Approve</div>
                                  <p className="text-[9px] text-slate-500 font-medium leading-normal">Allows members to validate content and move posts to final Scheduled or Published status.</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
                                  <Zap size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-black uppercase text-slate-900">Generate</div>
                                  <p className="text-[9px] text-slate-500 font-medium leading-normal">Grants access to AI generation for captions, images, and design prompts (DMPs).</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                  <Plus size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-black uppercase text-slate-900">Create</div>
                                  <p className="text-[9px] text-slate-500 font-medium leading-normal">Allows members to add new entries to the content calendar and draft campaign ideas.</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                                  <Trash2 size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-black uppercase text-slate-900">Delete</div>
                                  <p className="text-[9px] text-slate-500 font-medium leading-normal">Permits the removal of content entries and their associated media from the system.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {customRoles.map((role, idx) => (
                            <div key={idx} className="group relative flex flex-col gap-2 p-4 rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 hover:border-[#3fa9f5]/30 transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <ShieldCheck size={14} />
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-wider truncate">{role.name}</div>
                                    <button
                                      onClick={() => setShowRolesGuide(true)}
                                      className="text-slate-300 hover:text-blue-400 transition-colors"
                                      title="View Permission Details"
                                    >
                                      <Info size={10} />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRoleIdx(idx);
                                      setNewRoleName(role.name);
                                      setNewRoleDesc(role.description || "");
                                      setNewRolePermissions(role.permissions || { canApprove: false, canGenerate: false, canCreate: false, canDelete: false });
                                    }}
                                    className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => onUpdateCustomRoles(customRoles.filter((_, i) => i !== idx))}
                                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">{role.description || "No description provided."}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {role.permissions?.canApprove && (
                                  <div className="px-1.5 py-0.5 rounded-md bg-green-50 text-[8px] font-black uppercase text-green-700 flex items-center gap-1 border border-green-100/50">
                                    <Check size={8} /> Appr
                                  </div>
                                )}
                                {role.permissions?.canGenerate && (
                                  <div className="px-1.5 py-0.5 rounded-md bg-purple-50 text-[8px] font-black uppercase text-purple-700 flex items-center gap-1 border border-purple-100/50">
                                    <Zap size={8} /> Gen
                                  </div>
                                )}
                                {role.permissions?.canCreate && (
                                  <div className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[8px] font-black uppercase text-blue-700 flex items-center gap-1 border border-blue-100/50">
                                    <Check size={8} /> Cre
                                  </div>
                                )}
                                {role.permissions?.canDelete && (
                                  <div className="px-1.5 py-0.5 rounded-md bg-red-50 text-[8px] font-black uppercase text-red-700 flex items-center gap-1 border border-red-100/50">
                                    <Trash2 size={8} /> Del
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {(customRoles.length < 5 || editingRoleIdx !== null) && (
                            <div className={`p-4 rounded-xl border-2 border-dashed ${editingRoleIdx !== null ? 'border-blue-400 bg-blue-50/10' : 'border-slate-200 bg-slate-50/30'} flex flex-col gap-3 group hover:bg-white transition-all duration-300`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`h-6 w-6 rounded-full ${editingRoleIdx !== null ? 'bg-blue-500 text-white' : 'bg-[#3fa9f5]/10 text-[#3fa9f5]'} flex items-center justify-center`}>
                                    {editingRoleIdx !== null ? <Pencil size={10} /> : <Plus size={12} />}
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-900">{editingRoleIdx !== null ? `Editing: ${customRoles[editingRoleIdx].name}` : 'New Role'}</div>
                                </div>
                                {editingRoleIdx !== null && (
                                  <button onClick={() => {
                                    setEditingRoleIdx(null);
                                    setNewRoleName("");
                                    setNewRoleDesc("");
                                    setNewRolePermissions({ canApprove: true, canGenerate: true, canCreate: true, canDelete: false });
                                  }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">
                                    Cancel
                                  </button>
                                )}
                              </div>

                              <div className="w-full space-y-3">
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Title</label>
                                      <Input
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="Editor"
                                        className="h-8 text-xs border-slate-200 rounded-lg focus:ring-[#3fa9f5]/20"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Purpose</label>
                                      <Input
                                        value={newRoleDesc}
                                        onChange={(e) => setNewRoleDesc(e.target.value)}
                                        placeholder="Goal?"
                                        className="h-8 text-xs border-slate-200 rounded-lg focus:ring-[#3fa9f5]/20"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setNewRolePermissions(p => ({ ...p, canApprove: !p.canApprove }))}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all ${newRolePermissions.canApprove ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                    >
                                      <div className={`h-2.5 w-2.5 rounded-full border flex items-center justify-center ${newRolePermissions.canApprove ? 'bg-green-500 border-green-600' : 'bg-white border-slate-200'}`}>
                                        {newRolePermissions.canApprove && <Check size={6} className="text-white" />}
                                      </div>
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewRolePermissions(p => ({ ...p, canGenerate: !p.canGenerate }))}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all ${newRolePermissions.canGenerate ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                    >
                                      <div className={`h-2.5 w-2.5 rounded-full border flex items-center justify-center ${newRolePermissions.canGenerate ? 'bg-purple-500 border-purple-600' : 'bg-white border-slate-200'}`}>
                                        {newRolePermissions.canGenerate && <Check size={6} className="text-white" />}
                                      </div>
                                      Generate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewRolePermissions(p => ({ ...p, canCreate: !p.canCreate }))}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all ${newRolePermissions.canCreate ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                    >
                                      <div className={`h-2.5 w-2.5 rounded-full border flex items-center justify-center ${newRolePermissions.canCreate ? 'bg-blue-500 border-blue-600' : 'bg-white border-slate-200'}`}>
                                        {newRolePermissions.canCreate && <Check size={6} className="text-white" />}
                                      </div>
                                      Create
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewRolePermissions(p => ({ ...p, canDelete: !p.canDelete }))}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all ${newRolePermissions.canDelete ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                    >
                                      <div className={`h-2.5 w-2.5 rounded-full border flex items-center justify-center ${newRolePermissions.canDelete ? 'bg-red-500 border-red-600' : 'bg-white border-slate-200'}`}>
                                        {newRolePermissions.canDelete && <Check size={6} className="text-white" />}
                                      </div>
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={!newRoleName}
                                  onClick={() => {
                                    if (newRoleName) {
                                      if (editingRoleIdx !== null) {
                                        const updated = [...customRoles];
                                        updated[editingRoleIdx] = { name: newRoleName, description: newRoleDesc, permissions: newRolePermissions };
                                        onUpdateCustomRoles(updated);
                                        setEditingRoleIdx(null);
                                      } else {
                                        onUpdateCustomRoles([...customRoles, { name: newRoleName, description: newRoleDesc, permissions: newRolePermissions }]);
                                      }
                                      setNewRoleName("");
                                      setNewRoleDesc("");
                                      setNewRolePermissions({ canApprove: true, canGenerate: true, canCreate: true, canDelete: false });
                                    }
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest text-slate-900 border border-slate-200 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all duration-300 disabled:opacity-50"
                                >
                                  {editingRoleIdx !== null ? <Save size={14} /> : <Plus size={14} />}
                                  {editingRoleIdx !== null ? 'Update Role' : 'Create Role'}
                                </button>
                              </div>
                            </div>
                          )}

                          {customRoles.length === 0 && (
                            <div className="md:col-span-2 text-center py-8 px-4 bg-[#3fa9f5]/5 rounded-2xl border border-[#3fa9f5]/10">
                              <Zap className="mx-auto text-[#3fa9f5] mb-2" size={24} />
                              <p className="text-xs font-bold text-slate-600">Go beyond 'Collaborator'. Create custom roles tailored to your workflow.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Transfer Ownership Section */}
                  {isOwner && (
                    <Card className="bg-white border-amber-200" title="Transfer Ownership" subtitle="Transfer this company to another team member.">
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-sm text-amber-900 font-medium">
                            ⚠️ Transferring ownership will make you a collaborator with limited permissions.
                          </p>
                        </div>

                        {collaborators.filter((c: any) => c.role !== "owner").length > 0 ? (
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700">Select new owner</label>
                            <Select
                              value=""
                              onChange={(e) => {
                                if (e.target.value && onTransferOwnership) {
                                  onTransferOwnership(e.target.value);
                                }
                              }}
                              className="w-full"
                            >
                              <option value="">— Select a collaborator —</option>
                              {collaborators
                                .filter((c: any) => c.role !== "owner")
                                .map((c: any) => (
                                  <option key={c.id} value={c.id}>
                                    {c.email}
                                  </option>
                                ))}
                            </Select>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">
                            Add collaborators first before you can transfer ownership.
                          </p>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {tab === "audit" && (
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <div className="text-md md:text-xl font-bold">Audit</div>
                      <p className="mt-1 text-sm md:text-[0.875rem] font-medium text-slate-600">Track permission changes and team modifications.</p>
                    </div>
                  </div>
                  {isOwner && (
                    <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden p-0" title="" subtitle="">
                      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">Security & Audit Logs</div>
                          <div className="mt-1 text-sm text-slate-600">View chronological activity within this company.</div>
                        </div>
                        {loadingAudit && (
                          <Activity size={16} className="text-blue-500 animate-spin" />
                        )}
                      </div>

                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-[#f8fafc] text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-5 py-4 w-40">Date</th>
                              <th className="px-5 py-4 w-48">Actor</th>
                              <th className="px-5 py-4 w-48">Action</th>
                              <th className="px-5 py-4">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {auditLogs.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-slate-400 font-medium">
                                  {loadingAudit ? 'Loading logs...' : 'No activity recorded yet.'}
                                </td>
                              </tr>
                            ) : (
                              auditLogs.map((log, i) => (
                                <tr key={log.id || i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-5 py-4 whitespace-nowrap text-[11px] font-medium text-slate-500">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                  <td className="px-5 py-4 font-medium text-slate-700">
                                    {log.actorEmail || 'Unknown'}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-800 uppercase">
                                      {log.action?.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-xs font-medium text-slate-600 w-full min-w-[200px]">
                                    {log.action === 'ROLE_ASSIGN' && `Assigned role "${log.details?.role}" to teammate.`}
                                    {log.action === 'ROLES_UPDATE' && `Updated custom role definitions.`}
                                    {!['ROLE_ASSIGN', 'ROLES_UPDATE'].includes(log.action) && `Performed security action: ${log.action}`}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {tab === "integrations" && (
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                  <div className="mb-3">
                    <div className="text-md md:text-xl font-bold">Integrations</div>
                    <p className="mt-1 text-sm md:text-[0.875rem] font-medium text-slate-600">Connect services used for publishing, approvals, and automation.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Card title="Social Accounts" subtitle="Connect your social media profiles to enable auto-publishing.">
                      <div className="space-y-4">
                        {(localAccounts.length === 0 && !loadingAccounts) ? (
                          <p className="text-sm text-slate-500 italic">No accounts connected yet.</p>
                        ) : loadingAccounts ? (
                          <p className="text-sm text-slate-500 animate-pulse">Loading accounts...</p>
                        ) : (
                          <div className="space-y-2">
                            {localAccounts.map(acc => (
                              <div key={acc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                                <div className="flex items-center gap-3">
                                  {acc.profile_picture ? (
                                    <img src={acc.profile_picture} alt={acc.provider} className="w-10 h-10 rounded-full" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                      {acc.provider[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-bold text-slate-900 capitalize">{acc.provider}</div>
                                    <div className="text-xs text-slate-600">{acc.profile_name || 'Connected'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                    Active
                                  </div>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await onDisconnectAccount(acc.id);
                                      setLocalAccounts(prev => prev.filter(a => a.id !== acc.id));
                                    }}
                                    className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-wider"
                                  >
                                    Disconnect
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={onConnectLinkedIn}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-lg font-semibold text-sm hover:bg-[#006097] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            Connect LinkedIn
                          </button>

                          <button
                            type="button"
                            onClick={onConnectFacebook}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg font-semibold text-sm hover:bg-[#166fe5] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            Connect Facebook Pages
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes panelFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
