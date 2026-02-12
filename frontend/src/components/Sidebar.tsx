import { Building2, CalendarDays, Check, ChevronDown, FileText, HelpCircle, LayoutDashboard, Plus, Settings, Wand2 } from "lucide-react";
import type { NavigateFunction } from "react-router-dom";
import { useEffect } from "react";
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
  setNewCompanyName: (name: string) => void;
  setNewCompanyDescription: (desc: string) => void;
  setIsAddCompanyModalOpen: (open: boolean) => void;
  notify: (message: string, type: "success" | "error" | "info") => void;
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
  setNewCompanyName,
  setNewCompanyDescription,
  setIsAddCompanyModalOpen,
  notify,
}: SidebarProps) {
  const location = useLocation();

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
    fixed top-[80px] left-0 z-50
    h-[calc(100vh-80px)]
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
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto lg:overflow-y-visible">
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
                      setNewCompanyName("");
                      setNewCompanyDescription("");
                      setIsAddCompanyModalOpen(true);
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
          <nav className="flex flex-col gap-1 mt-4">
            {[
              { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
              { key: "generate", label: "Create", icon: Wand2, path: "generate" },
              { key: "calendar", label: "Calendar", icon: CalendarDays, path: "calendar" },
              { key: "drafts", label: "Drafts", icon: FileText, path: "drafts" },
              { key: "settings", label: "Company Settings", icon: Settings, path: "settings/overview" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNavKey === item.key;

              return (
                <button
                  key={item.key}
                  className={`flex items-center gap-2.5 py-2.5 px-2 rounded-r-xl font-bold transition ${isActive ? "bg-blue-100 text-blue-400 border-l-4 border-l-blue-500" : "hover:bg-blue-50 hover:text-blue-400"}`}
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

        {/* SUPPORT BUTTONS PINNED AT BOTTOM */}
        <div className="flex flex-col gap-2 px-1.5 mt-auto">
          <button onClick={() => navigate("/faq")} className="flex items-center gap-2 py-2 px-2 rounded-xl font-bold hover:bg-blue-50 hover:text-blue-400">
            <HelpCircle size={18} />
            FAQ
          </button>

          <button onClick={() => notify("Contact Support is coming soon.", "info")} className="flex items-center gap-2 py-2 px-2 rounded-xl font-bold hover:bg-blue-50 hover:text-blue-400">
            <HelpCircle size={18} />
            Contact Support
          </button>
        </div>
      </aside>
    </>
  );
}
