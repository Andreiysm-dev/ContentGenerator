import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
    id: string;
    role?: string;
    onboarding_completed?: boolean;
    full_name?: string;
    email?: string;
    [key: string]: any;
}

interface UseAuthReturn {
    session: Session | null;
    authLoading: boolean;
    userProfile: UserProfile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    isOnboardingOpen: boolean;
    setIsOnboardingOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showProductTour: boolean;
    setShowProductTour: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Manages Supabase session, user profile fetching, and onboarding/tour state.
 *
 * Does NOT own the authedFetch ping (that stays in App so it can use the
 * stable authedFetch that already has the live session token in its closure).
 *
 * Extracted from App.tsx to reduce its surface area and isolate auth concerns.
 */
export function useAuth(backendBaseUrl: string): UseAuthReturn {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [showProductTour, setShowProductTour] = useState(false);

    // Fetch profile from backend using the session token.
    // Opens onboarding modal if the user hasn't completed it yet.
    const fetchProfile = useCallback(async (currentSession: Session | null) => {
        if (!currentSession) {
            setAuthLoading(false);
            return;
        }

        try {
            const token = currentSession.access_token;
            const res = await fetch(`${backendBaseUrl}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                setAuthLoading(false);
                return;
            }

            const data = await res.json().catch(() => ({}));
            setUserProfile(data.profile || null);

            // Show onboarding flow if not yet completed
            if (data.profile && !data.profile.onboarding_completed) {
                setIsOnboardingOpen(true);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setAuthLoading(false);
        }
    }, [backendBaseUrl]);

    // Bootstrap: get the current session, then subscribe to auth state changes.
    useEffect(() => {
        if (!supabase) {
            setAuthLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data }) => {
            const s = data.session ?? null;
            setSession(s);
            fetchProfile(s);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            const s = currentSession ?? null;
            setSession(s);
            if (_event === 'SIGNED_IN') {
                fetchProfile(s);
            }
        });

        return () => {
            listener?.subscription?.unsubscribe();
        };
    }, [fetchProfile]);

    return {
        session,
        authLoading,
        userProfile,
        setUserProfile,
        isOnboardingOpen,
        setIsOnboardingOpen,
        showProductTour,
        setShowProductTour,
    };
}
