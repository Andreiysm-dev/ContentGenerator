import React, { useState, useEffect, useMemo } from 'react';
import {
    Image,
    Sparkles,
    Wand2,
    Copy,
    Pencil,
    Settings2,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    History,
    Search,
    Filter,
    ArrowRight,
    Layout,
    X,
    Eye,
    EyeOff,
    HelpCircle,
    ArrowLeft,
    Maximize2,
    MousePointer2,
    RefreshCw,
    Download,
    Check,
    PenTool,
    Palette,
    Type,
    Camera,
    ImagePlus,
    ChevronRight,
    ChevronLeft,
    Monitor,
    ShieldCheck,
    FileText,
    Zap,
    MessageSquare,
    Info,
    XCircle
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface ImageHubPageProps {
    calendarRows: any[];
    setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    activeCompanyId?: string;
    brandKbId: string | null;
    systemInstruction: string;
    setSystemInstruction: React.Dispatch<React.SetStateAction<string>>;
    backendBaseUrl: string;
    getStatusValue: (status: any) => string;
    getImageGeneratedUrl: (row: any | null) => string | null;
    getImageGeneratedSignature: (row: any | null) => string | null;
    requestConfirm: (config: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
    }) => Promise<boolean>;
    setSelectedRow: React.Dispatch<React.SetStateAction<any | null>>;
    userPermissions?: {
        canApprove: boolean;
        canGenerate: boolean;
        canCreate: boolean;
        canDelete: boolean;
        isOwner: boolean;
    };
    activeCompany?: any;
}

export function ImageHubPage({
    calendarRows,
    setCalendarRows,
    authedFetch,
    notify,
    activeCompanyId,
    brandKbId,
    systemInstruction,
    setSystemInstruction,
    backendBaseUrl,
    getStatusValue,
    getImageGeneratedUrl,
    getImageGeneratedSignature,
    requestConfirm,
    setSelectedRow,
    userPermissions = {
        canApprove: false,
        canGenerate: false,
        canCreate: false,
        canDelete: false,
        isOwner: false
    },
    activeCompany
}: ImageHubPageProps) {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [dmpDraft, setDmpDraft] = useState('');
    const [isEditingDmp, setIsEditingDmp] = useState(false);
    const [isEditingBrandRules, setIsEditingBrandRules] = useState(false);
    const [brandRulesDraft, setBrandRulesDraft] = useState(systemInstruction);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [provider, setProvider] = useState<'google' | 'replicate' | 'fal'>('fal');
    const [selectedModel, setSelectedModel] = useState('fal-ai/nano-banana-pro');
    const [imagePreviewNonce, setImagePreviewNonce] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
    const [aiRefinementMessage, setAiRefinementMessage] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isRefinerOpen, setIsRefinerOpen] = useState(false);
    const [showTechnicalPrompt, setShowTechnicalPrompt] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const columns = (activeCompany?.kanban_settings?.columns || []) as any[];

    // Visual Onboarding States
    const [isVisualOnboardingOpen, setIsVisualOnboardingOpen] = useState(false);
    const [visualOnboardingStep, setVisualOnboardingStep] = useState(1);
    const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [visualOnboardingState, setVisualOnboardingState] = useState({
        primaryColor: '#3B82F6',
        secondaryColor: '#64748B',
        fontStyle: 'Modern Sans-Serif',
        customFont: '',
        imageryMood: 'Clean & Professional',
        customImageryMood: '',
        compositionStyle: 'Minimalist',
        lightingStyle: 'Natural Daylight',
        perspective: 'Eye-level',
        visualComplexity: 'Balanced',
        graphicStyle: 'Realistic Photo',
        targetDemographic: 'Professional & Corporate',
        contentFocus: 'Balanced Mix',
        vibeDescription: '',
        forbiddenElements: ''
    });

    const [designReferences, setDesignReferences] = useState<string[]>([]);
    const [isDesignReferencesOpen, setIsDesignReferencesOpen] = useState(false);
    const [brandInspirationImages, setBrandInspirationImages] = useState<string[]>([]);
    const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);


    const [imageContext, setImageContext] = useState('');
    const [imageMood, setImageMood] = useState('Brand Default');
    const [imageLighting, setImageLighting] = useState('Brand Default');
    const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
    const [proposals, setProposals] = useState<string[]>([]);
    const [isProposing, setIsProposing] = useState(false);
    const [isProposalsModalOpen, setIsProposalsModalOpen] = useState(false);

    // Persist dismissed IDs in localStorage
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('imageHubDismissedIds') || '[]');
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('imageHubDismissedIds', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    const ALL_MODELS = [
        { id: 'fal-ai/nano-banana-pro', name: 'Google Nano Banana Pro', provider: 'fal', group: 'Fal.ai' },
        { id: 'google-imagen', name: 'Google Imagen', provider: 'google', group: 'Google' },
        { id: 'imagineart/imagineart-1.5-preview/text-to-image', name: 'Imagine Art', provider: 'fal', group: 'Fal.ai' },
    ];

    const MOOD_OPTIONS = ['Brand Default', 'Minimalist', 'Professional', 'Energetic', 'Cinematic', 'Whimsical', 'Corporate', 'Luxurious'];
    const LIGHTING_OPTIONS = ['Brand Default', 'Natural Daylight', 'Studio Softbox', 'Neon/Cyberpunk', 'Golden Hour', 'Moody/Dark', 'Bright & Airy'];

    const approvedRows = useMemo(() => {
        return calendarRows.filter(row => {
            if (selectedStatusFilter === 'all') return true;

            const rawStatus = getStatusValue(row.status).trim();

            // Try to find the title of the current row's status
            const rowColumn = columns.find(c =>
                c.id === rawStatus ||
                c.title.toLowerCase() === rawStatus.toLowerCase()
            );

            const rowStatusTitle = rowColumn ? rowColumn.title : rawStatus;
            const rowStatusId = rowColumn ? rowColumn.id : rawStatus;

            // Try to find the column for the selected filter (which could be an ID or Title)
            const filterColumn = columns.find(c =>
                c.id === selectedStatusFilter ||
                c.title.toLowerCase() === selectedStatusFilter.toLowerCase()
            );

            const filterTitle = filterColumn ? filterColumn.title : selectedStatusFilter;
            const filterId = filterColumn ? filterColumn.id : selectedStatusFilter;

            // Match by ID or Title
            return rowStatusId === filterId ||
                rowStatusTitle.toLowerCase() === filterTitle.toLowerCase();
        }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [calendarRows, getStatusValue, selectedStatusFilter, columns]);

    const activeQueueRows = useMemo(() => {
        // Filter out dismissed items, but ALWAYS show the explicitly selected one from URL/Editor
        return approvedRows.filter(row => {
            if (row.contentCalendarId === selectedRowId) return true;
            return !dismissedIds.includes(row.contentCalendarId);
        });
    }, [approvedRows, dismissedIds, selectedRowId]);

    const filteredRows = useMemo(() => {
        if (!searchQuery.trim()) return activeQueueRows;
        return activeQueueRows.filter(row =>
            (row.theme || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.finalCaption || row.captionOutput || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeQueueRows, searchQuery]);

    const selectedRow = useMemo(() => {
        const row = approvedRows.find(r => r.contentCalendarId === selectedRowId) || null;
        // Sync with global state so AI Assistant knows which row is active
        return row;
    }, [approvedRows, selectedRowId]);

    // Lift state to App.tsx whenever selectedRow changes
    useEffect(() => {
        setSelectedRow(selectedRow);
    }, [selectedRow, setSelectedRow]);

    // Automatically open visual onboarding if systemInstruction is missing
    useEffect(() => {
        if (!systemInstruction && brandKbId && !isVisualOnboardingOpen) {
            const timer = setTimeout(() => {
                setIsVisualOnboardingOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [systemInstruction, brandKbId]);

    const handleGenerateVisualIdentity = async () => {
        if (!brandKbId) return;
        setIsGeneratingImage(true);
        try {
            // Merge custom fields into the state being sent
            const finalState = {
                ...visualOnboardingState,
                fontStyle: visualOnboardingState.fontStyle === 'Other' ? visualOnboardingState.customFont : visualOnboardingState.fontStyle,
                imageryMood: visualOnboardingState.imageryMood === 'Other' ? visualOnboardingState.customImageryMood : visualOnboardingState.imageryMood,
            };

            const res = await authedFetch(`${backendBaseUrl}/api/brandkb/${brandKbId}/generate-visual-identity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visualOnboardingState: finalState }),
            });
            if (!res.ok) {
                notify('Failed to generate Visual Identity.', 'error');
                return;
            }
            const data = await res.json();
            setSystemInstruction(data.systemInstruction);
            setBrandRulesDraft(data.systemInstruction);
            setIsVisualOnboardingOpen(false);
            notify('Visual Identity generated and saved!', 'success');
        } catch (err) {
            notify('Error generating visual identity.', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleMagicPropose = async () => {
        if (!selectedRow) return;
        setIsProposing(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/propose-image-ideas`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setProposals(data.ideas || []);
                setIsProposalsModalOpen(true);
            } else {
                notify('Failed to suggest visual ideas.', 'error');
            }
        } catch (err) {
            console.error('Propose error:', err);
            notify('Error suggesting ideas.', 'error');
        } finally {
            setIsProposing(false);
        }
    };

    const handleInheritFromBrand = () => {
        if (!systemInstruction) return;
        // Extract some keywords from system instruction or just append a summary
        // For simplicity, let's just append the brand mission if available or some key traits
        const traits = systemInstruction.slice(0, 100) + (systemInstruction.length > 100 ? '...' : '');
        setImageContext(prev => prev ? `${prev}\n\n[Brand Context]: ${traits}` : `[Brand Context]: ${traits}`);
        notify('Brand traits inherited!', 'success');
    };

    const handleAnalyzeWebsiteForVisuals = async () => {
        if (!websiteUrl.trim()) return;
        setIsAnalyzingWebsite(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/analyze-website`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteUrl }),
            });
            if (!res.ok) {
                notify('Failed to analyze website.', 'error');
                return;
            }
            const data = await res.json();
            const visuals = data.brandData?.visualIdentity;

            if (visuals) {
                setVisualOnboardingState(prev => ({
                    ...prev,
                    primaryColor: visuals.primaryColors?.[0] || prev.primaryColor,
                    secondaryColor: visuals.secondaryColors?.[0] || prev.secondaryColor,
                    vibeDescription: data.brandData.description || prev.vibeDescription
                }));
                notify('Website analysis complete! We updated your defaults.', 'success');
                setVisualOnboardingStep(2); // Jump to colors
            }
        } catch (err) {
            notify('Technical error during analysis.', 'error');
        } finally {
            setIsAnalyzingWebsite(false);
        }
    };

    const handleDownload = async () => {
        const imageUrl = getImageGeneratedUrl(selectedRow);
        if (!imageUrl) return;

        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `brand_image_${selectedRow.contentCalendarId.slice(0, 8)}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            notify('Download started!', 'success');
        } catch (e) {
            console.error(e);
            notify('Failed to download image', 'error');
        }
    };

    // Track last ID to avoid selection lock and unnecessary resets
    const [lastId, setLastId] = useState<string | null>(null);
    const [lastUrlId, setLastUrlId] = useState<string | null>(null);

    // Initial item selection & URL Handling
    useEffect(() => {
        const urlId = searchParams.get('id');

        // Priority 1: New URL ID detected
        if (urlId && urlId !== lastUrlId) {
            if (dismissedIds.includes(urlId)) {
                setDismissedIds(prev => prev.filter(id => id !== urlId));
            }
            setSelectedRowId(urlId);
            setLastId(urlId);
            setLastUrlId(urlId);
            return;
        }

        // Priority 2: Auto-select first item removed per user request
        // if (!selectedRowId && activeQueueRows.length > 0) {
        //     const firstId = activeQueueRows[0].contentCalendarId;
        //     setSelectedRowId(firstId);
        //     setLastId(firstId);
        // }
    }, [activeQueueRows, selectedRowId, searchParams, dismissedIds, lastUrlId]);

    // Handle row selection change - Only reset when switching DIFFERENT items
    useEffect(() => {
        if (!selectedRow) return;
        if (selectedRow.contentCalendarId !== lastId) {
            setDmpDraft(selectedRow.dmp || '');
            setIsEditingDmp(false);
            setLastId(selectedRow.contentCalendarId);
        } else if (!isEditingDmp) {
            if (selectedRow.dmp !== dmpDraft) {
                setDmpDraft(selectedRow.dmp || '');
            }
        }
    }, [selectedRow, lastId, isEditingDmp, dmpDraft]);

    const handleSaveDmp = async () => {
        if (!selectedRow) return;
        const trimmedDmp = dmpDraft.trim();
        if (!trimmedDmp) {
            notify('Design Style Guide cannot be empty.', 'error');
            return;
        }

        setIsGeneratingImage(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dmp: trimmedDmp,
                    provider,
                    model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined,
                    aspectRatio: selectedAspectRatio
                }),
            });
            if (!res.ok) {
                notify('Failed to save Visual Style Guide.', 'error');
                setIsGeneratingImage(false);
                return;
            }
            // Update local state
            setCalendarRows(prev => prev.map(r =>
                r.contentCalendarId === selectedRow.contentCalendarId ? { ...r, dmp: trimmedDmp } : r
            ));
            setIsEditingDmp(false);
            notify('Visual Style Guide saved.', 'success');
        } catch (err) {
            notify('Error saving style info.', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const blobToBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result as string;
                        // Remove data:image/...;base64, prefix
                        resolve(base64String.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        });
    };

    const handleAnalyzeBrand = async () => {
        if (brandInspirationImages.length === 0) {
            notify('Please upload at least one inspiration image.', 'info');
            return;
        }

        setIsAnalyzingBrand(true);
        try {
            const base64Images = await Promise.all(
                brandInspirationImages.map(url => blobToBase64(url))
            );

            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/analyze-brand-visuals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: base64Images }),
            });

            if (res.ok) {
                const data = await res.json();
                const analysis = data.analysis;
                console.log('[handleAnalyzeBrand] Analysis result:', analysis);

                if (analysis && typeof analysis === 'string') {
                    // Simple parser for the AI response
                    const colorsMatch = analysis.match(/COLORS:\s*(#[0-9A-Fa-f]{6}),\s*(#[0-9A-Fa-f]{6})/);
                    const vibeMatch = analysis.match(/VIBE:\s*(.*)/);

                    setVisualOnboardingState(prev => ({
                        ...prev,
                        primaryColor: colorsMatch ? colorsMatch[1] : prev.primaryColor,
                        secondaryColor: colorsMatch ? colorsMatch[2] : prev.secondaryColor,
                        vibeDescription: vibeMatch ? vibeMatch[1] : prev.vibeDescription,
                    }));

                    notify('Inspiration analyzed! Wizard fields have been auto-filled.', 'success');
                    setVisualOnboardingStep(3); // Move to Step 3 (Colors) directly as Step 2 is more for website scan
                } else {
                    notify('AI returned an empty analysis. Please try again or fill manually.', 'info');
                }
            } else {
                notify('Failed to analyze inspiration images.', 'error');
            }
        } catch (err) {
            console.error('Inspiration analysis error:', err);
            notify('Error analyzing images.', 'error');
        } finally {
            setIsAnalyzingBrand(false);
        }
    };

    const handleGenerateStyleGuide = async (silent = false) => {
        if (!selectedRow) return null;

        if (!silent) setIsGeneratingImage(true);
        try {
            // Process design references to base64
            const base64Refs = await Promise.all(
                designReferences.map(url => blobToBase64(url))
            ).catch(err => {
                console.error('Error converting images to base64:', err);
                return [];
            });

            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/generate-dmp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction,
                    designReferences: base64Refs,
                    aspectRatio: selectedAspectRatio,
                    imageContext,
                    imageMood,
                    imageLighting
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setDmpDraft(data.dmp);
                // Update local rows
                setCalendarRows(prev => prev.map(r =>
                    r.contentCalendarId === selectedRow.contentCalendarId ? { ...r, dmp: data.dmp } : r
                ));
                if (!silent) notify('Visual Style Guide generated with references!', 'success');
                return data.dmp;
            } else {
                if (!silent) notify('Failed to generate Style Guide.', 'error');
                return null;
            }
        } catch (err) {
            console.error('DMP generation error:', err);
            if (!silent) notify('Error generating Style Guide.', 'error');
            return null;
        } finally {
            if (!silent) setIsGeneratingImage(false);
        }
    };

    const handleRefineDmp = async () => {
        if (!selectedRow || !aiRefinementMessage.trim()) return;

        setIsRefining(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${selectedRow.contentCalendarId}/dmp-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: aiRefinementMessage,
                    currentDmp: dmpDraft
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setDmpDraft(data.updatedDmp);
                setAiRefinementMessage('');
                notify('Style instructions refined by Assistant!', 'success');
                // Update local rows
                setCalendarRows(prev => prev.map(r =>
                    r.contentCalendarId === selectedRow.contentCalendarId ? { ...r, dmp: data.updatedDmp } : r
                ));
            } else {
                notify('Failed to refine instructions.', 'error');
            }
        } catch (err) {
            notify('Error joining AI Assistant.', 'error');
        } finally {
            setIsRefining(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedRow || !activeCompanyId || !brandKbId) {
            notify('Please ensure company and brand info are loaded.', 'error');
            return;
        }

        if (isEditingDmp) {
            notify('Please save or cancel edits first.', 'error');
            return;
        }

        setIsGeneratingImage(true);
        try {
            // Step 2: Generate Image
            const response = await authedFetch(
                `${backendBaseUrl}/api/content-calendar/batch-generate-image`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rowIds: [selectedRow.contentCalendarId],
                        brandKbId,
                        systemInstruction: systemInstruction ?? '',
                        provider,
                        model: (provider === 'replicate' || provider === 'fal') ? selectedModel : undefined,
                        aspectRatio: selectedAspectRatio
                    }),
                }
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                notify(`Image generation failed. ${data.error || ''}`, 'error');
            } else {
                notify('Image generation started! This may take a few moments.', 'success');
            }
        } catch (err) {
            notify('Network error triggering image generation.', 'error');
        } finally {
            setTimeout(() => setIsGeneratingImage(false), 2000);
        }
    };

    const handleSaveBrandRules = async (customRules?: string) => {
        if (!brandKbId) return;
        const finalRules = customRules ?? brandRulesDraft.trim();
        setIsGeneratingImage(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/brandkb/${brandKbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemInstruction: finalRules }),
            });
            if (!res.ok) {
                notify('Failed to save Brand Rules.', 'error');
                return;
            }
            setSystemInstruction(finalRules);
            setIsEditingBrandRules(false);
            notify('Step 1 Complete: Visual Identity updated! Proceed to Step 2.', 'success');

            // Auto-trigger Step 2 if possible and needed
            if (selectedRow && !selectedRow.dmp) {
                handleGenerateStyleGuide(true);
            }
        } catch (err) {
            notify('Error saving brand rules.', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };


    const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Mock upload for now
        const files = e.target.files;
        if (files && files[0]) {
            notify(`Reference image "${files[0].name}" attached (Simulation)`, 'info');
            // Logic to actually upload and store URLs would go here
        }
    };

    useEffect(() => {
        setBrandRulesDraft(systemInstruction);
    }, [systemInstruction]);

    const handleDismissItem = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDismissedIds(prev => [...new Set([...prev, id])]);
        if (selectedRowId === id) {
            // Find next available row in activeQueue
            const remaining = activeQueueRows.filter(r => r.contentCalendarId !== id);
            if (remaining.length > 0) {
                setSelectedRowId(remaining[0].contentCalendarId);
            } else {
                setSelectedRowId(null);
            }
        }
    };

    return (
        <main className="flex-1 bg-gray-50/50 p-2.5 md:p-6 min-h-0 relative flex flex-col overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-12%] left-[5%] w-[38%] h-[38%] bg-gradient-to-br from-[#6fb6e8]/18 to-[#81bad1]/14 rounded-full blur-[95px] animate-pulse" />
                <div className="absolute bottom-[-8%] right-[8%] w-[35%] h-[35%] bg-gradient-to-tl from-[#a78bfa]/14 to-[#3fa9f5]/12 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '900ms' }} />
            </div>

            <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
                {/* Header */}
                <header className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden flex-shrink-0">
                    <Sparkles className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                                title="Go Back"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
                                    Aesthetics & Visuals
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Image Hub</h2>
                            </div>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-400">Refine your design prompts and generate stunning AI visuals for approved content.</p>
                    </div>

                    <div className="hidden lg:flex items-center gap-6 relative z-10">
                        <div className="flex items-center gap-3">

                            <div className="w-px h-8 bg-white/10 mx-2" />

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Workflow</span>
                                    <span className="text-xs font-bold text-white uppercase">3-Step Process</span>
                                </div>
                                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 gap-1">
                                    <div className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-xl border border-blue-400/20">1. BRAND RULES</div>
                                    <ArrowRight size={14} className="text-white/20" />
                                    <div className={`px-3 py-1.5 ${imageContext ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'} text-[10px] font-black rounded-xl transition-all duration-300`}>2. IMAGE DESCRIPTION</div>
                                    <ArrowRight size={14} className="text-white/20" />
                                    <div className={`px-3 py-1.5 ${dmpDraft ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'} text-[10px] font-black rounded-xl transition-all duration-300`}>3. GENERATE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 md:p-8">
                    {selectedRow ? (
                        <div className="max-w-[1700px] mx-auto space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Step 1: Define Rules (Now a Card) */}
                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-fit">
                                    <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl relative">
                                                <Palette size={18} />
                                                <div className="absolute -top-1 -left-1 flex items-center justify-center w-4 h-4 bg-emerald-600 text-[10px] font-black text-white rounded-full">1</div>
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Step 1: Company Rules</h2>
                                                <p className="text-[10px] font-bold text-blue-600 -mt-0.5 uppercase tracking-widest bg-blue-50 px-2 rounded-md inline-block">Global Settings (Applies to all)</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsVisualOnboardingOpen(true)}
                                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 border border-transparent hover:border-slate-100 transition-all"
                                        >
                                            <Wand2 size={16} />
                                        </button>
                                    </header>

                                    <div className="p-6 space-y-8 bg-white overflow-y-auto max-h-[700px] custom-scrollbar">
                                        {/* Intelligence Tools */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                <Zap size={12} className="text-amber-400" />
                                                <span>Quick Setup Tools</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => {
                                                        setIsVisualOnboardingOpen(true);
                                                        setVisualOnboardingStep(1);
                                                    }}
                                                    className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-white hover:border-blue-200 transition-all group"
                                                >
                                                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                                                        <ImagePlus size={16} />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Analyze Images</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const url = prompt("Enter website URL:");
                                                        if (url) {
                                                            setWebsiteUrl(url);
                                                            handleAnalyzeWebsiteForVisuals();
                                                        }
                                                    }}
                                                    className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-white hover:border-indigo-200 transition-all group"
                                                >
                                                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                                                        <Monitor size={16} />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Scan Site</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Core Identity */}
                                        <div className="space-y-6 pt-4 border-t border-slate-50">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand Vibe & Personality</label>
                                                <textarea
                                                    value={visualOnboardingState.vibeDescription}
                                                    onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, vibeDescription: e.target.value }))}
                                                    placeholder="e.g. Modern, high-tech, minimalist with premium textures..."
                                                    className="w-full h-20 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner resize-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Color</label>
                                                    <div className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                        <input
                                                            type="color"
                                                            value={visualOnboardingState.primaryColor}
                                                            onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                            className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                                        />
                                                        <span className="text-[10px] font-black uppercase text-slate-600 font-mono tracking-tighter">{visualOnboardingState.primaryColor}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secondary Color</label>
                                                    <div className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                        <input
                                                            type="color"
                                                            value={visualOnboardingState.secondaryColor}
                                                            onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                                            className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                                        />
                                                        <span className="text-[10px] font-black uppercase text-slate-600 font-mono tracking-tighter">{visualOnboardingState.secondaryColor}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Imagery Mood</label>
                                                    <select
                                                        value={visualOnboardingState.imageryMood}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, imageryMood: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Clean & Bright', 'Dark & Moody', 'Vibrant & Pop', 'Soft Pastels', 'Vintage / Retro', 'Scientific / Technical', 'High Luxury', 'Street / Candid', 'Other'].map(mood => (
                                                            <option key={mood} value={mood}>{mood}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Typography</label>
                                                    <select
                                                        value={visualOnboardingState.fontStyle}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, fontStyle: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Modern Sans-Serif', 'Elegant Serif', 'Bold & Industrial', 'Playful & Rounded', 'Minimalist Mono', 'Other'].map(f => (
                                                            <option key={f} value={f}>{f}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Composition Style</label>
                                                <select
                                                    value={visualOnboardingState.compositionStyle}
                                                    onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, compositionStyle: e.target.value }))}
                                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                >
                                                    {['Minimalist', 'Full Page Photo', 'Split Screen', 'Dynamic Motion'].map(style => (
                                                        <option key={style} value={style}>{style}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lighting & Atmosphere</label>
                                                    <select
                                                        value={visualOnboardingState.lightingStyle}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, lightingStyle: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Natural Daylight', 'Studio Softbox', 'Cinematic / Dramatic', 'Golden Hour', 'Neon / Cyberpunk', 'High-Key / Bright', 'Low-Key / Moody'].map(light => (
                                                            <option key={light} value={light}>{light}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Camera Perspective</label>
                                                    <select
                                                        value={visualOnboardingState.perspective}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, perspective: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Eye-level', 'Flat Lay / Top-down', 'Birds Eye View', 'Low Angle / Heroic', 'Macro / Extreme Close-up', 'Wide / Panoramic'].map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Graphic Medium</label>
                                                    <select
                                                        value={visualOnboardingState.graphicStyle}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, graphicStyle: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Realistic Photo', '3D Render', 'Minimalist Illustration', 'Vector / Flat Art', 'Mixed Media', 'Digital Painting'].map(style => (
                                                            <option key={style} value={style}>{style}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Visual Weight</label>
                                                    <select
                                                        value={visualOnboardingState.visualComplexity}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, visualComplexity: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Ultra-Minimal', 'Clean & Balanced', 'Rich Detail', 'Dizzying Maximalist'].map(v => (
                                                            <option key={v} value={v}>{v}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Demographic</label>
                                                    <select
                                                        value={visualOnboardingState.targetDemographic}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, targetDemographic: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Professional & Corporate', 'Gen-Z / Trendsetters', 'Families & Parents', 'High-Net-Worth / Luxury', 'Tech Enthusiasts', 'Eco-Conscious', 'General Public'].map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Content Focus</label>
                                                    <select
                                                        value={visualOnboardingState.contentFocus}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, contentFocus: e.target.value }))}
                                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {['Product Centric', 'People & Lifestyle', 'Conceptual / Abstract', 'Interior / Architecture', 'Natural Landscapes', 'Balanced Mix'].map(f => (
                                                            <option key={f} value={f}>{f}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Visual Guardrails (Never use)</label>
                                                <textarea
                                                    value={visualOnboardingState.forbiddenElements}
                                                    onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, forbiddenElements: e.target.value }))}
                                                    placeholder="e.g. No stock photos, no generic suits..."
                                                    className="w-full h-20 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white transition-all shadow-inner resize-none"
                                                />
                                            </div>

                                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Style Instructions</label>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase border border-emerald-100">
                                                        <Check size={8} /> Active
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={brandRulesDraft}
                                                    onChange={(e) => setBrandRulesDraft(e.target.value)}
                                                    className="w-full h-64 p-5 bg-slate-900 text-slate-300 rounded-[2rem] text-[11px] font-mono leading-relaxed outline-none border border-slate-800 focus:border-blue-500/30 transition-all custom-scrollbar resize-none"
                                                    placeholder="The master design rules generated for the AI..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <footer className="p-6 border-t border-slate-100 bg-white space-y-3 mt-auto">
                                        <button
                                            onClick={handleGenerateVisualIdentity}
                                            disabled={isGeneratingImage}
                                            className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={14} className={`text-amber-400 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                                            AI Assistant Update
                                        </button>
                                        <button
                                            onClick={() => handleSaveBrandRules()}
                                            disabled={isGeneratingImage}
                                            className="w-full py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={14} />
                                            {isGeneratingImage ? 'Saving...' : 'Save & Continue'}
                                        </button>
                                    </footer>
                                </div>
                                {/* Left Col: Prompting */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-fit relative">
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl relative">
                                                    <PenTool size={18} />
                                                    <div className="absolute -top-1 -left-1 flex items-center justify-center w-4 h-4 bg-blue-600 text-[10px] font-black text-white rounded-full">2</div>
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                        Step 2: Specific Image
                                                    </h2>
                                                    <p className="text-[10px] font-bold text-slate-400 -mt-0.5 uppercase tracking-widest">Description for this post</p>
                                                </div>
                                            </div>
                                            {/* Style controls moved to Step 3 */}
                                        </div>

                                        <div className="p-6 space-y-6">
                                            {/* Step 2: Main Description Box */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Instructions & Subject</label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={handleInheritFromBrand}
                                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-100 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all group"
                                                            title="Pull keywords from Step 1"
                                                        >
                                                            <Palette size={10} className="group-hover:scale-110 transition-transform" />
                                                            Inherit
                                                        </button>
                                                        <button
                                                            onClick={handleMagicPropose}
                                                            disabled={isProposing}
                                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group disabled:opacity-50"
                                                            title="AI proposes 3 visual ideas"
                                                        >
                                                            {isProposing ? (
                                                                <RefreshCw size={10} className="animate-spin" />
                                                            ) : (
                                                                <Wand2 size={10} className="group-hover:scale-110 transition-transform" />
                                                            )}
                                                            Magic Propose
                                                        </button>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={imageContext}
                                                    onChange={(e) => setImageContext(e.target.value)}
                                                    placeholder="The Director's Chair: Describe exactly what we are making. Priority #1 in generation."
                                                    className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner resize-none leading-relaxed"
                                                />

                                                {/* Proposals Selection (Inline when open) */}
                                                {isProposalsModalOpen && proposals.length > 0 && (
                                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                                                        <div className="flex items-center justify-between mb-4 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <Sparkles size={14} className="text-blue-600" />
                                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Pick a Creative Direction</span>
                                                            </div>
                                                            <button onClick={() => setIsProposalsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {proposals.map((p, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => {
                                                                        setImageContext(p);
                                                                        setIsProposalsModalOpen(false);
                                                                    }}
                                                                    className="w-full text-left p-4 bg-white border border-blue-100 rounded-2xl text-xs font-medium hover:border-blue-500 hover:shadow-md transition-all group flex gap-3"
                                                                >
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-[10px] font-black">{i + 1}</div>
                                                                    <span className="text-slate-600 line-clamp-3 group-hover:text-slate-900 leading-relaxed">{p}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Aspect Ratio Presets */}
                                            <div className="mb-6">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Aspect Ratio Preset</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { id: '1:1', label: 'Square (1:1)', icon: <Layout size={14} /> },
                                                        { id: '4:5', label: 'Portrait (4:5)', icon: <Monitor size={14} className="rotate-90" /> },
                                                        { id: '16:9', label: 'Landscape (16:9)', icon: <Monitor size={14} /> },
                                                        { id: '9:16', label: 'Story (9:16)', icon: <Maximize2 size={14} /> }
                                                    ].map((ratio) => (
                                                        <button
                                                            key={ratio.id}
                                                            onClick={() => setSelectedAspectRatio(ratio.id)}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${selectedAspectRatio === ratio.id
                                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                                                : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                                                                }`}
                                                        >
                                                            {ratio.icon}
                                                            {ratio.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Integrated Design References (Collapsible) */}
                                            <div className="mt-8 pt-8 border-t border-slate-100">
                                                <button
                                                    onClick={() => setIsDesignReferencesOpen(!isDesignReferencesOpen)}
                                                    className="w-full flex items-center justify-between mb-2 group/ref hover:bg-slate-50 p-3 rounded-xl transition-all"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/ref:text-blue-500 transition-colors">Design Reference Studio</h3>
                                                        {designReferences.length > 0 && (
                                                            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[8px] font-bold">{designReferences.length}</div>
                                                        )}
                                                    </div>
                                                    <div className={`text-slate-300 transition-all duration-300 ${isDesignReferencesOpen ? 'rotate-180 text-blue-500' : ''}`}>
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </button>

                                                {isDesignReferencesOpen && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <p className="text-[10px] font-medium text-slate-400 mb-4 italic">Upload inspiration images to guide the AI's creative direction.</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[0, 1, 2].map((idx) => (
                                                                <div key={idx} className="aspect-video rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30 flex flex-col items-center justify-center relative group overflow-hidden hover:border-blue-200 transition-all cursor-pointer">
                                                                    {designReferences[idx] ? (
                                                                        <>
                                                                            <img src={designReferences[idx]} className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setDesignReferences(prev => prev.filter((_, i) => i !== idx));
                                                                                    }}
                                                                                    className="p-1.5 bg-white rounded-full text-slate-900 shadow-xl"
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ImagePlus size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        const url = URL.createObjectURL(file);
                                                                                        setDesignReferences(p => [...p, url].slice(0, 3));
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Generation Action Button (Centerpiece) */}
                                            <div className="mt-8">
                                                <button
                                                    onClick={() => handleGenerateStyleGuide()}
                                                    disabled={isGeneratingImage || !selectedRow}
                                                    className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:scale-[1.02] hover:shadow-blue-300 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                                >
                                                    {isGeneratingImage ? (
                                                        <RefreshCw size={18} className="animate-spin" />
                                                    ) : (
                                                        <Sparkles size={18} />
                                                    )}
                                                    Generate Vision
                                                </button>
                                                <p className="text-center mt-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Constructs Technical Style Guide</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Preview & Actions (Step 3) */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col h-fit">
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl relative">
                                                    <Sparkles size={18} />
                                                    <div className="absolute -top-1 -left-1 flex items-center justify-center w-4 h-4 bg-purple-600 text-[10px] font-black text-white rounded-full">3</div>
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                        Step 3: Final Output
                                                    </h2>
                                                    <p className="text-[10px] font-bold text-slate-400 -mt-0.5 uppercase tracking-widest bg-slate-50 px-2 rounded-md inline-block">Creation Phase</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Style Specs Controls (Moved from Step 2) */}
                                                {dmpDraft && (
                                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 mr-2">
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(dmpDraft);
                                                                notify('Style instructions copied!', 'success');
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
                                                            title="Copy Prompt"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setIsEditingDmp(!isEditingDmp)}
                                                            className={`p-1.5 rounded-lg transition-colors ${isEditingDmp ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                                                            title="Edit Mode"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setIsRefinerOpen(!isRefinerOpen)}
                                                            className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 px-2.5 ${isRefinerOpen ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                                            title="AI Style Refiner"
                                                        >
                                                            <Sparkles size={10} className={isRefining ? 'animate-pulse' : ''} />
                                                            <span className="text-[8px] font-black uppercase tracking-wider">Refine Style</span>
                                                        </button>
                                                    </div>
                                                )}

                                                <select
                                                    value={selectedModel}
                                                    onChange={(e) => {
                                                        const m = ALL_MODELS.find(x => x.id === e.target.value);
                                                        if (m) {
                                                            setSelectedModel(m.id);
                                                            setProvider(m.provider as any);
                                                        }
                                                    }}
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer hover:bg-white transition-all shadow-sm"
                                                >
                                                    {ALL_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col items-center bg-slate-100/30 overflow-y-auto custom-scrollbar h-full min-h-[500px] relative">
                                            {/* AI Refiner Assistant (Lightened) - Mapped to Output Column */}
                                            {isRefinerOpen && (
                                                <div className="w-full mb-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden z-[20]">
                                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-white text-indigo-600 rounded-lg">
                                                                <Sparkles size={14} />
                                                            </div>
                                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Style Tuner</h3>
                                                        </div>
                                                        <button onClick={() => setIsRefinerOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                                    </div>
                                                    <div className="relative group z-10">
                                                        <textarea
                                                            value={aiRefinementMessage}
                                                            onChange={(e) => setAiRefinementMessage(e.target.value)}
                                                            placeholder="e.g. 'Make it more professional'..."
                                                            className="w-full bg-white border border-indigo-100 rounded-xl p-4 pr-12 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none h-20 shadow-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleRefineDmp();
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={handleRefineDmp}
                                                            disabled={isRefining || !aiRefinementMessage.trim()}
                                                            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                                                        >
                                                            {isRefining ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Preview Image */}
                                            <div className="w-full flex flex-col items-center justify-center relative z-10 mb-8">
                                                {/* Design Pattern Grid (Subtle) */}
                                                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '16px 16px' }} />

                                                {getImageGeneratedUrl(selectedRow) ? (
                                                    <div className="relative group/preview w-full flex items-center justify-center z-10">
                                                        <img
                                                            src={`${getImageGeneratedUrl(selectedRow)}?v=${imagePreviewNonce}`}
                                                            alt="Preview"
                                                            className="max-w-full max-h-[600px] rounded-2xl shadow-premium-lg object-contain bg-white transition-all duration-500 relative z-10"
                                                            onError={(e) => {
                                                                console.warn("Visual Output failed to load (likely expired link):", getImageGeneratedUrl(selectedRow));
                                                                // Handle visually if needed
                                                            }}
                                                        />
                                                        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 opacity-0 group-hover/preview:opacity-100 transition-opacity z-40">
                                                            <button
                                                                onClick={() => setIsZoomModalOpen(true)}
                                                                className="px-4 py-2 bg-white text-slate-900 text-[10px] font-bold rounded-full shadow-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                            >
                                                                <Maximize2 size={12} />
                                                                Expand
                                                            </button>
                                                            <button
                                                                onClick={handleDownload}
                                                                className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-full backdrop-blur-md flex items-center gap-2 shadow-xl hover:bg-blue-700 transition-colors pointer-events-auto"
                                                            >
                                                                <Download size={12} />
                                                                Download
                                                            </button>
                                                            <button
                                                                onClick={() => setImagePreviewNonce(n => n + 1)}
                                                                className="px-4 py-2 bg-slate-900/80 text-white text-[10px] font-bold rounded-full backdrop-blur-md flex items-center gap-2 shadow-xl hover:bg-slate-900 transition-colors pointer-events-auto"
                                                            >
                                                                <History size={12} />
                                                                Refresh
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-12 max-w-sm relative z-10">
                                                        <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
                                                            <Image size={32} strokeWidth={1} />
                                                        </div>
                                                        <h3 className="text-slate-900 font-bold mb-2">Ready to Design?</h3>
                                                        <p className="text-xs text-slate-500 leading-relaxed font-semibold italic opacity-80 mb-6">
                                                            Visual instructions are ready. Click the button below to bring this concept to life.
                                                        </p>
                                                        <div className="flex items-center justify-center animate-bounce text-blue-400">
                                                            <ArrowRight size={20} className="rotate-90" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-8 border-t border-slate-100 bg-white space-y-6">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleGenerate}
                                                        disabled={isGeneratingImage || isEditingDmp || !dmpDraft.trim() || !userPermissions?.canGenerate}
                                                        className="flex-1 py-4 bg-[#3fa9f5] text-white rounded-2xl text-base font-black shadow-lg shadow-blue-200/50 hover:bg-[#2f97e6] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                                                        title={!userPermissions?.canGenerate ? "You don't have permission to generate images" : !dmpDraft.trim() ? "Generate Style Guide first (Step 1)" : "Create high-res visual"}
                                                    >
                                                        {isGeneratingImage ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap size={20} className="text-amber-300" />
                                                                Step 3: Generate Image
                                                            </>
                                                        )}
                                                    </button>
                                                    {getImageGeneratedUrl(selectedRow) && (
                                                        <button
                                                            onClick={() => handleDismissItem(selectedRow.contentCalendarId)}
                                                            className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                                                            title="Satisfied? Dismiss from queue"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Ready to Post
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Technical Spec / Technical Persona (Moved from Step 2) */}
                                                {dmpDraft && (
                                                    <div className="pt-6 border-t border-slate-50 w-full animate-in fade-in slide-in-from-top-4 duration-700">
                                                        <button
                                                            onClick={() => setShowTechnicalPrompt(!showTechnicalPrompt)}
                                                            className="w-full flex items-center justify-between group/persona mb-4"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                                    <ShieldCheck size={14} />
                                                                </div>
                                                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Active Visual Persona</h3>
                                                            </div>
                                                            <div className={`text-slate-300 group-hover/persona:text-indigo-600 transition-all ${showTechnicalPrompt ? 'rotate-180' : ''}`}>
                                                                <ChevronDown size={14} />
                                                            </div>
                                                        </button>

                                                        {showTechnicalPrompt ? (
                                                            <div className="relative group">
                                                                <textarea
                                                                    value={dmpDraft}
                                                                    onChange={(e) => setDmpDraft(e.target.value)}
                                                                    readOnly={!isEditingDmp}
                                                                    className={`w-full min-h-[300px] p-5 rounded-2xl font-mono text-[10px] border-2 outline-none transition-all resize-none shadow-inner ${isEditingDmp
                                                                        ? 'border-blue-500/30 bg-white ring-8 ring-blue-500/[0.03]'
                                                                        : 'border-slate-100 bg-slate-50/50 text-slate-600'
                                                                        }`}
                                                                />
                                                                {!isEditingDmp && (
                                                                    <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                                                                        <button
                                                                            onClick={() => setIsEditingDmp(true)}
                                                                            className="bg-white/90 backdrop-blur shadow-xl border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black uppercase text-slate-600 pointer-events-auto"
                                                                        >
                                                                            Edit Spec
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {isEditingDmp && (
                                                                    <div className="mt-4 flex items-center justify-end gap-2">
                                                                        <button onClick={() => setIsEditingDmp(false)} className="text-[10px] font-bold text-slate-400">Cancel</button>
                                                                        <button onClick={handleSaveDmp} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold">Save Spec</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 group/mini hover:bg-slate-100 transition-all cursor-pointer" onClick={() => setShowTechnicalPrompt(true)}>
                                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-indigo-50 flex items-center justify-center text-indigo-500">
                                                                    <Eye size={18} />
                                                                </div>
                                                                <div className="flex-1 text-left">
                                                                    <p className="text-[10px] font-black text-slate-700 uppercase">Persona Locked</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">Click to view/edit technical style guide</p>
                                                                </div>
                                                                <ArrowRight size={14} className="text-slate-300 group-hover/mini:translate-x-1 transition-transform" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 py-2 rounded-lg border border-slate-100">
                                                    <div className="p-1 bg-white rounded-md border shadow-sm">
                                                        <Layout size={10} className="text-blue-500" />
                                                    </div>
                                                    Moves to <span className="text-blue-600">Studio</span> for final posting
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm max-w-4xl mx-auto relative overflow-hidden">
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] text-blue-50 opacity-[0.4] pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-sm">
                                    <MousePointer2 size={48} className="text-blue-500/30 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">No Visual Selected</h2>
                                <p className="text-slate-500 max-w-sm font-medium mb-8">
                                    Please select an approved content item from the Content Studio to begin generating visuals.
                                </p>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Studio
                                </button>

                                {dismissedIds.length > 0 && (
                                    <button
                                        onClick={() => setDismissedIds([])}
                                        className="mt-12 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"
                                    >
                                        <History size={16} />
                                        Restore finished items
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox / Zoom Modal */}
            {
                isZoomModalOpen && getImageGeneratedUrl(selectedRow) && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
                        onClick={() => setIsZoomModalOpen(false)}
                    >
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />

                        <button
                            className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-20 shadow-2xl"
                            onClick={() => setIsZoomModalOpen(false)}
                        >
                            <X size={24} />
                        </button>

                        <div
                            className="relative z-10 max-w-7xl w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={getImageGeneratedUrl(selectedRow)!}
                                alt="Visual Detail"
                                className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500"
                            />

                            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Theme</span>
                                    <span className="text-sm font-bold text-white truncate max-w-sm">{selectedRow?.theme}</span>
                                </div>
                                <div className="w-px h-8 bg-white/10 mx-2" />
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    <Download size={14} />
                                    Download High-Res
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isVisualOnboardingOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsVisualOnboardingOpen(false)} />

                        <div className="relative z-10 w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-500">
                            {/* Progress Header */}
                            <div className="px-12 pt-12 pb-8 bg-white border-b border-slate-50 relative z-20">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-200">
                                            <Palette size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Design System Onboarding</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Step {visualOnboardingStep} of 5</p>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Building your visual identity</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsVisualOnboardingOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors group">
                                        <X size={28} className="text-slate-400 group-hover:text-slate-600" />
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <div
                                            key={s}
                                            className={`h-2 flex-1 rounded-full transition-all duration-700 relative overflow-hidden ${s <= visualOnboardingStep ? 'bg-blue-600' : 'bg-slate-100'}`}
                                        >
                                            {s === visualOnboardingStep && (
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 px-12 overflow-y-auto custom-scrollbar space-y-10 py-10">
                                {visualOnboardingStep === 1 && (
                                    <div className="animate-in slide-in-from-right-8 duration-700 space-y-10 max-w-2xl">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <Sparkles size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Visual Inspiration (Optional)</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Upload images you love and we'll extract the "DNA" of your brand.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                {[0, 1, 2].map((idx) => (
                                                    <div key={idx} className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center relative group overflow-hidden hover:border-blue-200 hover:bg-white transition-all cursor-pointer shadow-inner">
                                                        {brandInspirationImages[idx] ? (
                                                            <>
                                                                <img src={brandInspirationImages[idx]} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setBrandInspirationImages(prev => prev.filter((_, i) => i !== idx));
                                                                        }}
                                                                        className="p-3 bg-white rounded-full text-slate-900 shadow-2xl"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="p-4 bg-white rounded-2xl mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                                                    <ImagePlus size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Image</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            const url = URL.createObjectURL(file);
                                                                            setBrandInspirationImages(p => [...p, url].slice(0, 3));
                                                                        }
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {brandInspirationImages.length > 0 && (
                                                <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-4">
                                                    <button
                                                        onClick={handleAnalyzeBrand}
                                                        disabled={isAnalyzingBrand}
                                                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-4 relative overflow-hidden"
                                                    >
                                                        {isAnalyzingBrand ? (
                                                            <>
                                                                <RefreshCw size={20} className="animate-spin text-blue-400" />
                                                                <span>Extracting Brand DNA...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap size={20} className="text-amber-400" />
                                                                <span>Analyze & Auto-Fill Wizard</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Our AI Vision will scan colors, fonts, and moods to save you time.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {visualOnboardingStep === 2 && (
                                    <div className="animate-in slide-in-from-right-8 duration-700 space-y-10 max-w-2xl">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <RefreshCw size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Fast Track: Crawler (Optional)</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">We'll scan your site for colors and descriptions</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={websiteUrl}
                                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                                    placeholder="https://yourwebsite.com"
                                                    className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
                                                />
                                                <button
                                                    onClick={handleAnalyzeWebsiteForVisuals}
                                                    disabled={isAnalyzingWebsite || !websiteUrl}
                                                    className="px-8 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isAnalyzingWebsite ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                                                    {isAnalyzingWebsite ? 'Scanning...' : 'Scan Site'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <Monitor size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Brand Vibe & Style</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Tell us the personality of your brand's visuals</p>
                                                </div>
                                            </div>
                                            <textarea
                                                value={visualOnboardingState.vibeDescription}
                                                onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, vibeDescription: e.target.value }))}
                                                placeholder="e.g. A modern, high-tech vibe with clean lines and lots of white space. It should feel premium and trustworthy but also innovative..."
                                                className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-600 leading-relaxed shadow-inner"
                                            />
                                        </div>
                                    </div>
                                )}

                                {visualOnboardingStep === 3 && (
                                    <div className="animate-in slide-in-from-right-8 duration-700 space-y-10 max-w-2xl">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <Zap size={20} />
                                                <h4 className="text-lg font-black tracking-tight">Your Brand Colors</h4>
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">These will be used for gradients, overlays, and UI elements.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Accent</span>
                                                <div className="relative group">
                                                    <input
                                                        type="color"
                                                        value={visualOnboardingState.primaryColor}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                        className="w-32 h-32 rounded-[2.5rem] cursor-pointer border-8 border-white shadow-xl group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={visualOnboardingState.primaryColor}
                                                    onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-center text-sm font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secondary Accent</span>
                                                <div className="relative group">
                                                    <input
                                                        type="color"
                                                        value={visualOnboardingState.secondaryColor}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                                        className="w-32 h-32 rounded-[2.5rem] cursor-pointer border-8 border-white shadow-xl group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={visualOnboardingState.secondaryColor}
                                                    onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-center text-sm font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {visualOnboardingStep === 4 && (
                                    <div className="animate-in slide-in-from-right-8 duration-700 space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Type size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Font Style & Preview</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Select a typography vibe for your text overlays</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { id: 'Modern Sans-Serif', label: 'Modern Sans', class: 'font-sans', preview: 'Inter / Roboto' },
                                                    { id: 'Elegant Serif', label: 'Elegant Serif', class: 'font-serif', preview: 'Playfair / Times' },
                                                    { id: 'Bold & Industrial', label: 'Bold Display', class: 'font-sans font-black uppercase tracking-tighter', preview: 'IMPACT / BLACK' },
                                                    { id: 'Playful & Rounded', label: 'Playful Rounded', class: 'font-sans rounded-xl', preview: 'Fredoka / Nunito' },
                                                    { id: 'Minimalist Mono', label: 'Minimalist Mono', class: 'font-mono', preview: 'Fira / Courier' },
                                                    { id: 'Other', label: 'Custom Option', class: '', preview: 'Define your own' }
                                                ].map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setVisualOnboardingState(prev => ({ ...prev, fontStyle: item.id }))}
                                                        className={`w-full p-6 rounded-[2rem] text-left transition-all border-2 flex flex-col gap-2 ${visualOnboardingState.fontStyle === item.id ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 scale-[1.03] z-10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${visualOnboardingState.fontStyle === item.id ? 'text-blue-100' : 'text-slate-400'}`}>{item.label}</span>
                                                        <span className={`text-xl ${item.class} ${visualOnboardingState.fontStyle === item.id ? 'text-white' : 'text-slate-900'}`}>{item.preview}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {visualOnboardingState.fontStyle === 'Other' && (
                                                <div className="animate-in slide-in-from-top-2 duration-300 pt-2">
                                                    <input
                                                        type="text"
                                                        value={visualOnboardingState.customFont}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, customFont: e.target.value }))}
                                                        placeholder="e.g. Gotham Rounded Bold or a handwriting font..."
                                                        className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-900 outline-none placeholder:text-blue-300"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <Camera size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Imagery Mood</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Determine the photography aesthetic</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Clean & Bright', 'Dark & Moody', 'Vibrant & Pop', 'Soft Pastels', 'Vintage / Retro', 'Scientific / Technical', 'High Luxury', 'Street / Candid', 'Other'].map(mood => (
                                                    <button
                                                        key={mood}
                                                        onClick={() => setVisualOnboardingState(prev => ({ ...prev, imageryMood: mood }))}
                                                        className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${visualOnboardingState.imageryMood === mood ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                                    >
                                                        {mood}
                                                    </button>
                                                ))}
                                            </div>
                                            {visualOnboardingState.imageryMood === 'Other' && (
                                                <div className="animate-in slide-in-from-top-2 duration-300">
                                                    <textarea
                                                        value={visualOnboardingState.customImageryMood}
                                                        onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, customImageryMood: e.target.value }))}
                                                        placeholder="Describe your imagery mood in detail (e.g. grainy black and white film style showing urban architectures)..."
                                                        className="w-full h-24 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 outline-none placeholder:text-emerald-300 shadow-inner"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {visualOnboardingStep === 5 && (
                                    <div className="animate-in slide-in-from-right-8 duration-700 space-y-12 max-w-2xl">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                    <Layout size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Composition Style</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">How should the elements be arranged?</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { id: 'Minimalist', desc: 'Lots of negative space, centered focus' },
                                                    { id: 'Full Page Photo', desc: 'Edge-to-edge imagery with light overlays' },
                                                    { id: 'Split Screen', desc: 'Distinct sections for text and imagery' },
                                                    { id: 'Dynamic Motion', desc: 'Action-oriented, diagonal lines, high energy' }
                                                ].map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setVisualOnboardingState(prev => ({ ...prev, compositionStyle: item.id }))}
                                                        className={`w-full p-6 rounded-[2rem] text-left border-2 transition-all flex flex-col gap-1 ${visualOnboardingState.compositionStyle === item.id ? 'bg-amber-600 border-amber-600 shadow-xl shadow-amber-100 scale-[1.03] z-10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <span className={`text-base font-black tracking-tight ${visualOnboardingState.compositionStyle === item.id ? 'text-white' : 'text-slate-900'}`}>{item.id}</span>
                                                        <span className={`text-[9px] font-bold ${visualOnboardingState.compositionStyle === item.id ? 'text-amber-100' : 'text-slate-400'}`}>{item.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                                    <EyeOff size={18} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Visual Guardrails</label>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">What should the AI absolutely never do?</p>
                                                </div>
                                            </div>
                                            <textarea
                                                value={visualOnboardingState.forbiddenElements}
                                                onChange={(e) => setVisualOnboardingState(prev => ({ ...prev, forbiddenElements: e.target.value }))}
                                                placeholder="e.g. No low-quality stock photos, no bright red, no cursive fonts, no generic corporate suits..."
                                                className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:bg-white shadow-inner"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <footer className="px-12 py-10 border-t border-slate-100 flex items-center justify-between bg-white relative z-20">
                                <button
                                    onClick={() => visualOnboardingStep > 1 && setVisualOnboardingStep(v => v - 1)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${visualOnboardingStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                                >
                                    <ChevronLeft size={20} />
                                    Previous Step
                                </button>

                                <div className="flex gap-4">
                                    {visualOnboardingStep < 5 ? (
                                        <button
                                            onClick={() => setVisualOnboardingStep(v => v + 1)}
                                            className="flex items-center gap-4 px-12 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all group"
                                        >
                                            Next Step
                                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleGenerateVisualIdentity}
                                            disabled={isGeneratingImage}
                                            className="flex items-center gap-4 px-12 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isGeneratingImage ?
                                                <span className="flex items-center gap-3">
                                                    <RefreshCw size={20} className="animate-spin" />
                                                    Creating Identity...
                                                </span>
                                                : (
                                                    <>
                                                        <ShieldCheck size={20} />
                                                        Finalize & Generate
                                                    </>
                                                )}
                                        </button>
                                    )}
                                </div>
                            </footer>
                        </div>
                    </div>
                )
            }
        </main>
    );
}
