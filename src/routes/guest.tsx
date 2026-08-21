import { oppositeRole, type Role } from "@/lib/roles";
import { RoleSelector } from "@/components/RoleSelector";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createGuestJourney } from "@/lib/guest.functions";
import { formatPhone } from "@/lib/phone";
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
} from "lucide-react";

export const Route = createFileRoute("/guest")({
  head: () => ({ meta: [{ title: "Continue as guest — RedFlagDaddy" }] }),
  component: GuestPage,
  errorComponent: ({ error }) => (
    
      <p className="text-destructive">{error.message}</p>
    
  ),
  notFoundComponent: () => (
    
      <p>Not found.</p>
    
  ),
});

const steps = [
  {
    icon: Smartphone,
    title: "Tell us where to send your report",
    body: "We'll text your completed compatibility, safety and red-flag report link to your mobile number when the assessment is done.",
  },
  {
    icon: ClipboardList,
    title: "Pick the dynamic you're assessing",
    body: "Choose the role that best matches your partner. This shapes the questions they will answer.",
  },
];

function GuestPage() {
  const createFn = useServerFn(createGuestJourney);

  const [phone, setPhone] = useState("");
  const [partnerType, setPartnerType] = useState<Role | "">("");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: { guestPhone: phone, partnerEmail: "", partnerType },
      }),
  });


  if (mutation.data) {
    return (
      <PartnerLinkView
        code={mutation.data.code}
        guestPhone={phone}
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
            Take the assessment without creating an account. Your final report link is sent to your mobile number.
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
              label="Your mobile number"
              hint="We'll text your private report link here when the assessment is done."
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="071 234 5678"
            />


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
              <input type="checkbox" required className="mt-0.5 accent-primary" />
              I confirm I am 18+ and agree to the consent &amp; safety guidelines.
            </label>

            {mutation.error && (
              <p className="text-xs text-destructive">{(mutation.error as Error).message}</p>
            )}

            <button
              disabled={mutation.isPending || !partnerType}
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
    </div>
  );
}

function PartnerLinkView({
  code,
  guestPhone,
  partnerType,
}: {
  code: string;
  guestPhone?: string;
  partnerType: Role | "";
}) {
  const navigate = useNavigate();
  const createFn = useServerFn(createGuestJourney);
  const [copied, setCopied] = useState(false);

  const opposite: Role | "" = partnerType ? oppositeRole(partnerType) : "";
  const [selfType, setSelfType] = useState<Role | "">(opposite);

  const selfMutation = useMutation({
    mutationFn: () =>
      createFn({ data: { guestPhone: guestPhone ?? "", partnerEmail: "", partnerType: selfType as Role, isSelf: true } }),

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

  const smsHref = `sms:?&body=${encodeURIComponent(shareMessage)}`;
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
            answer privately and we'll text the combined report link to your mobile number.
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
              <li>Share the link using one of the buttons below — your contacts stay on your device.</li>
              <li>They open the link, confirm they're 18+, and complete the assessment.</li>
              <li>
                Once they finish, we'll text the combined report link to:{" "}
                <span className="text-foreground">{formatPhone(guestPhone) || guestPhone}</span>
              </li>
            </ol>
          </div>
        </section>

        <section className="glass-strong rounded-3xl p-6 sm:p-7 space-y-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Send the invite
          </span>
          <p className="text-xs text-muted-foreground">
            Open your messaging app with the invite pre-filled. Pick the contact yourself —
            nothing is sent until you hit send.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={smsHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input py-3 text-sm font-medium hover:bg-white/5 transition"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </a>
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
            <p className="text-xs text-destructive">{(selfMutation.error as Error).message}</p>
          )}
          <button
            onClick={() => selfMutation.mutate()}
            disabled={!selfType || selfMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {selfMutation.isPending ? "Preparing…" : "Start my assessment"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

      </motion.div>
    </div>
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

