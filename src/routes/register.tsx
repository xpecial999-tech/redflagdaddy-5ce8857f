import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Dynamic Compass" }] }),
  component: Register,
});

const roles = ["Dominant", "submissive", "switch"] as const;

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<typeof roles[number]>("switch");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name, role },
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) navigate({ to: "/dashboard" });
    else setError("Check your email to confirm your account, then sign in.");
  };

  return (
    <div className="max-w-sm mx-auto pt-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
        <h1 className="text-2xl font-display font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">18+ only. Consent-first by design.</p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Used on your journeys" />
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Field label="Password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />

          <div>
            <span className="text-xs text-muted-foreground">Primary identity</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button type="button" key={r} onClick={() => setRole(r)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${role === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-input text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
            <input type="checkbox" required className="mt-0.5 accent-primary" />
            I confirm I am 18+ and agree to the consent & safety guidelines.
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Already a member? <Link to="/login" className="text-primary">Sign in</Link>
        </p>
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
