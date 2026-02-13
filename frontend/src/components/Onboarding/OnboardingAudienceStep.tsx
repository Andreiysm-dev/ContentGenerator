import React from 'react';
import { Target, Users, AlertCircle, Trophy } from 'lucide-react';

interface OnboardingAudienceStepProps {
    audienceRole: string;
    setAudienceRole: (val: string) => void;
    audienceIndustry: string;
    setAudienceIndustry: (val: string) => void;
    audiencePainPoints: string[];
    setAudiencePainPoints: (val: string[]) => void;
    audienceOutcome: string;
    setAudienceOutcome: (val: string) => void;
    onNext: () => void;
    onBack: () => void;
    isExtracting?: boolean;
}

export function OnboardingAudienceStep({
    audienceRole,
    setAudienceRole,
    audienceIndustry,
    setAudienceIndustry,
    audiencePainPoints,
    setAudiencePainPoints,
    audienceOutcome,
    setAudienceOutcome,
    onNext,
    onBack
}: OnboardingAudienceStepProps) {

    const handlePainPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Split by comma and filter empty strings
        const points = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
        // We only update the state if there are actual values or empty to allow typing
        // Actually, for a text input representing an array, it's better to store a local string state
        // but here we are passed the setter for the array. 
        // Let's assume the parent handles the array directly for now, but a tag input would be better.
        // For simplicity in this "Holo" version, let's keep it as a comma-separated string input
        // that parses on blur or change.
        setAudiencePainPoints(points);
    };

    // Local state for the input display value
    const [painPointsInput, setPainPointsInput] = React.useState(audiencePainPoints.join(', '));

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Who are we talking to?</h2>
                <p className="text-slate-600 text-lg">Define your ideal customer profile.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Users className="w-4 h-4 text-blue-500" /> Target Role
                    </label>
                    <input
                        type="text"
                        value={audienceRole}
                        onChange={(e) => setAudienceRole(e.target.value)}
                        placeholder="e.g. Marketing Managers"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                    />
                </div>

                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-colors">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Target className="w-4 h-4 text-purple-500" /> Industry
                    </label>
                    <input
                        type="text"
                        value={audienceIndustry}
                        onChange={(e) => setAudienceIndustry(e.target.value)}
                        placeholder="e.g. SaaS Tech"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-purple-500 outline-none placeholder:text-slate-400"
                    />
                </div>

                <div className="col-span-2 space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-pink-300 transition-colors">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <AlertCircle className="w-4 h-4 text-pink-500" /> Main Pain Points
                    </label>
                    <input
                        type="text"
                        value={painPointsInput}
                        onChange={(e) => {
                            setPainPointsInput(e.target.value);
                            handlePainPointsChange(e);
                        }}
                        placeholder="e.g. Low budget, lack of time, complexity..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-pink-500 outline-none placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-500 pl-1">Separate multiple points with commas</p>
                </div>

                <div className="col-span-2 space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Trophy className="w-4 h-4 text-emerald-500" /> Desired Outcome
                    </label>
                    <input
                        type="text"
                        value={audienceOutcome}
                        onChange={(e) => setAudienceOutcome(e.target.value)}
                        placeholder="e.g. Increase ROI by 20%"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
                    />
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl px-6 py-3 font-bold text-white hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/20"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
