import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
interface LoginPageProps {
  supabase: any;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}

export function LoginPage({ supabase, notify }: LoginPageProps) {
    const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {!isSignUp ? (
          <>
            {/* Sign In */}
            <h1 style={{ textAlign: "center", textTransform: "uppercase", paddingBottom: "20px" }}>Welcome Back</h1>

            <button
              type="button"
              className="btn btn-primary"
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
              <img src="https://cdn.freebiesupply.com/logos/large/2x/google-g-2015-logo-png-transparent.png" alt="Google" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Sign in with Google
            </button>

            <div className="divider">OR</div>

            <form className="auth-form">
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
            </form>
            <button type="submit" className="btn btn-primary">
              LOGIN
            </button>

            <p className="auth-footer">
              Don't have an account?{" "}
              <button type="button" className="link-button" onClick={() => setIsSignUp(true)}>
                Sign Up
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Sign Up */}
            <h1>Create an account</h1>
            <p className="auth-subtitle">Sign up to get started.</p>

            <form className="auth-form">
              <input type="text" placeholder="Full Name" />
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <input type="password" placeholder="Confirm Password" />
            </form>
            <button type="submit" className="btn btn-primary">
              SIGN UP
            </button>

            <p className="auth-footer">
              Already have an account?{" "}
              <button type="button" className="link-button" onClick={() => setIsSignUp(false)}>
                Log In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
