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
        target: '[data-tour="drafts"]',
        title: '📝 Drafts',
        description: 'Access your saved drafts and work-in-progress content. Never lose your ideas.',
        placement: 'right',
    },
    {
        target: '[data-tour="company-settings"]',
        title: '⚙️ Company Settings',
        description: '🎯 Continue setting up your Brand Intelligence here! Configure your brand voice, audience, and AI preferences to get better, more personalized content.',
        placement: 'right',
        highlight: true,
        ctaText: 'Go to Settings',
        navigateTo: 'settings',
    },
];

export function ProductTour({ onComplete, onSkip, companyId }: ProductTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const navigate = useNavigate();

    const currentTourStep = TOUR_STEPS[currentStep];

    useEffect(() => {
        const updatePosition = () => {
            const element = document.querySelector(currentTourStep.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);

                // Calculate tooltip position (below the target)
                const tooltipTop = rect.bottom + 16;
                const tooltipLeft = rect.left;
                setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStep, currentTourStep.target]);

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
                isLastStep={currentStep === TOUR_STEPS.length - 1}
                ctaText={currentTourStep.ctaText}
                highlight={currentTourStep.highlight}
            />
        </>
    );
}
