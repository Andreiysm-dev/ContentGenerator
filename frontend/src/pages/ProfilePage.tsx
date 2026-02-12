import { useState, useEffect } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

interface ProfilePageProps {
  session: Session | null;
  supabase: SupabaseClient | null;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          avatar_url: avatarUrl,
        },
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
    <main className="flex-1 overflow-y-auto p-2.5 md:p-6 ">
      <section className="w-full max-w-[1200px] mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="px-4 py-5 md:px-6 md:py-6 bg-gradient-to-r from-brand-primary/10 to-white border-t border-l border-r border-gray-200 rounded-t-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 md:gap-0 shadow-sm">
          <div>
            <h2 className="text-md md:text-xl font-bold">Personal Information</h2>
            <p className="mt-1 text-sm font-medium">Manage your personal details.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowEdit(true)} className="btn btn-primary btn-sm">
              Edit Profile
            </button>
            <button onClick={() => setShowDelete(true)} className="btn btn-danger btn-sm">
              Delete Account
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50">
          <div className="relative group">
            <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-premium transition-transform group-hover:scale-105" />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-md font-semibold text-gray-900">{userDisplayName}</div>
            <p className="text-gray-500 text-sm">{session?.user?.email}</p>
          </div>
        </div>
        <div className="w-full max-w-[1200px] mx-auto bg-white border-slate-200/60 not-[]:shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-4 py-5 md:px-6 md:py-6 bg-gradient-to-r from-brand-primary/10 to-white border-t border-l border-r border-gray-200 rounded-t-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 md:gap-0 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Account Credentials</h2>
              <p className="text-sm text-gray-500 font-medium">Manage your login email and password.</p>
            </div>

           <div className="flex inline-flex">
             <button onClick={() => setShowCredentials(true)} className="btn btn-primary btn-sm">
              Edit Credentials
            </button>
           </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Login Email</label>
                <div className="py-3 px-4 border border-gray-100 rounded-xl bg-gray-50/50 text-gray-700 text-sm">{session?.user?.email}</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Password</label>
                <div className="py-3 px-4 border border-gray-100 rounded-xl bg-gray-50/50 text-gray-400 ext-sm">••••••••••••</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#3fa9f5] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Edit Profile</h3>
              <button onClick={() => setShowEdit(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Profile Picture</label>
                <div className="relative w-full border border-gray-300 rounded-xl p-1 transition">
                  <input
                    type="file"
                    className="w-full rounded-xl text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-bold
                        file:bg-[#3fa9f5]/10 file:text-[#3fa9f5]
                        hover:file:bg-[#3fa9f5]/20
                        cursor-pointer transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button onClick={handleUpdateProfile} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#3fa9f5] hover:bg-[#2f97e6] shadow-md transition-all">
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#3fa9f5] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Update Credentials</h3>
              <button onClick={() => setShowCredentials(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Login Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                <p className="text-[11px] text-slate-400 font-medium italic">Verification link will be sent to the new email.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowCredentials(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button onClick={handleUpdateCredentials} className="btn btn-primary btn-sm">
                  {isSaving ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header with Red BG and Close Button */}
            <div className="bg-rose-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Delete Account</h3>
              <button onClick={() => setShowDelete(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium">This action is permanent. Are you sure you want to delete your account?</p>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={handleDeleteAccount} className="btn btn-danger btn-sm">
                  Yes, Delete
                </button>
                <button onClick={() => setShowDelete(false)} className="btn btn-primary btn-sm">
                  No, Keep My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
