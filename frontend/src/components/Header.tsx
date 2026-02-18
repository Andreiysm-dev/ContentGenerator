import { LogOut, Settings, User, RefreshCw } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { type Session, SupabaseClient } from "@supabase/supabase-js";
import type { NavigateFunction } from "react-router-dom";
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
  onLogout: () => void;
}

export function Header({ isNavDrawerOpen, setIsNavDrawerOpen, activeCompany, notify, navigate, session, supabase, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[rgba(56,89,128,0.18)] shadow-[0_4px_20px_rgba(11,38,65,0.06)] px-4 sm:px-6 h-[64px] flex items-center justify-between">
      <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
        <button
          type="button"
          className="flex items-center gap-2 appearance-none border-none bg-transparent font-inherit font-extrabold tracking-wide text-brand-dark/90 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand-500)]"
          onClick={() => setIsNavDrawerOpen((prev) => !prev)}
          aria-label={isNavDrawerOpen ? "Close sidebar" : "Open sidebar"}
        >
          <span className="relative w-5 h-5 flex flex-col justify-between lg:hidden">
            <span className={`block h-1 w-5 bg-blue-400 rounded transform transition duration-300 ${isNavDrawerOpen ? "rotate-45 translate-y-2.5" : ""}`} />
            <span className={`block h-1 w-5 bg-blue-500 rounded transition duration-300 ${isNavDrawerOpen ? "opacity-0" : "opacity-100"}`} />
            <span className={`block h-1 w-5 bg-blue-500 rounded transform transition duration-300 ${isNavDrawerOpen ? "-rotate-45 -translate-y-2.5" : ""}`} />
          </span>

          <span className="font-black text-sm sm:text-base truncate">ContentGenerator</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationBell />

          <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors" onClick={() => navigate("/profile")} title="User settings">
            <Settings className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:inline-flex items-center justify-center rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 w-9 p-0 overflow-hidden border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <img src="https://i.pinimg.com/1200x/d4/a5/82/d4a5829f2d13dac1c9c0d00e4c19e1ad.jpg" alt="Profile" className="h-full w-full object-cover rounded-full" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <User size={20} className="mr-2" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  onLogout();
                }}
              >
                <LogOut size={20} className="mr-2 text-red-500" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors">
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <User size={20} className="mr-2" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  onLogout();
                }}
              >
                <LogOut size={20} className="mr-2 text-red-500" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
