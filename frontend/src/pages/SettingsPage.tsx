import React, { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';

export type CompanySettingsTab = 'overview' | 'brand-intelligence' | 'team' | 'integrations';

export type CompanySettingsShellProps = {
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
    }, [decodedId, setActiveCompanyIdWithPersistence]);

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
                            <div className="settings-section brand-intel-section">
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
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={async () => {
                                                                    const saved = await saveBrandSetup();
                                                                    if (!saved) return;
                                                                    setBrandSetupMode(null);
                                                                    setIsEditingBrandSetup(false);
                                                                }}
                                                            >
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
                            <div className="settings-section brand-intel-section">
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
                            <div className="settings-section brand-intel-section">
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
