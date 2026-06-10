import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — RedFlagDaddy" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  };

  return (
    <div className="max-w-sm mx-auto pt-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
        <h1 className="text-2xl font-display font-semibold mb-1">Reset your password</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {sent ? "Check your inbox for a reset link." : "Enter your email and we'll send you a reset link."}
        </p>
        {!sent && (
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs text-muted-foreground">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1 w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </label>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="text-xs text-muted-foreground text-center mt-6">
          <Link to="/login" className="text-primary">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
