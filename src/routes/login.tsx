import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin-auth.functions";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/phone-auth.functions";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toE164, isValidE164, formatPhone } from "@/lib/phone";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — RedFlagDaddy" },
      { name: "description", content: "Sign in to RedFlagDaddy with your mobile number and a one-time SMS code." },
      { property: "og:title", content: "Sign in — RedFlagDaddy" },
      { property: "og:description", content: "Sign in with your mobile number and a one-time SMS code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const sendOtp = useServerFn(requestPhoneOtp);
  const verifyOtp = useServerFn(verifyPhoneOtp);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const e164 = toE164(phone);

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
    setInfo(`We sent a 6-digit code to ${formatPhone(e164)}.`);
  };

  const submittedRef = useRef<string | null>(null);

  const onVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    if (loading) return;
    submittedRef.current = otp;
    setLoading(true);
    setError(null);
    const result = await verifyOtp({ data: { phone: e164, code: otp } }).catch(() => ({
      error: "Could not verify code.",
    }));
    if ("error" in result && result.error) {
      setLoading(false);
      return setError(result.error);
    }
    if (!("session" in result) || !result.session) {
      setLoading(false);
      return setError("Could not sign you in.");
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    if (sessionError) {
      setLoading(false);
      return setError(sessionError.message);
    }
    let isAdmin = false;
    const adminStatus = await checkAdmin().catch(() => ({ isAdmin: false }));
    isAdmin = adminStatus.isAdmin;
    setLoading(false);
    navigate({ to: isAdmin ? "/admin" : "/dashboard", replace: true });
  };

  useEffect(() => {
    if (step !== "otp") return;
    if (otp.length !== 6 || loading) return;
    if (submittedRef.current === otp) return;
    void onVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step, loading]);

  return (
    <div className="max-w-sm mx-auto pt-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div key="phone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-2xl font-display font-semibold mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground mb-6">Enter your mobile number and we'll text you a code.</p>
              <form className="space-y-3" onSubmit={sendCode}>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Mobile number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className="mt-1 w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60">
                  {loading ? "Sending code…" : "Send code"}
                </button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-6">
                New here? <Link to="/register" className="text-primary">Create an account</Link>
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
                  {loading ? "Verifying…" : "Verify & sign in"}
                </button>
              </form>
              <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground">
                <button type="button" onClick={() => { setStep("phone"); setOtp(""); setError(null); }} className="hover:text-foreground">
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
    </div>
  );
}
