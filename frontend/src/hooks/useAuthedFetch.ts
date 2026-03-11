import { useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';

interface UseAuthedFetchOptions {
    session: Session | null;
    userProfile: { role?: string } | null;
    onMaintenanceDetected: () => void;
}

/**
 * Returns a stable `authedFetch` function that:
 *  - Attaches the current session's Bearer token to every request
 *  - Attaches the X-Impersonate-User header when an admin is impersonating
 *  - Triggers the maintenance-mode flag on 503 responses (non-admins only)
 *
 * The function reference is stable across renders (useCallback) so it is safe
 * to list as a dependency in useEffect without causing infinite loops.
 */
export function useAuthedFetch({ session, userProfile, onMaintenanceDetected }: UseAuthedFetchOptions) {
    const authedFetch = useCallback(
        (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
            const token = session?.access_token;
            const impersonateUserId = sessionStorage.getItem('impersonateUserId');

            const headers: Record<string, string> = {
                ...(init.headers as Record<string, string> || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(impersonateUserId ? { 'X-Impersonate-User': impersonateUserId } : {}),
            };

            return fetch(input, { ...init, headers }).then((res) => {
                if (res.status === 503 && userProfile?.role !== 'ADMIN') {
                    onMaintenanceDetected();
                }
                return res;
            });
        },
        // Re-create only when the token or user role changes — not on every render.
        [session?.access_token, userProfile?.role, onMaintenanceDetected],
    );

    return { authedFetch };
}
