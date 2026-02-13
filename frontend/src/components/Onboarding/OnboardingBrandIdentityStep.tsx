import React from 'react';
import { Building2, Briefcase } from 'lucide-react';

interface OnboardingBrandIdentityStepProps {
    companyName: string;
    setCompanyName: (val: string) => void;
    industry: string;
    setIndustry: (val: string) => void;
    onNext: () => void;
    onBack: () => void;
}

const INDUSTRY_OPTIONS = [
    'Marketing & Advertising', 'E-commerce', 'SaaS / Software', 'Finance',
    'Healthcare', 'Real Estate', 'Education', 'Hospitality', 'Other'
];

export function OnboardingBrandIdentityStep({
    companyName,
    setCompanyName,
    industry,
    setIndustry,
    onNext,
    onBack
}: OnboardingBrandIdentityStepProps) {
    const isValid = companyName.trim() && industry;

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Let’s get acquainted</h2>
                <p className="text-slate-600 text-lg">Tell us a bit about your business.</p>
            </div>

            <div className="max-w-md mx-auto space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Company Name</label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Startuplab"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-12 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Industry</label>
                    <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                            value={INDUSTRY_OPTIONS.includes(industry) ? industry : (industry ? 'Other' : '')}
                            onChange={(e) => {
                                if (e.target.value === 'Other') {
                                    setIndustry('Custom');
                                } else {
                                    setIndustry(e.target.value);
                                }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-12 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer shadow-sm"
                        >
                            <option value="" disabled className="text-slate-400">Select an industry</option>
                            {INDUSTRY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt} className="bg-white text-slate-900">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Render input if value is 'Other' or custom */}
                    {((industry === 'Custom') || (industry && !INDUSTRY_OPTIONS.includes(industry))) && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs text-slate-500 ml-1 mb-1 block">Specify Industry</label>
                            <input
                                type="text"
                                value={industry === 'Custom' ? '' : industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g. Biotech, Logistics, Gaming..."
                                className="w-full bg-slate-50 border border-blue-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={!isValid}
                        className={`
              flex-1 rounded-xl px-6 py-3 font-bold text-white transition-all duration-200
              ${isValid
                                ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }
            `}
                    >
                        Continue
                    </button>
                </div>
            </div >
        </div >
    );
}
