import type { Session } from '@supabase/supabase-js';

interface ProfilePageProps {
    session: Session | null;
}

export function ProfilePage({ session }: ProfilePageProps) {
    return (
        <main className="app-main">
            <section className="card">
                <div className="card-header">
                    <div>
                        <h1 className="card-title">Profile</h1>
                        <p className="card-subtitle">Account and session details.</p>
                    </div>
                </div>
                <div style={{ padding: 16 }}>
                    <div style={{ color: 'var(--ink-500)', fontSize: '0.9rem' }}>{session?.user?.email || ''}</div>
                </div>
            </section>
        </main>
    );
}
