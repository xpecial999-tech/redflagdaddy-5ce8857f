import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createGuestJourney } from "@/lib/guest.functions";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  UserCircle2,
  Mail,
  UserPlus,
  ClipboardList,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

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
    body: "Is your partner a Dominant, submissive, or switch? This shapes the questions they will answer.",
  },
];

function GuestPage() {
  const createFn = useServerFn(createGuestJourney);

  const [email, setEmail] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerType, setPartnerType] = useState<typeof partnerRoles[number]>("switch");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: { guestEmail: email, partnerEmail: partnerEmail || "", partnerType },
      }),
  });

  if (mutation.data) {
    return (
      <PartnerLinkView
        code={mutation.data.code}
        guestEmail={email}
        partnerEmail={partnerEmail}
        partnerType={partnerType}
      />
    );
  }

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
              {mutation.isPending ? "Creating…" : "Generate partner link"}
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

function PartnerLinkView({
  code,
  guestEmail,
  partnerEmail,
  partnerType,
}: {
  code: string;
  guestEmail: string;
  partnerEmail: string;
  partnerType: string;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const link = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/journey/${code}`;
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-1 to-aurora-2 items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Your partner link is ready
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Send this link to your partner so they can take the {partnerType} assessment. They'll
            answer privately and we'll email the combined report to you.
          </p>
        </div>

        <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Partner link
            </span>
            <div className="mt-2 flex items-stretch gap-2">
              <div className="flex-1 rounded-xl border border-border bg-input px-3 py-3 text-xs font-mono break-all">
                {link}
              </div>
              <button
                onClick={copy}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 text-xs font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Code: <span className="font-mono text-foreground">{code}</span>
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium">How to send it to your partner</h3>
            <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground list-decimal pl-4">
              <li>Copy the link above.</li>
              <li>Send it to your partner over a private channel (iMessage, Signal, WhatsApp, email).</li>
              <li>They open the link, confirm they're 18+, and complete the assessment.</li>
              <li>
                Once they finish, we'll email the combined report to you:{" "}
                <span className="text-foreground">{guestEmail}</span>
              </li>
            </ol>
          </div>
        </section>

        {partnerEmail && (
          <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Send invite to your partner
            </span>
            <div className="rounded-xl border border-border bg-input px-3 py-3 text-sm break-all">
              {partnerEmail}
            </div>
            <button
              onClick={() => setEmailConfirmed(true)}
              disabled={emailConfirmed}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary py-3 text-sm font-medium disabled:opacity-70"
            >
              {emailConfirmed ? (
                <>
                  <Check className="w-4 h-4" /> Invite sent
                </>
              ) : (
                "Send invite"
              )}
            </button>
          </section>
        )}

        <section className="glass-strong rounded-3xl p-6 sm:p-7 text-center space-y-3">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            Want to take your own assessment too?
          </h3>
          <p className="text-sm text-muted-foreground">
            Follow the journey from your side and we'll compare both perspectives in the final
            report.
          </p>
          <button
            onClick={() => navigate({ to: "/journey/$code", params: { code } })}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30"
          >
            Start my assessment
            <ArrowRight className="w-4 h-4" />
          </button>
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
