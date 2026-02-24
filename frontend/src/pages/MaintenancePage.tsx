import React from 'react';
import { Hammer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MaintenancePage: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 overflow-hidden">
            {/* Abstract Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Visual Icon with rotating gear */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50">
                        <Hammer className="w-12 h-12 text-brand-primary" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Under Maintenance
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        We're currently performing scheduled system upgrades to improve your experience. ContentGenerator will be back shortly.
                    </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">status: server upgrading</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-left italic">
                        All your data and generated content remain safe. Background scheduling is paused during this window.
                    </p>
                </div>

                <Button
                    variant="secondary"
                    className="rounded-xl font-bold px-8 h-12 gap-2 hover:bg-slate-50"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="w-4 h-4" />
                    Check Status
                </Button>

                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-8">
                    &copy; {new Date().getFullYear()} Startuplab AI
                </p>
            </div>
        </div>
    );
};
