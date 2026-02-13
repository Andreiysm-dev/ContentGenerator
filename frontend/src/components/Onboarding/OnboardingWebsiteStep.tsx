import React, { useState } from 'react';
import { Sparkles, Globe, Loader2, ArrowRight } from 'lucide-react';

interface OnboardingWebsiteStepProps {
    websiteUrl: string;
    setWebsiteUrl: (url: string) => void;
    onExtract: () => Promise<void>;
    isExtracting: boolean;
    onSkip: () => void;
}

export function OnboardingWebsiteStep({
    websiteUrl,
    setWebsiteUrl,
    onExtract,
    isExtracting,
    onSkip
}: OnboardingWebsiteStepProps) {
    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">
                    Where does the magic happen?
                </h2>
                <p className="text-slate-600 text-lg">
                    Enter your website URL to instantly extract your brand DNA.
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white rounded-xl border border-slate-200 shadow-sm">
                        <Globe className="ml-4 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourcompany.com"
                            className="w-full bg-transparent border-none text-slate-900 px-4 py-4 focus:ring-0 placeholder:text-slate-400"
                            onKeyDown={(e) => e.key === 'Enter' && websiteUrl && onExtract()}
                        />
                    </div>
                </div>

                <button
                    onClick={onExtract}
                    disabled={!websiteUrl || isExtracting}
                    className={`
            w-full relative group overflow-hidden rounded-xl px-4 py-4 font-bold text-white 
            transition-all duration-300
            ${!websiteUrl || isExtracting
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-lg shadow-blue-500/20'
                        }
          `}
                >
                    {isExtracting ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Analyzing your brand...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                            <span>Extract Brand DNA</span>
                        </div>
                    )}
                </button>

                <div className="text-center">
                    <button
                        onClick={onSkip}
                        disabled={isExtracting}
                        className="text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                        I don't have a website yet <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
