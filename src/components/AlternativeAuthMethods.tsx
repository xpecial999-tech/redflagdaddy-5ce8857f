import { useState } from "react";
import { Apple, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthMethodsConfig } from "@/lib/auth-methods-config";
import { EmailOtpForm } from "@/components/EmailOtpForm";

type AlternativeAuthMethodsProps = {
  mode: "login" | "register" | "admin";
  metadata?: { name?: string; role?: string };
  primary?: boolean;
  registrationAcknowledged?: boolean;
  onAuthenticated?: () => Promise<void> | void;
};

export function AlternativeAuthMethods({
  mode,
  metadata,
  primary = false,
  registrationAcknowledged = true,
  onAuthenticated,
}: AlternativeAuthMethodsProps) {
  const config = getAuthMethodsConfig();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailEnabled = config.emailSignIn;
  const socialEnabled = mode !== "admin" && (config.googleSignIn || config.appleSignIn);
  if (!emailEnabled && !socialEnabled) return null;

  const continueWithProvider = async (provider: "google" | "apple") => {
    setLoading(provider);
    setError(null);
    const { error: providerError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
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
        <EmailOtpForm
          mode={mode}
          metadata={metadata}
          registrationAcknowledged={registrationAcknowledged}
          onAuthenticated={onAuthenticated}
        />
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
