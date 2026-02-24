import React, { useEffect, useState } from 'react';
import { Activity, Database, Shield, Server, CheckCircle2, AlertCircle } from 'lucide-react';

interface HealthData {
    database: { status: string; latency: string };
    openai: { status: string; message: string };
    gemini: { status: string; message: string };
    fal_ai: { status: string; message: string };
    replicate: { status: string; message: string };
    storage: { status: string; provider: string };
    uptime: number;
    timestamp: string;
}

export const AdminHealth: React.FC<{ health: HealthData | null }> = ({ health }) => {
    if (!health) return null;

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    };

    const StatusBadge = ({ status, message }: { status: string; message?: string }) => (
        <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                {status === 'healthy' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                {status.toUpperCase()}
            </span>
            {message && <span className="text-[9px] text-slate-400 font-medium max-w-[120px] truncate text-right">{message}</span>}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Database */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Database size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Database</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Status</span>
                            <StatusBadge status={health.database.status} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Latency</span>
                            <span className="text-sm font-mono font-bold text-slate-700">{health.database.latency}</span>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                            <Server size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Server Info</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Uptime</span>
                            <span className="text-sm font-bold text-slate-700">{formatUptime(health.uptime)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Last Check</span>
                            <span className="text-[10px] font-mono text-slate-400">{new Date(health.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Storage */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Activity size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Cloud Storage</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Status</span>
                            <StatusBadge status={health.storage.status} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Provider</span>
                            <span className="text-[10px] font-bold text-slate-700">{health.storage.provider}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Provider Health */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-brand-primary" />
                    AI Service Providers Connectivity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: 'OpenAI (GPT-4o)', ...health.openai },
                        { name: 'Google (Gemini 2.0)', ...health.gemini },
                        { name: 'Fal.ai (Flux/Stable)', ...health.fal_ai },
                        { name: 'Replicate (Video/Img)', ...health.replicate }
                    ].map((provider) => (
                        <div key={provider.name} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                            <span className="text-xs font-bold text-slate-700">{provider.name}</span>
                            <div className="flex justify-start">
                                <StatusBadge status={provider.status} message={provider.message} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
