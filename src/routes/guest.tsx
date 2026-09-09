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
  Mail,
  MessageSquare,
  Share2,
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
          <div className="space-y-5">
            <div>
              <span className="text-sm font-medium">Which role best suits your partner?</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                This shapes the questions they'll answer first.
              </p>
              <div className="mt-3 space-y-3">
                <RoleSelector value={partnerType} onChange={setPartnerType} />
              </div>
            </div>
          </div>
        </section>

        <section className="glass-strong rounded-3xl p-6 sm:p-7">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
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

  const nativeShare = async () => {
    if (typeof navigator === "undefined" || !("share" in navigator)) return;
    try {
      await navigator.share({
        title: "RedFlagDaddy private assessment",
        text: shareMessage,
        url: link,
      });
    } catch {
      /* User cancelled or the device blocked sharing. */
    }
  };

  const saveOwnerCodeImage = () => {
    if (!ownerCode || typeof document === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 720, 720);
    bg.addColorStop(0, "#05020d");
    bg.addColorStop(0.45, "#15082b");
    bg.addColorStop(1, "#06010b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 720, 720);

    const glow = ctx.createRadialGradient(360, 220, 55, 360, 220, 410);
    glow.addColorStop(0, "rgba(236,72,153,0.42)");
    glow.addColorStop(0.5, "rgba(124,58,237,0.18)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 720, 720);

    ctx.strokeStyle = "rgba(236,72,153,0.45)";
    ctx.lineWidth = 3;
    roundRect(ctx, 64, 64, 592, 592, 32);
    ctx.stroke();

    ctx.fillStyle = "#f8f5ff";
    ctx.textAlign = "center";
    ctx.font = "700 48px Georgia, serif";
    ctx.fillText("RedFlagDaddy", 360, 168);

    const accent = ctx.createLinearGradient(210, 0, 510, 0);
    accent.addColorStop(0, "#ec4899");
    accent.addColorStop(1, "#7c3aed");
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(195, 205);
    ctx.lineTo(525, 205);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "500 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("🔑 Secret code", 360, 286);

    ctx.fillStyle = "rgba(12,8,28,0.78)";
    roundRect(ctx, 100, 320, 520, 120, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 320, 520, 120, 24);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 28px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = "middle";
    ctx.fillText(ownerCode, 360, 382);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "400 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Save this secret code.", 360, 510);
    ctx.fillText("You'll need it to return to your results.", 360, 542);

    ctx.fillStyle = "#f8f5ff";
    ctx.font = "600 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("View results at redflagdaddy.com", 360, 600);

    ctx.fillStyle = "#ec4899";
    ctx.font = "700 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Consent. Compatibility. Safety. Red flags.", 360, 632);

    const anchor = document.createElement("a");
    anchor.download = `redflagdaddy-owner-code-${code}.jpg`;
    anchor.href = canvas.toDataURL("image/jpeg", 0.82);
    anchor.click();
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(
    "Private RedFlagDaddy assessment",
  )}&body=${encodeURIComponent(shareMessage)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(shareMessage)}`;

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
            answer privately. Return with your secret code to check the report.
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

          <div className="flex flex-wrap justify-center gap-2 no-print">
            <ShareButton onClick={nativeShare} icon={Share2} label="Share" />
            <ShareLink href={mailHref} icon={Mail} label="Email" />
            <ShareLink href={smsHref} icon={MessageSquare} label="SMS" />
            <ShareLink href={whatsappHref} icon={MessageCircle} label="WhatsApp" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium">How to send it to your partner</h3>
            <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground list-decimal pl-4">
              <li>
                Share this link using one of the buttons above — your contacts stay on your device.
              </li>
              <li>They open the link, confirm they're 18+, and complete the assessment.</li>
            </ol>
          </div>
        </section>

        {ownerCode && !claimed && (
          <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-4 border border-primary/25">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                I've sent it, what next?
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">
                <li>Complete your own matching assessment while your partner answers theirs.</li>
                <li>
                  Enter your email address below and we’ll let you know when both sides are ready to
                  compare.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Get notified and keep track
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Add your email after sharing so we can tell you when both assessments are ready to
                compare. We’ll also save this journey to your dashboard so you can come back easily
                and create more when you’re ready.
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

            <p className="-mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground/80">
              We only use your email for account access and journey notifications; no personal
              profile details are required.
            </p>
          </section>
        )}

        {ownerCode && (
          <section className="glass rounded-3xl p-6 sm:p-7 space-y-4 border border-primary/15">
            {!claimed && (
              <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Rather not register?</span> You can
                wait for your partner to complete the questionnaire, then come back and check using
                your secret code below.
              </p>
            )}
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Save your secret code
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  This is shown once and cannot be recovered. Keep it separate from the partner
                  link. You’ll need it to view your results until the journey expires.
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
                onClick={saveOwnerCodeImage}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium"
              >
                <Download className="w-4 h-4" /> Save code image
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
      </motion.div>
    </div>
  );
}

function ShareButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: typeof Share2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-input px-4 text-xs font-medium hover:bg-white/5 transition"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </button>
  );
}

function ShareLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Share2;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-input px-4 text-xs font-medium hover:bg-white/5 transition"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </a>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split("-");
  let line = "";
  let currentY = y;
  for (let i = 0; i < words.length; i += 1) {
    const candidate = line ? `${line}-${words[i]}` : words[i];
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  }
  ctx.fillText(line, x, currentY);
}
