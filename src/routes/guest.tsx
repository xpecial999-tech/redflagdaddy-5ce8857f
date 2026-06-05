import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createGuestJourney } from "@/lib/guest.functions";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, UserCircle2, Mail, UserPlus, ClipboardList, ShieldCheck } from "lucide-react";

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

const partnerRoles = ["Dominant", "submissive", "switch"] as const;

const steps = [
  {
    icon: Mail,
    title: "Tell us where to send your report",
    body: "We'll email your completed compatibility, safety and red-flag report to you when the assessment is done.",
  },
  {
    icon: UserPlus,
    title: "Invite your partner (optional)",
    body: "Add their email and we'll send them an invite. Skip it and we'll give you a unique link & code to share yourself.",
  },
  {
    icon: ClipboardList,
    title: "Pick the dynamic you're assessing",
    body: "Is your partner a Dominant, submissive, or switch? This shapes the questions you'll both answer.",
  },
  {
    icon: ShieldCheck,
    title: "Take the assessment privately",
    body: "No account needed. Your responses stay tied to a private link only you and your partner can use.",
  },
];

function GuestPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createGuestJourney);

  const [email, setEmail] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerType, setPartnerType] = useState<typeof partnerRoles[number]>("switch");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: { guestEmail: email, partnerEmail: partnerEmail || "", partnerType },
      }),
    onSuccess: ({ code }) => {
      navigate({ to: "/journey/$code", params: { code } });
    },
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-1 to-aurora-2 items-center justify-center">
            <UserCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Continue as guest
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Take the assessment without creating an account. Your final report lands in your inbox.
          </p>
        </div>

        <section className="glass-strong rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-lg font-semibold tracking-tight">How it works</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="flex gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium">{s.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="glass-strong rounded-3xl p-6 sm:p-7">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Field
              label="Your email address"
              hint="Only used to send your completed report."
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <Field
              label="Your partner's email"
              hint="Optional — leave blank to get a unique link & code to share yourself."
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="partner@example.com"
            />

            <div>
              <span className="text-sm font-medium">Which assessment do you want to do?</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Is your partner a Dominant, submissive, or switch?
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {partnerRoles.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setPartnerType(r)}
                    className={`rounded-xl border px-2 py-3 text-xs font-medium transition ${partnerType === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-input text-muted-foreground hover:text-foreground"}`}
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
            Want to save your history?{" "}
            <Link to="/register" className="text-primary">Create an account</Link>
          </p>
        </section>
      </motion.div>
    </main>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
      <input
        {...props}
        className="mt-2 w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
