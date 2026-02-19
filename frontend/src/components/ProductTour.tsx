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
        description: 'View your content performance, analytics, and quick actions. This is your command center.',
        placement: 'right',
    },
    {
        target: '[data-tour="planner"]',
        title: '🎯 Content Planner',
        description: 'Define your goals and let AI structure your long-term campaign strategy and scheduled posts.',
        placement: 'right',
    },
    {
        target: '[data-tour="create"]',
        title: '✨ Create Content',
        description: 'Generate new social media posts with AI assistance. Create engaging content in seconds.',
        placement: 'right',
    },
    {
        target: '[data-tour="calendar"]',
        title: '📅 Content Calendar',
        description: 'Plan, schedule, and manage your content pipeline. See all your posts at a glance.',
        placement: 'right',
    },
    {
        target: '[data-tour="image-hub"]',
        title: '🖼️ Image Hub',
        description: 'Generate stunning AI visuals for your social posts. Choose from multiple styles and upscale your brand imagery.',
        placement: 'right',
    },
    {
        target: '[data-tour="studio"]',
        title: '🎨 Studio Editor',
        description: 'Refine and perfect your posts in our powerful editor before they go live.',
        placement: 'right',
    },
    {
        target: '[data-tour="toolbox"]',
        title: '🧰 AI Toolbox',
        description: 'A suite of specialized AI tools for research, copywriting, and strategy.',
        placement: 'right',
    },
    {
        target: '[data-tour="leads"]',
        title: '🧲 Lead Magnets',
        description: 'Convert your social reach into a loyal audience. Create high-value lead magnets and digital assets in seconds with AI.',
        placement: 'right',
    },
    {
        target: '[data-tour="published"]',
        title: '✅ Published Posts',
        description: 'Review your history of successfully published content across all social channels.',
        placement: 'right',
    },
    {
        target: '[data-tour="insights"]',
        title: '📈 Performance Insights',
        description: 'Analyze what works and optimize your strategy with detailed engagement data.',
        placement: 'right',
    },
    {
        target: '[data-tour="library"]',
        title: '📁 Media Library',
        description: 'Organize your images, videos, and Brand DNA assets for quick use in any post.',
        placement: 'right',
    },
    {
        target: '[data-tour="ai-assistant"]',
        title: '🤖 AI Assistant',
        description: 'Your autonomous command center. Use it to navigate, update brand rules, or get creative strategy advice on the fly.',
        placement: 'left',
    },
    {
        target: '[data-tour="profile-settings"]',
        title: '👤 Profile & Security',
        description: 'Manage your personal account, update your avatar, and configure security preferences.',
        placement: 'left',
    },
    {
        target: '[data-tour="company-settings"]',
        title: '⚙️ Company Settings',
        description: '🎯 Finalize your Brand Intelligence here! Configure your voice, audience, and AI preferences to get personalized content.',
        placement: 'right',
        highlight: true,
        ctaText: 'Go to Settings',
        navigateTo: 'settings/brand-intelligence',
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
