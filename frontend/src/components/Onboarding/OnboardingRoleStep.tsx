import React from 'react';

interface OnboardingRoleStepProps {
    selectedRole: string;
    onSelectRole: (role: string) => void;
    onNext: () => void;
}

const ROLE_OPTIONS = [
    { value: 'ceo_owner', label: 'CEO / Owner', icon: '👔' },
    { value: 'digital_marketer', label: 'Digital Marketer', icon: '📱' },
    { value: 'content_creator', label: 'Content Creator', icon: '✍️' },
    { value: 'social_media_manager', label: 'Social Media Manager', icon: '📊' },
    { value: 'graphic_designer', label: 'Graphic Designer', icon: '🎨' },
    { value: 'other', label: 'Other', icon: '💼' },
];

export function OnboardingRoleStep({ selectedRole, onSelectRole, onNext }: OnboardingRoleStepProps) {
    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-slate-900">
                    Welcome aboard!
                </h2>
                <p className="text-slate-600 text-lg">
                    What describes your role best?
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {ROLE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => {
                            onSelectRole(option.value);
                            // Small delay to show selection before auto-advancing
                            setTimeout(onNext, 400);
                        }}
                        className={`
              group relative p-6 rounded-xl border transition-all duration-300 text-left
              hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10
              ${selectedRole === option.value
                                ? 'bg-blue-50 border-blue-500/50 shadow-blue-500/20'
                                : 'bg-white border-slate-200 hover:border-blue-300/50 hover:bg-slate-50'
                            }
            `}
                    >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                            {option.icon}
                        </div>
                        <div className={`font-semibold text-lg ${selectedRole === option.value ? 'text-blue-700' : 'text-slate-700'}`}>
                            {option.label}
                        </div>

                        {/* Selection Glow */}
                        {selectedRole === option.value && (
                            <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-white animate-pulse" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
