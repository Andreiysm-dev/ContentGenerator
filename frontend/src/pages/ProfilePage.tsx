import { useState, useEffect } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

interface ProfilePageProps {
  session: Session | null;
  supabase: SupabaseClient | null;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export function ProfilePage({ session, supabase, notify }: ProfilePageProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  // Profile data state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Credentials state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata;
        const fullName = metadata?.full_name || metadata?.display_name || "";

        // Use separate fields if they exist, otherwise parse from full_name
        let fName = metadata?.first_name || "";
        let lName = metadata?.last_name || "";

        if (!fName && !lName && fullName) {
          const parts = fullName.split(" ");
          fName = parts[0] || "";
          lName = parts.slice(1).join(" ") || "";
        }

        setFirstName(fName);
        setLastName(lName);
        setAvatarUrl(metadata?.avatar_url || "https://i.pinimg.com/1200x/d4/a5/82/d4a5829f2d13dac1c9c0d00e4c19e1ad.jpg");
        setEmail(user.email || "");
      } else if (session?.user) {
        // Fallback to session if getUser fails
        const metadata = session.user.user_metadata;
        setFirstName(metadata?.first_name || "");
        setLastName(metadata?.last_name || "");
        setAvatarUrl(metadata?.avatar_url || "https://i.pinimg.com/1200x/d4/a5/82/d4a5829f2d13dac1c9c0d00e4c19e1ad.jpg");
        setEmail(session.user.email || "");
      }
    };

    fetchUser();
  }, [session, supabase]);

  const handleUpdateProfile = async () => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const combinedName = `${firstName} ${lastName}`.trim();
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: combinedName,
          display_name: combinedName,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      notify("Profile updated successfully", "success");
      setShowEdit(false);
    } catch (err: any) {
      notify(err.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const updateData: { email?: string; password?: string } = {};
      if (email !== session?.user?.email) updateData.email = email;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        setShowCredentials(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;

      notify(updateData.email ? "Confirmation email sent to new address" : "Password updated successfully", "success");
      setShowCredentials(false);
      setPassword("");
    } catch (err: any) {
      notify(err.message || "Failed to update credentials", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    notify("Account deletion is a sensitive action. Please contact support to proceed.", "info");
    setShowDelete(false);
  };

  const userDisplayName = `${firstName} ${lastName}`.trim() || session?.user?.email || "User";

  return (
    <main className="flex flex-col gap-6 animate-page-fade-in max-w-4xl mx-auto py-8 px-4">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Personal Information</h1>
            <p className="text-gray-500">Manage your personal details and public profile.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowEdit(true)}
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition-all border border-rose-200/50"
            >
              Delete Account
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-premium transition-transform group-hover:scale-105"
            />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xl font-bold text-gray-900">{userDisplayName}</div>
            <p className="text-gray-500 font-medium">{session?.user?.email}</p>
          </div>
        </div>
      </section>

      {/* CREDENTIALS SECTION */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Account Credentials</h2>
            <p className="text-sm text-gray-500 font-medium">Manage your login email and password.</p>
          </div>

          <button
            onClick={() => setShowCredentials(true)}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 rounded-xl text-sm font-semibold border border-gray-200 transition-all shadow-sm"
          >
            Edit Credentials
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Login Email</label>
            <div className="py-3 px-4 border border-gray-100 rounded-xl bg-gray-50/50 text-gray-700 font-medium">{session?.user?.email}</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Password</label>
            <div className="py-3 px-4 border border-gray-100 rounded-xl bg-gray-50/50 text-gray-400 font-medium tracking-widest">••••••••••••</div>
          </div>
        </div>
      </section>

      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-premium-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-brand-primary px-8 py-5">
              <h3 className="text-white font-bold text-lg">Edit Profile</h3>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Avatar URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowEdit(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCredentials && (
        <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-premium-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-brand-primary px-8 py-5">
              <h3 className="text-white font-bold text-lg">Update Credentials</h3>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Login Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
                <p className="text-[11px] text-gray-400 font-medium">Changing your email will require a verification link sent to your new address.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowCredentials(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCredentials}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-premium-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-500 px-8 py-5">
              <h3 className="text-white font-bold text-lg">Delete Account</h3>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-sm text-rose-700 font-medium text-center">
                  This action is permanent and will delete all your data and content projects.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-all text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
