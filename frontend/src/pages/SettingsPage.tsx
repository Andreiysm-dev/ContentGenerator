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
    activeBrandRuleEdit: 'pack' | 'capabilities' | 'writer' | 'reviewer' | 'visual' | null;
    brandRuleDraft: { pack: string; capabilities: string; writer: string; reviewer: string; visual: string };
    setBrandRuleDraft: Dispatch<
        SetStateAction<{ pack: string; capabilities: string; writer: string; reviewer: string; visual: string }>
    >;
    startBrandRuleEdit: (key: 'pack' | 'capabilities' | 'writer' | 'reviewer' | 'visual') => void;
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

    const TabLink = ({
        to,
        id,
        children,
    }: {
        to: string;
        id: CompanySettingsTab;
        children: React.ReactNode;
    }) => (
        <NavLink
            to={to}
            onClick={() => setPressedTab(id)}
            className={({ isActive }) => {
                const base =
                    'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-bold transition ' +
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2';
                const active =
                    'bg-[#3fa9f5]/10 text-[#3fa9f5] border border-[#3fa9f5]/20';
                const inactive =
                    'bg-transparent text-slate-800/80 border border-transparent hover:text-[#3fa9f5] hover:-translate-y-[1px]';
                const pressed = pressedTab === id ? ' scale-[0.99]' : '';
                return `${base} ${isActive ? active : inactive}${pressed}`;
            }}
        >
            {children}
        </NavLink>
    );

    const Card = ({
        title,
        subtitle,
        action,
        children,
        className = '',
    }: {
        title?: string;
        subtitle?: string;
        action?: React.ReactNode;
        children: React.ReactNode;
        className?: string;
    }) => (
        <div
            className={
                'rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_22px_rgba(11,38,65,0.08)] ' +
                'p-4 sm:p-5 ' +
                className
            }
        >
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

    const SectionTitle = ({
        children,
    }: {
        children: React.ReactNode;
    }) => (
        <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            {children}
        </div>
    );

    const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input
            {...props}
            className={
                'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 ' +
                'shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15 ' +
                (props.className ?? '')
            }
        />
    );

    const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
        <textarea
            {...props}
            className={
                'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 ' +
                'shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15 ' +
                (props.className ?? '')
            }
        />
    );

    const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
        <select
            {...props}
            className={
                'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 ' +
                'shadow-sm outline-none transition focus:border-[#3fa9f5]/50 focus:ring-2 focus:ring-[#3fa9f5]/15 ' +
                (props.className ?? '')
            }
        />
    );

    const Pill = ({
        active,
        onClick,
        children,
    }: {
        active: boolean;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={
                'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ' +
                (active
                    ? 'border-[#3fa9f5]/50 bg-[#3fa9f5]/15 text-[#2f97e6]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#3fa9f5]/30 hover:bg-[#3fa9f5]/5')
            }
        >
            {children}
        </button>
    );

    const StatusPill = ({ tone, children }: { tone: 'positive' | 'warning' | 'muted'; children: React.ReactNode }) => {
        const cls =
            tone === 'positive'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-900'
                : tone === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-900'
                    : 'border-slate-300/60 bg-slate-100 text-slate-700';
        return (
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
                {children}
            </span>
        );
    };

    const Button = ({
        variant,
        children,
        ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant: 'primary' | 'secondary' | 'ghost' }) => {
        const base =
            'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition ' +
            'active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa9f5]/25 focus-visible:ring-offset-2 ' +
            'disabled:opacity-40 disabled:cursor-not-allowed';
        const cls =
            variant === 'primary'
                ? 'bg-[#3fa9f5] text-white hover:bg-[#2f97e6]'
                : variant === 'ghost'
                    ? 'bg-transparent text-[#2f97e6] border border-[#3fa9f5]/40 hover:bg-[#3fa9f5]/10'
                    : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50';
        return (
            <button {...rest} className={`${base} ${cls} ${rest.className ?? ''}`}>
                {children}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="px-4 sm:px-6 lg:px-7 py-5 sm:py-6">
                <div className="mx-auto w-full max-w-[1120px]">
                    {/* Tabs */}
                    <div className="sticky top-3 z-10">
                        <div className="relative flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/90 p-2 shadow-[0_12px_26px_rgba(11,38,65,0.06)] backdrop-blur">
                            <TabLink to={`${companyUrlBase}/overview`} id="overview">
                                Overview
                            </TabLink>
                            <TabLink to={`${companyUrlBase}/brand-intelligence`} id="brand-intelligence">
                                Brand Intelligence
                            </TabLink>
                            <TabLink to={`${companyUrlBase}/team`} id="team">
                                Team
                            </TabLink>
                            <TabLink to={`${companyUrlBase}/integrations`} id="integrations">
                                Integrations
                            </TabLink>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-slate-900/5" />
                        </div>
                    </div>

                    {/* Panel */}
                    <div key={tab} className="pt-4 animate-[panelFade_160ms_ease-out]">
                        {tab === 'overview' && (
                            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                                {/* Header */}
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div>
                                        <h1 className="text-xl font-extrabold text-slate-900">Overview</h1>
                                        <p className="mt-1 text-sm text-slate-600 max-w-[72ch]">
                                            Key configuration signals for this company. Review Brand Intelligence before generating content at scale.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                                    <div className="space-y-4">
                                        {/* Stats */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand Intelligence</div>
                                                <div className="mt-2 text-base font-extrabold text-slate-900">
                                                    <StatusPill tone={hasBrandIntelligenceConfigured ? 'positive' : 'warning'}>
                                                        {hasBrandIntelligenceConfigured ? 'Configured' : 'Not configured'}
                                                    </StatusPill>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Setup type</div>
                                                <div className="mt-2 text-base font-extrabold text-slate-900">
                                                    {resolvedBrandSetupType ? String(resolvedBrandSetupType) : '—'}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team members</div>
                                                <div className="mt-2 text-base font-extrabold text-slate-900">
                                                    {collaborators.length ? collaborators.length : '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Company profile */}
                                        <Card
                                            title="Company profile"
                                            subtitle="Used across AI outputs and collaboration surfaces."
                                            className="bg-slate-50/60"
                                        >
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-700">Company Name</label>
                                                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                                </div>

                                                <div className="space-y-1.5 sm:col-span-2">
                                                    <label className="text-xs font-bold text-slate-700">Company Description</label>
                                                    <Textarea
                                                        rows={3}
                                                        value={companyDescription}
                                                        onChange={(e) => setCompanyDescription(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Right rail */}
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
                                                    <Button
                                                        variant="primary"
                                                        type="button"
                                                        onClick={() => navigate(`${companyUrlBase}/brand-intelligence`)}
                                                    >
                                                        {hasBrandIntelligenceConfigured ? 'Review Brand Intelligence' : 'Set up Brand Intelligence'}
                                                    </Button>
                                                    <Button variant="secondary" type="button" onClick={() => navigate(`${companyUrlBase}/team`)}>
                                                        Manage team
                                                    </Button>
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

                        {tab === 'brand-intelligence' && (
                            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                                {/* Header */}
                                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div>
                                        <h1 className="text-xl font-extrabold text-slate-900">Brand Intelligence</h1>
                                        <p className="mt-1 text-sm text-slate-600 max-w-[78ch]">
                                            Controls AI behavior for this company—tone, brand rules, and compliance guardrails. Designed to be guided and reversible.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                                        <StatusPill tone={hasBrandIntelligenceConfigured ? 'positive' : 'warning'}>
                                            {hasBrandIntelligenceConfigured ? 'Configured' : 'Not configured'}
                                        </StatusPill>

                                        {hasBrandIntelligenceConfigured && (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    type="button"
                                                    onClick={() => {
                                                        setBrandSetupMode(
                                                            resolvedBrandSetupType === 'custom' ? 'custom' : (resolvedBrandSetupType || 'quick'),
                                                        );
                                                        setBrandSetupStep(1);
                                                        setIsEditingBrandSetup(true);
                                                    }}
                                                >
                                                    Answer again
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    type="button"
                                                    onClick={async () => {
                                                        await sendBrandWebhook(buildFormAnswer());
                                                    }}
                                                >
                                                    Regenerate
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            variant="secondary"
                                            type="button"
                                            onClick={() => loadBrandKB(false, true)}
                                        >
                                            Refresh
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                                    <div className="space-y-4">
                                        {(brandKbId && !brandIntelligenceReady && !brandSetupMode) && (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Generation</div>
                                                    <div className="mt-2">
                                                        <StatusPill tone="warning">In progress</StatusPill>
                                                    </div>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next</div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-900">Wait for generation, then refresh</div>
                                                </div>
                                            </div>
                                        )}

                                        {(brandIntelligenceReady && !brandSetupMode) && (
                                            <div className="space-y-4">
                                                {/* Rules grid */}
                                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                    {/* Brand Pack */}
                                                    <Card
                                                        title="Brand Pack"
                                                        subtitle="High-level identity, voice, and positioning."
                                                        action={
                                                            <Button variant="secondary" type="button" onClick={() => startBrandRuleEdit('pack')}>
                                                                Edit
                                                            </Button>
                                                        }
                                                    >
                                                        {activeBrandRuleEdit === 'pack' ? (
                                                            <>
                                                                <Textarea
                                                                    rows={8}
                                                                    value={brandRuleDraft.pack}
                                                                    onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, pack: e.target.value }))}
                                                                />
                                                                <div className="mt-3 flex justify-end gap-2">
                                                                    <Button variant="secondary" type="button" onClick={cancelBrandRuleEdit}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button variant="primary" type="button" onClick={saveBrandRuleEdit}>
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                                                {brandPack || '—'}
                                                            </div>
                                                        )}
                                                    </Card>

                                                    {/* Capabilities */}
                                                    <Card
                                                        title="Capabilities"
                                                        subtitle="What we can claim, do, and emphasize."
                                                        action={
                                                            <Button variant="secondary" type="button" onClick={() => startBrandRuleEdit('capabilities')}>
                                                                Edit
                                                            </Button>
                                                        }
                                                    >
                                                        {activeBrandRuleEdit === 'capabilities' ? (
                                                            <>
                                                                <Textarea
                                                                    rows={8}
                                                                    value={brandRuleDraft.capabilities}
                                                                    onChange={(e) =>
                                                                        setBrandRuleDraft((prev) => ({ ...prev, capabilities: e.target.value }))
                                                                    }
                                                                />
                                                                <div className="mt-3 flex justify-end gap-2">
                                                                    <Button variant="secondary" type="button" onClick={cancelBrandRuleEdit}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button variant="primary" type="button" onClick={saveBrandRuleEdit}>
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                                                {brandCapability || '—'}
                                                            </div>
                                                        )}
                                                    </Card>

                                                    {/* Writer prompt */}
                                                    <Card
                                                        title="Writer prompt"
                                                        subtitle="System instructions used for generation."
                                                        action={
                                                            <Button variant="secondary" type="button" onClick={() => startBrandRuleEdit('writer')}>
                                                                Edit
                                                            </Button>
                                                        }
                                                    >
                                                        {activeBrandRuleEdit === 'writer' ? (
                                                            <>
                                                                <Textarea
                                                                    rows={8}
                                                                    value={brandRuleDraft.writer}
                                                                    onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, writer: e.target.value }))}
                                                                />
                                                                <div className="mt-3 flex justify-end gap-2">
                                                                    <Button variant="secondary" type="button" onClick={cancelBrandRuleEdit}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button variant="primary" type="button" onClick={saveBrandRuleEdit}>
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                                                {aiWriterSystemPrompt || '—'}
                                                            </div>
                                                        )}
                                                    </Card>

                                                    {/* Reviewer prompt */}
                                                    <Card
                                                        title="Reviewer prompt"
                                                        subtitle="Used for review and QA."
                                                        action={
                                                            <Button variant="secondary" type="button" onClick={() => startBrandRuleEdit('reviewer')}>
                                                                Edit
                                                            </Button>
                                                        }
                                                    >
                                                        {activeBrandRuleEdit === 'reviewer' ? (
                                                            <>
                                                                <Textarea
                                                                    rows={8}
                                                                    value={brandRuleDraft.reviewer}
                                                                    onChange={(e) =>
                                                                        setBrandRuleDraft((prev) => ({ ...prev, reviewer: e.target.value }))
                                                                    }
                                                                />
                                                                <div className="mt-3 flex justify-end gap-2">
                                                                    <Button variant="secondary" type="button" onClick={cancelBrandRuleEdit}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button variant="primary" type="button" onClick={saveBrandRuleEdit}>
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                                                {aiWriterUserPrompt || '—'}
                                                            </div>
                                                        )}
                                                    </Card>
                                                </div>

                                                {/* Divider */}
                                                <div className="my-6 h-px w-full bg-slate-200/70" />

                                                {/* Visual rules */}
                                                <div className="mb-2">
                                                    <div className="text-base font-extrabold text-slate-900">Visual &amp; Image Rules</div>
                                                    <div className="mt-1 text-sm text-slate-600">
                                                        Controls how AI generates images for this company.
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                    <div className="lg:col-span-2">
                                                        <Card
                                                            title="Visual Identity"
                                                            subtitle="Describe the colors, lighting, and design guardrails for AI image generation."
                                                            action={
                                                                <Button variant="secondary" type="button" onClick={() => startBrandRuleEdit('visual')}>
                                                                    Edit
                                                                </Button>
                                                            }
                                                        >
                                                            {activeBrandRuleEdit === 'visual' ? (
                                                                <>
                                                                    <Textarea
                                                                        rows={8}
                                                                        value={brandRuleDraft.visual}
                                                                        onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, visual: e.target.value }))}
                                                                    />
                                                                    <div className="mt-3 flex justify-end gap-2">
                                                                        <Button variant="secondary" type="button" onClick={cancelBrandRuleEdit}>
                                                                            Cancel
                                                                        </Button>
                                                                        <Button variant="primary" type="button" onClick={saveBrandRuleEdit}>
                                                                            Save
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                                                    {systemInstruction || '—'}
                                                                </div>
                                                            )}
                                                        </Card>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!hasBrandIntelligenceConfigured && !brandSetupMode && (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {[
                                                    { k: 'Safe defaults', v: 'Enabled' },
                                                    { k: 'Impact', v: 'Writing + review prompts' },
                                                    { k: 'Reversible', v: 'Edit inputs anytime' },
                                                ].map((x) => (
                                                    <div key={x.k} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{x.k}</div>
                                                        <div className="mt-2 text-sm font-extrabold text-slate-900">{x.v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!isEditingBrandSetup && !brandSetupMode && !brandIntelligenceReady && (
                                            <Card
                                                title="Set up your brand intelligence"
                                                subtitle="Choose how detailed you want to be. You can refine this anytime."
                                                className="bg-white"
                                            >
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    <button
                                                        type="button"
                                                        className="rounded-2xl border border-[#3fa9f5]/50 bg-white p-4 text-left shadow-[0_14px_30px_rgba(63,169,245,0.18)] transition hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(11,38,65,0.12)]"
                                                        onClick={() => {
                                                            setBrandSetupMode('quick');
                                                            setBrandSetupLevel('quick');
                                                            setBrandSetupStep(1);
                                                            setIsEditingBrandSetup(true);
                                                        }}
                                                    >
                                                        <div className="text-sm font-extrabold text-slate-900">Quick Setup (Recommended)</div>
                                                        <div className="mt-1 text-xs text-slate-600">5–7 minutes · Best for agencies &amp; multi-brand managers</div>
                                                        <div className="mt-1 text-sm text-slate-700">Safe defaults + smart inference</div>
                                                        <div className="mt-3 text-xs font-bold text-[#2f97e6]">Start Quick Setup</div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-[2px] hover:border-[#3fa9f5]/45 hover:shadow-[0_14px_30px_rgba(11,38,65,0.12)]"
                                                        onClick={() => {
                                                            setBrandSetupMode('advanced');
                                                            setBrandSetupLevel('advanced');
                                                            setBrandSetupStep(1);
                                                            setIsEditingBrandSetup(true);
                                                        }}
                                                    >
                                                        <div className="text-sm font-extrabold text-slate-900">Advanced Setup</div>
                                                        <div className="mt-1 text-xs text-slate-600">15–20 minutes · Full control for regulated brands</div>
                                                        <div className="mt-1 text-sm text-slate-700">Unlock audience segments, pillars, CTA matrices</div>
                                                        <div className="mt-3 text-xs font-bold text-[#2f97e6]">Start Advanced Setup</div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-[2px] hover:border-[#3fa9f5]/45 hover:shadow-[0_14px_30px_rgba(11,38,65,0.12)]"
                                                        onClick={() => {
                                                            setBrandSetupMode('custom');
                                                            setBrandSetupLevel('custom');
                                                            setBrandSetupStep(0);
                                                            setIsEditingBrandSetup(true);
                                                        }}
                                                    >
                                                        <div className="text-sm font-extrabold text-slate-900">Custom (Provide Your Own)</div>
                                                        <div className="mt-1 text-xs text-slate-600">Direct megaprompt control</div>
                                                        <div className="mt-1 text-sm text-slate-700">Paste your Brand Pack, Capabilities, Writer &amp; Reviewer rules.</div>
                                                        <div className="mt-3 text-xs font-bold text-[#2f97e6]">Use Custom Setup</div>
                                                    </button>
                                                </div>
                                            </Card>
                                        )}

                                        {brandSetupMode === 'custom' && (
                                            <Card
                                                title="Custom Brand Intelligence"
                                                subtitle="Provide your own prompts and rules."
                                                action={<StatusPill tone="muted">Manual</StatusPill>}
                                            >
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700">Brand Pack</label>
                                                        <Textarea rows={4} value={brandPack} onChange={(e) => setBrandPack(e.target.value)} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700">Brand Capability</label>
                                                        <Textarea
                                                            rows={4}
                                                            value={brandCapability}
                                                            onChange={(e) => setBrandCapability(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5 sm:col-span-2">
                                                        <label className="text-xs font-bold text-slate-700">Emoji Rule</label>
                                                        <Input value={emojiRule} onChange={(e) => setEmojiRule(e.target.value)} />
                                                    </div>

                                                    <div className="space-y-1.5 sm:col-span-2">
                                                        <label className="text-xs font-bold text-slate-700">System Instruction</label>
                                                        <Textarea
                                                            rows={4}
                                                            value={systemInstruction}
                                                            onChange={(e) => setSystemInstruction(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700">Writer System Prompt</label>
                                                        <Textarea
                                                            rows={4}
                                                            value={aiWriterSystemPrompt}
                                                            onChange={(e) => setAiWriterSystemPrompt(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700">Reviewer Prompt</label>
                                                        <Textarea
                                                            rows={4}
                                                            value={aiWriterUserPrompt}
                                                            onChange={(e) => setAiWriterUserPrompt(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex justify-end">
                                                    <Button
                                                        variant="secondary"
                                                        type="button"
                                                        onClick={async () => {
                                                            await saveBrandSetup();
                                                            setBrandSetupMode(null);
                                                            setIsEditingBrandSetup(false);
                                                        }}
                                                    >
                                                        Save &amp; Exit
                                                    </Button>
                                                </div>
                                            </Card>
                                        )}

                                        {(brandSetupMode && brandSetupMode !== 'custom') && (
                                            <div className="space-y-4">
                                                {/* Step 1 */}
                                                {brandSetupMode && brandSetupStep === 1 && (
                                                    <Card
                                                        title="Brand Snapshot"
                                                        subtitle={`Step 1 of ${brandSetupMode === 'advanced' ? 4 : 3} · Estimated time: ~2 minutes`}
                                                        action={
                                                            <StatusPill tone="muted">
                                                                {brandSetupMode === 'advanced' ? 'Advanced Setup' : 'Quick Setup'}
                                                            </StatusPill>
                                                        }
                                                    >
                                                        <div className="rounded-2xl border border-[#3fa9f5]/20 bg-white p-4">
                                                            <div className="text-sm font-extrabold text-slate-900">Brand Basics</div>

                                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold text-slate-700">Brand Name</label>
                                                                    <Input value={brandBasicsName} onChange={(e) => setBrandBasicsName(e.target.value)} />
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold text-slate-700">Industry</label>
                                                                    <Select value={brandBasicsIndustry} onChange={(e) => setBrandBasicsIndustry(e.target.value)}>
                                                                        <option value="">Select industry</option>
                                                                        {!!brandBasicsIndustry && !industryOptions.includes(brandBasicsIndustry) && (
                                                                            <option value={brandBasicsIndustry}>{brandBasicsIndustry}</option>
                                                                        )}
                                                                        {industryOptions.map((option) => (
                                                                            <option key={option} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </Select>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold text-slate-700">Business Type</label>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {['B2B', 'B2C', 'Both'].map((option) => (
                                                                            <Pill key={option} active={brandBasicsType === option} onClick={() => setBrandBasicsType(option)}>
                                                                                {option}
                                                                            </Pill>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold text-slate-700">Primary Offer</label>
                                                                    <Input value={brandBasicsOffer} onChange={(e) => setBrandBasicsOffer(e.target.value)} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex justify-end gap-2">
                                                            <Button
                                                                variant="secondary"
                                                                type="button"
                                                                onClick={async () => {
                                                                    const saved = await saveBrandSetup();
                                                                    if (!saved) return;
                                                                    setBrandSetupMode(null);
                                                                    setIsEditingBrandSetup(false);
                                                                }}
                                                            >
                                                                Save &amp; Exit
                                                            </Button>
                                                            <Button variant="primary" type="button" onClick={() => setBrandSetupStep(2)}>
                                                                Continue
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                )}

                                                {/* Step 2 */}
                                                {brandSetupMode && brandSetupStep === 2 && (
                                                    <Card
                                                        title="Audience & outcomes"
                                                        subtitle={`Step 2 of ${brandSetupMode === 'advanced' ? 5 : 3} · Estimated time: ~2 minutes`}
                                                        action={
                                                            <StatusPill tone="muted">
                                                                {brandSetupMode === 'advanced' ? 'Advanced Setup' : 'Quick Setup'}
                                                            </StatusPill>
                                                        }
                                                    >
                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Primary audience role</label>
                                                                <Input
                                                                    value={audienceRole}
                                                                    onChange={(e) => setAudienceRole(e.target.value)}
                                                                    placeholder="e.g., Marketing Manager, Founder, HR Lead"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Audience industry (optional)</label>
                                                                <Input
                                                                    value={audienceIndustry}
                                                                    onChange={(e) => setAudienceIndustry(e.target.value)}
                                                                    placeholder="e.g., Healthcare, SaaS, Retail"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5 sm:col-span-2">
                                                                <label className="text-xs font-bold text-slate-700">Pain points</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {painPointOptions.map((opt) => {
                                                                        const active = audiencePainPoints.includes(opt);
                                                                        return (
                                                                            <Pill
                                                                                key={opt}
                                                                                active={active}
                                                                                onClick={() =>
                                                                                    setAudiencePainPoints((prev) => (active ? prev.filter((v) => v !== opt) : [...prev, opt]))
                                                                                }
                                                                            >
                                                                                {opt}
                                                                            </Pill>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5 sm:col-span-2">
                                                                <label className="text-xs font-bold text-slate-700">Desired outcome</label>
                                                                <Input
                                                                    value={audienceOutcome}
                                                                    onChange={(e) => setAudienceOutcome(e.target.value)}
                                                                    placeholder="e.g., book a tour, request a demo, follow for tips"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex justify-end gap-2">
                                                            <Button variant="secondary" type="button" onClick={() => setBrandSetupStep(1)}>
                                                                Back
                                                            </Button>
                                                            <Button variant="primary" type="button" onClick={() => setBrandSetupStep(3)}>
                                                                Continue
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                )}

                                                {/* Step 3 */}
                                                {brandSetupMode && brandSetupStep === 3 && (
                                                    <Card
                                                        title="Voice & guardrails"
                                                        subtitle={`Step ${brandSetupMode === 'advanced' ? 3 : 3} of ${brandSetupMode === 'advanced' ? 5 : 3} · Estimated time: ~3 minutes`}
                                                        action={
                                                            <StatusPill tone="muted">
                                                                {brandSetupMode === 'advanced' ? 'Advanced Setup' : 'Quick Setup'}
                                                            </StatusPill>
                                                        }
                                                    >
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                            {[
                                                                { label: 'Formal', value: toneFormal, set: setToneFormal },
                                                                { label: 'Energy', value: toneEnergy, set: setToneEnergy },
                                                                { label: 'Boldness', value: toneBold, set: setToneBold },
                                                            ].map((s) => (
                                                                <div key={s.label} className="space-y-2">
                                                                    <label className="text-xs font-bold text-slate-700">{s.label}</label>
                                                                    <input
                                                                        type="range"
                                                                        min={0}
                                                                        max={100}
                                                                        value={s.value}
                                                                        onChange={(e) => s.set(Number(e.target.value))}
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                            ))}

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Emoji usage</label>
                                                                <Select value={emojiUsage} onChange={(e) => setEmojiUsage(e.target.value)}>
                                                                    <option value="None">None</option>
                                                                    <option value="Light">Light</option>
                                                                    <option value="Medium">Medium</option>
                                                                    <option value="Heavy">Heavy</option>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Length</label>
                                                                <Select value={writingLength} onChange={(e) => setWritingLength(e.target.value)}>
                                                                    <option value="Short">Short</option>
                                                                    <option value="Balanced">Balanced</option>
                                                                    <option value="Long">Long</option>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">CTA strength</label>
                                                                <Select value={ctaStrength} onChange={(e) => setCtaStrength(e.target.value)}>
                                                                    <option value="Soft">Soft</option>
                                                                    <option value="Medium">Medium</option>
                                                                    <option value="Strong">Strong</option>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                                                                <label className="text-xs font-bold text-slate-700">Absolute truths</label>
                                                                <Textarea rows={3} value={absoluteTruths} onChange={(e) => setAbsoluteTruths(e.target.value)} />
                                                            </div>

                                                            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                                                                <label className="text-xs font-bold text-slate-700">No-say rules</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {noSayOptions.map((opt) => {
                                                                        const active = noSayRules.includes(opt);
                                                                        return (
                                                                            <Pill
                                                                                key={opt}
                                                                                active={active}
                                                                                onClick={() =>
                                                                                    setNoSayRules((prev) => (active ? prev.filter((v) => v !== opt) : [...prev, opt]))
                                                                                }
                                                                            >
                                                                                {opt}
                                                                            </Pill>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex justify-end gap-2">
                                                            <Button variant="secondary" type="button" onClick={() => setBrandSetupStep(2)}>
                                                                Back
                                                            </Button>
                                                            {brandSetupMode === 'advanced' ? (
                                                                <Button variant="primary" type="button" onClick={() => setBrandSetupStep(4)}>
                                                                    Continue
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="primary"
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        const saved = await saveBrandSetup();
                                                                        if (!saved) return;
                                                                        await sendBrandWebhook(buildFormAnswer());
                                                                        setBrandSetupMode(null);
                                                                        setIsEditingBrandSetup(false);
                                                                    }}
                                                                >
                                                                    Save &amp; Generate
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </Card>
                                                )}

                                                {/* Step 4 */}
                                                {brandSetupMode === 'advanced' && brandSetupStep === 4 && (
                                                    <Card
                                                        title="Advanced positioning"
                                                        subtitle="Step 4 of 5 · Estimated time: ~4 minutes"
                                                        action={<StatusPill tone="muted">Advanced Setup</StatusPill>}
                                                    >
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Positioning</label>
                                                                <Textarea rows={3} value={advancedPositioning} onChange={(e) => setAdvancedPositioning(e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Differentiators</label>
                                                                <Textarea rows={3} value={advancedDifferentiators} onChange={(e) => setAdvancedDifferentiators(e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Pillars</label>
                                                                <Textarea rows={3} value={advancedPillars} onChange={(e) => setAdvancedPillars(e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Competitors</label>
                                                                <Textarea rows={3} value={advancedCompetitors} onChange={(e) => setAdvancedCompetitors(e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-700">Proof points</label>
                                                                <Textarea rows={3} value={advancedProofPoints} onChange={(e) => setAdvancedProofPoints(e.target.value)} />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex justify-end gap-2">
                                                            <Button variant="secondary" type="button" onClick={() => setBrandSetupStep(3)}>
                                                                Back
                                                            </Button>
                                                            <Button variant="primary" type="button" onClick={() => setBrandSetupStep(5)}>
                                                                Continue
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                )}

                                                {/* Step 5 */}
                                                {brandSetupMode === 'advanced' && brandSetupStep === 5 && (
                                                    <Card
                                                        title="Visual & image identity"
                                                        subtitle="Step 5 of 5 · Estimated time: ~2 minutes"
                                                        action={<StatusPill tone="muted">Advanced Setup</StatusPill>}
                                                    >
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-slate-700">Visual Brand Identity (Image Guidelines)</label>
                                                            <Textarea
                                                                rows={8}
                                                                value={systemInstruction}
                                                                onChange={(e) => setSystemInstruction(e.target.value)}
                                                                placeholder="Describe the visual style, colors, lighting, and mood for your brand images. AI will use this to generate all photos/illustrations."
                                                            />
                                                        </div>

                                                        <div className="mt-4 flex justify-end gap-2">
                                                            <Button variant="secondary" type="button" onClick={() => setBrandSetupStep(4)}>
                                                                Back
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                type="button"
                                                                onClick={async () => {
                                                                    const saved = await saveBrandSetup();
                                                                    if (!saved) return;
                                                                    await sendBrandWebhook(buildFormAnswer());
                                                                    setBrandSetupMode(null);
                                                                    setIsEditingBrandSetup(false);
                                                                }}
                                                            >
                                                                Save &amp; Generate
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right rail */}
                                    <aside className="hidden xl:flex xl:flex-col xl:gap-3 xl:sticky xl:top-[4.5rem]">
                                        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                            <div className="text-sm font-extrabold text-slate-900">Safety + control</div>
                                            <div className="mt-2 text-sm text-slate-600">
                                                This configuration affects all AI outputs for this company.
                                                <ul className="mt-3 list-disc pl-5 space-y-1">
                                                    <li>Use safe defaults to get started</li>
                                                    <li>Edit inputs any time</li>
                                                    <li>Regeneration is rate-limited</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_8px_18px_rgba(11,38,65,0.06)]">
                                            <div className="text-sm font-extrabold text-slate-900">Recommended order</div>
                                            <div className="mt-2 text-sm text-slate-600">
                                                <ul className="mt-3 list-disc pl-5 space-y-1">
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
                            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                                <div className="mb-5">
                                    <h1 className="text-xl font-extrabold text-slate-900">Team</h1>
                                    <p className="mt-1 text-sm text-slate-600">Manage collaborators with access to this company.</p>
                                </div>

                                <Card className="bg-white" title="Collaborators" subtitle="Add teammates who can access and approve content.">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700">Add collaborator (email)</label>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <Input
                                                    type="email"
                                                    placeholder="user@example.com"
                                                    value={newCollaboratorEmail}
                                                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                                                />
                                                <Button
                                                    variant="primary"
                                                    type="button"
                                                    onClick={handleAddCollaborator}
                                                    disabled={!newCollaboratorEmail}
                                                    className="sm:w-[120px]"
                                                >
                                                    Add
                                                </Button>
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
                                                                    <div className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                                                        {c.role}
                                                                    </div>
                                                                </div>
                                                                {c.role !== 'owner' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        type="button"
                                                                        onClick={() => handleRemoveCollaborator(c.id)}
                                                                        className="self-start sm:self-auto"
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {tab === 'integrations' && (
                            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
                                <div className="mb-3">
                                    <h1 className="text-xl font-extrabold text-slate-900">Integrations</h1>
                                    <p className="mt-1 text-sm text-slate-600">Connect services used for publishing, approvals, and automation.</p>
                                </div>
                                <div className="text-sm text-slate-600">Coming soon.</div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* local keyframes */}
            <style>{`
        @keyframes panelFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
