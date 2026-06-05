import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Dynamic Compass" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <div className="max-w-sm mx-auto pt-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
        <h1 className="text-2xl font-display font-semibold mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to continue your journey.</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => navigate({ to: "/dashboard" }), 400);
          }}
        >
          <Field label="Email" type="email" placeholder="you@example.com" />
          <Field label="Password" type="password" placeholder="••••••••" />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">
          New here? <Link to="/register" className="text-primary">Create an account</Link>
        </p>
      </motion.div>
      <p className="text-xs text-center text-muted-foreground mt-4">
        Auth requires Lovable Cloud — enable to wire up real sign-in.
      </p>
    </div>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
