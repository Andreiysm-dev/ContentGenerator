import React from 'react';
import { Target, Lightbulb, TrendingUp } from 'lucide-react';

interface OnboardingStrategicStepProps {
    mission: string;
    setMission: (value: string) => void;
    valueProps: string[];
    setValueProps: (values: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}

export function OnboardingStrategicStep({
    mission,
    setMission,
    valueProps,
    setValueProps,
    onNext,
    onBack
}: OnboardingStrategicStepProps) {

    const handleValuePropChange = (index: number, value: string) => {
        const newProps = [...valueProps];
        newProps[index] = value;
        setValueProps(newProps);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4">
                    <Target className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Strategic Core</h2>
                <p className="text-slate-600 text-lg">Define your purpose and what makes you unique.</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
                {/* Mission Statement */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-semibold text-slate-900">Mission Statement</h3>
                    </div>
                    <textarea
                        value={mission}
                        onChange={(e) => setMission(e.target.value)}
                        placeholder="e.g. To democratize access to financial freedom for everyone..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all min-h-[100px] text-slate-700 placeholder:text-slate-400 font-medium"
                    />
                </div>

                {/* Value Propositions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-semibold text-slate-900">Key Value Propositions (Top 3)</h3>
                    </div>
                    <div className="space-y-3">
                        {[0, 1, 2].map((index) => (
                            <input
                                key={index}
                                type="text"
                                value={valueProps[index] || ''}
                                onChange={(e) => handleValuePropChange(index, e.target.value)}
                                placeholder={`Value Prop #${index + 1}`}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                            />
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
                    disabled={!mission || valueProps.filter(Boolean).length === 0}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
