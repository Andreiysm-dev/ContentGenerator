import React, { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";

export type CompanySettingsTab = "overview" | "brand-intelligence" | "team" | "integrations";

export type CompanySettingsShellProps = {
  tab: CompanySettingsTab;
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
  isOwner?: boolean;
  isBrandWebhookCoolingDown: boolean;
  brandWebhookCooldownSecondsLeft: number;
  isEditingBrandSetup: boolean;
  brandEditingRef: React.RefObject<boolean>;
  formAnswerCache: any;
  connectedAccounts: any[];
  onConnectLinkedIn: () => void;
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

import { BrandCoreTab } from "./settings/BrandCoreTab";

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
  } = props;

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
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh accounts
    }
  }, []);



  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden p-2.5 md:p-6">
        <div className="w-full max-w-[1200px] mx-auto bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          {/* Tabs Navigation */}
          <div className="z-30 bg-white px-4 md:px-6 pt-4 md:pt-6 pb-2">
            <div className="relative flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
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
                      </Card>

                      {/* Danger Zone */}
                      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
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

                  <Card className="bg-white" title="Collaborators" subtitle="Add teammates who can access and approve content.">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Add collaborator (email)</label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input type="email" placeholder="user@example.com" value={newCollaboratorEmail} onChange={(e) => setNewCollaboratorEmail(e.target.value)} />
                          <button className="btn btn-primary btn-sm" type="button" onClick={onAddCollaborator} disabled={!newCollaboratorEmail}>
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Current collaborators</label>
                        <div className="rounded-2xl border border-slate-200 bg-white">
                          {collaborators.length === 0 ? (
                            <div className="p-4 text-sm text-slate-600">No collaborators added yet.</div>
                          ) : (
                            <div className="divide-y divide-slate-200">
                              {collaborators.map((c: any) => (
                                <div key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-900">{c.email}</div>
                                    <div className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{c.role}</div>
                                  </div>
                                  {props.isOwner && c.role !== "owner" && (
                                    <button className="btn btn-danger btn-sm self-start sm:self-auto" type="button" onClick={() => onRemoveCollaborator(c.id)}>
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Transfer Ownership Section */}
                  {props.isOwner && (
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
                                if (e.target.value && props.onTransferOwnership) {
                                  props.onTransferOwnership(e.target.value);
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

              {tab === "integrations" && (
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                  <div className="mb-3">
                    <div className="text-md md:text-xl font-bold">Integrations</div>
                    <p className="mt-1 text-sm md:text-[0.875rem] font-medium text-slate-600">Connect services used for publishing, approvals, and automation.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Card title="Social Accounts" subtitle="Connect your social media profiles to enable auto-publishing.">
                      <div className="space-y-4">
                        {connectedAccounts.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No accounts connected yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {connectedAccounts.map(acc => (
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
                                <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                  Active
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={onConnectLinkedIn}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-lg font-semibold text-sm hover:bg-[#006097] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            Connect LinkedIn
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
