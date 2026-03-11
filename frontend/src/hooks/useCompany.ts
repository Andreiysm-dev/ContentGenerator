import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from './useAuth';

const DEFAULT_COMPANY_ID = import.meta.env.VITE_COMPANY_ID || '';

export interface UserPermissions {
    canApprove: boolean;
    canGenerate: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canEditSettings: boolean;
    canAddCollaborators: boolean;
    isOwner: boolean;
    roleName?: string | null;
}

interface UseCompanyOptions {
    session: Session | null;
    userProfile: UserProfile | null;
    collaborators: Array<{ id: string; email: string; role: string }>;
    customRoles: Array<{
        name: string;
        permissions?: {
            canApprove: boolean;
            canGenerate: boolean;
            canCreate: boolean;
            canDelete: boolean;
            canEditSettings: boolean;
            canAddCollaborators: boolean;
        };
    }>;
    isOnboardingOpen: boolean;
    setShowProductTour: (show: boolean) => void;
}

/**
 * Manages the active company selection, recent companies list (persisted to
 * localStorage), and derives userPermissions + automations from company data.
 *
 * Also owns the product tour trigger (needs both userProfile and activeCompanyId).
 *
 * Extracted from App.tsx — Batch 3.
 */
export function useCompany({
    session,
    userProfile,
    collaborators,
    customRoles,
    isOnboardingOpen,
    setShowProductTour,
}: UseCompanyOptions) {
    const location = useLocation();

    // ── Active company selection ──────────────────────────────────────────────

    const [companies, setCompanies] = useState<any[]>([]);
    const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>(() => {
        const saved = localStorage.getItem('activeCompanyId');
        return saved || DEFAULT_COMPANY_ID || undefined;
    });
    const [recentCompanyIds, setRecentCompanyIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('recentCompanyIds');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    /** Persists the active company to localStorage so it survives a refresh.
     *  Accepts either a direct value or a functional updater (just like setState). */
    const setActiveCompanyIdWithPersistence = useCallback(
        (companyIdOrUpdater: string | undefined | ((current: string | undefined) => string | undefined)) => {
            setActiveCompanyId((current) => {
                const next =
                    typeof companyIdOrUpdater === 'function'
                        ? companyIdOrUpdater(current)
                        : companyIdOrUpdater;
                if (next) {
                    localStorage.setItem('activeCompanyId', next);
                } else {
                    localStorage.removeItem('activeCompanyId');
                }
                return next;
            });
        },
        [],
    );

    // Sync active company from the current URL path (e.g. /company/:id/...)
    const routeCompanyId = useMemo(() => {
        const match = location.pathname.match(/^\/company\/([^/]+)(?:\/|$)/);
        return match?.[1] ? decodeURIComponent(match[1]) : undefined;
    }, [location.pathname]);

    useEffect(() => {
        if (!routeCompanyId) return;
        if (routeCompanyId === activeCompanyId) return;
        setActiveCompanyIdWithPersistence(routeCompanyId);
    }, [routeCompanyId, activeCompanyId, setActiveCompanyIdWithPersistence]);

    // Keep the recent-companies list up to date (max 3 entries, most recent first)
    useEffect(() => {
        if (!activeCompanyId) return;
        setRecentCompanyIds((prev) => {
            const filtered = prev.filter((id) => id !== activeCompanyId);
            const next = [activeCompanyId, ...filtered].slice(0, 3);
            localStorage.setItem('recentCompanyIds', JSON.stringify(next));
            return next;
        });
    }, [activeCompanyId]);

    // ── Derived values ────────────────────────────────────────────────────────

    const activeCompany = useMemo(
        () => companies.find((c) => c.companyId === activeCompanyId) || null,
        [companies, activeCompanyId],
    );

    const userPermissions = useMemo<UserPermissions>(() => {
        const noAccess: UserPermissions = {
            canApprove: false, canGenerate: false, canCreate: false,
            canDelete: false, canEditSettings: false, canAddCollaborators: false,
            isOwner: false,
        };

        if (!session?.user || !activeCompany) return noAccess;
        const userId = session.user.id;

        // Owner gets full access
        if (activeCompany.user_id === userId) {
            return {
                canApprove: true, canGenerate: true, canCreate: true,
                canDelete: true, canEditSettings: true, canAddCollaborators: true,
                isOwner: true, roleName: 'owner',
            };
        }

        // Collaborator — derive from role definition
        const collaboratorEntry = collaborators.find((c) => c.id === userId);
        if (!collaboratorEntry) return { ...noAccess, roleName: null };

        const roleName = collaboratorEntry.role;
        const roleDef = customRoles.find((r) => r.name === roleName);

        return {
            canApprove: roleDef?.permissions?.canApprove || false,
            canGenerate: roleDef?.permissions?.canGenerate || false,
            canCreate: roleDef?.permissions?.canCreate || false,
            canDelete: roleDef?.permissions?.canDelete || false,
            canEditSettings: roleDef?.permissions?.canEditSettings || false,
            canAddCollaborators: roleDef?.permissions?.canAddCollaborators || false,
            isOwner: false,
            roleName,
        };
    }, [session, activeCompany, collaborators, customRoles]);

    const automations = useMemo(
        () => (activeCompany as any)?.kanban_settings?.automations || [],
        [activeCompany],
    );

    // ── Product tour trigger ──────────────────────────────────────────────────
    // Show the tour for new users who haven't seen it and aren't mid-onboarding.

    useEffect(() => {
        if (!userProfile?.id || !activeCompanyId) return;

        const STORAGE_KEY = `productTourCompleted_${userProfile.id}`;
        const tourCompleted = localStorage.getItem(STORAGE_KEY);
        const justOnboarded = sessionStorage.getItem('justCompletedOnboarding');

        if ((justOnboarded || !tourCompleted) && !tourCompleted && !isOnboardingOpen) {
            const timer = setTimeout(() => {
                setShowProductTour(true);
                if (justOnboarded) sessionStorage.removeItem('justCompletedOnboarding');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [activeCompanyId, userProfile?.id, isOnboardingOpen, setShowProductTour]);

    return {
        companies,
        setCompanies,
        activeCompanyId,
        setActiveCompanyId: setActiveCompanyIdWithPersistence,
        recentCompanyIds,
        activeCompany,
        userPermissions,
        automations,
    };
}
