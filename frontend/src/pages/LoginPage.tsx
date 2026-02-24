import { useState } from "react";
import { Loader2, Target } from "lucide-react";

interface LoginPageProps {
  supabase: any;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}

export function LoginPage({ supabase, notify }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error State
  const [authError, setAuthError] = useState<string | null>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // SignUp State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const clearError = () => {
    if (authError) setAuthError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) {
      setAuthError("System configuration error: Supabase not found.");
      return;
    }
    if (!loginEmail || !loginPassword) {
      setAuthError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        console.error("Login error:", error);
        setAuthError(error.message || "Invalid login credentials.");
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) {
      setAuthError("Supabase is not configured.");
      return;
    }
    if (!signUpEmail || !signUpPassword) {
      setAuthError("Please enter email and password.");
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        notify("Account created! Check your email to confirm.", "success");
        setIsSignUp(false);
      }
    } catch (err) {
      setAuthError("An unexpected error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F8FB] px-4 font-ribo">
      {/* Background decoration matching Ribo palette */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-7%] w-[40%] h-[40%] bg-[#3FA9F5]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[38%] h-[38%] bg-[#0B2641]/5 rounded-full blur-[100px]" />
      </div>

      <div className="bg-white p-8 md:p-12 rounded-xl shadow-[0_10px_40px_rgba(11,38,65,0.08)] w-full max-w-[440px] relative z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#3FA9F5] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 transition-transform hover:scale-110">
            <Target className="text-white w-7 h-7" />
          </div>
          <h1 className="h3 text-[#0B2641]">
            Startup<span className="text-[#3FA9F5]">Lab</span>
          </h1>
          <p className="caption-1 text-slate-400 mt-2 uppercase tracking-widest font-bold">Content Intelligence Platform</p>
        </div>

        {!isSignUp ? (
          <>
            <h2 className="h5 text-[#0B2641] text-center mb-6">Welcome Back</h2>

            {authError && (
              <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="mt-0.5">⚠️</div>
                <span>{authError}</span>
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <div className="space-y-1.5 text-left">
                <label className="label-ribo text-slate-500">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alex@company.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] transition-all text-sm"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    clearError();
                  }}
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="label-ribo text-slate-500">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] transition-all text-sm"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    clearError();
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#0B2641] text-white rounded-md font-bold text-sm hover:bg-[#1D3D5E] transition-all shadow-lg shadow-blue-900/10 mt-2 flex justify-center items-center"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIGN IN"}
              </button>
            </form>

            <div className="relative text-center my-8">
              <span className="relative z-10 bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">or continue with</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
              onClick={async () => {
                if (!supabase) {
                  notify("Supabase is not configured.", "error");
                  return;
                }
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: window.location.origin },
                });
              }}
            >
              <img src="https://cdn.freebiesupply.com/logos/large/2x/google-g-2015-logo-png-transparent.png" alt="Google" className="w-5 h-5" />
              Google Workspace
            </button>

            <p className="mt-8 text-xs text-slate-500 text-center">
              New to StartupLab?{" "}
              <button
                type="button"
                className="text-[#3FA9F5] font-bold hover:underline transition-colors"
                onClick={() => setIsSignUp(true)}
              >
                Create Account
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="h5 text-[#0B2641] text-center mb-2">Create Account</h2>
            <p className="body-3 text-slate-400 text-center mb-8">Join the intelligence fast-lane.</p>

            <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="label-ribo text-slate-500">First Name</label>
                  <input
                    type="text"
                    placeholder="Alex"
                    className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="label-ribo text-slate-500">Last Name</label>
                  <input
                    type="text"
                    placeholder="Smith"
                    className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="label-ribo text-slate-500">Corporate Email</label>
                <input
                  type="email"
                  placeholder="alex@company.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] text-sm"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="label-ribo text-slate-500">Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] text-sm"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="label-ribo text-slate-500">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5] text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#0B2641] text-white rounded-md font-bold text-sm hover:bg-[#1D3D5E] transition-all shadow-lg flex justify-center items-center mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "JOIN NOW"}
              </button>
            </form>

            <p className="mt-8 text-xs text-slate-500 text-center">
              Already a member?{" "}
              <button
                type="button"
                className="text-[#3FA9F5] font-bold hover:underline transition-colors"
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
