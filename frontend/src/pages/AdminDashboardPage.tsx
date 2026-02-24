import React, { useEffect, useState } from 'react';
import {
    Users,
    Building2,
    FileText,
    Image as ImageIcon,
    TrendingUp,
    Activity,
    UserPlus,
    Calendar,
    ShieldCheck,
    ChevronRight,
    Search,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Wrench,
    Zap,
    History,
    Activity as HealthIcon,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AdminHealth } from '@/components/admin/AdminHealth';
import { AdminLogs } from '@/components/admin/AdminLogs';
import { AdminToolbox } from '@/components/admin/AdminToolbox';

interface AdminStats {
    totalUsers: number;
    totalCompanies: number;
    totalContent: number;
    totalImages: number;
    totalSpend: number;
}

interface RecentActivity {
    contentCalendarId: string;
    status: string;
    created_at: string;
    company: {
        companyName: string;
    };
}

interface AdminDashboardPageProps {
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    backendBaseUrl: string;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    tab?: 'overview' | 'users' | 'companies' | 'health' | 'logs' | 'toolbox';
}
interface UserProfile {
    id: string;
    role: string | null;
    onboarding_completed: boolean;
    created_at: string;
    email?: string;
    full_name?: string;
}

interface CompanyItem {
    companyId: string;
    companyName: string;
    industry: string;
    created_at: string;
    profiles: {
        id: string;
        email?: string;
        full_name?: string;
    } | null;
    contentCount: number;
    imageCount: number;
    usage: number;
    totalSpend: number;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
    authedFetch,
    backendBaseUrl,
    notify,
    tab = 'overview'
}) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [companies, setCompanies] = useState<CompanyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const activeTab = tab;
    const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
    const [isResettingOnboarding, setIsResettingOnboarding] = useState<string | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [filterText, setFilterText] = useState("");

    const handleImpersonate = async (userId: string) => {
        try {
            await authedFetch(`${backendBaseUrl}/api/admin/audit/impersonate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, action: 'START' })
            });
        } catch (e) {
            console.error('Failed to log impersonation start', e);
        }

        sessionStorage.setItem('impersonateUserId', userId);
        localStorage.removeItem('activeCompanyId'); // Clear current company to force reload of target user's data
        notify('Swapping context... View as user mode active.', 'success');
        window.location.href = '/';
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview') {
                const res = await authedFetch(`${backendBaseUrl}/api/admin/stats`);
                if (!res.ok) throw new Error('Failed to fetch admin stats');
                const data = await res.json();
                setStats(data.stats);
                setActivities(data.recentActivities);
            } else if (activeTab === 'users') {
                const res = await authedFetch(`${backendBaseUrl}/api/admin/users`);
                if (!res.ok) throw new Error('Failed to fetch users');
                const data = await res.json();
                setUsers(data.users);
            } else if (activeTab === 'companies') {
                const res = await authedFetch(`${backendBaseUrl}/api/admin/companies`);
                if (!res.ok) throw new Error('Failed to fetch companies');
                const data = await res.json();
                setCompanies(data.companies);
            } else if (activeTab === 'logs') {
                const res = await authedFetch(`${backendBaseUrl}/api/admin/logs`);
                if (!res.ok) throw new Error('Failed to fetch logs');
                const data = await res.json();
                setAuditLogs(data.logs || []);
            } else if (activeTab === 'health') {
                const res = await authedFetch(`${backendBaseUrl}/api/admin/health`);
                if (!res.ok) throw new Error('Failed to fetch health status');
                const data = await res.json();
                setHealth(data.health);
            } else if (activeTab === 'toolbox') {
                const res = await authedFetch(`${backendBaseUrl}/api/admin/settings`);
                if (!res.ok) throw new Error('Failed to fetch settings');
                const data = await res.json();
                setSettings(data.settings);
            }
        } catch (err) {
            notify(`Failed to load ${activeTab} data`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, currentRole: string | null) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        setIsUpdatingRole(userId);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/users/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });

            if (!res.ok) throw new Error('Failed to update role');

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            notify(`User promoted to ${newRole}`, 'success');
        } catch (err) {
            notify('Failed to update user role', 'error');
        } finally {
            setIsUpdatingRole(null);
        }
    };

    const handleResetOnboarding = async (userId: string) => {
        if (!window.confirm('Are you sure you want to reset onboarding for this user? They will be redirect to the onboarding flow on their next login.')) return;

        setIsResettingOnboarding(userId);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/users/reset-onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!res.ok) throw new Error('Failed to reset onboarding');

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, onboarding_completed: false } : u));
            notify('Onboarding status reset successfully', 'success');
        } catch (err) {
            notify('Failed to reset onboarding', 'error');
        } finally {
            setIsResettingOnboarding(null);
        }
    };

    const handleUpdateSetting = async (key: string, value: any) => {
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (!res.ok) throw new Error('Failed to update setting');
            notify('Setting updated successfully', 'success');
            // Refresh settings
            const fetchRes = await authedFetch(`${backendBaseUrl}/api/admin/settings`);
            const data = await fetchRes.json();
            setSettings(data.settings);
        } catch (err) {
            notify('Failed to update setting', 'error');
        }
    };

    const handleSendBroadcast = async (title: string, message: string) => {
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, type: 'info' })
            });
            if (!res.ok) throw new Error('Failed to send broadcast');
            notify('Broadcast sent to all users successfully', 'success');
        } catch (err) {
            notify('Failed to send broadcast', 'error');
        }
    };

    const handlePurgeLogs = async (days: number) => {
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/logs/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days })
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to purge logs');
            notify(`Successfully purged ${data.deletedCount} old audit logs`, 'success');
        } catch (err) {
            notify('Failed to purge logs', 'error');
        }
    };

    const handleDeleteCompany = async (companyId: string, companyName: string) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete "${companyName}"? This cannot be undone and will delete all associated content.`)) return;

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/admin/companies/${companyId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete company');
            notify(`Company "${companyName}" deleted`, 'success');
            setCompanies(prev => prev.filter(c => c.companyId !== companyId));
        } catch (err) {
            notify('Failed to delete company', 'error');
        }
    };

    if (isLoading && !users.length && !stats) {
        return (
            <div className="p-8 animate-pulse">
                <div className="h-8 w-64 bg-slate-200 rounded mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200"></div>
                    ))}
                </div>
                <div className="h-96 bg-slate-50 rounded-2xl border border-slate-200"></div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', trendUp: true, isCurrency: false },
        { label: 'Total Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+5%', trendUp: true, isCurrency: false },
        { label: 'Content Items', value: stats?.totalContent || 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+18%', trendUp: true, isCurrency: false },
        { label: 'Images Generated', value: stats?.totalImages || 0, icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+24%', trendUp: true, isCurrency: false },
        { label: 'Total API Spend', value: stats?.totalSpend || 0, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Live', trendUp: true, isCurrency: true },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Global platform overview and analytics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={fetchData} className="gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Activity className="w-4 h-4" />
                        Refresh Data
                    </Button>
                </div>
            </header>

            {activeTab === 'overview' ? (
                <>
                    {/* Stat Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {statCards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`${card.bg} ${card.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {card.trend}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                                    <p className="text-3xl font-bold text-slate-900">
                                        {card.isCurrency ? `$${Number(card.value).toFixed(2)}` : card.value.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Activity Table */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-brand-primary" />
                                    Recent Content Activity
                                </h2>
                                <Button variant="ghost" className="text-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 gap-1 text-sm">
                                    View All <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activities.map((activity) => {
                                            const statusObj = typeof activity.status === 'string'
                                                ? { state: activity.status }
                                                : (activity.status as any) || { state: 'Unknown' };
                                            const statusState = statusObj.state || 'Unknown';

                                            return (
                                                <tr key={activity.contentCalendarId} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                                                                {activity.company?.companyName?.[0] || 'C'}
                                                            </div>
                                                            <span className="font-semibold text-slate-900">{activity.company?.companyName || 'Loading...'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusState === 'Ready' || statusState === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                                                            statusState === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {statusState}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {new Date(activity.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {activities.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    No recent activity found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions & System Health */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    Quick Actions
                                </h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { label: 'Manage Users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'users' },
                                        { label: 'Generate Reports', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
                                        { label: 'System Settings', icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50' },
                                        { label: 'Audit Logs', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    ].map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => action.tab && navigate(`/admin/${action.tab}`)}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-200 hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left group"
                                        >
                                            <div className={`${action.bg} ${action.color} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                                                <action.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-semibold text-slate-700 group-hover:text-brand-primary transition-colors">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-brand-dark to-slate-900 p-6 rounded-2xl text-white shadow-premium-lg flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                    <TrendingUp className="w-8 h-8 text-brand-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">System Healthy</h3>
                                    <p className="text-white/60 text-sm mt-1">All services are operating normally. No active incidents reported.</p>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="w-[98%] h-full bg-brand-primary shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
                                </div>
                                <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">99.9% Uptime</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'users' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-primary" />
                            User Directory
                        </h2>
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder="Search by name, email or ID..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all w-64"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Onboarding</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u =>
                                    u.full_name?.toLowerCase().includes(filterText.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(filterText.toLowerCase()) ||
                                    u.id.toLowerCase().includes(filterText.toLowerCase())
                                ).map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 leading-none mb-1">{user.full_name || 'Anonymous User'}</span>
                                                <span className="text-xs text-slate-500 mb-1">{user.email}</span>
                                                <span className="font-mono text-[10px] text-slate-400 select-all truncate max-w-[120px]" title={user.id}>{user.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                                }`}>
                                                {user.role || 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.onboarding_completed ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                                <span className="text-sm text-slate-600">{user.onboarding_completed ? 'Completed' : 'Pending'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleResetOnboarding(user.id)}
                                                    disabled={isResettingOnboarding === user.id}
                                                    className="rounded-xl px-3 font-bold text-xs h-9 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all gap-1"
                                                    title="Reset Onboarding"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${isResettingOnboarding === user.id ? 'animate-spin' : ''}`} />
                                                    Reset
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleUpdateRole(user.id, user.role)}
                                                    disabled={isUpdatingRole === user.id}
                                                    className={`rounded-xl px-4 font-bold text-xs h-9 transition-all border ${user.role === 'ADMIN'
                                                        ? 'text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200'
                                                        : 'text-brand-primary border-brand-primary/20 hover:bg-brand-primary/5 hover:border-brand-primary/30'
                                                        }`}
                                                >
                                                    {isUpdatingRole === user.id ? 'Updating...' : user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleImpersonate(user.id)}
                                                    className="rounded-xl px-4 font-bold text-xs h-9 transition-all border border-amber-200 text-amber-600 hover:bg-amber-50"
                                                >
                                                    View as user
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'companies' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    {/* ... existing companies table ... */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Company Directory
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">API Usage</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Created</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {companies.map((company) => (
                                    <tr key={company.companyId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                    {company.companyName?.[0] || 'C'}
                                                </div>
                                                <span className="font-bold text-slate-900">{company.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{company.profiles?.full_name || 'System Owner'}</span>
                                                <span className="text-[10px] text-slate-500 font-medium mb-1">{company.profiles?.email || 'No email associated'}</span>
                                                <span className="font-mono text-[9px] text-slate-300 select-all truncate max-w-[120px]" title={company.profiles?.id}>{company.profiles?.id || 'SYSTEM'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Posts</span>
                                                        <span className="text-sm font-black text-slate-700">{company.contentCount}</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-100" />
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Images</span>
                                                        <span className="text-sm font-black text-slate-700">{company.imageCount}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                                                    <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-tighter border border-blue-100">
                                                        {company.usage} Credits
                                                    </div>
                                                    <div className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-tighter border border-rose-100">
                                                        ${company.totalSpend.toFixed(2)} USD Spend
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-500">
                                            {new Date(company.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteCompany(company.companyId, company.companyName)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                title="Delete Company"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const id = company.profiles?.id;
                                                    if (id) handleImpersonate(id);
                                                }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all ml-1"
                                                title="Impersonate Owner"
                                                disabled={!company.profiles?.id}
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'health' ? (
                <AdminHealth health={health} />
            ) : activeTab === 'logs' ? (
                <AdminLogs logs={auditLogs} />
            ) : activeTab === 'toolbox' ? (
                <AdminToolbox
                    settings={settings}
                    onUpdateSetting={handleUpdateSetting}
                    onSendBroadcast={handleSendBroadcast}
                    onPurgeLogs={handlePurgeLogs}
                />
            ) : null}
        </div>
    );
};
