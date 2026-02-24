import { BarChart3, Boxes, Building2, CalendarCheck, CalendarDays, Check, ChevronDown, FileText, Headphones, HelpCircle, Image, LayoutDashboard, Magnet, Plus, Settings, Wand2, Target, ShieldCheck, Users } from "lucide-react";
import type { NavigateFunction } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface Company {
  companyId: string;
  companyName: string;
}

interface SidebarProps {
  isNavDrawerOpen: boolean;
  setIsNavDrawerOpen: (open: boolean) => void;
  activeCompany: Company | null;
  activeCompanyId: string | null | undefined;
  companies: Company[];
  isCompanyDropdownOpen: boolean;
  setIsCompanyDropdownOpen: (open: boolean) => void;
  navigate: NavigateFunction;
  activeNavKey: string | null | undefined;
  setActiveCompanyIdWithPersistence: (id: string) => void;
  setIsOnboardingOpen: (open: boolean) => void;
  notify: (message: string, type: "success" | "error" | "info") => void;
  recentCompanies: Company[];
  userRole?: string | null;
}

export function Sidebar({
  isNavDrawerOpen,
  setIsNavDrawerOpen,
  activeCompany,
  activeCompanyId,
  companies,
  isCompanyDropdownOpen,
  setIsCompanyDropdownOpen,
  navigate,
  activeNavKey,
  setActiveCompanyIdWithPersistence,
  setIsOnboardingOpen,
  notify,
  recentCompanies,
  userRole,
}: SidebarProps) {
  const location = useLocation();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsNavDrawerOpen(false);
    }
  }, [location.pathname, setIsNavDrawerOpen]);

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
        aria-label="Primary navigation"
      >
        {/* LOGO SECTION - Ribo Branding */}
        <div className="h-[64px] flex items-center px-7 border-b border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-8 h-8 bg-[#3FA9F5] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mr-3 shrink-0">
            <Target className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white/90 font-ribo">
            Startup<span className="text-[#3FA9F5]">Lab</span>
          </span>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar py-6 px-4">

          {/* COMPANY SELECTOR - Elevated Style */}
          <div className="flex flex-col gap-2.5 px-2">
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-black pl-1">Project Space</div>
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 py-3 px-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group ring-1 ring-white/0 hover:ring-white/5"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <Building2 size={16} />
                  </div>
                  <span className="font-bold text-sm truncate">{activeCompany?.companyName || "Select Project"}</span>
                </div>
                <ChevronDown size={14} className={`text-white/30 transition-transform duration-300 ${isCompanyDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isCompanyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl z-[60] flex flex-col gap-1 animate-in zoom-in-95 fade-in duration-200 backdrop-blur-xl">
                  {companies.map((company) => {
                    const isActive = company.companyId === activeCompanyId;
                    return (
                      <button
                        key={company.companyId}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                        onClick={() => {
                          setActiveCompanyIdWithPersistence(company.companyId);
                          setIsCompanyDropdownOpen(false);
                          navigate(`/company/${encodeURIComponent(company.companyId)}/dashboard`);
                          if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                        }}
                      >
                        <Building2 size={16} className={isActive ? "text-white" : "text-white/30"} />
                        <span className="truncate flex-1 text-left">{company.companyName}</span>
                        {isActive && <Check size={14} />}
                      </button>
                    );
                  })}

                  <div className="h-px bg-white/5 my-1.5 mx-2" />

                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:bg-white/5 hover:text-white transition-all"
                    onClick={() => {
                      setIsOnboardingOpen(true);
                      setIsCompanyDropdownOpen(false);
                    }}
                  >
                    <Plus size={16} />
                    New Workspace
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NAVIGATION GROUPS - Reorganized and Polished */}
          {activeCompany && (
            <div className="flex flex-col gap-8">

              {/* Main Workspace */}
              <nav className="flex flex-col gap-1.5">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-black px-3 mb-1">Main Workspace</div>
                {[
                  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
                  { key: "settings", tourKey: "company-settings", label: "Company Settings", icon: Settings, path: "settings/overview" },
                ].map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.tourKey || item.key}
                      className={`flex items-center gap-3.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${isActive ? "text-white bg-[#3FA9F5] shadow-lg shadow-blue-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
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

              {/* Creative Suite */}
              <nav className="flex flex-col gap-1.5">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-black px-3 mb-1">Creative Suite</div>
                {[
                  { key: "planner", label: "Content Planner", icon: Target, path: "plan" },
                  { key: "generate", label: "AI Creator", tourKey: "create", icon: Wand2, path: "generate" },
                  { key: "calendar", label: "Editorial Calendar", icon: CalendarDays, path: "calendar" },
                  { key: "image-hub", label: "Visual Assets", icon: Image, path: "image-hub" },
                  { key: "studio", label: "Studio Explorer", icon: FileText, path: "studio" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.tourKey || item.key}
                      className={`flex items-center gap-3.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${isActive ? "text-white bg-[#3FA9F5] shadow-lg shadow-blue-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
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

              {/* Growth Engine */}
              <nav className="flex flex-col gap-1.5">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-black px-3 mb-1">Growth Engine</div>
                {[
                  { key: "leads", label: "Lead Generation", icon: Magnet, path: "leads" },
                  { key: "toolbox", label: "Marketing AI", icon: Boxes, path: "toolbox" },
                  { key: "published", label: "Published Posts", icon: CalendarCheck, path: "calendar/published" },
                  { key: "insights", label: "Analytics", icon: BarChart3, path: "insights" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.key}
                      className={`flex items-center gap-3.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${isActive ? "text-white bg-[#3FA9F5] shadow-lg shadow-blue-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
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

              {/* Assets & Resources */}
              <nav className="flex flex-col gap-1.5">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-black px-3 mb-1">Resources</div>
                {[
                  { key: "library", label: "Media Library", icon: Boxes, path: "library" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.key}
                      className={`flex items-center gap-3.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${isActive ? "text-white bg-[#3FA9F5] shadow-lg shadow-blue-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
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

              {/* System Admin - Exclusive Look */}
              {userRole === 'ADMIN' && (
                <nav className="flex flex-col gap-1.5 mt-2">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-amber-500/40 font-black px-3 mb-1">Management</div>
                  <button
                    className={`flex items-center gap-3.5 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${location.pathname.startsWith('/admin') ? "text-white bg-amber-600 shadow-lg shadow-amber-600/20" : "text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/5"}`}
                    onClick={() => {
                      navigate("/admin/overview");
                      if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                    }}
                  >
                    <ShieldCheck size={18} className={location.pathname.startsWith('/admin') ? "text-white" : "text-amber-500/40 group-hover:text-amber-400 group-hover:scale-110 transition-all"} />
                    Admin Console
                    {location.pathname.startsWith('/admin') && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/20 rounded-l-full" />}
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM UTILITIES - Polished */}
        <div className="p-6 mt-auto flex flex-col gap-2 border-t border-white/5 bg-[#0F172A]/50 backdrop-blur-md">
          {[
            { key: "faq", label: "Help Center", icon: HelpCircle, path: "/faq" },
            { key: "support", label: "Contact Support", icon: Headphones, onClick: () => setShowSupport(true) },
          ].filter(i => (i as any).path || (i as any).onClick).map((item: any) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path || '___');
            return (
              <button
                key={item.key}
                data-tour={item.tourKey || item.key}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.path) navigate(item.path);
                  if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                }}
                className={`flex items-center gap-3.5 py-2.5 px-3.5 rounded-xl text-sm font-bold transition-all ${isActive ? "text-white bg-white/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>
      {/* CONTACT SUPPORT MODAL */}
      {showSupport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="bg-[#3fa9f5] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Contact Support</h3>
              <button onClick={() => setShowSupport(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Your Email</label>
                <input type="email" placeholder="you@example.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Message</label>
                <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} rows={4} placeholder="How can we help you?" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none" />
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowSupport(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setIsSending(true);
                    setTimeout(() => {
                      setIsSending(false);
                      notify("Support request sent successfully!", "success");
                      setShowSupport(false);
                      setSupportMessage("");
                    }, 1000);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  {isSending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
