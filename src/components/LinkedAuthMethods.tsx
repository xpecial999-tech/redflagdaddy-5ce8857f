import { useEffect, useState } from "react";
import { Apple, Check, Link2, Loader2, Mail, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthMethodsConfig } from "@/lib/auth-methods-config";
import { Input } from "@/components/ui/input";

export function LinkedAuthMethods() {
  const config = getAuthMethodsConfig();
  const [providers, setProviders] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setProviders((data.user?.identities ?? []).map((identity) => identity.provider));
    });
  }, []);

  if (!config.accountLinking) return null;

  const linkProvider = async (provider: "google" | "apple") => {
    setLoading(provider);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile")}`;
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo },
    });
    if (linkError) {
      setLoading(null);
      setError("We could not link that sign-in method. It may already belong to another account.");
    }
  };

  const linkEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    setMessage(null);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser(
      { email: email.trim().toLowerCase() },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile")}`,
      },
    );
    setLoading(null);
    if (updateError) {
      setError("We could not link that email address. It may already belong to another account.");
      return;
    }
    setMessage("Check that inbox to confirm the address. Your mobile sign-in remains available.");
  };

  const linked = (provider: string) => providers.includes(provider);

  return (
    <section className="glass-strong rounded-3xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">Sign-in methods</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Link another method while signed in so it opens this account and keeps your journeys
            together.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-input p-3 text-sm">
        <Smartphone className="w-4 h-4 text-primary" />
        Mobile SMS
        <Check className="ml-auto w-4 h-4 text-primary" aria-label="Linked" />
      </div>

      {config.emailSignIn && !linked("email") && (
        <form className="space-y-2" onSubmit={linkEmail}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            aria-label="Email address to link"
          />
          <button
            disabled={loading !== null || !email.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading === "email" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Link email sign-in
          </button>
        </form>
      )}

      {config.emailSignIn && linked("email") && <LinkedRow icon={Mail} label="Email sign-in" />}
      {config.googleSignIn &&
        (linked("google") ? (
          <LinkedRow icon={() => <span className="font-semibold">G</span>} label="Google" />
        ) : (
          <LinkButton
            label="Link Google"
            loading={loading === "google"}
            onClick={() => void linkProvider("google")}
          />
        ))}
      {config.appleSignIn &&
        (linked("apple") ? (
          <LinkedRow icon={Apple} label="Apple" />
        ) : (
          <LinkButton
            label="Link Apple"
            loading={loading === "apple"}
            onClick={() => void linkProvider("apple")}
            icon={Apple}
          />
        ))}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Mobile SMS stays available as a recovery method. Removing linked identities will be added
        only after the recovery policy is approved.
      </p>
      {message && <p className="text-xs text-primary">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}

function LinkedRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-input p-3 text-sm">
      <Icon className="w-4 h-4 text-primary" />
      {label}
      <Check className="ml-auto w-4 h-4 text-primary" aria-label="Linked" />
    </div>
  );
}

function LinkButton({
  label,
  loading,
  onClick,
  icon: Icon,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-2.5 text-sm font-medium disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : (
        <span className="font-semibold">G</span>
      )}
      {label}
    </button>
  );
}
