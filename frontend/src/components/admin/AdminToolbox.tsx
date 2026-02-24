import React, { useState } from 'react';
import { Wrench, Shield, Zap, Megaphone, Save, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Setting {
    value: any;
    description: string;
}

interface AdminToolboxProps {
    settings: Record<string, Setting> | null;
    onUpdateSetting: (key: string, value: any) => Promise<void>;
    onSendBroadcast: (title: string, message: string) => Promise<void>;
    onPurgeLogs: (days: number) => Promise<void>;
}

export const AdminToolbox: React.FC<AdminToolboxProps> = ({
    settings,
    onUpdateSetting,
    onSendBroadcast,
    onPurgeLogs
}) => {
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [purgeDays, setPurgeDays] = useState(30);
    const [isPurging, setIsPurging] = useState(false);

    if (!settings) return null;

    const handleToggle = async (key: string, currentValue: any) => {
        setIsSaving(key);
        try {
            await onUpdateSetting(key, !currentValue);
        } finally {
            setIsSaving(null);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) return;
        setIsBroadcasting(true);
        try {
            await onSendBroadcast(broadcastTitle, broadcastMessage);
            setBroadcastTitle('');
            setBroadcastMessage('');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handlePurge = async () => {
        setIsPurging(true);
        try {
            await onPurgeLogs(purgeDays);
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Maintenance & Announcements */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Power size={20} className="text-rose-500" />
                        System Controls
                    </h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Maintenance Mode</p>
                                <p className="text-[10px] text-slate-500">{settings.maintenance_mode.description}</p>
                            </div>
                            <Button
                                variant={settings.maintenance_mode.value ? "secondary" : "default"}
                                size="sm"
                                disabled={isSaving === 'maintenance_mode'}
                                onClick={() => handleToggle('maintenance_mode', settings.maintenance_mode.value)}
                                className="rounded-xl font-bold px-4 h-8 text-xs"
                            >
                                {settings.maintenance_mode.value ? 'DISABLED' : 'ENABLED'}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                <Megaphone size={12} className="text-brand-primary" />
                                Global Banner Text
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    placeholder="Enter system banner text..."
                                    value={settings.system_announcement.value}
                                    onChange={(e) => onUpdateSetting('system_announcement', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Megaphone size={20} className="text-amber-500" />
                        System Broadcast
                    </h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Message Title"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="Type your message to all users..."
                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium"
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                        />
                        <Button
                            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 gap-2 shadow-lg shadow-amber-200"
                            disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                            onClick={handleBroadcast}
                        >
                            <Zap size={16} />
                            {isBroadcasting ? 'Sending...' : 'Send Broadcast to All Users'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Zap size={20} className="text-amber-500" />
                        API Usage Quotas
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(settings.api_usage_caps.value).map(([key, value]) => (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>{key.replace(/_/g, ' ')}</span>
                                    <span>{value as number} / day</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    value={value as number}
                                    onChange={(e) => onUpdateSetting('api_usage_caps', { ...settings.api_usage_caps.value, [key]: parseInt(e.target.value) })}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-indigo-500" />
                        Database Maintenance
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Logs Retention</span>
                                <span className="text-sm font-black text-slate-900">{purgeDays} Days</span>
                            </div>
                            <input
                                type="range"
                                min="7"
                                max="180"
                                step="7"
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                value={purgeDays}
                                onChange={(e) => setPurgeDays(parseInt(e.target.value))}
                            />
                            <Button
                                variant="secondary"
                                className="w-full rounded-xl font-bold h-10 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all text-sm gap-2"
                                disabled={isPurging}
                                onClick={handlePurge}
                            >
                                <Wrench size={16} />
                                {isPurging ? 'Purging Old Logs...' : 'Execute Manual Purge'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
