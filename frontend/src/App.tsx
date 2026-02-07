import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import {
  Brain,
  Building2,
  CalendarDays,
  HelpCircle,
  LayoutDashboard,
  Bell,
  Plug,
  Settings,
  Wand2,
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

type CompanySettingsTab = 'overview' | 'brand-intelligence' | 'team' | 'integrations';

type CompanySettingsShellProps = {
  tab: CompanySettingsTab;
  setActiveCompanyIdWithPersistence: (companyId: string) => void;
  brandIntelligenceReady: boolean;
  brandSetupMode: 'quick' | 'advanced' | 'custom' | null;
  setBrandSetupMode: (mode: 'quick' | 'advanced' | 'custom' | null) => void;
  brandSetupLevel: 'quick' | 'advanced' | 'custom' | null;
  setBrandSetupLevel: (level: 'quick' | 'advanced' | 'custom' | null) => void;
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
  activeBrandRuleEdit: 'pack' | 'capabilities' | 'writer' | 'reviewer' | null;
  brandRuleDraft: { pack: string; capabilities: string; writer: string; reviewer: string };
  setBrandRuleDraft: Dispatch<SetStateAction<{ pack: string; capabilities: string; writer: string; reviewer: string }>>;
  startBrandRuleEdit: (key: 'pack' | 'capabilities' | 'writer' | 'reviewer') => void;
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
  newCollaboratorEmail: string;
  setNewCollaboratorEmail: (value: string) => void;
  handleAddCollaborator: () => void;
  handleRemoveCollaborator: (id: string) => void;
};

function BrandRedirect() {
  const params = useParams();
  const decodedId = decodeURIComponent(params.companyId || '');
  const safeId = encodeURIComponent(decodedId);
  return <Navigate to={`/company/${safeId}/settings/brand-intelligence`} replace />;
}

function CompanySettingsShell(props: CompanySettingsShellProps) {
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
    newCollaboratorEmail,
    setNewCollaboratorEmail,
    handleAddCollaborator,
    handleRemoveCollaborator,
  } = props;

  const navigate = useNavigate();
  const params = useParams();
  const decodedId = decodeURIComponent(params.companyId || '');
  const companyUrlBase = `/company/${encodeURIComponent(decodedId)}/settings`;
  const hasBrandIntelligenceConfigured = !!brandIntelligenceReady;
  const resolvedBrandSetupType = brandSetupLevel || brandSetupMode || null;
  const isEditingBrandSetup = !!brandSetupMode;
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  useEffect(() => {
    if (decodedId) {
      setActiveCompanyIdWithPersistence(decodedId);
    }
  }, [decodedId]);

  useEffect(() => {
    if (!pressedTab) return;
    const timeout = window.setTimeout(() => setPressedTab(null), 220);
    return () => window.clearTimeout(timeout);
  }, [pressedTab]);

  return (
    <div className="company-shell company-shell--tabs">
      <main className="company-main">
        <div className="company-container">
          <div className="company-tabs" role="tablist" aria-label="Company settings">
            <NavLink
              to={`${companyUrlBase}/overview`}
              onClick={() => setPressedTab('overview')}
              className={({ isActive }: { isActive: boolean }) =>
                `company-tab ${isActive ? 'is-active' : ''} ${pressedTab === 'overview' ? 'is-pressed' : ''}`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to={`${companyUrlBase}/brand-intelligence`}
              onClick={() => setPressedTab('brand-intelligence')}
              className={({ isActive }: { isActive: boolean }) =>
                `company-tab ${isActive ? 'is-active' : ''} ${pressedTab === 'brand-intelligence' ? 'is-pressed' : ''}`
              }
            >
              Brand Intelligence
            </NavLink>
            <NavLink
              to={`${companyUrlBase}/team`}
              onClick={() => setPressedTab('team')}
              className={({ isActive }: { isActive: boolean }) =>
                `company-tab ${isActive ? 'is-active' : ''} ${pressedTab === 'team' ? 'is-pressed' : ''}`
              }
            >
              Team
            </NavLink>
            <NavLink
              to={`${companyUrlBase}/integrations`}
              onClick={() => setPressedTab('integrations')}
              className={({ isActive }: { isActive: boolean }) =>
                `company-tab ${isActive ? 'is-active' : ''} ${pressedTab === 'integrations' ? 'is-pressed' : ''}`
              }
            >
              Integrations
            </NavLink>
          </div>

          <div className="company-tab-panel" key={tab}>
            {tab === 'overview' && (
              <>
                <div className="company-page-header">
                  <div>
                    <h1 className="company-page-title">Overview</h1>
                    <p className="company-page-subtitle">
                      Key configuration signals for this company. Review Brand Intelligence before generating content at scale.
                    </p>
                  </div>
                </div>

                <div className="company-content-grid">
                  <div>
                    <div className="stat-grid">
                      <div className="stat-card">
                        <div className="stat-label">Brand Intelligence</div>
                        <div className="stat-value">
                          <span className={`status-pill ${hasBrandIntelligenceConfigured ? 'is-positive' : 'is-warning'}`}>
                            {hasBrandIntelligenceConfigured ? 'Configured' : 'Not configured'}
                          </span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Setup type</div>
                        <div className="stat-value">{resolvedBrandSetupType ? String(resolvedBrandSetupType) : '—'}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Team members</div>
                        <div className="stat-value">{collaborators.length ? collaborators.length : '—'}</div>
                      </div>
                    </div>

                    <div className="settings-section">
                      <div className="settings-section-title">Company profile</div>
                      <p className="section-helper">Used across AI outputs and collaboration surfaces.</p>
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
                  </div>

                  <aside className="company-right-rail">
                    <div className="rail-card">
                      <h3 className="rail-card-title">Next steps</h3>
                      <div className="rail-card-body">
                        Keep configuration tight before generating content at scale.
                        <ul className="rail-list">
                          <li>Set up Brand Intelligence rules</li>
                          <li>Add collaborators who approve content</li>
                          <li>Connect integrations when available</li>
                        </ul>
                        <div className="rail-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`${companyUrlBase}/brand-intelligence`)}
                          >
                            {hasBrandIntelligenceConfigured ? 'Review Brand Intelligence' : 'Set up Brand Intelligence'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`${companyUrlBase}/team`)}
                          >
                            Manage team
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rail-card">
                      <h3 className="rail-card-title">What Brand Intelligence controls</h3>
                      <div className="rail-card-body">
                        Defines AI behavior for this company:
                        <ul className="rail-list">
                          <li>Voice and tone consistency</li>
                          <li>Compliance guardrails</li>
                          <li>Writer and reviewer prompts</li>
                        </ul>
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            )}

          {tab === 'brand-intelligence' && (
            <div className="settings-section brand-intel-section">
              <div className="company-page-header">
                <div>
                  <h1 className="company-page-title">Brand Intelligence</h1>
                  <p className="company-page-subtitle">
                    Controls AI behavior for this company—tone, brand rules, and compliance guardrails. Designed to be guided and reversible.
                  </p>
                </div>
                <div className="company-page-actions">
                  <span className={`status-pill ${hasBrandIntelligenceConfigured ? 'is-positive' : 'is-warning'}`}>
                    {hasBrandIntelligenceConfigured ? 'Configured' : 'Not configured'}
                  </span>
                  {hasBrandIntelligenceConfigured && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setBrandSetupMode(resolvedBrandSetupType === 'custom' ? 'custom' : (resolvedBrandSetupType || 'quick'));
                          setBrandSetupStep(1);
                          setIsEditingBrandSetup(true);
                        }}
                      >
                        Answer again
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          await sendBrandWebhook(buildFormAnswer());
                        }}
                      >
                        Regenerate
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadBrandKB(false, true)}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="company-content-grid">
                <div>
                  {(brandKbId && !brandIntelligenceReady && !brandSetupMode) && (
                    <div className="stat-grid" style={{ marginBottom: 12 }}>
                      <div className="stat-card">
                        <div className="stat-label">Generation</div>
                        <div className="stat-value">
                          <span className="status-pill is-warning">In progress</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Next</div>
                        <div className="stat-value">Wait for generation, then refresh</div>
                      </div>
                    </div>
                  )}

                  {(brandIntelligenceReady && !brandSetupMode) && (
                    <div className="brand-rules">
                      <div className="brand-rules-grid">
                        <div className="brand-rule-card">
                          <div className="brand-rule-card-header">
                            <div>
                              <div className="brand-rule-title">Brand Pack</div>
                              <div className="brand-rule-subtitle">High-level identity, voice, and positioning.</div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => startBrandRuleEdit('pack')}>
                              Edit
                            </button>
                          </div>
                          {activeBrandRuleEdit === 'pack' ? (
                            <>
                              <textarea
                                className="field-input field-textarea"
                                rows={8}
                                value={brandRuleDraft.pack}
                                onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, pack: e.target.value }))}
                              />
                              <div className="brand-rule-actions">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelBrandRuleEdit}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={saveBrandRuleEdit}>
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="content-box content-box--scroll">{brandPack || '—'}</div>
                          )}
                        </div>

                        <div className="brand-rule-card">
                          <div className="brand-rule-card-header">
                            <div>
                              <div className="brand-rule-title">Capabilities</div>
                              <div className="brand-rule-subtitle">What we can claim, do, and emphasize.</div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => startBrandRuleEdit('capabilities')}>
                              Edit
                            </button>
                          </div>
                          {activeBrandRuleEdit === 'capabilities' ? (
                            <>
                              <textarea
                                className="field-input field-textarea"
                                rows={8}
                                value={brandRuleDraft.capabilities}
                                onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, capabilities: e.target.value }))}
                              />
                              <div className="brand-rule-actions">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelBrandRuleEdit}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={saveBrandRuleEdit}>
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="content-box content-box--scroll">{brandCapability || '—'}</div>
                          )}
                        </div>

                        <div className="brand-rule-card">
                          <div className="brand-rule-card-header">
                            <div>
                              <div className="brand-rule-title">Writer prompt</div>
                              <div className="brand-rule-subtitle">System instructions used for generation.</div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => startBrandRuleEdit('writer')}>
                              Edit
                            </button>
                          </div>
                          {activeBrandRuleEdit === 'writer' ? (
                            <>
                              <textarea
                                className="field-input field-textarea"
                                rows={8}
                                value={brandRuleDraft.writer}
                                onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, writer: e.target.value }))}
                              />
                              <div className="brand-rule-actions">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelBrandRuleEdit}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={saveBrandRuleEdit}>
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="content-box content-box--scroll">{aiWriterSystemPrompt || '—'}</div>
                          )}
                        </div>

                        <div className="brand-rule-card">
                          <div className="brand-rule-card-header">
                            <div>
                              <div className="brand-rule-title">Reviewer prompt</div>
                              <div className="brand-rule-subtitle">Used for review and QA.</div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => startBrandRuleEdit('reviewer')}>
                              Edit
                            </button>
                          </div>
                          {activeBrandRuleEdit === 'reviewer' ? (
                            <>
                              <textarea
                                className="field-input field-textarea"
                                rows={8}
                                value={brandRuleDraft.reviewer}
                                onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, reviewer: e.target.value }))}
                              />
                              <div className="brand-rule-actions">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelBrandRuleEdit}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={saveBrandRuleEdit}>
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="content-box content-box--scroll">{aiWriterUserPrompt || '—'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasBrandIntelligenceConfigured && !brandSetupMode && (
                    <div className="stat-grid">
                      <div className="stat-card">
                        <div className="stat-label">Safe defaults</div>
                        <div className="stat-value">Enabled</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Impact</div>
                        <div className="stat-value">Writing + review prompts</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Reversible</div>
                        <div className="stat-value">Edit inputs anytime</div>
                      </div>
                    </div>
                  )}

                  {!isEditingBrandSetup && !brandSetupMode && !brandIntelligenceReady && (
                    <div className="brand-choice">
                      <div className="brand-choice-header">
                        <h3>Set up your brand intelligence</h3>
                        <p>Choose how detailed you want to be. You can refine this anytime.</p>
                      </div>
                      <div className="choice-grid">
                        <button
                          type="button"
                          className="choice-card is-primary"
                          onClick={() => {
                            setBrandSetupMode('quick');
                            setBrandSetupLevel('quick');
                            setBrandSetupStep(1);
                            setIsEditingBrandSetup(true);
                          }}
                        >
                          <div className="choice-title">Quick Setup (Recommended)</div>
                          <div className="choice-meta">5–7 minutes · Best for agencies & multi-brand managers</div>
                          <div className="choice-desc">Safe defaults + smart inference</div>
                          <span className="choice-cta">Start Quick Setup</span>
                        </button>
                        <button
                          type="button"
                          className="choice-card"
                          onClick={() => {
                            setBrandSetupMode('advanced');
                            setBrandSetupLevel('advanced');
                            setBrandSetupStep(1);
                            setIsEditingBrandSetup(true);
                          }}
                        >
                          <div className="choice-title">Advanced Setup</div>
                          <div className="choice-meta">15–20 minutes · Full control for regulated brands</div>
                          <div className="choice-desc">Unlock audience segments, pillars, CTA matrices</div>
                          <span className="choice-cta">Start Advanced Setup</span>
                        </button>
                        <button
                          type="button"
                          className="choice-card"
                          onClick={() => {
                            setBrandSetupMode('custom');
                            setBrandSetupLevel('custom');
                            setBrandSetupStep(0);
                            setIsEditingBrandSetup(true);
                          }}
                        >
                          <div className="choice-title">Custom (Provide Your Own)</div>
                          <div className="choice-meta">Direct megaprompt control</div>
                          <div className="choice-desc">Paste your Brand Pack, Capabilities, Writer & Reviewer rules.</div>
                          <span className="choice-cta">Use Custom Setup</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {brandSetupMode === 'custom' && (
                    <div className="brand-step">
                      <div className="brand-step-header">
                        <div>
                          <h3>Custom Brand Intelligence</h3>
                          <p>Provide your own prompts and rules.</p>
                        </div>
                        <span className="step-pill">Manual</span>
                      </div>
                      <div className="settings-grid">
                        <div className="form-group">
                          <label className="field-label">Brand Pack</label>
                          <textarea className="field-input field-textarea" rows={4} value={brandPack} onChange={(e) => setBrandPack(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="field-label">Brand Capability</label>
                          <textarea className="field-input field-textarea" rows={4} value={brandCapability} onChange={(e) => setBrandCapability(e.target.value)} />
                        </div>
                        <div className="form-group settings-full-width">
                          <label className="field-label">Emoji Rule</label>
                          <input type="text" className="field-input" value={emojiRule} onChange={(e) => setEmojiRule(e.target.value)} />
                        </div>
                        <div className="form-group settings-full-width">
                          <label className="field-label">System Instruction</label>
                          <textarea className="field-input field-textarea" rows={4} value={systemInstruction} onChange={(e) => setSystemInstruction(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="field-label">Writer System Prompt</label>
                          <textarea className="field-input field-textarea" rows={4} value={aiWriterSystemPrompt} onChange={(e) => setAiWriterSystemPrompt(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="field-label">Reviewer Prompt</label>
                          <textarea className="field-input field-textarea" rows={4} value={aiWriterUserPrompt} onChange={(e) => setAiWriterUserPrompt(e.target.value)} />
                        </div>
                      </div>
                      <div className="brand-step-footer">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            await saveBrandSetup();
                            setBrandSetupMode(null);
                            setIsEditingBrandSetup(false);
                          }}
                        >
                          Save & Exit
                        </button>
                      </div>
                    </div>
                  )}

                  {(brandSetupMode && brandSetupMode !== 'custom') && (
                    <>
                      {brandSetupMode && brandSetupStep === 1 && (
                        <div className="brand-step">
                          <div className="brand-step-header">
                            <div>
                              <h3>Brand Snapshot</h3>
                              <p>Step 1 of {brandSetupMode === 'advanced' ? 4 : 3} · Estimated time: ~2 minutes</p>
                            </div>
                            <span className="step-pill">{brandSetupMode === 'advanced' ? 'Advanced Setup' : 'Quick Setup'}</span>
                          </div>
                          <div className="brand-subsection">
                            <div className="brand-subtitle">Brand Basics</div>
                            <div className="settings-grid">
                              <div className="form-group">
                                <label className="field-label">Brand Name</label>
                                <input type="text" className="field-input" value={brandBasicsName} onChange={(e) => setBrandBasicsName(e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label className="field-label">Industry</label>
                                <select className="field-input select-input" value={brandBasicsIndustry} onChange={(e) => setBrandBasicsIndustry(e.target.value)}>
                                  <option value="">Select industry</option>
                                  {!!brandBasicsIndustry && !industryOptions.includes(brandBasicsIndustry) && (
                                    <option value={brandBasicsIndustry}>{brandBasicsIndustry}</option>
                                  )}
                                  {industryOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="field-label">Business Type</label>
                                <div className="pill-group">
                                  {['B2B', 'B2C', 'Both'].map((option) => (
                                    <button key={option} type="button" className={`pill ${brandBasicsType === option ? 'is-active' : ''}`} onClick={() => setBrandBasicsType(option)}>
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="form-group">
                                <label className="field-label">Primary Offer</label>
                                <input type="text" className="field-input" value={brandBasicsOffer} onChange={(e) => setBrandBasicsOffer(e.target.value)} />
                              </div>
                            </div>
                          </div>
                          <div className="brand-step-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setBrandSetupMode(null); setIsEditingBrandSetup(false); }}>
                              Save & Exit
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => setBrandSetupStep(2)}>
                              Continue
                            </button>
                          </div>
                        </div>
                      )}

                      {brandSetupMode && brandSetupStep === 2 && (
                        <div className="brand-step">
                          <div className="brand-step-header">
                            <div>
                              <h3>Audience & outcomes</h3>
                              <p>Step 2 of {brandSetupMode === 'advanced' ? 4 : 3} · Estimated time: ~2 minutes</p>
                            </div>
                            <span className="step-pill">{brandSetupMode === 'advanced' ? 'Advanced Setup' : 'Quick Setup'}</span>
                          </div>
                          <div className="settings-grid">
                            <div className="form-group">
                              <label className="field-label">Primary audience role</label>
                              <input
                                type="text"
                                className="field-input"
                                value={audienceRole}
                                onChange={(e) => setAudienceRole(e.target.value)}
                                placeholder="e.g., Marketing Manager, Founder, HR Lead"
                              />
                            </div>
                            <div className="form-group">
                              <label className="field-label">Audience industry (optional)</label>
                              <input type="text" className="field-input" value={audienceIndustry} onChange={(e) => setAudienceIndustry(e.target.value)} placeholder="e.g., Healthcare, SaaS, Retail" />
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">Pain points</label>
                              <div className="pill-group">
                                {painPointOptions.map((opt) => {
                                  const active = audiencePainPoints.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      className={`pill ${active ? 'is-active' : ''}`}
                                      onClick={() =>
                                        setAudiencePainPoints((prev) =>
                                          active ? prev.filter((v) => v !== opt) : [...prev, opt],
                                        )
                                      }
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">Desired outcome</label>
                              <input type="text" className="field-input" value={audienceOutcome} onChange={(e) => setAudienceOutcome(e.target.value)} placeholder="e.g., book a tour, request a demo, follow for tips" />
                            </div>
                          </div>
                          <div className="brand-step-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBrandSetupStep(1)}>
                              Back
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => setBrandSetupStep(3)}>
                              Continue
                            </button>
                          </div>
                        </div>
                      )}

                      {brandSetupMode && brandSetupStep === 3 && (
                        <div className="brand-step">
                          <div className="brand-step-header">
                            <div>
                              <h3>Voice & guardrails</h3>
                              <p>
                                Step {brandSetupMode === 'advanced' ? 3 : 3} of {brandSetupMode === 'advanced' ? 4 : 3} · Estimated time: ~3 minutes
                              </p>
                            </div>
                            <span className="step-pill">{brandSetupMode === 'advanced' ? 'Advanced Setup' : 'Quick Setup'}</span>
                          </div>

                          <div className="settings-grid">
                            <div className="form-group">
                              <label className="field-label">Formal</label>
                              <input type="range" min={0} max={100} value={toneFormal} onChange={(e) => setToneFormal(Number(e.target.value))} />
                            </div>
                            <div className="form-group">
                              <label className="field-label">Energy</label>
                              <input type="range" min={0} max={100} value={toneEnergy} onChange={(e) => setToneEnergy(Number(e.target.value))} />
                            </div>
                            <div className="form-group">
                              <label className="field-label">Boldness</label>
                              <input type="range" min={0} max={100} value={toneBold} onChange={(e) => setToneBold(Number(e.target.value))} />
                            </div>

                            <div className="form-group">
                              <label className="field-label">Emoji usage</label>
                              <select className="field-input select-input" value={emojiUsage} onChange={(e) => setEmojiUsage(e.target.value)}>
                                <option value="None">None</option>
                                <option value="Light">Light</option>
                                <option value="Medium">Medium</option>
                                <option value="Heavy">Heavy</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="field-label">Length</label>
                              <select className="field-input select-input" value={writingLength} onChange={(e) => setWritingLength(e.target.value)}>
                                <option value="Short">Short</option>
                                <option value="Balanced">Balanced</option>
                                <option value="Long">Long</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="field-label">CTA strength</label>
                              <select className="field-input select-input" value={ctaStrength} onChange={(e) => setCtaStrength(e.target.value)}>
                                <option value="Soft">Soft</option>
                                <option value="Medium">Medium</option>
                                <option value="Strong">Strong</option>
                              </select>
                            </div>

                            <div className="form-group settings-full-width">
                              <label className="field-label">Absolute truths</label>
                              <textarea className="field-input field-textarea" rows={3} value={absoluteTruths} onChange={(e) => setAbsoluteTruths(e.target.value)} />
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">No-say rules</label>
                              <div className="pill-group">
                                {noSayOptions.map((opt) => {
                                  const active = noSayRules.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      className={`pill ${active ? 'is-active' : ''}`}
                                      onClick={() =>
                                        setNoSayRules((prev) =>
                                          active ? prev.filter((v) => v !== opt) : [...prev, opt],
                                        )
                                      }
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="brand-step-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBrandSetupStep(2)}>
                              Back
                            </button>
                            {brandSetupMode === 'advanced' ? (
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => setBrandSetupStep(4)}>
                                Continue
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                  const saved = await saveBrandSetup();
                                  if (!saved) return;
                                  await sendBrandWebhook(buildFormAnswer());
                                  setBrandSetupMode(null);
                                  setIsEditingBrandSetup(false);
                                }}
                              >
                                Save & Generate
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {brandSetupMode === 'advanced' && brandSetupStep === 4 && (
                        <div className="brand-step">
                          <div className="brand-step-header">
                            <div>
                              <h3>Advanced positioning</h3>
                              <p>Step 4 of 4 · Estimated time: ~4 minutes</p>
                            </div>
                            <span className="step-pill">Advanced Setup</span>
                          </div>

                          <div className="settings-grid">
                            <div className="form-group settings-full-width">
                              <label className="field-label">Positioning</label>
                              <textarea className="field-input field-textarea" rows={3} value={advancedPositioning} onChange={(e) => setAdvancedPositioning(e.target.value)} />
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">Differentiators</label>
                              <textarea className="field-input field-textarea" rows={3} value={advancedDifferentiators} onChange={(e) => setAdvancedDifferentiators(e.target.value)} />
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">Pillars</label>
                              <textarea className="field-input field-textarea" rows={3} value={advancedPillars} onChange={(e) => setAdvancedPillars(e.target.value)} />
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">Competitors</label>
                              <textarea className="field-input field-textarea" rows={3} value={advancedCompetitors} onChange={(e) => setAdvancedCompetitors(e.target.value)} />
                            </div>
                            <div className="form-group settings-full-width">
                              <label className="field-label">Proof points</label>
                              <textarea className="field-input field-textarea" rows={3} value={advancedProofPoints} onChange={(e) => setAdvancedProofPoints(e.target.value)} />
                            </div>
                          </div>

                          <div className="brand-step-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBrandSetupStep(3)}>
                              Back
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={async () => {
                                const saved = await saveBrandSetup();
                                if (!saved) return;
                                await sendBrandWebhook(buildFormAnswer());
                                setBrandSetupMode(null);
                                setIsEditingBrandSetup(false);
                              }}
                            >
                              Save & Generate
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <aside className="company-right-rail">
                  <div className="rail-card">
                    <h3 className="rail-card-title">Safety + control</h3>
                    <div className="rail-card-body">
                      This configuration affects all AI outputs for this company.
                      <ul className="rail-list">
                        <li>Use safe defaults to get started</li>
                        <li>Edit inputs any time</li>
                        <li>Regeneration is rate-limited</li>
                      </ul>
                    </div>
                  </div>
                  <div className="rail-card">
                    <h3 className="rail-card-title">Recommended order</h3>
                    <div className="rail-card-body">
                      <ul className="rail-list">
                        <li>Brand snapshot + audience</li>
                        <li>Guardrails + compliance</li>
                        <li>Generate and review outputs</li>
                      </ul>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="settings-section">
              <div className="company-page-header">
                <div>
                  <h1 className="company-page-title">Team</h1>
                  <p className="company-page-subtitle">Manage collaborators with access to this company.</p>
                </div>
              </div>
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
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAddCollaborator} disabled={!newCollaboratorEmail}>
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
                      collaborators.map((c: any) => (
                        <div key={c.id} className="collaborator-item">
                          <span>{c.email}</span>
                          <span className="collaborator-role">{c.role}</span>
                          {c.role !== 'owner' && (
                            <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleRemoveCollaborator(c.id)}>
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
          )}

          {tab === 'integrations' && (
            <div className="settings-section">
              <div className="company-page-header">
                <div>
                  <h1 className="company-page-title">Integrations</h1>
                  <p className="company-page-subtitle">Connect services used for publishing, approvals, and automation.</p>
                </div>
              </div>
              <p className="section-helper">Coming soon.</p>
            </div>
          )}

          </div>
        </div>
      </main>
    </div>
  );
}

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const supabaseBaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
const defaultCompanyId = import.meta.env.VITE_COMPANY_ID as string | undefined;
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseBaseUrl && supabaseAnonKey
  ? createClient(supabaseBaseUrl, supabaseAnonKey)
  : null;
const revisionWebhookUrl = (import.meta.env as any).VITE_MAKE_REVISION_WEBHOOK || '';
const imageFromExistingDmpWebhookUrl =
  (import.meta.env as any).VITE_MAKE_IMAGE_EXISTING_DMP_WEBHOOK ||
  'https://hook.eu2.make.com/ms8ivolxdradx79w0nh6x96yuejq0o6a';
const VIEW_MODAL_POLL_MS = 1500;
const CALENDAR_POLL_MS = 2500;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
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
    if (!supabase) {
      notify('Supabase is not configured.', 'error');
      return;
    }
    if (!selectedRow) return;
    setIsUploadingDesigns(true);
    try {
      const uploads = Array.from(files).map(async (file) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `designs/${selectedRow.contentCalendarId}-${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
          .from('generated-images')
          .upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('generated-images').getPublicUrl(path);
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
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>(() => {
    // Try to get from localStorage first, fallback to defaultCompanyId
    const saved = localStorage.getItem('activeCompanyId');
    return saved || defaultCompanyId;
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

  useEffect(() => {
    const isTeamRoute = /^\/company\/[^/]+\/settings\/team\/?$/.test(location.pathname);
    if (!isTeamRoute) return;
    if (!activeCompanyId) return;
    fetchCollaborators(activeCompanyId);
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
    'pack' | 'capabilities' | 'writer' | 'reviewer' | null
  >(null);
  const [brandRuleDraft, setBrandRuleDraft] = useState<{
    pack: string;
    capabilities: string;
    writer: string;
    reviewer: string;
  }>({ pack: '', capabilities: '', writer: '', reviewer: '' });
  const brandRuleSnapshotRef = useRef<{
    pack: string;
    capabilities: string;
    writer: string;
    reviewer: string;
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

  const saveBrandSetup = async () => {
    if (!activeCompanyId) return false;
    const formAnswer = buildFormAnswer();
    const brandPayload = {
      companyId: activeCompanyId,
      brandPack,
      brandCapability,
      emojiRule,
      systemInstruction,
      writerAgent: aiWriterSystemPrompt,
      reviewPrompt1: aiWriterUserPrompt,
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
      return false;
    }
    if (brandData?.brandKB?.brandKbId) {
      setBrandKbId(brandData.brandKB.brandKbId);
    }
    setFormAnswerCache(formAnswer);
    return true;
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
    const nextCooldownUntil = Date.now() + 60_000;
    setBrandWebhookCooldownUntil(nextCooldownUntil);
    try {
      const res = await fetch('https://hook.eu2.make.com/g24qwx5vfgoqb5xe9r2jnbd2znpsgnd4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompanyId,
          companyName,
          brandKbId,
          setupLevel: brandSetupLevel,
          formAnswer,
        }),
      });
      if (!res.ok) {
        throw new Error(`Webhook returned ${res.status}`);
      }
    } catch (err) {
      setBrandWebhookCooldownUntil(0);
      console.error('Brand intelligence webhook failed:', err);
    }
  };

  const startBrandRuleEdit = (key: 'pack' | 'capabilities' | 'writer' | 'reviewer') => {
    const snapshot = {
      pack: brandPack,
      capabilities: brandCapability,
      writer: aiWriterSystemPrompt,
      reviewer: aiWriterUserPrompt,
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

    setBrandPack(nextPack);
    setBrandCapability(nextCapabilities);
    setAiWriterSystemPrompt(nextWriter);
    setAiWriterUserPrompt(nextReviewer);

    const saved = await saveBrandSetup();
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
    /^\/company\/[^/]+\/settings\/brand-intelligence\/?$/.test(location.pathname);
  if (!isBrandIntelligenceRoute) return;
  if (!activeCompanyId || !session) return;
  if (brandEditingRef.current) return;
  if (brandIntelligenceReady && !brandSetupMode) return;
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

const buildGeneratePayload = (row: any) => ({
  contentCalendarId: row.contentCalendarId,
  companyId: row.companyId ?? activeCompanyId ?? null,
  brandKbId: brandKbId ?? null,
  brandHighlight: row.brandHighlight ?? '',
  crossPromo: row.crossPromo ?? '',
  theme: row.theme ?? '',
  contentType: row.contentType ?? '',
  channels: row.channels ?? '',
  targetAudience: row.targetAudience ?? '',
  primaryGoal: row.primaryGoal ?? '',
  cta: row.cta ?? '',
  promoType: row.promoType ?? '',
  emojiRule,
  brandPack,
  brandCapability,
  executionInstructions: [
    'Adapt tone and length to the listed Channels',
    'Speak directly to the selected Audience Segment',
    'Deliver clear value before promotion',
    'Ensure ecosystem framing (not single-offer isolation)',
    'If CTA is missing, choose the most appropriate soft or primary CTA',
    'Hashtags must be relevant, minimal, and professional',
  ],
  outputStructure: ['FRAMEWORK:', 'Caption', 'CTA:', 'Hashtags'],
});

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

  setCalendarRows((prev) =>
    prev.map((row) =>
      validRows.some((selected) => selected.contentCalendarId === row.contentCalendarId)
        ? { ...row, status: 'Generate' }
        : row,
    ),
  );

  let successCount = 0;
  for (const row of validRows) {
    try {
      const whRes = await fetch('https://hook.eu2.make.com/09mj7o8vwfsp8ju11xmcn4riaace5teb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeneratePayload(row)),
      });
      if (!whRes.ok) {
        const whText = await whRes.text().catch(() => '');
        notify(`Generation failed for ${row.theme || row.date || row.contentCalendarId}. ${whText}`, 'error');
      } else {
        successCount += 1;
      }
    } catch (err) {
      console.error('Failed to call generation webhook', err);
      notify(`Failed to trigger generation for ${row.theme || row.date || row.contentCalendarId}.`, 'error');
    }
  }

  if (successCount > 0) {
    notify(`Generation triggered for ${successCount} row(s).`, 'success');
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

  if (!revisionWebhookUrl) {
    notify('Revision webhook URL is not configured. Please set VITE_MAKE_REVISION_WEBHOOK.', 'error');
    setIsBatchReviewing(false);
    return;
  }
  if (!aiWriterUserPrompt || !aiWriterUserPrompt.trim()) {
    notify('Review prompt is empty. Please fill in Review Prompt in Company Settings.', 'error');
    setIsBatchReviewing(false);
    return;
  }

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

  setCalendarRows((prev) =>
    prev.map((row) =>
      validRows.some((selected) => selected.contentCalendarId === row.contentCalendarId)
        ? { ...row, status: 'Review' }
        : row,
    ),
  );

  let successCount = 0;
  for (const row of validRows) {
    try {
      await fetch(revisionWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentCalendarId: row.contentCalendarId,
          companyId: row.companyId ?? activeCompanyId ?? null,
        }),
      });
      successCount += 1;
    } catch (err) {
      console.error('Failed to call revision webhook', err);
      notify(`Failed to trigger review for ${row.theme || row.date || row.contentCalendarId}.`, 'error');
    }
  }

  if (successCount > 0) {
    notify(`Sent ${successCount} row(s) for review.`, 'success');
  }
  setIsBatchReviewing(false);
};

const handleBatchGenerateImages = async () => {
  if (selectedIds.length === 0) return;
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
          <button
            type="button"
            className="app-title-trigger"
            onClick={() => setIsNavDrawerOpen((prev) => !prev)}
          >
            <span className="app-title-text">ContentGenerator</span>
            <span className="app-title-context">· {activeCompany?.companyName || 'Select company'}</span>
          </button>

          <div className="header-actions">
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => {
                notify('No notifications yet.', 'info');
              }}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="header-icon-btn"
              onClick={() => {
                navigate('/profile');
              }}
              title="User settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="btn btn-secondary btn-sm">
                  {session?.user?.user_metadata?.full_name || session?.user?.email || 'Profile'}
                  <span className="company-trigger-caret">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="company-menu">
                <DropdownMenuItem
                  onSelect={() => {
                    navigate('/profile');
                  }}
                >
                  Profile
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

      <div className="app-shell">
        <aside
          className={`nav-rail ${isNavDrawerOpen ? 'is-open' : 'is-closed'}`}
          aria-label="Primary navigation"
        >
          <div className="nav-rail-section">
            <div className="nav-rail-section-title">Company</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="nav-rail-company-trigger" disabled={!isNavDrawerOpen}>
                  <span className="nav-rail-company-name">{activeCompany?.companyName || 'Select company'}</span>
                  <span className="company-trigger-caret">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="company-menu">
                {companies.map((company) => (
                  <DropdownMenuItem
                    key={company.companyId}
                    onSelect={() => {
                      setActiveCompanyIdWithPersistence(company.companyId);
                      navigate(`/company/${encodeURIComponent(company.companyId)}/dashboard`);
                    }}
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
          </div>

          <div className="nav-rail-section">
            <div className="nav-rail-section-title">Workspace</div>
            <div className="nav-rail-links">
              <button
                type="button"
                className="nav-rail-link"
                onClick={() => {
                  if (!activeCompanyId) return;
                  navigate(`/company/${encodeURIComponent(activeCompanyId)}/dashboard`);
                }}
                disabled={!activeCompanyId || !isNavDrawerOpen}
              >
                <LayoutDashboard className="nav-rail-icon" aria-hidden="true" />
                Dashboard
              </button>
              <button
                type="button"
                className={`nav-rail-link ${activeNavKey === 'generate' ? 'is-active' : ''}`}
                onClick={() => {
                  if (!activeCompanyId) return;
                  navigate(`/company/${encodeURIComponent(activeCompanyId)}/generate`);
                }}
                disabled={!activeCompanyId || !isNavDrawerOpen}
              >
                <Wand2 className="nav-rail-icon" aria-hidden="true" />
                Content Generator
              </button>
              <button
                type="button"
                className={`nav-rail-link ${activeNavKey === 'calendar' ? 'is-active' : ''}`}
                onClick={() => {
                  if (!activeCompanyId) return;
                  navigate(`/company/${encodeURIComponent(activeCompanyId)}/calendar`);
                }}
                disabled={!activeCompanyId || !isNavDrawerOpen}
              >
                <CalendarDays className="nav-rail-icon" aria-hidden="true" />
                Content Calendar
              </button>
              <button
                type="button"
                className={`nav-rail-link ${activeNavKey === 'integrations' ? 'is-active' : ''}`}
                onClick={() => {
                  if (!activeCompanyId) return;
                  navigate(`/company/${encodeURIComponent(activeCompanyId)}/integrations`);
                }}
                disabled={!activeCompanyId || !isNavDrawerOpen}
              >
                <Plug className="nav-rail-icon" aria-hidden="true" />
                Integrations
              </button>
              <button
                type="button"
                className={`nav-rail-link ${activeNavKey === 'settings' ? 'is-active' : ''}`}
                onClick={() => {
                  if (!activeCompanyId) return;
                  navigate(`/company/${encodeURIComponent(activeCompanyId)}/settings/overview`);
                }}
                disabled={!activeCompanyId || !isNavDrawerOpen}
              >
                <Building2 className="nav-rail-icon" aria-hidden="true" />
                Company Settings
              </button>
            </div>
          </div>

          <div className="nav-rail-section">
            <div className="nav-rail-section-title">Support</div>
            <div className="nav-rail-links">
              <button type="button" className="nav-rail-link" onClick={() => { notify('FAQ is coming soon.', 'info'); }} disabled={!isNavDrawerOpen}>
                <HelpCircle className="nav-rail-icon" aria-hidden="true" />
                FAQ
              </button>
              <button type="button" className="nav-rail-link" onClick={() => { notify('Contact Support is coming soon.', 'info'); }} disabled={!isNavDrawerOpen}>
                <HelpCircle className="nav-rail-icon" aria-hidden="true" />
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        <div className="app-shell-content">
          <div className="app-root">
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
            element={
              <main className="app-main">
                <section className="card">
                  <div className="card-header">
                    <div>
                      <h1 className="card-title">Profile</h1>
                      <p className="card-subtitle">Account and session details.</p>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ color: 'var(--ink-500)', fontSize: '0.9rem' }}>{session?.user?.email || ''}</div>
                  </div>
                </section>
              </main>
            }
          />

          <Route
            path="/company/:companyId/dashboard"
            element={
              <main className="app-main">
                <section className="card dashboard-card">
                  <div className="card-header card-header-compact">
                    <div>
                      <h2 className="card-title">{activeCompany?.companyName ?? 'Company'} Dashboard</h2>
                      <p className="card-subtitle">Overview & system health.</p>
                    </div>
                  </div>
                  <div className="dashboard-grid">
                    <div className="metric-card metric-card--primary">
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
                </section>
              </main>
            }
          />

          <Route
            path="/company/:companyId/generate"
            element={
              <main className="app-main">
                <section className="card generator-card">
                  <div className="settings-header generator-header">
                    <div>
                      <h2>Content Generator</h2>
                      <p>Create captions and content drafts for your calendar.</p>
                    </div>
                  </div>

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
                              <option value="Promo">Promo</option>
                              <option value="Educational">Educational</option>
                              <option value="Story">Story</option>
                              <option value="Testimonial">Testimonial</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="field-label">Target Audience</label>
                            <input
                              type="text"
                              name="targetAudience"
                              placeholder="e.g., Startup Founders"
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
                </section>
              </main>
            }
          />

          <Route
            path="/company/:companyId/calendar"
            element={
              <main className="app-main">
                <section className="card card-secondary calendar-card">
                  <div className="card-header card-header-compact" style={{ alignItems: 'center' }}>
                    <h2 className="card-title">Content Calendar</h2>
                    <div className="calendar-controls">
                      <div className="calendar-search-group">
                        <input
                          type="search"
                          className="field-input calendar-search-input"
                          placeholder="Search..."
                          value={calendarSearch}
                          onChange={(e) => setCalendarSearch(e.target.value)}
                        />
                        <button type="button" className="btn btn-primary btn-sm">
                          Search
                        </button>
                        <select
                          className="field-input select-input calendar-filter-select"
                          value={calendarStatusFilter}
                          onChange={(e) => setCalendarStatusFilter(e.target.value)}
                        >
                          {calendarStatusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === 'all' ? 'All statuses' : opt}
                            </option>
                          ))}
                        </select>
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
                            <th className="calendar-col calendar-col--primary calendar-col--theme">Theme / Content</th>
                            <th className="calendar-col calendar-col--muted">Brand / Promo</th>
                            <th className="calendar-col">Channel / Target</th>
                            <th className="calendar-col">Primary / CTA</th>
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
                              <td className="calendar-cell calendar-cell--theme">
                                <div className="calendar-cell-stack">
                                  <span className="calendar-cell-title">{row.theme ?? ''}</span>
                                  <span className="calendar-cell-meta">{row.contentType ?? ''}</span>
                                </div>
                              </td>
                              <td className="calendar-cell">
                                <div className="calendar-cell-stack calendar-cell-stack--muted">
                                  <span className="calendar-cell-meta">{row.brandHighlight ?? ''}</span>
                                  <span className="calendar-cell-meta">
                                    {[row.crossPromo, row.promoType].filter(Boolean).join(' • ')}
                                  </span>
                                </div>
                              </td>
                              <td className="calendar-cell">
                                <div className="calendar-cell-stack">
                                  <span className="calendar-cell-title">{row.channels ?? ''}</span>
                                  <span className="calendar-cell-meta">{row.targetAudience ?? ''}</span>
                                </div>
                              </td>
                              <td className="calendar-cell">
                                <div className="calendar-cell-stack">
                                  <span className="calendar-cell-title">{row.primaryGoal ?? ''}</span>
                                  <span className="calendar-cell-meta">{row.cta ?? ''}</span>
                                </div>
                              </td>
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
                                          const proceed = await requestConfirm({
                                            title: 'Generate caption for this item?',
                                            description: "You're about to trigger caption generation for this content item.",
                                            confirmLabel: 'Generate caption',
                                            cancelLabel: 'Keep status',
                                          });
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
                                                  body: JSON.stringify(buildGeneratePayload(row)),
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </main>
            }
          />

          <Route
            path="/company/:companyId/brand"
            element={<BrandRedirect />}
          />

          <Route
            path="/company/:companyId/integrations"
            element={
              <main className="app-main">
                <section className="card">
                  <div className="card-header">
                    <div>
                      <h1 className="card-title">Integrations</h1>
                      <p className="card-subtitle">System connectivity.</p>
                    </div>
                  </div>
                  <div className="empty-state">
                    <p>Coming soon.</p>
                  </div>
                </section>
              </main>
            }
          />

          <Route
            path="/company/:companyId/settings/overview"
            element={
              <CompanySettingsShell
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
                newCollaboratorEmail={newCollaboratorEmail}
                setNewCollaboratorEmail={setNewCollaboratorEmail}
                handleAddCollaborator={handleAddCollaborator}
                handleRemoveCollaborator={handleRemoveCollaborator}
              />
            }
          />
          <Route
            path="/company/:companyId/settings/brand-intelligence"
            element={
              <CompanySettingsShell
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
                sendBrandWebhook={sendBrandWebhook}
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
                newCollaboratorEmail={newCollaboratorEmail}
                setNewCollaboratorEmail={setNewCollaboratorEmail}
                handleAddCollaborator={handleAddCollaborator}
                handleRemoveCollaborator={handleRemoveCollaborator}
              />
            }
          />
          <Route
            path="/company/:companyId/settings/team"
            element={
              <CompanySettingsShell
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
                newCollaboratorEmail={newCollaboratorEmail}
                setNewCollaboratorEmail={setNewCollaboratorEmail}
                handleAddCollaborator={handleAddCollaborator}
                handleRemoveCollaborator={handleRemoveCollaborator}
              />
            }
          />
          <Route
            path="/company/:companyId/settings/integrations"
            element={
              <CompanySettingsShell
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
                newCollaboratorEmail={newCollaboratorEmail}
                setNewCollaboratorEmail={setNewCollaboratorEmail}
                handleAddCollaborator={handleAddCollaborator}
                handleRemoveCollaborator={handleRemoveCollaborator}
              />
            }
          />
            </Routes>
          </div>
        </div>

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

          {isCsvModalOpen && (
            <div className="modal-backdrop">
              <div className="modal modal-copy">
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">Export CSV</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleExportCsv();
                  }}
                >
                  <div className="modal-body copy-modal-body">
                    <p className="modal-description">
                      Choose which rows and fields you want to export. Your CSV will match the order below.
                    </p>
                    <div className="csv-scope">
                      <label className="copy-field">
                        <input
                          type="radio"
                          name="csvScope"
                          checked={csvScope === 'selected'}
                          onChange={() => setCsvScope('selected')}
                        />
                        <span>Selected rows</span>
                      </label>
                      <label className="copy-field">
                        <input
                          type="radio"
                          name="csvScope"
                          checked={csvScope === 'all'}
                          onChange={() => setCsvScope('all')}
                        />
                        <span>All rows</span>
                      </label>
                    </div>
                    <div className="copy-fields">
                      {csvFieldDefinitions.map((field) => (
                        <label key={field.key} className="copy-field">
                          <input
                            type="checkbox"
                            checked={!!csvFieldSelection[field.key]}
                            onChange={(event) =>
                              setCsvFieldSelection((prev) => ({
                                ...prev,
                                [field.key]: event.target.checked,
                              }))
                            }
                          />
                          <span>{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setIsCsvModalOpen(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Export CSV
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isCopyModalOpen && (
            <div className="modal-backdrop">
              <div
                className="modal modal-copy"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleCopySpreadsheet();
                  }
                }}
              >
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">Copy content for spreadsheet</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCopyModalOpen(false);
                      setCopySuccessMessage('');
                    }}
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleCopySpreadsheet();
                  }}
                >
                  <div className="modal-body copy-modal-body">
                    <p className="modal-description">
                      Copy your selected content in a spreadsheet-safe format. Emojis, line breaks, and formatting will
                      be preserved.
                    </p>
                    <div className="copy-fields">
                      {copyFieldDefinitions.map((field) => (
                        <label key={field.key} className="copy-field">
                          <input
                            type="checkbox"
                            checked={!!copyFieldSelection[field.key]}
                            onChange={(event) =>
                              setCopyFieldSelection((prev) => ({
                                ...prev,
                                [field.key]: event.target.checked,
                              }))
                            }
                          />
                          <span>{field.label}</span>
                        </label>
                      ))}
                    </div>
                    {copySuccessMessage && <div className="copy-success">{copySuccessMessage}</div>}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCopyModalOpen(false);
                        setCopySuccessMessage('');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Copy to clipboard
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isDraftModalOpen && selectedRow && (
            <div className="modal-backdrop modal-backdrop-top">
              <div className="modal modal-wide content-modal draft-publish-modal">
                <div className="modal-header content-modal-header">
                  <div className="content-modal-title">
                    <h2>Draft & publish content</h2>
                    <p>
                      Review the final content and decide how you’d like to proceed. You can save this as a draft or mark
                      it as ready for publishing.
                    </p>
                  </div>
                  <button type="button" className="modal-close" onClick={() => setIsDraftModalOpen(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body content-modal-body draft-publish-body">
                  <section className="draft-section">
                    <div className="section-title-row">
                      <h3 className="section-title">Content summary</h3>
                    </div>
                    <div className="draft-summary-grid">
                      <div>
                        <div className="draft-summary-label">Brand / Company</div>
                        <div className="draft-summary-value">{activeCompany?.companyName ?? '—'}</div>
                      </div>
                      <div>
                        <div className="draft-summary-label">Channels</div>
                        <div className="draft-summary-value">
                          {Array.isArray(selectedRow.channels) && selectedRow.channels.length
                            ? selectedRow.channels.join(', ')
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="draft-summary-block">
                      <div className="draft-summary-header">
                        <span>Final caption</span>
                        <button type="button" className="copy-btn" onClick={() => handleCopy('finalCaption', selectedRow.finalCaption)}>
                          {copiedField === 'finalCaption' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="content-box content-box--scroll">{selectedRow.finalCaption ?? ''}</div>
                    </div>
                    <div className="draft-summary-grid">
                      <div>
                        <div className="draft-summary-header">
                          <span>Final hashtags</span>
                          <button type="button" className="copy-btn" onClick={() => handleCopy('finalHashtags', selectedRow.finalHashtags)}>
                            {copiedField === 'finalHashtags' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="content-box content-box--scroll">{selectedRow.finalHashtags ?? ''}</div>
                      </div>
                      <div>
                        <div className="draft-summary-header">
                          <span>Final CTA</span>
                          <button type="button" className="copy-btn" onClick={() => handleCopy('finalCTA', selectedRow.finalCTA)}>
                            {copiedField === 'finalCTA' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="content-box content-box--scroll">{selectedRow.finalCTA ?? ''}</div>
                      </div>
                    </div>
                    <div className="draft-summary-block">
                      <div className="draft-summary-header">
                        <span>Attached images</span>
                        <label className="btn btn-secondary btn-sm draft-upload-btn">
                          {isUploadingDesigns ? 'Uploading…' : 'Upload images'}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(event) => {
                              void handleUploadDesigns(event.target.files);
                              event.currentTarget.value = '';
                            }}
                            disabled={isUploadingDesigns}
                            className="draft-upload-input"
                          />
                        </label>
                      </div>
                      <div className="draft-image-preview">
                        {(() => {
                          const attached = getAttachedDesignUrls(selectedRow);
                          if (attached.length) {
                            return (
                              <div className="draft-image-grid">
                                {attached.map((url, index) => (
                                  <img key={`${url}-${index}`} src={url} alt={`Design ${index + 1}`} />
                                ))}
                              </div>
                            );
                          }
                          if (getImageGeneratedUrl(selectedRow)) {
                            const imageUrl = getImageGeneratedUrl(selectedRow);
                            const separator = imageUrl?.includes('?') ? '&' : '?';
                            return <img src={`${imageUrl}${separator}v=${imagePreviewNonce}`} alt="Generated" />;
                          }
                          return <div className="draft-preview-placeholder">No images attached yet</div>;
                        })()}
                      </div>
                    </div>
                  </section>

                  <section className="draft-section">
                    <div className="section-title-row">
                      <h3 className="section-title">Platform readiness</h3>
                    </div>
                    <div className="draft-readiness">
                      <div className="draft-summary-label">Selected platforms</div>
                      <div className="draft-summary-value">
                        {Array.isArray(selectedRow.channels) && selectedRow.channels.length
                          ? selectedRow.channels.join(', ')
                          : '—'}
                      </div>
                      <div className="draft-readiness-status">Posting not scheduled yet</div>
                      <div className="draft-readiness-note">
                        Publishing to connected social accounts will be available soon.
                      </div>
                    </div>
                  </section>

                  <section className="draft-section">
                    <div className="section-title-row">
                      <h3 className="section-title">Publish intent</h3>
                    </div>
                    <div className="draft-intent-options">
                      <label className={`draft-intent-card ${draftPublishIntent === 'draft' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="draftIntent"
                          checked={draftPublishIntent === 'draft'}
                          onChange={() => setDraftPublishIntent('draft')}
                        />
                        <div>
                          <div className="draft-intent-title">Save as draft</div>
                          <div className="draft-intent-copy">
                            Keep this content saved and editable. You can publish it later.
                          </div>
                        </div>
                      </label>
                      <label className={`draft-intent-card ${draftPublishIntent === 'ready' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="draftIntent"
                          checked={draftPublishIntent === 'ready'}
                          onChange={() => setDraftPublishIntent('ready')}
                        />
                        <div>
                          <div className="draft-intent-title">Mark as ready to publish</div>
                          <div className="draft-intent-copy">
                            This content will be marked as approved and ready for publishing. Publishing can be scheduled later.
                          </div>
                        </div>
                      </label>
                    </div>
                  </section>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsDraftModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleDraftPublishIntent}>
                    {draftPublishIntent === 'ready' ? 'Mark as ready' : 'Save draft'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  <div className={`bulk-content ${showPreview ? 'bulk-content--preview' : 'bulk-content--paste'}`}>
                    <div className="bulk-paste-panel">
                      <p className="modal-description">
                        Paste rows from your sheet below. We’ll format everything and show a preview before anything is
                        imported.
                      </p>
                      <textarea
                        rows={6}
                        value={bulkText}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBulkText(value);
                        }}
                        className="bulk-textarea"
                        placeholder="Paste rows copied from Google Sheets or Excel"
                        spellCheck={false}
                      />
                    </div>
                    {showPreview && bulkPreview.length > 0 && (
                      <div className="bulk-preview">
                        <div className="bulk-preview-title">Here’s how your data will be imported</div>
                        <div className="bulk-preview-table-wrapper">
                          <table className="bulk-preview-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Brand highlight</th>
                                <th>Cross promo</th>
                                <th>Theme</th>
                                <th>Content type</th>
                                <th>Channels</th>
                                <th>Target audience</th>
                                <th>Primary goal</th>
                                <th>CTA</th>
                                <th>Promo type</th>
                              </tr>
                            </thead>
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
                  {showPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Back to paste
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
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!bulkText.trim()}
                      onClick={() => {
                        setBulkPreview(parseBulkText(bulkText));
                        setShowPreview(true);
                      }}
                    >
                      Preview import
                    </button>
                  )}
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
                <span className="status-pill status-pill--muted">
                  {getStatusValue(selectedRow.status) || 'Draft'}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (!selectedRow?.finalCaption) {
                      notify('Add a final caption before preparing this content for publishing.', 'error');
                      return;
                    }
                    setDraftPublishIntent('draft');
                    setIsDraftModalOpen(true);
                  }}
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
                  <div>
                    <h3 className="section-title">Inputs</h3>
                    <p className="section-subtitle">What was provided for generation.</p>
                  </div>
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
                  <div>
                    <h3 className="section-title">AI-Generated Outputs</h3>
                    <p className="section-subtitle">What the system generated for review.</p>
                  </div>
                </div>
                <div className="content-grid">
                  <div className="content-card content-card--primary">
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
                    <div className="content-box content-box--scroll">{selectedRow.captionOutput ?? ''}</div>
                  </div>

                  <div className="content-card content-card--secondary">
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
                    <div className="content-box content-box--scroll">{selectedRow.ctaOuput ?? ''}</div>
                  </div>

                  <div className="content-card content-card--secondary">
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
                    <div className="content-box content-box--scroll">{selectedRow.hastagsOutput ?? ''}</div>
                  </div>
                </div>
              </div>

              <div className="section content-section section-final">
                <div className="section-title-row">
                  <div>
                    <h3 className="section-title">Review & Final Approval</h3>
                    <p className="section-subtitle">What will ship after human approval.</p>
                  </div>
                </div>
                <div className="content-grid">
                  <div className="content-card content-card--secondary">
                    <div className="content-card-header">
                      <div className="content-card-title">Review Decision</div>
                    </div>
                    <div className="content-box content-box--scroll">{selectedRow.reviewDecision ?? ''}</div>
                  </div>
                  <div className="content-card content-card--secondary">
                    <div className="content-card-header">
                      <div className="content-card-title">Review Notes</div>
                    </div>
                    <div className="content-box content-box--scroll">{selectedRow.reviewNotes ?? ''}</div>
                  </div>

                  <div className="content-card content-card--final">
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
                    <div className="content-box content-box--final">{selectedRow.finalCaption ?? ''}</div>
                  </div>
                  <div className="content-card content-card--final">
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
                    <div className="content-box content-box--final">{selectedRow.finalCTA ?? ''}</div>
                  </div>
                  <div className="content-card content-card--final">
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
                    <div className="content-box content-box--final">{selectedRow.finalHashtags ?? ''}</div>
                  </div>
                </div>
              </div>

              <details className="section content-section section-system" open={false}>
                <summary className="section-title-row">
                  <div>
                    <h3 className="section-title section-title--muted">System / Internal</h3>
                    <p className="section-subtitle section-subtitle--muted">Internal references and metadata.</p>
                  </div>
                </summary>
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
              </details>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!selectedRow) return;
                  const proceed = await requestConfirm({
                    title: 'Generate caption for this item?',
                    description: "You're about to trigger caption generation for this content item.",
                    confirmLabel: 'Generate caption',
                    cancelLabel: 'Go back',
                  });
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
                      body: JSON.stringify(buildGeneratePayload(selectedRow)),
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
                  const proceed = await requestConfirm({
                    title: 'Send this item for revision?',
                    description: "You're about to send this content item for AI revision.",
                    confirmLabel: 'Send for revision',
                    cancelLabel: 'Keep item',
                  });
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
                  ['approved', 'design completed'].includes(
                    getStatusValue(selectedRow.status).trim().toLowerCase(),
                  )
                    ? 'primary'
                    : 'secondary'
                } btn-sm`}
                title="Generate image (coming soon)"
                disabled={
                  !['approved', 'design completed'].includes(
                    getStatusValue(selectedRow.status).trim().toLowerCase(),
                  )
                }
                onClick={() => {
                  if (
                    !['approved', 'design completed'].includes(
                      getStatusValue(selectedRow.status).trim().toLowerCase(),
                    )
                  )
                    return;
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
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setDmpDraft(selectedRow.dmp ?? '');
                            setIsEditingDmp(true);
                          }}
                        >
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
                    const proceed = await requestConfirm({
                      title: 'Replace this image?',
                      description:
                        "You're about to generate a new image for this content item. The current preview will be replaced once finished.",
                      confirmLabel: 'Generate new image',
                      cancelLabel: 'Keep current image',
                    });
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

      </div>

      {toast && (
        <div className={`toast toast--${toast.tone || 'info'}`} role="status">
          {toast.message}
        </div>
      )}

      {isConfirmOpen && confirmConfig && (
        <div className="modal-backdrop confirm-backdrop">
          <div className="modal confirm-modal">
            <div className="modal-header confirm-header">
              <h2 className="modal-title">{confirmConfig.title}</h2>
            </div>
            <div className="modal-body confirm-body">
              <p className="modal-description">{confirmConfig.description}</p>
            </div>
            <div className="modal-footer confirm-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => resolveConfirm(false)}>
                {confirmConfig.cancelLabel}
              </button>
              <button
                type="button"
                className={`btn btn-${confirmConfig.confirmVariant === 'danger' ? 'danger' : 'primary'} btn-sm`}
                onClick={() => resolveConfirm(true)}
              >
                {confirmConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
