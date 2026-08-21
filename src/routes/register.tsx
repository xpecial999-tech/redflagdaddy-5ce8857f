import { type Role } from "@/lib/roles";
import { RoleSelector } from "@/components/RoleSelector";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/phone-auth.functions";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toE164, isValidE164, formatPhone } from "@/lib/phone";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — RedFlagDaddy" },
      { name: "description", content: "Create your RedFlagDaddy account with your mobile number — we'll text you a 6-digit code." },
      { property: "og:title", content: "Create account — RedFlagDaddy" },
      { property: "og:description", content: "Sign up with your mobile number. Consent-first, 18+ only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const sendOtp = useServerFn(requestPhoneOtp);
  const verifyOtp = useServerFn(verifyPhoneOtp);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [role, setRole] = useState<Role>("switch");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const e164 = toE164(phone);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [step]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    if (!isValidE164(e164)) return setError("Enter a valid mobile number, including country code.");
    setLoading(true);
    const result = await sendOtp({ data: { phone: e164 } }).catch(() => ({ error: "Could not send code." }));
    setLoading(false);
    if ("error" in result && result.error) return setError(result.error);
    setStep("otp");
    setInfo(`We sent a 6-digit code to ${formatPhone(e164)}. Enter it below to finish.`);
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    setError(null);
    const result = await verifyOtp({
      data: {
        phone: e164,
        code: otp,
        metadata: { name: name || undefined, role },
      },
    }).catch(() => ({ error: "Could not verify code." }));
    if ("error" in result && result.error) {
      setLoading(false);
      return setError(result.error);
    }
    if (!("session" in result) || !result.session) {
      setLoading(false);
      return setError("Could not create account.");
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    if (sessionError) {
      setLoading(false);
      return setError(sessionError.message);
    }
    setLoading(false);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="max-w-sm mx-auto pt-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-2xl font-display font-semibold mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground mb-6">18+ only. Consent-first by design.</p>
              <form className="space-y-3" onSubmit={sendCode}>
                <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Used on your journeys" />
                <Field
                  label="Mobile number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27 82 123 4567"
                />

                <div>
                  <span className="text-xs text-muted-foreground">Primary identity</span>
                  <div className="mt-2 space-y-3 max-h-64 overflow-y-auto pr-1">
                <RoleSelector value={role} onChange={setRole} />
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
                  <input type="checkbox" required className="mt-0.5 accent-primary" />
                  I confirm I am 18+ and agree to the{" "}
                  <Link to="/consent-safety" className="text-primary underline hover:text-foreground">
                    consent & safety guidelines
                  </Link>
                  .
                </label>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <button disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60">
                  {loading ? "Sending code…" : "Create account"}
                </button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-6">
                Already a member? <Link to="/login" className="text-primary">Sign in</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-2xl font-display font-semibold mb-1">Enter your code</h1>
              <p className="text-sm text-muted-foreground mb-6">{info ?? `We sent a 6-digit code to ${formatPhone(e164)}.`}</p>
              <form className="space-y-4" onSubmit={onVerify}>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && <p className="text-xs text-destructive text-center">{error}</p>}

                <button disabled={loading || otp.length !== 6} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60">
                  {loading ? "Verifying…" : "Verify & continue"}
                </button>
              </form>
              <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground">
                <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(null); }} className="hover:text-foreground">
                  ← Use a different number
                </button>
                <button type="button" onClick={() => sendCode()} className="text-primary">
                  Resend code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <section className="glass-strong rounded-3xl p-6 text-center">
        <h2 className="text-2xl font-display font-semibold mb-2">How it works</h2>
        <p className="text-sm text-muted-foreground mb-6">Three steps, fully consent-first.</p>
        <ol className="space-y-4 text-left">
          {[
            "Create a journey and choose what to assess.",
            "Invite the other person via a private, expiring link.",
            "Review side-by-side compatibility, limits and red flags.",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">{i + 1}</span>
              <span className="text-sm pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input {...props} className="mt-1 w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}

