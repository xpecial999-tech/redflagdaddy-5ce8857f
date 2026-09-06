import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type EmailOtpFormProps = {
  mode: "login" | "register" | "admin";
  metadata?: { name?: string; role?: string };
  registrationAcknowledged?: boolean;
  onAuthenticated?: () => Promise<void> | void;
};

export function EmailOtpForm({
  mode,
  metadata,
  registrationAcknowledged = true,
  onAuthenticated,
}: EmailOtpFormProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    const { error: requestError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: mode === "register",
        data: mode === "register" ? metadata : undefined,
      },
    });
    setLoading(false);
    if (requestError) {
      setError("We couldn't send a sign-in code. Please wait and try again.");
      return;
    }
    setToken("");
    setStep("code");
  };

  const verifyCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (token.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });
    if (verifyError) {
      setLoading(false);
      setError("That code is invalid or has expired. Request a new one and try again.");
      return;
    }
    try {
      await onAuthenticated?.();
    } catch {
      setError("You are signed in, but we couldn't finish that action. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (step === "code") {
    return (
      <form className="space-y-4" onSubmit={verifyCode}>
        <p className="text-sm text-muted-foreground">
          Enter the six-digit code sent to <span className="text-foreground">{email}</span>.
        </p>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={token} onChange={setToken} autoComplete="one-time-code">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} className="h-12 w-12 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <button
          disabled={loading || token.length !== 6}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Checking code…" : "Continue"}
        </button>
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setStep("email")}
          >
            Use a different email
          </button>
          <button
            type="button"
            className="text-primary"
            disabled={loading}
            onClick={() => void requestCode()}
          >
            Send another code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-3" onSubmit={requestCode}>
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
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <button
        disabled={loading || !email.trim() || (mode === "register" && !registrationAcknowledged)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {loading ? "Sending code…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
