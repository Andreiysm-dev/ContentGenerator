import {
    Building2,
    CalendarDays,
    Check,
    ChevronDown,
    FileText,
    HelpCircle,
    LayoutDashboard,
    Plus,
    Settings,
    Wand2,
} from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

interface Company {
    companyId: string;
    companyName: string;
}

interface SidebarProps {
    isNavDrawerOpen: boolean;
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
    notify: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function Sidebar({
    isNavDrawerOpen,
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
    return (
        <aside
            className={`flex-none bg-white text-brand-dark border-r border-[rgba(56,89,128,0.18)] flex flex-col gap-3 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto transition-[width,padding,opacity] duration-300 ease-in-out ${isNavDrawerOpen
                ? 'w-[264px] p-3.5 px-3 opacity-100'
                : 'w-0 p-0 px-0 border-r-0 opacity-0 overflow-hidden'
                }`}
            aria-label="Primary navigation"
        >
            <div className="flex flex-col gap-2 px-1.5">
                <div className="text-[0.7rem] tracking-[0.12em] uppercase text-brand-dark/50 font-extrabold">
                    Company
                </div>
                <div className="relative">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between gap-2.5 py-2.5 px-3 rounded-xl border border-brand-dark/[0.12] bg-[rgba(248,250,252,0.9)] text-brand-dark/90 cursor-pointer hover:border-brand-primary/25 hover:bg-brand-primary/[0.06] transition-colors"
                        onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                        disabled={!isNavDrawerOpen}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div
                                className="max-w-[190px] overflow-hidden text-ellipsis whitespace-nowrap font-bold"
                                title={activeCompany?.companyName}
                            >
                                {activeCompany?.companyName || 'Select company'}
                            </div>
                        </div>
                        <ChevronDown
                            size={14}
                            className={`transform transition-transform ${isCompanyDropdownOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {isCompanyDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-white border border-brand-dark/10 rounded-xl shadow-lg z-50 flex flex-col gap-0.5">
                            {companies.map((company) => (
                                <button
                                    key={company.companyId}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold transition-colors ${company.companyId === activeCompanyId
                                        ? 'bg-brand-primary/10 text-brand-primary'
                                        : 'text-brand-dark/80 hover:bg-brand-dark/5 hover:text-brand-primary'
                                        }`}
                                    onClick={() => {
                                        setActiveCompanyIdWithPersistence(company.companyId);
                                        setIsCompanyDropdownOpen(false);
                                        navigate(
                                            `/company/${encodeURIComponent(company.companyId)}/dashboard`
                                        );
                                    }}
                                >
                                    <Building2
                                        size={16}
                                        className={
                                            company.companyId === activeCompanyId
                                                ? 'text-brand-primary'
                                                : 'text-brand-dark/50'
                                        }
                                    />
                                    <span className="truncate flex-1 text-left">
                                        {company.companyName}
                                    </span>
                                    {company.companyId === activeCompanyId && (
                                        <Check size={14} className="ml-auto text-brand-primary" />
                                    )}
                                </button>
                            ))}
                            <div className="h-px bg-brand-dark/10 my-0.5" />
                            <button
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold text-brand-dark/70 hover:bg-brand-dark/5 hover:text-brand-primary transition-colors"
                                onClick={() => {
                                    setNewCompanyName('');
                                    setNewCompanyDescription('');
                                    setIsAddCompanyModalOpen(true);
                                    setIsCompanyDropdownOpen(false);
                                }}
                            >
                                <Plus size={16} />
                                <span>Add company...</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 px-1.5">
                <div className="text-[0.7rem] tracking-[0.12em] uppercase text-brand-dark/50 font-extrabold">
                    Workspace
                </div>
                <nav className="flex flex-col gap-1">
                    <button
                        type="button"
                        className={`w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-all duration-200 hover:bg-brand-primary/5 hover:text-brand-primary/95 disabled:opacity-55 disabled:cursor-not-allowed group ${activeNavKey === 'dashboard'
                            ? 'text-brand-primary/95 bg-brand-primary/5'
                            : ''
                            }`}
                        onClick={() =>
                            activeCompanyId &&
                            navigate(
                                `/company/${encodeURIComponent(activeCompanyId)}/dashboard`
                            )
                        }
                        disabled={!activeCompanyId || !isNavDrawerOpen}
                    >
                        <LayoutDashboard
                            className={`w-4 h-4 flex-none group-hover:text-brand-primary/95 ${activeNavKey === 'dashboard'
                                ? 'text-brand-primary/95'
                                : 'text-brand-dark/55'
                                }`}
                        />
                        Dashboard
                        {activeNavKey === 'dashboard' && (
                            <span className="absolute left-3 right-3 bottom-0.5 h-[3px] rounded-full bg-blue-600" />
                        )}
                    </button>

                    <button
                        type="button"
                        className={`w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-all duration-200 hover:bg-brand-primary/5 hover:text-brand-primary/95 disabled:opacity-55 disabled:cursor-not-allowed group ${activeNavKey === 'generate'
                            ? 'text-brand-primary/95 bg-brand-primary/5'
                            : ''
                            }`}
                        onClick={() =>
                            activeCompanyId &&
                            navigate(
                                `/company/${encodeURIComponent(activeCompanyId)}/generate`
                            )
                        }
                        disabled={!activeCompanyId || !isNavDrawerOpen}
                    >
                        <Wand2
                            className={`w-4 h-4 flex-none group-hover:text-brand-primary/95 ${activeNavKey === 'generate'
                                ? 'text-brand-primary/95'
                                : 'text-brand-dark/55'
                                }`}
                        />
                        Create
                        {activeNavKey === 'generate' && (
                            <span className="absolute left-3 right-3 bottom-0.5 h-[3px] rounded-full bg-blue-600" />
                        )}
                    </button>

                    <button
                        type="button"
                        className={`w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-all duration-200 hover:bg-brand-primary/5 hover:text-brand-primary/95 disabled:opacity-55 disabled:cursor-not-allowed group ${activeNavKey === 'calendar'
                            ? 'text-brand-primary/95 bg-brand-primary/5'
                            : ''
                            }`}
                        onClick={() =>
                            activeCompanyId &&
                            navigate(
                                `/company/${encodeURIComponent(activeCompanyId)}/calendar`
                            )
                        }
                        disabled={!activeCompanyId || !isNavDrawerOpen}
                    >
                        <CalendarDays
                            className={`w-4 h-4 flex-none group-hover:text-brand-primary/95 ${activeNavKey === 'calendar'
                                ? 'text-brand-primary/95'
                                : 'text-brand-dark/55'
                                }`}
                        />
                        Calendar
                        {activeNavKey === 'calendar' && (
                            <span className="absolute left-3 right-3 bottom-0.5 h-[3px] rounded-full bg-blue-600" />
                        )}
                    </button>

                    <button
                        type="button"
                        className={`w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-all duration-200 hover:bg-brand-primary/5 hover:text-brand-primary/95 disabled:opacity-55 disabled:cursor-not-allowed group ${activeNavKey === 'drafts'
                            ? 'text-brand-primary/95 bg-brand-primary/5'
                            : ''
                            }`}
                        onClick={() =>
                            activeCompanyId &&
                            navigate(`/company/${encodeURIComponent(activeCompanyId)}/drafts`)
                        }
                        disabled={!activeCompanyId || !isNavDrawerOpen}
                    >
                        <FileText
                            className={`w-4 h-4 flex-none group-hover:text-brand-primary/95 ${activeNavKey === 'drafts'
                                ? 'text-brand-primary/95'
                                : 'text-brand-dark/55'
                                }`}
                        />
                        Drafts
                        {activeNavKey === 'drafts' && (
                            <span className="absolute left-3 right-3 bottom-0.5 h-[3px] rounded-full bg-blue-600" />
                        )}
                    </button>

                    <button
                        type="button"
                        className={`w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-all duration-200 hover:bg-brand-primary/5 hover:text-brand-primary/95 disabled:opacity-55 disabled:cursor-not-allowed group ${activeNavKey === 'settings'
                            ? 'text-brand-primary/95 bg-brand-primary/5'
                            : ''
                            }`}
                        onClick={() =>
                            activeCompanyId &&
                            navigate(
                                `/company/${encodeURIComponent(activeCompanyId)}/settings/overview`
                            )
                        }
                        disabled={!activeCompanyId || !isNavDrawerOpen}
                    >
                        <Settings
                            className={`w-4 h-4 flex-none group-hover:text-brand-primary/95 ${activeNavKey === 'settings'
                                ? 'text-brand-primary/95'
                                : 'text-brand-dark/55'
                                }`}
                        />
                        Company Settings
                        {activeNavKey === 'settings' && (
                            <span className="absolute left-3 right-3 bottom-0.5 h-[3px] rounded-full bg-blue-600" />
                        )}
                    </button>
                </nav>
            </div>

            <div className="mt-auto flex flex-col gap-2 px-1.5">
                <div className="text-[0.7rem] tracking-[0.12em] uppercase text-brand-dark/50 font-extrabold">
                    Support
                </div>
                <nav className="flex flex-col gap-1">
                    <button
                        type="button"
                        className="w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-[background_0.15s_ease,transform_0.12s_ease] hover:bg-transparent hover:text-brand-primary/95 group"
                        onClick={() => {
                            notify('FAQ is coming soon.', 'info');
                        }}
                        disabled={!isNavDrawerOpen}
                    >
                        <HelpCircle className="w-4 h-4 text-brand-dark/55 flex-none group-hover:text-brand-primary/95" />
                        FAQ
                    </button>
                    <button
                        type="button"
                        className="w-full text-left border border-transparent bg-transparent text-brand-dark/[0.86] py-2.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 relative transition-[background_0.15s_ease,transform_0.12s_ease] hover:bg-transparent hover:text-brand-primary/95 group"
                        onClick={() => {
                            notify('Contact Support is coming soon.', 'info');
                        }}
                        disabled={!isNavDrawerOpen}
                    >
                        <HelpCircle className="w-4 h-4 text-brand-dark/55 flex-none group-hover:text-brand-primary/95" />
                        Contact Support
                    </button>
                </nav>
            </div>
        </aside>
    );
}
