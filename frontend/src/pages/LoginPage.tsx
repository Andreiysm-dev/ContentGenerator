import { createClient } from '@supabase/supabase-js';

interface LoginPageProps {
    supabase: any;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export function LoginPage({ supabase, notify }: LoginPageProps) {
    return (
        <div className="auth-screen">
            <div className="auth-card">
                <h1>Welcome back</h1>
                <p>Sign in with Google to continue.</p>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                        if (!supabase) {
                            notify('Supabase is not configured.', 'error');
                            return;
                        }
                        await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: { redirectTo: window.location.origin },
                        });
                    }}
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
