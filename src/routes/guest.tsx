import { oppositeRole, type Role } from "@/lib/roles";
import { RoleSelector } from "@/components/RoleSelector";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createGuestJourney, lookupAnonymousJourney, sendGuestInvite } from "@/lib/guest.functions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { formatPhone } from "@/lib/phone";
import { captureMarketingEvent } from "@/lib/marketing-attribution";
import { ConstructionPage } from "@/components/ConstructionPage";
import { useConstructionMode } from "@/hooks/use-construction-mode";
import { InternationalPhoneInput } from "@/components/InternationalPhoneInput";
import { ReportView } from "@/components/ReportView";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  UserCircle2,
  Smartphone,
  ClipboardList,
  Copy,
  Check,
  CheckCircle2,
  MessageCircle,
  MessageSquare,
  BellRing,
  BellOff,
  KeyRound,
  Search,
  Download,
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
    icon: Smartphone,
    title: "Choose how to return",
    body: "Receive a private SMS when the report is ready, or save a private lookup code and receive no notifications.",
  },
  {
    icon: ClipboardList,
    title: "Pick the dynamic you're assessing",
    body: "Choose the role that best matches your partner. This shapes the questions they will answer.",
  },
];

function GuestPage() {
  const createFn = useServerFn(createGuestJourney);
  const construction = useConstructionMode();

  const [phone, setPhone] = useState("");
  const [notificationMode, setNotificationMode] = useState<"sms" | "owner_code">("sms");
  const [partnerType, setPartnerType] = useState<Role | "">("");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: { guestPhone: phone, notificationMode, partnerType },
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
        guestPhone={phone}
        notificationMode={notificationMode}
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
            Continue as guest
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Take the assessment without creating an account. Choose a text notification or a
            completely no-contact return code.
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

        <JourneyLookup />

        <section className="glass-strong rounded-3xl p-6 sm:p-7">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">How should we let you know?</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your choice only affects how you return to this journey.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <ModeCard
                  selected={notificationMode === "sms"}
                  onClick={() => setNotificationMode("sms")}
                  icon={BellRing}
                  title="Text me when ready"
                  body="Receive one private report link by SMS."
                />
                <ModeCard
                  selected={notificationMode === "owner_code"}
                  onClick={() => setNotificationMode("owner_code")}
                  icon={BellOff}
                  title="No notifications"
                  body="Save a code and return here within 30 days."
                />
              </div>
            </div>

            {notificationMode === "sms" ? (
              <div>
                <span className="text-sm font-medium">Your mobile number</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We'll text your private report link here when the assessment is done.
                </p>
                <InternationalPhoneInput
                  id="guest-owner-phone"
                  value={phone}
                  onValueChange={setPhone}
                  required
                  className="mt-2"
                  aria-label="Your mobile number"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">No contact details are required.</strong> You'll
                receive a private owner code once. It cannot be recovered, and the journey and
                report are automatically deleted after 30 days.
              </div>
            )}

            <div>
              <span className="text-sm font-medium">Which assessment do you want to do?</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the role that best matches your partner.
              </p>
              <div className="mt-3 max-h-64 overflow-y-auto pr-1 space-y-3">
                <RoleSelector value={partnerType} onChange={setPartnerType} />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
              <input type="checkbox" required className="mt-0.5 accent-primary" />I confirm I am 18+
              and agree to the consent &amp; safety guidelines.
            </label>

            {mutation.error && (
              <p role="alert" className="text-xs text-destructive">
                {(mutation.error as Error).message}
              </p>
            )}

            <button
              disabled={
                mutation.isPending || !partnerType || (notificationMode === "sms" && !phone)
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {mutation.isPending ? "Creating…" : "Generate partner link"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Want to save your history?{" "}
            <Link to="/register" className="text-primary">
              Create an account
            </Link>
          </p>
        </section>
      </motion.div>
    </div>
  );
}

function ModeCard({
  selected,
  onClick,
  icon: Icon,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof BellRing;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected ? "border-primary bg-primary/10" : "border-border bg-input hover:bg-white/5"
      }`}
    >
      <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
      <span className="block mt-2 text-sm font-medium">{title}</span>
      <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">{body}</span>
    </button>
  );
}

function JourneyLookup() {
  const lookupFn = useServerFn(lookupAnonymousJourney);
  const [ownerCode, setOwnerCode] = useState("");
  const lookup = useMutation({
    mutationFn: () => lookupFn({ data: { ownerCode } }),
  });

  const result = lookup.data;

  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-4">
      <div className="flex items-start gap-3">
        <Search className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Check a journey code
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the private owner code you saved. Codes and reports expire after 30 days.
          </p>
        </div>
      </div>

      <form
        className="flex flex-col sm:flex-row gap-2 no-print"
        onSubmit={(event) => {
          event.preventDefault();
          lookup.mutate();
        }}
      >
        <Input
          value={ownerCode}
          onChange={(event) => {
            setOwnerCode(event.target.value.toUpperCase());
            if (lookup.data) lookup.reset();
          }}
          aria-label="Private owner code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
          className="font-mono tracking-wide"
        />
        <button
          disabled={lookup.isPending || !ownerCode.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <Search className="w-4 h-4" /> {lookup.isPending ? "Checking…" : "Check code"}
        </button>
      </form>

      {lookup.error && (
        <p className="text-xs text-destructive">
          Could not check this code. Please wait and try again.
        </p>
      )}
      {result?.status === "unavailable" && (
        <p className="text-xs text-muted-foreground rounded-xl border border-border bg-input p-4">
          This code is invalid, expired, or no longer available. For privacy, we cannot recover
          anonymous codes.
        </p>
      )}
      {(result?.status === "waiting" || result?.status === "in_progress") && (
        <p className="text-xs text-muted-foreground rounded-xl border border-border bg-input p-4">
          {result.status === "waiting"
            ? "The partner assessment has not started yet."
            : "The partner assessment is still in progress."}{" "}
          Return with the same code later. This journey expires{" "}
          {new Date(result.expiresAt).toLocaleDateString()}.
        </p>
      )}
      {result?.status === "completed" && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-end no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input px-4 py-2.5 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Save / print report
            </button>
          </div>
          <ReportView
            title={result.journey.title}
            participantType={result.journey.participantType}
            scores={result.scores}
            analysis={result.analysis}
          />
          <p className="text-center text-xs text-muted-foreground no-print">
            Available until {new Date(result.expiresAt).toLocaleDateString()}.
          </p>
        </div>
      )}
    </section>
  );
}

function PartnerLinkView({
  code,
  guestPhone,
  notificationMode,
  ownerCode,
  ownerExpiresAt,
  partnerType,
}: {
  code: string;
  guestPhone?: string;
  notificationMode: "sms" | "owner_code";
  ownerCode: string | null;
  ownerExpiresAt: string | null;
  partnerType: Role | "";
}) {
  const navigate = useNavigate();
  const createFn = useServerFn(createGuestJourney);
  const [copied, setCopied] = useState(false);
  const [ownerCodeCopied, setOwnerCodeCopied] = useState(false);
  const sendInviteFn = useServerFn(sendGuestInvite);
  const [smsOpen, setSmsOpen] = useState(false);
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rNote, setRNote] = useState("");
  const [sending, setSending] = useState(false);

  const submitSms = async () => {
    setSending(true);
    try {
      await sendInviteFn({
        data: {
          code,
          recipientPhone: rPhone.trim(),
          recipientName: rName.trim() || undefined,
          notes: rNote.trim() || undefined,
        },
      });
      toast.success("Invite sent by SMS");
      setSmsOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const opposite: Role | "" = partnerType ? oppositeRole(partnerType) : "";
  const [selfType, setSelfType] = useState<Role | "">(opposite);

  const selfMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          guestPhone: guestPhone ?? "",
          notificationMode: "sms" as const,
          partnerType: selfType as Role,
          isSelf: true,
        },
      }),

    onSuccess: (res) => {
      navigate({ to: "/journey/$code", params: { code: res.code } });
    },
  });

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
            answer privately.{" "}
            {notificationMode === "sms"
              ? "We'll text the combined report link to your mobile number."
              : "Return with your private owner code to check the report."}
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
                {notificationMode === "sms" ? (
                  <>
                    Once they finish, we'll text the combined report link to:{" "}
                    <span className="text-foreground">{formatPhone(guestPhone) || guestPhone}</span>
                  </>
                ) : (
                  "Return to this page and enter your private owner code to check progress or view the report."
                )}
              </li>
            </ol>
          </div>
        </section>

        {notificationMode === "owner_code" && ownerCode && (
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

        <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Send the invite
          </span>
          <p className="text-xs text-muted-foreground">
            Send the invite by SMS from RedFlagDaddy — just enter their number — or share it on
            WhatsApp yourself.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSmsOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium hover:bg-white/5 transition"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
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

          <Dialog open={smsOpen} onOpenChange={(o) => !o && setSmsOpen(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send invite by SMS</DialogTitle>
                <DialogDescription>
                  We'll text the invite link straight to their phone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="g-name">Partner name (optional)</Label>
                  <Input
                    id="g-name"
                    value={rName}
                    onChange={(e) => setRName(e.target.value)}
                    placeholder="e.g. Natasha"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-phone">Partner mobile number</Label>
                  <InternationalPhoneInput
                    id="g-phone"
                    value={rPhone}
                    onValueChange={setRPhone}
                    aria-label="Partner mobile number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-note">Personal note (optional)</Label>
                  <Input
                    id="g-note"
                    value={rNote}
                    onChange={(e) => setRNote(e.target.value)}
                    placeholder="Add a line of context for them"
                    maxLength={500}
                  />
                </div>
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={submitSms}
                  disabled={sending || !rPhone.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send SMS"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {notificationMode === "sms" && (
          <section className="glass-strong rounded-3xl p-6 sm:p-7 text-center space-y-4">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              Want to take your own assessment too?
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick your own dynamic — we'll compare both perspectives in the final report.
            </p>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                I am a…
              </span>
              <div className="mt-2 max-h-56 overflow-y-auto pr-1 space-y-3">
                <RoleSelector value={selfType} onChange={setSelfType} />
              </div>
            </div>
            {selfMutation.error && (
              <p role="alert" className="text-xs text-destructive">
                {(selfMutation.error as Error).message}
              </p>
            )}
            <button
              type="button"
              onClick={() => selfMutation.mutate()}
              disabled={!selfType || selfMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {selfMutation.isPending ? "Preparing…" : "Start my assessment"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}
      </motion.div>
    </div>
  );
}
