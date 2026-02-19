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
    placement?: 'top' | 'bottom' | 'left' | 'right';
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
    placement = 'bottom',
    isLastStep = false,
    ctaText,
    highlight = false,
}: TourTooltipProps) {
    const getArrowStyle = () => {
        switch (placement) {
            case 'top':
                return "absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-lg border-r border-b border-gray-100";
            case 'bottom':
                return "absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-lg border-l border-t border-gray-100";
            case 'left':
                return "absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 shadow-lg border-r border-t border-gray-100";
            case 'right':
                return "absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 shadow-lg border-l border-b border-gray-100";
            default:
                return "hidden";
        }
    };

    return (
        <div
            className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                maxWidth: '380px',
                width: 'calc(100vw - 40px)',
            }}
        >
            <div className={`bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 relative border border-gray-100 ${highlight ? 'ring-4 ring-blue-500/20 ring-offset-0 border-blue-500' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-black text-gray-900 pr-4 tracking-tight leading-tight">{title}</h3>
                    <button
                        onClick={onSkip}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                        aria-label="Skip tour"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed font-medium">{description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Progress</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-black text-gray-900 leading-none">
                                {currentStep}
                            </span>
                            <span className="text-gray-300 font-bold">/</span>
                            <span className="text-sm font-bold text-gray-400">
                                {totalSteps}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSkip}
                            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={onNext}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center gap-2 ${highlight
                                ? 'bg-gradient-to-r from-blue-600 to-[#3fa9f5] hover:shadow-blue-500/40'
                                : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                                }`}
                        >
                            {ctaText || (isLastStep ? 'Complete Journey' : 'Continue')}
                            {!isLastStep && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Arrow */}
                <div className={getArrowStyle()} />
            </div>
        </div>
    );
}
