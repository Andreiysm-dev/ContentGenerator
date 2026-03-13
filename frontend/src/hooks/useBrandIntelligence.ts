import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { industryOptions } from '@/constants/app';

type Notify = (message: string, tone?: 'success' | 'error' | 'info') => void;

export type BrandSetupMode = 'quick' | 'advanced' | 'custom' | null;
export type BrandRuleEditKey = 'pack' | 'capabilities' | 'writer' | 'reviewer' | 'visual' | null;

type BrandRuleDraft = {
  pack: string;
  capabilities: string;
  writer: string;
  reviewer: string;
  visual: string;
};

interface UseBrandIntelligenceOptions {
  activeCompanyId?: string;
  session: Session | null;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  notify: Notify;
  pathname: string;
}

const DEFAULT_BRAND_RULE_DRAFT: BrandRuleDraft = {
  pack: '',
  capabilities: '',
  writer: '',
  reviewer: '',
  visual: '',
};

export function useBrandIntelligence({
  activeCompanyId,
  session,
  authedFetch,
  backendBaseUrl,
  notify,
  pathname,
}: UseBrandIntelligenceOptions) {
  const [brandKbId, setBrandKbId] = useState<string | null>(null);
  const [brandPack, setBrandPack] = useState('');
  const [brandCapability, setBrandCapability] = useState('');
  const [emojiRule, setEmojiRule] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [aiWriterSystemPrompt, setAiWriterSystemPrompt] = useState('');
  const [aiWriterUserPrompt, setAiWriterUserPrompt] = useState('');
  const [brandSetupMode, setBrandSetupMode] = useState<BrandSetupMode>(null);
  const [brandSetupLevel, setBrandSetupLevel] = useState<BrandSetupMode>(null);
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
  const [activeBrandRuleEdit, setActiveBrandRuleEdit] = useState<BrandRuleEditKey>(null);
  const [brandRuleDraft, setBrandRuleDraft] = useState<BrandRuleDraft>(DEFAULT_BRAND_RULE_DRAFT);
  const brandRuleSnapshotRef = useRef<BrandRuleDraft | null>(null);

  const buildFormAnswer = useCallback(() => ({
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
  }), [
    brandBasicsName,
    brandBasicsIndustry,
    brandBasicsType,
    brandBasicsOffer,
    brandBasicsGoal,
    audienceRole,
    audienceIndustry,
    audiencePainPoints,
    audienceOutcome,
    toneFormal,
    toneEnergy,
    toneBold,
    emojiUsage,
    writingLength,
    ctaStrength,
    absoluteTruths,
    noSayRules,
    regulatedIndustry,
    legalReview,
    advancedPositioning,
    advancedDifferentiators,
    advancedPillars,
    advancedCompetitors,
    advancedProofPoints,
    advancedRequiredPhrases,
    advancedForbiddenPhrases,
    advancedComplianceNotes,
  ]);

  const resetBrandFields = useCallback((includeReadiness = true) => {
    if (includeReadiness) {
      setBrandIntelligenceReady(false);
      setBrandSetupMode(null);
      setIsEditingBrandSetup(false);
      setFormAnswerCache(null);
    }
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
  }, []);

  const applyFormAnswer = useCallback((formAnswer: any) => {
    if (!formAnswer || typeof formAnswer !== 'object') return;
    const basics = formAnswer.brandBasics || {};
    const audience = formAnswer.audience || {};
    const voice = formAnswer.voice || {};
    const guardrails = formAnswer.guardrails || {};
    const advanced = formAnswer.advanced || {};

    const normalizeOptionValue = (raw: unknown, options: string[], allowCustom = false): string | null => {
      if (typeof raw !== 'string') return null;
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const match = options.find((opt) => opt.toLowerCase() === trimmed.toLowerCase());
      if (match) return match;
      return allowCustom ? trimmed : null;
    };

    const normalizeFixedEnum = (raw: unknown, options: string[]): string | null => {
      return normalizeOptionValue(raw, options, false);
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
  }, []);

  const saveBrandSetup = useCallback(async (overrides: Record<string, any> = {}) => {
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
    const brandUrl = brandKbId ? `${backendBaseUrl}/api/brandkb/${brandKbId}` : `${backendBaseUrl}/api/brandkb`;
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
  }, [
    activeCompanyId,
    aiWriterSystemPrompt,
    aiWriterUserPrompt,
    authedFetch,
    backendBaseUrl,
    brandCapability,
    brandKbId,
    brandPack,
    buildFormAnswer,
    emojiRule,
    notify,
    systemInstruction,
  ]);

  const loadBrandKB = useCallback(async (resetDefaults = true, preserveEdits = false) => {
    if (!session || !activeCompanyId) return;
    const requestedCompanyId = activeCompanyId;
    if (resetDefaults) {
      resetBrandFields(false);
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
      if (!first) return;

      if (typeof first.brandKbId === 'string') setBrandKbId(first.brandKbId);
      if (!isEditing && typeof first.brandPack === 'string') setBrandPack(first.brandPack);
      if (!isEditing && typeof first.brandCapability === 'string') setBrandCapability(first.brandCapability);
      if (!isEditing && typeof first.emojiRule === 'string') setEmojiRule(first.emojiRule);
      if (!isEditing && typeof first.systemInstruction === 'string') setSystemInstruction(first.systemInstruction);
      if (!isEditing && typeof first.writerAgent === 'string') setAiWriterSystemPrompt(first.writerAgent);
      if (!isEditing && typeof first.reviewPrompt1 === 'string') setAiWriterUserPrompt(first.reviewPrompt1);

      const hasGeneratedRules = !!first.brandPack || !!first.brandCapability || !!first.writerAgent || !!first.reviewPrompt1;
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
    } catch (err) {
      console.error('Error loading brandKB/company settings:', err);
    }
  }, [activeCompanyId, applyFormAnswer, authedFetch, backendBaseUrl, resetBrandFields, session]);

  const nowMs = Date.now() + brandWebhookCooldownTick * 0;
  const isBrandWebhookCoolingDown = brandWebhookCooldownUntil > nowMs;
  const brandWebhookCooldownSecondsLeft = isBrandWebhookCoolingDown
    ? Math.max(1, Math.ceil((brandWebhookCooldownUntil - nowMs) / 1000))
    : 0;

  const sendBrandWebhook = useCallback(async (formAnswer: ReturnType<typeof buildFormAnswer>) => {
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

      if (data?.brandKB && typeof data.brandKB === 'object') {
        await loadBrandKB(false, true);
      }
    } catch (err) {
      setBrandWebhookCooldownUntil(0);
      console.error('Brand intelligence webhook failed:', err);
      notify('Brand Intelligence generation failed. Check console for details.', 'error');
    }
  }, [
    activeCompanyId,
    authedFetch,
    backendBaseUrl,
    brandKbId,
    brandSetupLevel,
    brandWebhookCooldownSecondsLeft,
    isBrandWebhookCoolingDown,
    loadBrandKB,
    notify,
    saveBrandSetup,
  ]);

  const startBrandRuleEdit = useCallback((key: Exclude<BrandRuleEditKey, null>) => {
    const snapshot: BrandRuleDraft = {
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
  }, [aiWriterSystemPrompt, aiWriterUserPrompt, brandCapability, brandPack, systemInstruction]);

  const cancelBrandRuleEdit = useCallback(() => {
    if (brandRuleSnapshotRef.current) {
      setBrandRuleDraft(brandRuleSnapshotRef.current);
    }
    setActiveBrandRuleEdit(null);
  }, []);

  const closeBrandRuleEdit = useCallback(() => {
    setActiveBrandRuleEdit(null);
  }, []);

  const saveBrandRuleEdit = useCallback(async () => {
    if (!activeBrandRuleEdit) return;

    const nextPack = activeBrandRuleEdit === 'pack' ? brandRuleDraft.pack : brandPack;
    const nextCapabilities = activeBrandRuleEdit === 'capabilities' ? brandRuleDraft.capabilities : brandCapability;
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
  }, [
    activeBrandRuleEdit,
    aiWriterSystemPrompt,
    aiWriterUserPrompt,
    brandCapability,
    brandPack,
    brandRuleDraft,
    notify,
    saveBrandSetup,
    systemInstruction,
  ]);

  useEffect(() => {
    brandEditingRef.current =
      isEditingBrandSetup ||
      brandSetupMode !== null ||
      activeBrandRuleEdit !== null ||
      writerRulesUnlocked ||
      reviewerRulesUnlocked;
  }, [isEditingBrandSetup, brandSetupMode, activeBrandRuleEdit, writerRulesUnlocked, reviewerRulesUnlocked]);

  useEffect(() => {
    if (!isBrandWebhookCoolingDown) return;
    const id = window.setInterval(() => setBrandWebhookCooldownTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [isBrandWebhookCoolingDown]);

  useEffect(() => {
    loadBrandKB();
  }, [activeCompanyId, loadBrandKB, session]);

  useEffect(() => {
    setBrandIntelligenceReady(false);
    setBrandSetupMode(null);
    setIsEditingBrandSetup(false);
    setFormAnswerCache(null);
    resetBrandFields(false);
    setBrandSetupStep(0);
    setWriterRulesUnlocked(false);
    setReviewerRulesUnlocked(false);
    setActiveBrandRuleEdit(null);
    setBrandRuleDraft(DEFAULT_BRAND_RULE_DRAFT);
  }, [activeCompanyId, resetBrandFields]);

  useEffect(() => {
    const isBrandIntelligenceRoute =
      /^\/company\/[^/]+\/(brand-intelligence|brand)\/?$/.test(pathname) ||
      /^\/company\/[^/]+\/settings/.test(pathname);
    if (!isBrandIntelligenceRoute || !activeCompanyId || !session) return;
    if (brandEditingRef.current) return;
    if (!isBrandWebhookCoolingDown && brandIntelligenceReady && !brandSetupMode && !activeBrandRuleEdit) return;

    let canceled = false;
    const poll = async () => {
      if (canceled || brandEditingRef.current) return;
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
    activeBrandRuleEdit,
    brandIntelligenceReady,
    brandSetupMode,
    isBrandWebhookCoolingDown,
    loadBrandKB,
    pathname,
    session,
  ]);

  return {
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
    setBrandIntelligenceReady,
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
    closeBrandRuleEdit,
    cancelBrandRuleEdit,
    saveBrandRuleEdit,
  };
}
