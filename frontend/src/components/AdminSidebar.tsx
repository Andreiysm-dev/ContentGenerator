import { BarChart3, Building2, ChevronLeft, HelpCircle, LayoutDashboard, Settings, ShieldCheck, Users, Activity, FileText, Target, CalendarDays, Boxes, Headphones } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

interface AdminSidebarProps {
    isNavDrawerOpen: boolean;
    setIsNavDrawerOpen: (open: boolean) => void;
}

export function AdminSidebar({
    isNavDrawerOpen,
    setIsNavDrawerOpen,
}: AdminSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [showSupport, setShowSupport] = useState(false);

    const managementItems = [
        { key: "overview", label: "System Overview", icon: LayoutDashboard, path: "/admin/overview" },
        { key: "users", label: "User Management", icon: Users, path: "/admin/users" },
        { key: "companies", label: "Company Directory", icon: Building2, path: "/admin/companies" },
    ];

    const systemItems = [
        { key: "health", label: "System Health", icon: Activity, path: "/admin/health" },
        { key: "logs", label: "Audit Logs", icon: FileText, path: "/admin/logs" },
    ];

    return (
        <>
            {isNavDrawerOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setIsNavDrawerOpen(false)} />}

            <aside
                className={`
          fixed top-0 left-0 z-50
          h-screen
          w-[280px]
          bg-[#0B2641] border-r border-white/5
          flex flex-col
          transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isNavDrawerOpen ? "translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]" : "-translate-x-full"}
          lg:translate-x-0
        `}
                aria-label="Admin navigation"
            >
                {/* LOGO SECTION - Ribo Branding */}
                <div className="h-[64px] flex items-center px-7 border-b border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="w-8 h-8 bg-[#F5A623] rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 mr-3 shrink-0">
                        <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white/90 font-ribo">
                        Admin<span className="text-[#F5A623]">Portal</span>
                    </span>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex flex-col gap-8 overflow-y-auto no-scrollbar py-6 px-4">

                    {/* BACK BUTTON */}
                    <div className="px-2">
                        <button
                            onClick={() => navigate("/")}
                            className="w-full flex items-center gap-3 py-3 px-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                        >
                            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:-translate-x-1 transition-transform">
                                <ChevronLeft size={16} />
                            </div>
                            <span className="font-bold text-sm">Exit Admin Mode</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Management Section */}
                        <nav className="flex flex-col gap-1.5">
                            <div className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-black px-3 mb-1">Management</div>
                            {managementItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.key}
                                        className={`flex items-center gap-3.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${isActive ? "text-white bg-[#F5A623] shadow-lg shadow-amber-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                                        onClick={() => {
                                            navigate(item.path);
                                            if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                                        }}
                                    >
                                        <Icon size={18} className={isActive ? "text-white" : "text-white/40 group-hover:text-white group-hover:scale-110 transition-all"} />
                                        {item.label}
                                        {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/20 rounded-l-full" />}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* System Section */}
                        <nav className="flex flex-col gap-1.5">
                            <div className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-black px-3 mb-1">System</div>
                            {systemItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.key}
                                        className={`flex items-center gap-3.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${isActive ? "text-white bg-[#F5A623] shadow-lg shadow-amber-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                                        onClick={() => {
                                            navigate(item.path);
                                            if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                                        }}
                                    >
                                        <Icon size={18} className={isActive ? "text-white" : "text-white/40 group-hover:text-white group-hover:scale-110 transition-all"} />
                                        {item.label}
                                        {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/20 rounded-l-full" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* BOTTOM UTILITIES */}
                <div className="p-6 mt-auto flex flex-col gap-2 border-t border-white/5 bg-[#0F172A]/50 backdrop-blur-md">
                    <button
                        onClick={() => navigate("/admin/settings")}
                        className={`flex items-center gap-3.5 py-2.5 px-3.5 rounded-xl text-sm font-bold transition-all ${location.pathname === "/admin/settings" ? "text-white bg-white/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                    >
                        <Settings size={16} />
                        Global Settings
                    </button>
                    <div className="flex flex-col gap-2 px-1 mt-2 text-[10px] font-bold uppercase tracking-tight text-white/20">
                        <div className="flex items-center justify-between">
                            <span>API Version</span>
                            <span className="text-white/40 font-mono">v1.4.2</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Status</span>
                            <span className="text-emerald-500">Normal</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
