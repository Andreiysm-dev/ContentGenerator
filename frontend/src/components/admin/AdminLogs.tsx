import React from 'react';
import { FileText, User, Calendar, Tag, Info } from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata: any;
    created_at: string;
}

export const AdminLogs: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-primary" />
                    Security & Audit Trails
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing Last 100 Actions</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No audit logs found. System actions will appear here.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User size={12} className="text-slate-500" />
                                            </div>
                                            <span className="text-xs font-mono text-slate-600 truncate max-w-[120px]" title={log.user_id}>
                                                {log.user_id?.split('-')[0]}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${log.action.includes('DELETE') ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Tag size={12} className="text-slate-300" />
                                            <span className="text-sm font-medium text-slate-700 capitalize">{log.entity_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="group relative">
                                                <Info size={14} className="text-slate-400 cursor-help" />
                                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                                    <div className="bg-slate-900 text-white p-3 rounded-lg text-[10px] font-mono whitespace-pre shadow-xl max-w-xs">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                                {log.entity_id}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
