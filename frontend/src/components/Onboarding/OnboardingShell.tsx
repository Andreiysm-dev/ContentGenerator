import React from 'react';
import { X } from 'lucide-react';

interface OnboardingShellProps {
    currentStep: number;
    totalSteps: number;
    onClose?: () => void;
    children: React.ReactNode;
}

export function OnboardingShell({
    currentStep,
    totalSteps,
    onClose,
    children
}: OnboardingShellProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-100/60 backdrop-blur-md animate-in fade-in duration-300">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-amber-100/30 to-pink-100/30 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5">
                {/* Header / Progress */}
                <div className="relative h-1.5 bg-slate-100">
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Close Button (Optional) */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
}
