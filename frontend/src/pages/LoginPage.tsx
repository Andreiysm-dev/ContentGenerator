import { useState } from "react";
import { Loader2 } from "lucide-react";

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
    setAuthError(null); // Clear previous errors
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
      } else {
        // App.tsx auth listener will handle redirection
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
    <div className="flex justify-center items-center min-h-screen bg-cover bg-center px-4 sm:px-6" style={{ backgroundImage: "url('https://i.pinimg.com/1200x/a5/c7/e6/a5c7e61c0ea7ee0cfa03a220c6de9272.jpg')" }}>
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-[400px] text-center my-4">
        {!isSignUp ? (
          <>
            <div className="text-3xl sm:text-md font-bold text-brand-dark uppercase pb-5 mb-2 font-body">Welcome Back</div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-left flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            <form className="flex flex-col gap-3 mb-4" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${authError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-primary'}`}
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  clearError();
                }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${authError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-primary'}`}
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  clearError();
                }}
                required
              />

              <button type="submit" className="w-full text-md btn btn-primary flex justify-center mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LOGIN"}
              </button>
            </form>

            <div className="relative text-center my-6 font-medium">
              <span className="relative z-10 bg-white px-4">OR</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 btn btn-primary text-black bg-white border border-gray-300 hover:bg-gray-50"
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
              <img src="https://cdn.freebiesupply.com/logos/large/2x/google-g-2015-logo-png-transparent.png" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>

            <p className="mt-6 text-sm text-gray-500">
              Don't have an account?{" "}
              <button type="button" className="text-brand-primary underline font-medium transition-colors cursor-pointer bg-transparent border-none p-0" onClick={() => setIsSignUp(true)}>
                Sign Up
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Sign Up */}
            <div className="text-2xl sm:text-md font-bold uppercase mb-2">Create an account</div>
            <p className="text-gray-600 mb-8">Sign up to get started.</p>

            <form className="flex flex-col gap-3 mb-4" onSubmit={handleSignUp}>
              <input
                type="text"
                placeholder="First Name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button type="submit" className="w-full flex justify-center btn btn-primary mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIGN UP"}
              </button>
            </form>

            <p className="mt-6 text-sm text-gray-500">
              Already have an account?{" "}
              <button type="button" className="text-brand-primary underline font-medium transition-colors cursor-pointer bg-transparent border-none p-0" onClick={() => setIsSignUp(false)}>
                Log In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
