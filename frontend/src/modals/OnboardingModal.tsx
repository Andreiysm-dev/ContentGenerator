import { useState, useEffect } from 'react';
import { OnboardingShell } from '../components/Onboarding/OnboardingShell';
import { OnboardingRoleStep } from '../components/Onboarding/OnboardingRoleStep';
import { OnboardingWebsiteStep } from '../components/Onboarding/OnboardingWebsiteStep';
import { OnboardingBrandIdentityStep } from '../components/Onboarding/OnboardingBrandIdentityStep';
import { OnboardingStrategicStep } from '../components/Onboarding/OnboardingStrategicStep';
import { OnboardingAudienceStep } from '../components/Onboarding/OnboardingAudienceStep';
import { OnboardingContentStrategyStep } from '../components/Onboarding/OnboardingContentStrategyStep';
import { OnboardingVoiceStep } from '../components/Onboarding/OnboardingVoiceStep';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: (data: OnboardingData | null) => void;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export interface OnboardingData {
    role: string;
    companyName: string;
    companyDescription: string;
    industry: string;
    businessType: string;
    primaryGoal: string;

    // Strategic fields
    mission: string;
    valuePropositions: string[];

    // Audience fields
    audienceRole: string;
    audienceIndustry: string;
    audiencePainPoints: string[];
    audienceOutcome: string;

    // Content Strategy
    contentPillars: string[];
    primaryPlatform: string;

    // Tone fields
    toneFormal: number;
    toneEnergy: number;
    toneBold: number;
    emojiUsage: string;
    writingLength: string;
    ctaStrength: string;

    // Enhanced brand intelligence data (keep for backward compat/extra detail)
    targetAudience?: any;
    brandVoice?: any;
    visualIdentity?: any;
    socialProof?: string[];
    competitiveEdge?: string[];
}

export function OnboardingModal({ isOpen, onComplete, notify, isAiAssistantOpen }: OnboardingModalProps) {
    // Navigation State
    const [step, setStep] = useState(1);

    // Form Data State
    const [role, setRole] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyDescription, setCompanyDescription] = useState('');
    const [industry, setIndustry] = useState('');
    const [businessType, setBusinessType] = useState('B2B');
    const [primaryGoal, setPrimaryGoal] = useState('Leads');

    // Step 4: Strategic
    const [mission, setMission] = useState('');
    const [valueProps, setValueProps] = useState<string[]>(['', '', '']);

    // Step 5: Audience
    const [audienceRole, setAudienceRole] = useState('');
    const [audienceIndustry, setAudienceIndustry] = useState('');
    const [audiencePainPoints, setAudiencePainPoints] = useState<string[]>([]);
    const [audienceOutcome, setAudienceOutcome] = useState('');

    // Step 6: Content Strategy
    const [contentPillars, setContentPillars] = useState<string[]>([]);
    const [primaryPlatform, setPrimaryPlatform] = useState('LinkedIn');

    // Extraction State
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedBrandData, setExtractedBrandData] = useState<any>(null);

    // Initial default values for voice (will be overridden by Vibe Card)
    const [voiceSettings, setVoiceSettings] = useState({
        formal: 5,
        energy: 5,
        bold: 5,
        emoji: 'Sometimes'
    });

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            // Reset to step 1
            setStep(1);

            // Reset Form Data
            setRole('');
            setWebsiteUrl('');
            setCompanyName('');
            setCompanyDescription('');
            setIndustry('');
            setBusinessType('B2B');
            setPrimaryGoal('Leads');

            // Reset Strategic
            setMission('');
            setValueProps(['', '', '']);

            // Reset Audience
            setAudienceRole('');
            setAudienceIndustry('');
            setAudiencePainPoints([]);
            setAudienceOutcome('');

            // Reset Content Strategy
            setContentPillars([]);
            setPrimaryPlatform('LinkedIn');

            // Reset Voice
            setVoiceSettings({
                formal: 5,
                energy: 5,
                bold: 5,
                emoji: 'Sometimes'
            });

            // Reset Extraction
            setIsExtracting(false);
            setExtractedBrandData(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleExtractBrandDNA = async () => {
        if (!websiteUrl.trim()) return;

        setIsExtracting(true);
        try {
            const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const response = await fetch(`${backendBaseUrl}/api/analyze-website`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteUrl }),
            });

            if (!response.ok) throw new Error('Failed to analyze website');

            const data = await response.json();

            if (data.success && data.brandData) {
                const bd = data.brandData;

                // Pre-fill Identity
                setCompanyName(bd.companyName || '');
                setCompanyDescription(bd.description || '');
                setIndustry(bd.industry || '');

                // Pre-fill Strategic
                setMission(bd.missionStatement || '');
                if (Array.isArray(bd.valuePropositions) && bd.valuePropositions.length > 0) {
                    // Ensure we have 3 slots
                    const newProps = [...bd.valuePropositions, '', '', ''].slice(0, 3);
                    setValueProps(newProps);
                }

                // Pre-fill Audience
                if (bd.targetAudience) {
                    setAudienceRole(bd.targetAudience.role || '');
                    setAudienceIndustry(bd.industry || '');
                    setAudiencePainPoints(bd.targetAudience.painPoints || []);
                    setAudienceOutcome(bd.targetAudience.outcomes?.[0] || '');
                }

                // Pre-fill Content Strategy
                if (Array.isArray(bd.contentPillars)) {
                    setContentPillars(bd.contentPillars);
                }
                if (bd.primaryPlatform) {
                    setPrimaryPlatform(bd.primaryPlatform);
                }

                setExtractedBrandData(bd);
                notify('✨ Brand DNA extracted! Please review the details.', 'success');

                // Navigate to Step 3 (Identity) to let user review/edit extracted info
                setStep(3);
            } else {
                notify('Could not extract brand information. Please fill manually.', 'info');
                setStep(3); // Go to manual entry
            }
        } catch (error) {
            console.error('Extraction error:', error);
            notify('Failed to analyze website. Please fill manually.', 'error');
            setStep(3); // Go to manual entry
        } finally {
            setIsExtracting(false);
        }
    };

    const handleComplete = () => {
        onComplete({
            role,
            companyName,
            companyDescription: companyDescription || `A ${industry} company.`,
            industry,
            businessType: businessType,
            primaryGoal: primaryGoal,

            // New fields
            mission,
            valuePropositions: valueProps.filter(Boolean),
            contentPillars,
            primaryPlatform,

            audienceRole,
            audienceIndustry,
            audiencePainPoints,
            audienceOutcome,

            toneFormal: voiceSettings.formal,
            toneEnergy: voiceSettings.energy,
            toneBold: voiceSettings.bold,
            emojiUsage: voiceSettings.emoji,
            writingLength: 'Medium',
            ctaStrength: 'Moderate',

            // Enhanced data
            targetAudience: extractedBrandData?.targetAudience,
            brandVoice: extractedBrandData?.brandVoice,
            visualIdentity: extractedBrandData?.visualIdentity,
            socialProof: extractedBrandData?.socialProof,
            competitiveEdge: extractedBrandData?.competitiveEdge,
        });
    };

    return (
        <OnboardingShell
            currentStep={step}
            totalSteps={7}
            onClose={() => onComplete(null)}
            isAiAssistantOpen={isAiAssistantOpen}
        >
            {/* AI Suggestion Banner */}
            {extractedBrandData && (
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <span className="text-xl">✨</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 text-sm">AI Draft Ready</h4>
                        <p className="text-blue-700 text-sm mt-0.5">
                            We've analyzed your site and filled in the details.
                            <span className="font-medium"> Please review and edit anything that looks different from your vision.</span>
                        </p>
                    </div>
                </div>
            )}

            {step === 1 && (
                <OnboardingRoleStep
                    selectedRole={role}
                    onSelectRole={setRole}
                    onNext={() => setStep(2)}
                />
            )}

            {step === 2 && (
                <OnboardingWebsiteStep
                    websiteUrl={websiteUrl}
                    setWebsiteUrl={setWebsiteUrl}
                    onExtract={handleExtractBrandDNA}
                    isExtracting={isExtracting}
                    onSkip={() => setStep(3)}
                />
            )}

            {step === 3 && (
                <OnboardingBrandIdentityStep
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    industry={industry}
                    setIndustry={setIndustry}
                    onNext={() => setStep(4)}
                    onBack={() => setStep(2)}
                />
            )}

            {step === 4 && (
                <OnboardingStrategicStep
                    mission={mission}
                    setMission={setMission}
                    valueProps={valueProps}
                    setValueProps={setValueProps}
                    onNext={() => setStep(5)}
                    onBack={() => setStep(3)}
                />
            )}

            {step === 5 && (
                <OnboardingAudienceStep
                    audienceRole={audienceRole}
                    setAudienceRole={setAudienceRole}
                    audienceIndustry={audienceIndustry}
                    setAudienceIndustry={setAudienceIndustry}
                    audiencePainPoints={audiencePainPoints}
                    setAudiencePainPoints={setAudiencePainPoints}
                    audienceOutcome={audienceOutcome}
                    setAudienceOutcome={setAudienceOutcome}
                    onNext={() => setStep(6)}
                    onBack={() => setStep(4)}
                />
            )}

            {step === 6 && (
                <OnboardingContentStrategyStep
                    pillars={contentPillars}
                    setPillars={setContentPillars}
                    platform={primaryPlatform}
                    setPlatform={setPrimaryPlatform}
                    onNext={() => setStep(7)}
                    onBack={() => setStep(5)}
                />
            )}

            {step === 7 && (
                <OnboardingVoiceStep
                    onSetVoice={setVoiceSettings}
                    onComplete={handleComplete}
                    onBack={() => setStep(6)}
                    isSubmitting={false}
                />
            )}
        </OnboardingShell>
    );
}
