import React from 'react';

interface TourSpotlightProps {
    targetRect: DOMRect | null;
    isActive: boolean;
}

export function TourSpotlight({ targetRect, isActive }: TourSpotlightProps) {
    if (!isActive || !targetRect) return null;

    const padding = 8;

    return (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
            {/* Highlight border with glow - no dark overlay */}
            <div
                className="absolute border-2 border-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 pointer-events-none"
                style={{
                    top: `${targetRect.top - padding}px`,
                    left: `${targetRect.left - padding}px`,
                    width: `${targetRect.width + padding * 2}px`,
                    height: `${targetRect.height + padding * 2}px`,
                }}
            />
        </div>
    );
}
