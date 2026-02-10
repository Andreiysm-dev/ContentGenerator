import { Bell, LogOut, Settings, User } from 'lucide-react';
import { type Session, SupabaseClient } from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Company {
    companyId: string;
    companyName: string;
}

interface HeaderProps {
    isNavDrawerOpen: boolean;
    setIsNavDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeCompany: Company | null;
    notify: (message: string, type: 'success' | 'error' | 'info') => void;
    navigate: NavigateFunction;
    session: Session | null;
    supabase: SupabaseClient | null;
}

export function Header({
    setIsNavDrawerOpen,
    activeCompany,
    notify,
    navigate,
    session,
    supabase,
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 h-[80px] w-full bg-white border-b border-[rgba(56,89,128,0.18)] px-6 flex items-center justify-between shadow-[0_4px_20px_rgba(11,38,65,0.06)]">
            <div className="w-full flex items-center justify-between gap-4">
                <button
                    type="button"
                    className="appearance-none border-none bg-transparent p-2 -m-2 font-inherit font-extrabold tracking-wide text-brand-dark/90 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand-500)]"
                    onClick={() => setIsNavDrawerOpen((prev) => !prev)}
                >
                    <span className="font-black">ContentGenerator</span>
                    <span className="ml-2 font-bold text-brand-dark/55">
                        · {activeCompany?.companyName || 'Select company'}
                    </span>
                </button>

                <div className="header-actions flex items-center gap-2">
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                        onClick={() => {
                            notify('No notifications yet.', 'info');
                        }}
                        title="Notifications"
                    >
                        <Bell className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                        onClick={() => {
                            navigate('/profile');
                        }}
                        title="User settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                {session?.user?.user_metadata?.full_name || session?.user?.email || 'Profile'}
                                <span className="ml-2 opacity-50">▾</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={() => {
                                    navigate('/profile');
                                }}
                            >
                                {<User size={20} className="mr-2" />}
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={async () => {
                                    await supabase?.auth.signOut();
                                }}
                            >
                                {<LogOut size={20} className="mr-2 text-red-500" />}
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
