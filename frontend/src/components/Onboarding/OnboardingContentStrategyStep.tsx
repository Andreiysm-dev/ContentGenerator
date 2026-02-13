import React from 'react';
import { Layers, Share2, Plus, X } from 'lucide-react';

interface OnboardingContentStrategyStepProps {
    pillars: string[];
    setPillars: (pillars: string[]) => void;
    platform: string;
    setPlatform: (platform: string) => void;
    onNext: () => void;
    onBack: () => void;
}

const COMMON_PLATFORMS = [
    { id: 'LinkedIn', label: 'LinkedIn', color: 'bg-[#0077b5]' },
    { id: 'Twitter', label: 'Twitter / X', color: 'bg-black' },
    { id: 'Instagram', label: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
    { id: 'Facebook', label: 'Facebook', color: 'bg-[#1877f2]' },
    { id: 'YouTube', label: 'YouTube', color: 'bg-[#ff0000]' },
    { id: 'Blog', label: 'Company Blog', color: 'bg-orange-500' }
];

export function OnboardingContentStrategyStep({
    pillars,
    setPillars,
    platform,
    setPlatform,
    onNext,
    onBack
}: OnboardingContentStrategyStepProps) {
    const [newPillar, setNewPillar] = React.useState('');

    const handleAddPillar = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newPillar.trim() && !pillars.includes(newPillar.trim())) {
            setPillars([...pillars, newPillar.trim()]);
            setNewPillar('');
        }
    };

    const removePillar = (pillarToRemove: string) => {
        setPillars(pillars.filter(p => p !== pillarToRemove));
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                    <Share2 className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Content Strategy</h2>
                <p className="text-slate-600 text-lg">What do you talk about, and where?</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
                {/* Content Pillars */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold text-slate-900">Content Pillars (Topics)</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                        {pillars.map((p) => (
                            <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-sm font-medium animate-in zoom-in-50 duration-200">
                                {p}
                                <button onClick={() => removePillar(p)} className="hover:text-purple-900">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <form onSubmit={handleAddPillar} className="relative">
                        <input
                            type="text"
                            value={newPillar}
                            onChange={(e) => setNewPillar(e.target.value)}
                            placeholder="Add a topic (e.g. 'Industry Trends')"
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newPillar.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                {/* Primary Platform */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-slate-900">Primary Channel</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {COMMON_PLATFORMS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPlatform(p.id)}
                                className={`
                                    relative p-3 rounded-xl border text-center transition-all duration-200
                                    ${platform === p.id
                                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                        : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${p.color}`} />
                                <span className={`text-sm font-medium ${platform === p.id ? 'text-blue-700' : 'text-slate-600'}`}>
                                    {p.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto pt-4 flex gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={pillars.length === 0 || !platform}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
