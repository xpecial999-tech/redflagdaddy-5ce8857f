import { useState } from "react";
import { Apple, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthMethodsConfig } from "@/lib/auth-methods-config";
import { Input } from "@/components/ui/input";

type AlternativeAuthMethodsProps = {
  mode: "login" | "register" | "admin";
  metadata?: { name?: string; role?: string };
  primary?: boolean;
  registrationAcknowledged?: boolean;
};

function callbackUrl(next = "/dashboard"): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function AlternativeAuthMethods({
  mode,
  metadata,
  primary = false,
  registrationAcknowledged = true,
}: AlternativeAuthMethodsProps) {
  const config = getAuthMethodsConfig();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "apple" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailEnabled = config.emailSignIn;
  const socialEnabled = mode !== "admin" && (config.googleSignIn || config.appleSignIn);
  if (!emailEnabled && !socialEnabled) return null;

  const sendEmailLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    setMessage(null);
    setError(null);
    const { error: requestError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: mode === "register",
        emailRedirectTo: callbackUrl(mode === "admin" ? "/admin" : "/dashboard"),
        data: mode === "register" ? metadata : undefined,
      },
    });
    setLoading(null);
    if (requestError) {
      // Keep the response generic so this surface does not reveal whether an
      // email address already has an account.
      setError("We could not send a sign-in link. Please wait and try again.");
      return;
    }
    setMessage("If this email can be used, a private sign-in link is on its way.");
  };

  const continueWithProvider = async (provider: "google" | "apple") => {
    setLoading(provider);
    setError(null);
    const { error: providerError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (providerError) {
      setLoading(null);
      setError("That sign-in method is not available right now.");
    }
  };

  return (
    <div className={`${primary ? "space-y-4" : "mt-6 space-y-4"}`}>
      {!primary && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span>or use another private sign-in method</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {emailEnabled && (
        <form className="space-y-2" onSubmit={sendEmailLink}>
          <label className="block">
            <span className="text-xs text-muted-foreground">Email address</span>
            <Input
              className="mt-1"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button
            disabled={
              loading !== null ||
              !email.trim() ||
              (mode === "register" && !registrationAcknowledged)
            }
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium disabled:opacity-60"
          >
            {loading === "email" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Email me a sign-in link
          </button>
        </form>
      )}

      {socialEnabled && (
        <div className="grid gap-2">
          {config.googleSignIn && (
            <button
              type="button"
              onClick={() => void continueWithProvider("google")}
              disabled={loading !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium disabled:opacity-60"
            >
              {loading === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span aria-hidden="true" className="font-semibold">
                  G
                </span>
              )}
              Continue with Google
            </button>
          )}
          {config.appleSignIn && (
            <button
              type="button"
              onClick={() => void continueWithProvider("apple")}
              disabled={loading !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium disabled:opacity-60"
            >
              {loading === "apple" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Apple className="w-4 h-4" />
              )}
              Continue with Apple
            </button>
          )}
        </div>
      )}

      {message && <p className="text-xs text-primary">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
