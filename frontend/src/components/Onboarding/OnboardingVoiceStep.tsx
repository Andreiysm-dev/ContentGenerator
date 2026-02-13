import React from 'react';
import { Sparkles, MessageSquare, Zap, Coffee } from 'lucide-react';

interface OnboardingVoiceStepProps {
    onSetVoice: (voice: { formal: number; energy: number; bold: number; emoji: string }) => void;
    brandVoice?: { formality: string; energy: string; confidence: string };
    onComplete: () => void;
    onBack: () => void;
    isSubmitting: boolean;
}

const VIBES = [
    {
        id: 'professional',
        label: 'Trusted Authority',
        description: 'Formal, concise, and expert-driven.',
        icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
        values: { formal: 90, energy: 50, bold: 70, emoji: 'Rarely' },
        gradient: 'from-slate-800 to-slate-900'
    },
    {
        id: 'friendly',
        label: 'Friendly Neighbor',
        description: 'Warm, casual, and approachable.',
        icon: <Coffee className="w-6 h-6 text-emerald-400" />,
        values: { formal: 30, energy: 50, bold: 40, emoji: 'Sometimes' },
        gradient: 'from-emerald-900/30 to-slate-900'
    },
    {
        id: 'energetic',
        label: 'Hype Engine',
        description: 'High energy, bold, and exciting!',
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        values: { formal: 20, energy: 90, bold: 90, emoji: 'Often' },
        gradient: 'from-purple-900/30 to-pink-900/20'
    },
    {
        id: 'empathetic',
        label: 'Helpful Guide',
        description: 'Calm, supportive, and clear.',
        icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
        values: { formal: 50, energy: 40, bold: 50, emoji: 'Sometimes' },
        gradient: 'from-cyan-900/30 to-blue-900/20'
    }
];

export function OnboardingVoiceStep({
    onSetVoice,
    onComplete,
    onBack,
    isSubmitting
}: OnboardingVoiceStepProps) {
    const [selectedVibe, setSelectedVibe] = React.useState<string | null>(null);

    const handleSelect = (vibe: any) => {
        setSelectedVibe(vibe.id);
        onSetVoice(vibe.values);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">How do we sound?</h2>
                <p className="text-slate-600 text-lg">Pick a vibe that matches your brand.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {VIBES.map((vibe) => (
                    <button
                        key={vibe.id}
                        onClick={() => handleSelect(vibe)}
                        className={`
              group relative p-6 rounded-2xl border text-left transition-all duration-300
              hover:scale-[1.02] hover:shadow-xl
              ${selectedVibe === vibe.id
                                ? 'bg-gradient-to-br from-blue-50 to-white border-blue-500 shadow-blue-500/20'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                            }
            `}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-3 rounded-xl ${selectedVibe === vibe.id ? 'bg-blue-100/50 text-blue-600' : 'bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'} transition-colors`}>
                                {vibe.icon}
                            </div>
                            {selectedVibe === vibe.id && <div className="text-blue-600 font-bold text-xs uppercase tracking-wider bg-blue-100 px-2 py-1 rounded-full">Selected</div>}
                        </div>

                        <h3 className={`text-lg font-bold mb-1 transition-colors ${selectedVibe === vibe.id ? 'text-blue-900' : 'text-slate-900 group-hover:text-blue-700'}`}>
                            {vibe.label}
                        </h3>
                        <p className={`text-sm leading-relaxed transition-colors ${selectedVibe === vibe.id ? 'text-blue-700/80' : 'text-slate-500'}`}>
                            {vibe.description}
                        </p>
                    </button>
                ))}
            </div>

            <div className="max-w-md mx-auto pt-4 flex gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onComplete}
                    disabled={!selectedVibe || isSubmitting}
                    className={`
            flex-1 rounded-xl px-6 py-3 font-bold text-white transition-all duration-200
            ${selectedVibe && !isSubmitting
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-lg shadow-blue-500/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }
          `}
                >
                    {isSubmitting ? 'Finalizing...' : 'Complete Setup'}
                </button>
            </div>
        </div>
    );
}
