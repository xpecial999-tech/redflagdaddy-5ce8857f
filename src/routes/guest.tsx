import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createGuestJourney } from "@/lib/guest.functions";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/guest")({
  head: () => ({ meta: [{ title: "Continue as guest — Dynamic Compass" }] }),
  component: GuestPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <p className="text-destructive">{error.message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p>Not found.</p>
    </AppShell>
  ),
});

const roles = ["Dominant", "submissive", "switch"] as const;

function GuestPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createGuestJourney);

  const [title, setTitle] = useState("My assessment");
  const [role, setRole] = useState<typeof roles[number]>("switch");
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({ data: { title, participantType: role, guestEmail: email } }),
    onSuccess: ({ code }) => {
      navigate({ to: "/journey/$code", params: { code } });
    },
  });

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center mb-4">
            <UserCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Continue as guest</h1>
          <p className="text-sm text-muted-foreground mt-2">
            No account needed. Your final report will be emailed to you on submission.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Field
              label="Assessment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
            />
            <Field
              label="Email for your report"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <div>
              <span className="text-xs text-muted-foreground">Primary identity</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${role === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-input text-muted-foreground"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
              <input type="checkbox" required className="mt-0.5 accent-primary" />
              I confirm I am 18+ and agree to the consent &amp; safety guidelines.
            </label>

            {mutation.error && (
              <p className="text-xs text-destructive">{(mutation.error as Error).message}</p>
            )}

            <button
              disabled={mutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {mutation.isPending ? "Creating…" : "Start assessment"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Want to save your history? <Link to="/register" className="text-primary">Create an account</Link>
          </p>
        </div>
      </motion.div>
    </AppShell>
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
