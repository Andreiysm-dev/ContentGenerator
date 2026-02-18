import { BarChart3, Building2, CalendarCheck, CalendarDays, Check, ChevronDown, FileText, Headphones, HelpCircle, Image, LayoutDashboard, Plus, Settings, Wand2 } from "lucide-react";
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
    fixed top-[64px] left-0 z-50
    h-[calc(100vh-64px)]
    w-[264px] p-3.5
    bg-white text-brand-dark border-r border-[rgba(56,89,128,0.18)]
    flex flex-col
    transition-all duration-300 ease-in-out
    ${isNavDrawerOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
        aria-label="Primary navigation"
      >
        {/* CONTENT ABOVE SUPPORT BUTTONS */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-6">
          {/* COMPANY SELECTOR */}
          <div className="flex flex-col gap-2 px-1.5">
            <div className="text-[0.7rem] tracking-[0.12em] uppercase text-brand-dark/50 font-extrabold">Company</div>
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2.5 py-2.5 px-2 rounded-xl border border-brand-dark/[0.12] bg-[rgba(248,250,252,0.9)] text-brand-dark/90 hover:border-brand-primary/25 hover:bg-brand-primary/[0.06]"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Building2 size={16} className="text-gray-500" />
                  <span className="font-bold truncate">{activeCompany?.companyName || "Select company"}</span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isCompanyDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isCompanyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-white border border-brand-dark/10 rounded-xl shadow-lg z-50 flex flex-col gap-0.5">
                  {companies.map((company) => {
                    const isActive = company.companyId === activeCompanyId;
                    return (
                      <button
                        key={company.companyId}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold ${isActive ? "bg-blue-100 text-blue-400" : "hover:bg-blue-50 hover:text-blue-400"}`}
                        onClick={() => {
                          setActiveCompanyIdWithPersistence(company.companyId);
                          setIsCompanyDropdownOpen(false);
                          navigate(`/company/${encodeURIComponent(company.companyId)}/dashboard`);
                          if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                        }}
                      >
                        <Building2 size={16} />
                        <span className="truncate flex-1 text-left">{company.companyName}</span>
                        {isActive && <Check size={14} />}
                      </button>
                    );
                  })}

                  <div className="h-px bg-brand-dark/10 my-0.5" />

                  <button
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 hover:text-blue-400"
                    onClick={() => {
                      setIsOnboardingOpen(true);
                      setIsCompanyDropdownOpen(false);
                    }}
                  >
                    <Plus size={16} />
                    Add company...
                  </button>
                </div>
              )}
            </div>
          </div>



          {/* NAVIGATION */}
          {activeCompany && (
            <div className="flex flex-col gap-5 mt-4">
              {/* Workspace */}
              <nav className="flex flex-col gap-1">
                <div className="text-[0.65rem] tracking-[0.12em] uppercase text-brand-dark/40 font-extrabold px-2 mb-1">Workspace</div>
                {[
                  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "dashboard", tourId: "dashboard" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.tourId}
                      className={`flex items-center gap-2.5 py-2 px-2 rounded-xl font-medium transition ${isActive ? "bg-blue-100 text-blue-400 border-l-4 border-l-blue-500" : "hover:bg-blue-50 hover:text-blue-400"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
                        if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Content Workflow */}
              <nav className="flex flex-col gap-1">
                <div className="text-[0.65rem] tracking-[0.12em] uppercase text-brand-dark/40 font-extrabold px-2 mb-1">Content</div>
                {[
                  { key: "generate", label: "Create", icon: Wand2, path: "generate", tourId: "create" },
                  { key: "calendar", label: "Calendar", icon: CalendarDays, path: "calendar", tourId: "calendar" },
                  { key: "studio", label: "Studio", icon: FileText, path: "studio", tourId: "studio" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.tourId}
                      className={`flex items-center gap-2.5 py-2 px-2 rounded-xl font-medium transition ${isActive ? "bg-blue-100 text-blue-400 border-l-4 border-l-blue-500" : "hover:bg-blue-50 hover:text-blue-400"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
                        if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Performance */}
              <nav className="flex flex-col gap-1">
                <div className="text-[0.65rem] tracking-[0.12em] uppercase text-brand-dark/40 font-extrabold px-2 mb-1">Performance</div>
                {[
                  { key: "published", label: "Published", icon: CalendarCheck, path: "calendar/published", tourId: "published" },
                  { key: "insights", label: "Post Insights", icon: BarChart3, path: "insights", tourId: "insights" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.tourId}
                      className={`flex items-center gap-2.5 py-2 px-2 rounded-xl font-medium transition ${isActive ? "bg-blue-100 text-blue-400 border-l-4 border-l-blue-500" : "hover:bg-blue-50 hover:text-blue-400"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
                        if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Resources */}
              <nav className="flex flex-col gap-1">
                <div className="text-[0.65rem] tracking-[0.12em] uppercase text-brand-dark/40 font-extrabold px-2 mb-1">Resources</div>
                {[
                  { key: "library", label: "Media Library", icon: Image, path: "library", tourId: "library" },
                  { key: "settings", label: "Settings", icon: Settings, path: "settings/overview", tourId: "company-settings" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.key;
                  return (
                    <button
                      key={item.key}
                      data-tour={item.tourId}
                      className={`flex items-center gap-2.5 py-2 px-2 rounded-xl font-medium transition ${isActive ? "bg-blue-100 text-blue-400 border-l-4 border-l-blue-500" : "hover:bg-blue-50 hover:text-blue-400"}`}
                      onClick={() => {
                        if (!activeCompanyId) return;
                        navigate(`/company/${encodeURIComponent(activeCompanyId)}/${item.path}`);
                        if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* RECENT SHORTCUTS */}
          {recentCompanies.length > 0 && (
            <div className="flex flex-col gap-1 mt-4 px-1.5">
              <div className="text-[0.65rem] tracking-[0.12em] uppercase text-brand-dark/50 font-extrabold px-2 mb-1">Your shortcuts</div>
              {recentCompanies.map((company) => {
                const isActive = company.companyId === activeCompanyId;
                return (
                  <button
                    key={company.companyId}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-100 text-blue-400" : "text-brand-dark/70 hover:bg-brand-primary/[0.06] hover:text-brand-primary"}`}
                    onClick={() => {
                      setActiveCompanyIdWithPersistence(company.companyId);
                      navigate(`/company/${encodeURIComponent(company.companyId)}/dashboard`);
                      if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
                    }}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${isActive ? "bg-blue-200" : "bg-brand-primary/10"}`}>
                      <span className={`text-[10px] font-bold ${isActive ? "text-blue-500" : "text-brand-primary"}`}>{company.companyName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="truncate text-left">{company.companyName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 px-1.5 mt-auto">
          <button
            onClick={() => {
              navigate("/faq");
              if (window.innerWidth < 1024) setIsNavDrawerOpen(false);
            }}
            className={`flex items-center gap-2 py-2 px-2 rounded-xl font-medium transition ${location.pathname.startsWith("/faq") ? "bg-blue-100 text-blue-400 border-l-4 border-l-blue-500" : "hover:bg-blue-50 hover:text-blue-400"}`}
          >
            <HelpCircle size={18} />
            FAQ
          </button>

          <button onClick={() => setShowSupport(true)} className="flex items-center gap-2 py-2 px-2 rounded-xl font-medium hover:bg-blue-50 hover:text-blue-400 transition">
            <Headphones size={18} />
            Contact Support
          </button>
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
