import { useNavigate, useParams, NavLink, useLocation, type NavigateFunction } from "react-router-dom";
import { LogOut, Settings, User, RefreshCw, ShieldCheck, ChevronRight } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { type Session, SupabaseClient } from "@supabase/supabase-js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Company {
  companyId: string;
  companyName: string;
}

interface HeaderProps {
  isNavDrawerOpen: boolean;
  setIsNavDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeCompany: Company | null;
  notify: (message: string, type: "success" | "error" | "info") => void;
  navigate: NavigateFunction;
  session: Session | null;
  supabase: SupabaseClient | null;
  userRole?: string | null;
  onLogout: () => void;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
}

export function Header({
  isNavDrawerOpen,
  setIsNavDrawerOpen,
  activeCompany,
  notify,
  navigate,
  session,
  supabase,
  onLogout,
  userRole,
  authedFetch,
  backendBaseUrl
}: HeaderProps) {
  const impersonateUserId = sessionStorage.getItem('impersonateUserId');
  const location = useLocation();

  const getBreadcrumbs = () => {
    const path = location.pathname.toLowerCase();
    const segments = location.pathname.split('/').filter(Boolean);
    const crumbs: string[] = [];

    // 1. Context (Company or Global)
    if (activeCompany?.companyName) {
      crumbs.push(activeCompany.companyName);
    } else if (path.includes('/admin')) {
      crumbs.push('Admin');
    } else if (path.includes('/profile')) {
      crumbs.push('Profile');
    }

    // 2. Main Page & Sub-Pages
    if (path.includes('/settings')) {
      crumbs.push('Settings');
      const settingsIndex = segments.findIndex(s => s.toLowerCase() === 'settings');
      const tab = segments[settingsIndex + 1];
      if (tab) crumbs.push(tab.replace(/-/g, ' '));
    } else if (path.includes('/dashboard')) {
      crumbs.push('Dashboard');
    } else if (path.includes('/calendar/published')) {
      crumbs.push('Archives');
    } else if (path.includes('/calendar')) {
      crumbs.push('Content Board');
    } else if (path.includes('/plan')) {
      crumbs.push('Content Planner');
    } else if (path.includes('/scheduler')) {
      crumbs.push('Calendar');
    } else if (path.includes('/generate')) {
      crumbs.push('Create');
    } else if (path.includes('/studio')) {
      crumbs.push('Content Studio');
      const studioIndex = segments.findIndex(s => s.toLowerCase() === 'studio');
      if (segments[studioIndex + 1] && segments[studioIndex + 1] !== 'overview') {
        crumbs.push('Studio Editor');
      }
    } else if (path.includes('/image-hub')) {
      crumbs.push('Content Studio');
      crumbs.push('Studio Editor');
      crumbs.push('Image Hub');
    } else if (path.includes('/leads')) {
      crumbs.push('Lead Generation');
    } else if (path.includes('/toolbox')) {
      crumbs.push('Marketing AI');
    } else if (path.includes('/insights')) {
      crumbs.push('Analytics');
    } else if (path.includes('/hub')) {
      crumbs.push('Creative Hub');
    } else if (path.includes('/workboard')) {
      crumbs.push('Workboard');
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleStopImpersonation = async () => {
    try {
      await authedFetch(`${backendBaseUrl}/api/admin/audit/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: impersonateUserId, action: 'STOP' })
      });
    } catch (e) {
      console.error('Failed to log impersonation stop', e);
    }
    sessionStorage.removeItem('impersonateUserId');
    localStorage.removeItem('activeCompanyId');
    window.location.href = '/';
  };
  return (
    <header className="sticky top-0 z-40 w-full lg:ml-[280px] lg:w-[calc(100%-280px)] bg-white/90 backdrop-blur-md border-b border-slate-200/50 h-[64px] flex items-center justify-between px-4 sm:px-8 transition-all duration-300 font-ribo">
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-slate-100 transition-colors"
          onClick={() => setIsNavDrawerOpen((prev) => !prev)}
          aria-label={isNavDrawerOpen ? "Close sidebar" : "Open sidebar"}
        >
          <div className="relative w-5 h-4 flex flex-col justify-between">
            <div className={`h-0.5 w-5 bg-[#0B2641] rounded-full transition-all duration-300 ${isNavDrawerOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <div className={`h-0.5 w-4 bg-[#0B2641] rounded-full transition-all duration-300 ${isNavDrawerOpen ? 'opacity-0' : ''}`} />
            <div className={`h-0.5 w-5 bg-[#0B2641] rounded-full transition-all duration-300 ${isNavDrawerOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>

        {/* Minimal Breadcrumb - Left aligned next to sidebar */}
        <div className="hidden lg:flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={10} className="text-slate-300" />}
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${index === breadcrumbs.length - 1 ? 'text-[#0B2641]' : 'text-slate-400/80'}`}>
                {crumb}
              </span>
            </div>
          ))}
        </div>
      </div>

      {impersonateUserId && (
        <div className="flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/20 px-3 py-1.5 rounded-md animate-pulse">
          <ShieldCheck size={14} className="text-[#F5A623]" />
          <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-tight">Ghost Mode: {impersonateUserId.slice(0, 8)}...</span>
          <button
            onClick={handleStopImpersonation}
            className="ml-2 bg-[#F5A623] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm hover:bg-[#D48C1C] transition-colors shadow-sm"
          >
            Exit
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200/60">
          <NotificationBell />

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-[#3FA9F5] hover:bg-white hover:shadow-sm transition-all duration-200"
            onClick={() => navigate("/profile")}
            title="User settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-tour="profile-settings"
              className="flex items-center gap-2 p-1 pr-3 rounded-lg border border-slate-200/60 hover:border-[#3FA9F5]/30 hover:bg-[#3FA9F5]/5 transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-md overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
                <img src={session?.user?.user_metadata?.avatar_url || "https://i.pinimg.com/1200x/d4/a5/82/d4a5829f2d13dac1c9c0d00e4c19e1ad.jpg"} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <div className="hidden md:flex flex-col items-start translate-y-[1px]">
                <span className="text-xs font-bold text-[#0B2641] leading-none">{session?.user?.user_metadata?.full_name?.split(' ')[0] || "User"}</span>
                <span className="text-[9px] font-bold text-[#3FA9F5] leading-none mt-1 uppercase tracking-tighter">Pro Account</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-lg border-slate-200/60 shadow-xl shadow-slate-200/20 backdrop-blur-xl">
            <DropdownMenuItem
              onSelect={() => navigate("/profile")}
              className="flex items-center gap-3 py-2.5 rounded-md focus:bg-[#3FA9F5]/10 focus:text-[#0B2641] font-bold text-sm cursor-pointer"
            >
              <div className="w-8 h-8 bg-[#3FA9F5]/10 rounded-md flex items-center justify-center text-[#3FA9F5]">
                <User size={18} />
              </div>
              My Profile
            </DropdownMenuItem>

            {userRole === 'ADMIN' && (
              <DropdownMenuItem
                onSelect={() => navigate("/admin/overview")}
                className="flex items-center gap-3 py-2.5 rounded-md focus:bg-[#F5A623]/10 focus:text-[#F5A623] font-bold text-sm cursor-pointer mt-1"
              >
                <div className="w-8 h-8 bg-[#F5A623]/10 rounded-md flex items-center justify-center text-[#F5A623]">
                  <ShieldCheck size={18} />
                </div>
                Admin Console
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-2 bg-slate-100" />

            <DropdownMenuItem
              onSelect={onLogout}
              className="flex items-center gap-3 py-2.5 rounded-md focus:bg-rose-50 focus:text-rose-600 font-bold text-sm cursor-pointer"
            >
              <div className="w-8 h-8 bg-rose-50 rounded-md flex items-center justify-center text-rose-600">
                <LogOut size={18} />
              </div>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
