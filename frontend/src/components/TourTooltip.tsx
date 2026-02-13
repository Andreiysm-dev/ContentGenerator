import React from 'react';
import { X, ArrowRight } from 'lucide-react';

interface TourTooltipProps {
    title: string;
    description: string;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onSkip: () => void;
    position: { top: number; left: number };
    isLastStep?: boolean;
    ctaText?: string;
    highlight?: boolean;
}

export function TourTooltip({
    title,
    description,
    currentStep,
    totalSteps,
    onNext,
    onSkip,
    position,
    isLastStep = false,
    ctaText,
    highlight = false,
}: TourTooltipProps) {
    return (
        <div
            className="fixed z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                maxWidth: '400px',
            }}
        >
            <div className={`bg-white rounded-xl shadow-2xl p-6 ${highlight ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 pr-4">{title}</h3>
                    <button
                        onClick={onSkip}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Skip tour"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {currentStep} of {totalSteps}
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={onSkip}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Skip Tour
                        </button>
                        <button
                            onClick={onNext}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 ${highlight
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-lg'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {ctaText || (isLastStep ? 'Finish' : 'Next')}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Arrow pointing up to target */}
            <div className="absolute -top-2 left-8 w-4 h-4 bg-white rotate-45 shadow-lg" />
        </div>
    );
}
