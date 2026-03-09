import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';

interface TourStep {
    target: string;
    title: string;
    description: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    highlight?: boolean;
    ctaText?: string;
    navigateTo?: string;
}

interface ProductTourProps {
    onComplete: () => void;
    onSkip: () => void;
    companyId: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="dashboard"]',
        title: '📊 Dashboard',
        description: 'Your real-time command center. Track performance, see recent activity, and take quick actions across your workspace.',
        placement: 'right',
    },
    {
        target: '[data-tour="company-settings"]',
        title: '🧬 Brand DNA',
        description: '🎯 Brand Intelligence starts here! Define your voice, audience, and specialized rules to ensure AI always sounds just like you.',
        placement: 'right',
    },
    {
        target: '[data-tour="planner"]',
        title: '🎯 Content Planner',
        description: 'Think long-term. Let AI structure your marketing strategy and generate month-long campaign clusters in seconds.',
        placement: 'right',
    },
    {
        target: '[data-tour="create"]',
        title: '✨ Swift Create',
        description: 'Need a post now? Generate high-engagement social media content with AI assistance on the fly.',
        placement: 'right',
    },
    {
        target: '[data-tour="calendar"]',
        title: '🗂️ Content Board',
        description: 'Manage your content pipeline. Move posts through stages from Planning to Success in a visual Kanban view.',
        placement: 'right',
    },
    {
        target: '[data-tour="scheduler"]',
        title: '📅 Content Calendar',
        description: 'Your bird\'s-eye view. Visualize your entire posting schedule and ensure consistent brand presence.',
        placement: 'right',
    },
    {
        target: '[data-tour="image-hub"]',
        title: '🖼️ Image Hub',
        description: 'Generate stunning AI visuals tailored to your posts. Choose from specialized styles and upscale your brand imagery.',
        placement: 'right',
    },
    {
        target: '[data-tour="studio"]',
        title: '🎨 Content Studio',
        description: 'The ultimate staging ground. Refine drafts, manage approvals, and track scheduled posts with a multi-tab workflow.',
        placement: 'right',
    },
    {
        target: '[data-tour="leads"]',
        title: '🧲 Lead Generation',
        description: 'Turn social attention into ownership. Create high-value lead magnets and digital assets instantly with AI.',
        placement: 'right',
    },
    {
        target: '[data-tour="toolbox"]',
        title: '🧰 Marketing AI',
        description: 'A specialized suite of AI utilities for deep research, growth hacks, and advanced copywriting strategy.',
        placement: 'right',
    },
    {
        target: '[data-tour="insights"]',
        title: '📈 Performance Analytics',
        description: 'Go beyond likes. Analyze detailed engagement data to see what works and optimize your strategy.',
        placement: 'right',
    },
    {
        target: '[data-tour="library"]',
        title: '📁 Media Library',
        description: 'Centralize your creative assets. Manage images, videos, and brand files for instant access across the platform.',
        placement: 'right',
    },
    {
        target: '[data-tour="admin-console"]',
        title: '🛡️ Admin Console',
        description: 'Platform management. Configure core AI prompts, monitor system health, and view detailed audit logs.',
        placement: 'right',
    },
    {
        target: '[data-tour="ai-assistant"]',
        title: '🤖 Command Center',
        description: 'Your autonomous AI assistant. Use it to navigate, update brand rules, or brainstorm strategy on the fly.',
        placement: 'left',
    },
    {
        target: '[data-tour="profile-settings"]',
        title: '👤 Account & Security',
        description: 'Manage your identity, personal preferences, and security settings in one place.',
        placement: 'left',
        highlight: true,
        ctaText: 'View Profile',
        navigateTo: 'profile',
    },
];

export function ProductTour({ onComplete, onSkip, companyId }: ProductTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
    const navigate = useNavigate();

    const currentTourStep = TOUR_STEPS[currentStep];

    useEffect(() => {
        const updatePosition = () => {
            const element = document.querySelector(currentTourStep.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);

                const tooltipWidth = 380;
                const tooltipHeight = 220; // Estimated height
                const gap = 16;
                const margin = 20;

                let finalPlacement = currentTourStep.placement || 'bottom';

                const calculatePos = (p: string) => {
                    switch (p) {
                        case 'top':
                            return {
                                top: rect.top - tooltipHeight - gap,
                                left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
                            };
                        case 'bottom':
                            return {
                                top: rect.bottom + gap,
                                left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
                            };
                        case 'left':
                            return {
                                top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
                                left: rect.left - tooltipWidth - gap
                            };
                        case 'right':
                            return {
                                top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
                                left: rect.right + gap
                            };
                        default:
                            return { top: rect.bottom + gap, left: rect.left };
                    }
                };

                let pos = calculatePos(finalPlacement);

                // Simple collision detection and flip
                if (finalPlacement === 'bottom' && pos.top + tooltipHeight > window.innerHeight - margin) {
                    finalPlacement = 'top';
                    pos = calculatePos('top');
                } else if (finalPlacement === 'top' && pos.top < margin) {
                    finalPlacement = 'bottom';
                    pos = calculatePos('bottom');
                }

                // Horizontal boundary check
                if (pos.left < margin) pos.left = margin;
                if (pos.left + tooltipWidth > window.innerWidth - margin) {
                    pos.left = window.innerWidth - tooltipWidth - margin;
                }

                // Vertical boundary check (final fallback)
                if (pos.top < margin) pos.top = margin;
                if (pos.top + tooltipHeight > window.innerHeight - margin) {
                    pos.top = window.innerHeight - tooltipHeight - margin;
                }

                setTooltipPosition({ top: pos.top, left: pos.left });
                setPlacement(finalPlacement as any);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStep, currentTourStep.target, currentTourStep.placement]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onSkip();
            } else if (e.key === 'Enter') {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep, onSkip]);

    const handleNext = () => {
        if (currentStep === TOUR_STEPS.length - 1) {
            // Last step - navigate to settings if specified
            if (currentTourStep.navigateTo && companyId) {
                navigate(`/company/${encodeURIComponent(companyId)}/${currentTourStep.navigateTo}`);
                // Small delay to ensure navigation happens before completing
                setTimeout(() => {
                    onComplete();
                }, 100);
            } else {
                onComplete();
            }
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    return (
        <>
            <TourSpotlight targetRect={targetRect} isActive={true} />
            <TourTooltip
                title={currentTourStep.title}
                description={currentTourStep.description}
                currentStep={currentStep + 1}
                totalSteps={TOUR_STEPS.length}
                onNext={handleNext}
                onSkip={onSkip}
                position={tooltipPosition}
                placement={placement}
                isLastStep={currentStep === TOUR_STEPS.length - 1}
                ctaText={currentTourStep.ctaText}
                highlight={currentTourStep.highlight}
            />
        </>
    );
}
