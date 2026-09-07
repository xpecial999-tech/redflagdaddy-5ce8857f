import { type Role } from "@/lib/roles";
import { RoleSelector } from "@/components/RoleSelector";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { claimAnonymousJourney, createGuestJourney } from "@/lib/guest.functions";
import { captureMarketingEvent } from "@/lib/marketing-attribution";
import { ConstructionPage } from "@/components/ConstructionPage";
import { useConstructionMode } from "@/hooks/use-construction-mode";
import { EmailOtpForm } from "@/components/EmailOtpForm";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  UserCircle2,
  ClipboardList,
  Copy,
  Check,
  CheckCircle2,
  MessageCircle,
  KeyRound,
  Download,
  Send,
  FileCheck2,
} from "lucide-react";

export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [
      { title: "Continue as guest — RedFlagDaddy" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: GuestPage,
  errorComponent: ({ error }) => <p className="text-destructive">{error.message}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});

const steps = [
  {
    icon: ClipboardList,
    title: "Pick the dynamic you're assessing",
    body: "Choose the role that best suits your partner.",
  },
  {
    icon: Send,
    title: "Send a link to your partner",
    body: "They open a private link and complete their side of the assessment.",
  },
  {
    icon: UserCircle2,
    title: "Fill out your matching assessment",
    body: "Answer your own side so the summary can compare both perspectives.",
  },
  {
    icon: FileCheck2,
    title: "Receive a summary once both are done",
    body: "Come back with your private code to view the result when both sides are complete.",
  },
];

function GuestPage() {
  const createFn = useServerFn(createGuestJourney);
  const construction = useConstructionMode();

  const [notificationMode] = useState<"owner_code">("owner_code");
  const [partnerType, setPartnerType] = useState<Role | "">("");
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: { guestPhone: "", notificationMode, partnerType },
      }),
    onSuccess: () => {
      void captureMarketingEvent("core_action_completed", "guest", { once: true });
    },
  });

  if (construction.enabled) return <ConstructionPage />;

  if (mutation.data) {
    return (
      <PartnerLinkView
        code={mutation.data.code}
        ownerCode={mutation.data.ownerCode}
        ownerExpiresAt={mutation.data.ownerExpiresAt}
        partnerType={partnerType}
      />
    );
  }

  return (
    <div className="py-2 sm:py-6">
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
            Start a private assessment
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start with your partner's side. We'll create a private link you can send them, then you
            can complete your own matching assessment.
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
            <div>
              <span className="text-sm font-medium">Which role best suits your partner?</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                This shapes the questions they'll answer first.
              </p>
              <div className="mt-3 max-h-64 overflow-y-auto pr-1 space-y-3">
                <RoleSelector value={partnerType} onChange={setPartnerType} />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
              <input
                type="checkbox"
                required
                checked={consentAcknowledged}
                onChange={(event) => setConsentAcknowledged(event.target.checked)}
                className="mt-0.5 accent-primary"
              />
              I confirm I am 18+ and agree to the consent &amp; safety guidelines.
            </label>

            {mutation.error && (
              <p role="alert" className="text-xs text-destructive">
                {(mutation.error as Error).message}
              </p>
            )}

            <button
              disabled={mutation.isPending || !partnerType || !consentAcknowledged}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {mutation.isPending ? "Creating…" : "Generate partner link"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            No account or email is needed to start.
          </p>
        </section>
      </motion.div>
    </div>
  );
}

function PartnerLinkView({
  code,
  ownerCode,
  ownerExpiresAt,
  partnerType,
}: {
  code: string;
  ownerCode: string | null;
  ownerExpiresAt: string | null;
  partnerType: Role | "";
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [ownerCodeCopied, setOwnerCodeCopied] = useState(false);
  const claimFn = useServerFn(claimAnonymousJourney);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, []);

  const link = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/j/${code}`;
  }, [code]);

  const shareMessage = useMemo(
    () =>
      `Hey — I'd like us to take a private compatibility & consent assessment together on RedFlagDaddy. Open this link to take your ${partnerType} assessment: ${link}`,
    [link, partnerType],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const copyOwnerCode = async () => {
    if (!ownerCode) return;
    try {
      await navigator.clipboard.writeText(ownerCode);
      setOwnerCodeCopied(true);
      setTimeout(() => setOwnerCodeCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="py-2 sm:py-6">
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
            answer privately. Return with your private owner code to check the report.
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
                type="button"
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
              <li>
                Share the link using one of the buttons below — your contacts stay on your device.
              </li>
              <li>They open the link, confirm they're 18+, and complete the assessment.</li>
              <li>
                Return to this page and enter your private owner code to check progress or view the
                report.
              </li>
            </ol>
          </div>
        </section>

        {ownerCode && (
          <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-4 border border-primary/25">
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Save your private owner code
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  This is shown once and cannot be recovered. Keep it separate from the partner
                  link. Anyone with it can view the report until it expires.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-input p-4 text-center font-mono text-base sm:text-lg tracking-wider break-all">
              {ownerCode}
            </div>
            <div className="grid grid-cols-2 gap-2 no-print">
              <button
                type="button"
                onClick={copyOwnerCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium"
              >
                {ownerCodeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {ownerCodeCopied ? "Copied" : "Copy code"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium"
              >
                <Download className="w-4 h-4" /> Save / print
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Expires{" "}
              {ownerExpiresAt
                ? new Date(ownerExpiresAt).toLocaleDateString()
                : "30 days after creation"}
              . The journey and report are then deleted.
            </p>
          </section>
        )}

        {ownerCode && !claimed && (
          <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-4 border border-primary/25">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Save and track this journey
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Optional: create an account after sharing. This journey will appear on your
                dashboard, where you can track it, create more, and build custom journeys.
              </p>
            </div>
            <EmailOtpForm
              mode="register"
              onAuthenticated={async () => {
                try {
                  await claimFn({ data: { ownerCode } });
                  setClaimed(true);
                  navigate({ to: "/dashboard" });
                } catch (error) {
                  setClaimError(
                    error instanceof Error ? error.message : "We couldn't save this journey.",
                  );
                  throw error;
                }
              }}
            />
            {claimError && (
              <p role="alert" className="text-xs text-destructive">
                {claimError}
              </p>
            )}
          </section>
        )}

        <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Send the invite
          </span>
          <p className="text-xs text-muted-foreground">
            Share the private link yourself by email or WhatsApp.
          </p>
          <div className="grid gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium hover:bg-white/5 transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
