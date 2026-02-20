import React, { useState } from "react";
import type { CompanySettingsShellProps } from "../SettingsPage";
import { Card, StatusPill, Input, Textarea, Select, Pill } from "../SettingsPage";
import { Sparkles, HelpCircle } from "lucide-react";

export function BrandCoreTab(props: CompanySettingsShellProps) {
    const {
        brandIntelligenceReady,
        brandSetupMode,
        setBrandSetupMode,
        setBrandSetupLevel,
        brandSetupStep,
        setBrandSetupStep,
        setIsEditingBrandSetup,
        loadBrandKB,
        brandKbId,
        startBrandRuleEdit,
        activeBrandRuleEdit,
        brandRuleDraft,
        setBrandRuleDraft,
        cancelBrandRuleEdit,
        saveBrandRuleEdit,
        brandPack,
        brandCapability,
        systemInstruction,
        aiWriterSystemPrompt,
        aiWriterUserPrompt,
        saveBrandSetup,
        setBrandPack,
        setBrandCapability,
        setEmojiRule,
        setSystemInstruction,
        setAiWriterSystemPrompt,
        setAiWriterUserPrompt,
        emojiRule,
        sendBrandWebhook,
        buildFormAnswer,
        // Form fields
        brandBasicsName,
        setBrandBasicsName,
        brandBasicsIndustry,
        setBrandBasicsIndustry,
        industryOptions,
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
        painPointOptions,
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
        noSayOptions,
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
        notify,
        authedFetch,
    } = props;


    const hasBrandIntelligenceConfigured = !!brandIntelligenceReady;

    // Helper to start setup
    const startSetup = (mode: "quick" | "advanced" | "custom") => {
        setBrandSetupMode(mode);
        setBrandSetupLevel(mode);
        setBrandSetupStep(mode === "custom" ? 0 : 1);
        setIsEditingBrandSetup(true);
    };

    const resolvedBrandSetupType = props.brandSetupLevel || brandSetupMode || null;

    return (
        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/90 to-[#eef4fa]/95 p-4 sm:p-5 shadow-[0_10px_22px_rgba(11,38,65,0.08)]">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                    <div className="text-xl font-bold text-slate-900">Brand</div>
                    <p className="mt-1 text-sm font-medium text-slate-600">Controls AI behavior for this company—tone, brand rules, and compliance guardrails. Designed to be guided and reversible.</p>
                </div>

                <div className="flex items-center gap-3">
                    <StatusPill tone={hasBrandIntelligenceConfigured ? "positive" : "warning"}>{hasBrandIntelligenceConfigured ? "Configured" : "Not configured"}</StatusPill>

                    {hasBrandIntelligenceConfigured && (
                        <>
                            <button
                                className="btn btn-primary btn-sm"
                                type="button"
                                onClick={() => {
                                    setBrandSetupMode(resolvedBrandSetupType === "custom" ? "custom" : resolvedBrandSetupType || "quick");
                                    setBrandSetupStep(1);
                                    setIsEditingBrandSetup(true);
                                }}
                            >
                                Answer again
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                type="button"
                                onClick={async () => {
                                    await sendBrandWebhook(buildFormAnswer());
                                }}
                            >
                                Regenerate
                            </button>
                        </>
                    )}


                    <button className="btn btn-secondary btn-sm bg-white" type="button" onClick={() => loadBrandKB(false, true)}>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                {/* Main Content Column */}
                <div className="space-y-6">
                    {/* Generation Status (if applicable) */}
                    {brandKbId && !brandIntelligenceReady && !brandSetupMode && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">GENERATION</div>
                                <StatusPill tone="warning">In progress</StatusPill>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">NEXT</div>
                                <div className="text-sm font-bold text-slate-900">Wait for generation, then refresh</div>
                            </div>
                        </div>
                    )}

                    {/* Info Cards Row */}
                    {!hasBrandIntelligenceConfigured && !brandSetupMode && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">SAFE DEFAULTS</div>
                                <div className="text-base font-extrabold text-slate-900">Enabled</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">IMPACT</div>
                                <div className="text-base font-extrabold text-slate-900">Writing + review prompts</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">REVERSIBLE</div>
                                <div className="text-base font-extrabold text-slate-900">Edit inputs anytime</div>
                            </div>
                        </div>
                    )}

                    {/* Setup Options */}
                    {!hasBrandIntelligenceConfigured && !brandSetupMode && (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                            <div className="mb-4">
                                <h3 className="text-base font-extrabold text-slate-900">Set up your brand intelligence</h3>
                                <p className="text-sm text-slate-600">Choose how detailed you want to be. You can refine this anytime.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                {/* Quick Setup */}
                                <button
                                    onClick={() => startSetup("quick")}
                                    className="group relative flex flex-col items-start rounded-xl border-2 border-[#3fa9f5] bg-blue-50 p-6 text-left transition hover:bg-blue-100 hover:shadow-lg hover:-translate-y-1"
                                >
                                    <div className="absolute top-4 right-4 rounded-full bg-[#3fa9f5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Start Here</div>
                                    <div className="text-base font-extrabold text-slate-900">Quick Setup</div>
                                    <div className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Best for 90% of users</div>
                                    <div className="mt-3 text-sm font-medium text-slate-700 leading-relaxed">
                                        Answer a few simple questions to build your brand voice instantly. We handle the complex prompting for you.
                                    </div>
                                    <div className="mt-auto pt-6 text-sm font-bold text-[#3fa9f5] group-hover:underline">Start Quick Setup →</div>
                                </button>

                                {/* Advanced Setup */}
                                <button
                                    onClick={() => startSetup("advanced")}
                                    className="group relative flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-md"
                                >
                                    <div className="text-sm font-extrabold text-slate-900">Advanced Setup</div>
                                    <div className="mt-1 text-xs text-slate-500">15–20 minutes · Full control for regulated brands</div>
                                    <div className="mt-2 text-sm font-medium text-slate-700">Unlock audience segments, pillars, CTA matrices</div>
                                    <div className="mt-auto pt-4 text-xs font-bold text-[#3fa9f5] group-hover:underline">Start Advanced Setup</div>
                                </button>

                                {/* Custom Setup */}
                                <button
                                    onClick={() => startSetup("custom")}
                                    className="group relative flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-md"
                                >
                                    <div className="text-sm font-extrabold text-slate-900">Custom (Provide Your Own)</div>
                                    <div className="mt-1 text-xs text-slate-500">Direct megaprompt control</div>
                                    <div className="mt-2 text-sm font-medium text-slate-700">Paste your Brand Pack, Capabilities, Writer & Reviewer rules.</div>
                                    <div className="mt-auto pt-4 text-xs font-bold text-[#3fa9f5] group-hover:underline">Use Custom Setup</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Custom Setup Manual Mode */}
                    {brandSetupMode === "custom" && (
                        <Card title="Custom Brand Intelligence" subtitle="Provide your own prompts and rules." action={<StatusPill tone="muted">Manual</StatusPill>}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Brand Pack</label>
                                    <Textarea rows={4} value={brandPack} onChange={(e) => setBrandPack(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Brand Capability</label>
                                    <Textarea rows={4} value={brandCapability} onChange={(e) => setBrandCapability(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-700">Emoji Rule</label>
                                    <Input value={emojiRule} onChange={(e) => setEmojiRule(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-700">System Instruction</label>
                                    <Textarea rows={4} value={systemInstruction} onChange={(e) => setSystemInstruction(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Writer System Prompt</label>
                                    <Textarea rows={4} value={aiWriterSystemPrompt} onChange={(e) => setAiWriterSystemPrompt(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Reviewer Prompt</label>
                                    <Textarea rows={4} value={aiWriterUserPrompt} onChange={(e) => setAiWriterUserPrompt(e.target.value)} />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    type="button"
                                    onClick={async () => {
                                        await saveBrandSetup();
                                        setBrandSetupMode(null);
                                        setIsEditingBrandSetup(false);
                                    }}
                                >
                                    Save & Exit
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Setup Wizard (Quick/Advanced) */}
                    {brandSetupMode && brandSetupMode !== "custom" && (
                        <div className="space-y-4">
                            {/* Step 1 */}
                            {brandSetupStep === 1 && (
                                <Card
                                    title="Brand Snapshot"
                                    subtitle={`Step 1 of ${brandSetupMode === "advanced" ? 4 : 3} · Estimated time: ~2 minutes`}
                                    action={<StatusPill tone="muted">{brandSetupMode === "advanced" ? "Advanced Setup" : "Quick Setup"}</StatusPill>}
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
                                                    {!!brandBasicsIndustry && !industryOptions.includes(brandBasicsIndustry) && <option value={brandBasicsIndustry}>{brandBasicsIndustry}</option>}
                                                    {industryOptions.map((option) => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-700">Business Type</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["B2B", "B2C", "Both"].map((option) => (
                                                        <Pill key={option} active={brandBasicsType === option} onClick={() => setBrandBasicsType(option)}>{option}</Pill>
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
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            type="button"
                                            onClick={async () => {
                                                const saved = await saveBrandSetup();
                                                if (!saved) return;
                                                setBrandSetupMode(null);
                                                setIsEditingBrandSetup(false);
                                            }}
                                        >
                                            Save & Exit
                                        </button>
                                        <button className="btn btn-primary btn-sm" type="button" onClick={() => setBrandSetupStep(2)}>
                                            Continue
                                        </button>
                                    </div>
                                </Card>
                            )}

                            {/* Step 2 */}
                            {brandSetupStep === 2 && (
                                <Card
                                    title="Audience & outcomes"
                                    subtitle={`Step 2 of ${brandSetupMode === "advanced" ? 4 : 3} · Estimated time: ~2 minutes`}
                                    action={<StatusPill tone="muted">{brandSetupMode === "advanced" ? "Advanced Setup" : "Quick Setup"}</StatusPill>}
                                >
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700">Primary audience role</label>
                                            <Input value={audienceRole} onChange={(e) => setAudienceRole(e.target.value)} placeholder="e.g., Marketing Manager, Founder, HR Lead" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700">Audience industry (optional)</label>
                                            <Input value={audienceIndustry} onChange={(e) => setAudienceIndustry(e.target.value)} placeholder="e.g., Healthcare, SaaS, Retail" />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="text-xs font-bold text-slate-700">Pain points</label>
                                            <div className="flex flex-wrap gap-2">
                                                {painPointOptions.map((opt) => {
                                                    const active = audiencePainPoints.includes(opt);
                                                    return (
                                                        <Pill key={opt} active={active} onClick={() => setAudiencePainPoints((prev) => (active ? prev.filter((v) => v !== opt) : [...prev, opt]))}>
                                                            {opt}
                                                        </Pill>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="text-xs font-bold text-slate-700">Desired outcome</label>
                                            <Input value={audienceOutcome} onChange={(e) => setAudienceOutcome(e.target.value)} placeholder="e.g., book a tour, request a demo, follow for tips" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setBrandSetupStep(1)}>
                                            Back
                                        </button>
                                        <button className="btn btn-primary btn-sm" type="button" onClick={() => setBrandSetupStep(3)}>
                                            Continue
                                        </button>
                                    </div>
                                </Card>
                            )}

                            {/* Step 3 */}
                            {brandSetupStep === 3 && (
                                <Card
                                    title="Voice & guardrails"
                                    subtitle={`Step 3 of ${brandSetupMode === "advanced" ? 4 : 3} · Estimated time: ~3 minutes`}
                                    action={<StatusPill tone="muted">{brandSetupMode === "advanced" ? "Advanced Setup" : "Quick Setup"}</StatusPill>}
                                >
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {[
                                            { label: "Formal", value: toneFormal, set: setToneFormal },
                                            { label: "Energy", value: toneEnergy, set: setToneEnergy },
                                            { label: "Boldness", value: toneBold, set: setToneBold },
                                        ].map((s) => (
                                            <div key={s.label} className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">{s.label}</label>
                                                <input type="range" min={0} max={100} value={s.value} onChange={(e) => s.set(Number(e.target.value))} className="w-full" />
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
                                                        <Pill key={opt} active={active} onClick={() => setNoSayRules((prev) => (active ? prev.filter((v) => v !== opt) : [...prev, opt]))}>
                                                            {opt}
                                                        </Pill>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setBrandSetupStep(2)}>
                                            Back
                                        </button>
                                        {brandSetupMode === "advanced" ? (
                                            <button className="btn btn-primary btn-sm" type="button" onClick={() => setBrandSetupStep(4)}>
                                                Continue
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                type="button"
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
                                </Card>
                            )}

                            {/* Step 4 (Advanced) */}
                            {brandSetupMode === "advanced" && brandSetupStep === 4 && (
                                <Card title="Advanced positioning" subtitle="Step 4 of 4 · Estimated time: ~4 minutes" action={<StatusPill tone="muted">Advanced Setup</StatusPill>}>
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
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setBrandSetupStep(3)}>
                                            Back
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            type="button"
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
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Configured Rules View */}
                    {brandIntelligenceReady && !brandSetupMode && (
                        <div className="space-y-4">
                            {/* Rules grid */}
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {/* Brand Pack */}
                                <Card
                                    title="Core Identity"
                                    subtitle="Your high-level brand mission, voice, and positioning."
                                    action={
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => startBrandRuleEdit("pack")}>
                                            Edit
                                        </button>
                                    }
                                >
                                    {activeBrandRuleEdit === "pack" ? (
                                        <>
                                            <Textarea rows={8} value={brandRuleDraft.pack} onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, pack: e.target.value }))} />
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button className="btn btn-secondary btn-sm" type="button" onClick={cancelBrandRuleEdit}>
                                                    Cancel
                                                </button>
                                                <button className="btn btn-primary btn-sm" type="button" onClick={saveBrandRuleEdit}>
                                                    Save
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">{brandPack || "—"}</div>
                                    )}
                                </Card>

                                {/* Capabilities */}
                                <Card
                                    title="Key Brand Facts"
                                    subtitle="What your company offers, claims, and emphasizes."
                                    action={
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => startBrandRuleEdit("capabilities")}>
                                            Edit
                                        </button>
                                    }
                                >
                                    {activeBrandRuleEdit === "capabilities" ? (
                                        <>
                                            <Textarea rows={8} value={brandRuleDraft.capabilities} onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, capabilities: e.target.value }))} />
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button className="btn btn-secondary btn-sm" type="button" onClick={cancelBrandRuleEdit}>
                                                    Cancel
                                                </button>
                                                <button className="btn btn-primary btn-sm" type="button" onClick={saveBrandRuleEdit}>
                                                    Save
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">{brandCapability || "—"}</div>
                                    )}
                                </Card>

                                {/* Writer prompt */}
                                <Card
                                    title="AI Writing Style"
                                    subtitle="Instructions for how the AI should write your content."
                                    action={
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => startBrandRuleEdit("writer")}>
                                            Edit
                                        </button>
                                    }
                                >
                                    {activeBrandRuleEdit === "writer" ? (
                                        <>
                                            <Textarea rows={8} value={brandRuleDraft.writer} onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, writer: e.target.value }))} />
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button className="btn btn-secondary btn-sm" type="button" onClick={cancelBrandRuleEdit}>
                                                    Cancel
                                                </button>
                                                <button className="btn btn-primary btn-sm" type="button" onClick={saveBrandRuleEdit}>
                                                    Save
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">{aiWriterSystemPrompt || "—"}</div>
                                    )}
                                </Card>

                                {/* Reviewer prompt */}
                                <Card
                                    title="Quality Check Rules"
                                    subtitle="Guidelines used to review and approve content."
                                    action={
                                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => startBrandRuleEdit("reviewer")}>
                                            Edit
                                        </button>
                                    }
                                >
                                    {activeBrandRuleEdit === "reviewer" ? (
                                        <>
                                            <Textarea rows={8} value={brandRuleDraft.reviewer} onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, reviewer: e.target.value }))} />
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button className="btn btn-secondary btn-sm" type="button" onClick={cancelBrandRuleEdit}>
                                                    Cancel
                                                </button>
                                                <button className="btn btn-primary btn-sm" type="button" onClick={saveBrandRuleEdit}>
                                                    Save
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">{aiWriterUserPrompt || "—"}</div>
                                    )}
                                </Card>
                            </div>

                            {/* Visual Rules */}
                            <div className="my-6 h-px w-full bg-slate-200/70" />
                            <div className="mb-2">
                                <div className="text-base font-extrabold text-slate-900">Visual & Image Rules</div>
                                <div className="mt-1 text-sm text-slate-600">Controls how AI generates images for this company.</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div className="lg:col-span-2">
                                    <Card
                                        title="Image Style Guide"
                                        subtitle="Colors, lighting, and design preferences for AI images."
                                        action={
                                            <button className="btn btn-secondary btn-sm" type="button" onClick={() => startBrandRuleEdit("visual")}>
                                                Edit
                                            </button>
                                        }
                                    >
                                        {activeBrandRuleEdit === "visual" ? (
                                            <>
                                                <Textarea rows={8} value={brandRuleDraft.visual} onChange={(e) => setBrandRuleDraft((prev) => ({ ...prev, visual: e.target.value }))} />
                                                <div className="mt-3 flex justify-end gap-2">
                                                    <button className="btn btn-secondary btn-sm" type="button" onClick={cancelBrandRuleEdit}>
                                                        Cancel
                                                    </button>
                                                    <button className="btn btn-primary btn-sm" type="button" onClick={saveBrandRuleEdit}>
                                                        Save
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-4">
                                                {!systemInstruction && (
                                                    <div className="p-4 bg-[#3fa9f5]/5 border border-[#3fa9f5]/20 rounded-2xl flex gap-3 items-start">
                                                        <HelpCircle className="text-[#3fa9f5] mt-0.5 flex-shrink-0" size={18} />
                                                        <p className="text-xs font-bold text-[#3fa9f5] leading-relaxed">
                                                            Visual identity is currently empty. This will be generated through a dedicated flow on the Image Hub page.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto">{systemInstruction || "—"}</div>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-extrabold text-slate-900 mb-2">Safety + control</h3>
                        <p className="text-sm text-slate-600 mb-4">This configuration affects all AI outputs for this company.</p>
                        <ul className="space-y-2 text-sm font-medium text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Use safe defaults to get started
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Edit inputs any time
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Regeneration is rate-limited
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-extrabold text-slate-900 mb-4">Recommended order</h3>
                        <ul className="space-y-2 text-sm font-medium text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Brand snapshot + audience
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Guardrails + compliance
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Generate and review outputs
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div >
    );
}
