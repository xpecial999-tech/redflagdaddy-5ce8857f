import { createFileRoute, Link, useNavigate, useServerFn } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Mail, Sparkles, ArrowRight, Link2, KeyRound, Loader2 } from "lucide-react";
import { createJourney } from "@/lib/journeys.functions";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({ meta: [{ title: "Create journey — Dynamic Compass" }] }),
  component: Create,
});

const participantTypes = [
  { value: "Dominant", desc: "They lead in the dynamic." },
  { value: "submissive", desc: "They follow in the dynamic." },
  { value: "switch", desc: "They move between roles." },
] as const;

type Step = 1 | 2 | 3 | 4;
type ParticipantType = (typeof participantTypes)[number]["value"];

function Create() {
  const navigate = useNavigate();
  const createFn = useServerFn(createJourney);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [participantType, setParticipantType] = useState<ParticipantType>("submissive");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: title.trim(),
          participantType,
          recipientName: recipientName.trim() || null,
          recipientEmail: recipientEmail.trim() || null,
          notes: notes.trim() || null,
        },
      }),
    onSuccess: () => setStep(4),
  });

  const canContinue =
    (step === 1 && title.trim().length > 0) ||
    (step === 2 && !!participantType) ||
    (step === 3 && true);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {step < 4 ? `Step ${step} of 3` : "All set"}
        </p>
        <h1 className="text-3xl font-display font-semibold">
          {step < 4 ? "Create journey" : "Journey ready"}
        </h1>
      </header>

      {step < 4 && (
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2" animate={{ width: `${(step / 3) * 100}%` }} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepWrap key="1">
            <h2 className="font-semibold mb-3">Name your journey</h2>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Negotiation with Alex"
              maxLength={120}
              className="w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-2">Only you and the respondent see this.</p>
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap key="2">
            <h2 className="font-semibold mb-3">Their role in the dynamic</h2>
            <div className="space-y-2">
              {participantTypes.map((t) => {
                const on = participantType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setParticipantType(t.value)}
                    className={`w-full text-left rounded-2xl p-4 border transition ${on ? "border-primary/60 bg-primary/10" : "border-border bg-input"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${on ? "bg-primary border-primary" : "border-border"}`}>
                        {on && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap key="3">
            <h2 className="font-semibold mb-3">Respondent details</h2>
            <Field label="Participant name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Optional" />
            <Field label="Participant email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Optional, for invite" />
            <label className="block">
              <span className="text-xs text-muted-foreground">Notes for them</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context, intentions, anything you want them to know."
                maxLength={2000}
                className="mt-1 w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </label>
            {mutation.isError && (
              <p className="text-xs text-destructive">{(mutation.error as Error).message}</p>
            )}
          </StepWrap>
        )}

        {step === 4 && mutation.data && (
          <SuccessScreen
            key="4"
            url={mutation.data.journey.invite_url ?? ""}
            code={mutation.data.journey.invite_code}
            email={mutation.data.journey.recipient_email}
            title={mutation.data.journey.title}
          />
        )}
      </AnimatePresence>

      {step < 4 && (
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep((step - 1) as Step)} className="flex-1 rounded-xl glass py-3 text-sm font-medium">
              Back
            </button>
          )}
          <button
            disabled={!canContinue || mutation.isPending}
            onClick={() => {
              if (step < 3) setStep((step + 1) as Step);
              else mutation.mutate();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> :
              step < 3 ? <>Continue <ArrowRight className="w-4 h-4" /></> :
              <>Create journey <Sparkles className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="flex gap-3">
          <Link to="/dashboard" className="flex-1 text-center rounded-xl glass py-3 text-sm font-medium">Dashboard</Link>
          <button onClick={() => { setStep(1); setTitle(""); setNotes(""); setRecipientEmail(""); setRecipientName(""); mutation.reset(); }} className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium">
            Create another
          </button>
        </div>
      )}
    </div>
  );
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="glass-strong rounded-3xl p-6 space-y-3"
    >
      {children}
    </motion.div>
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

function SuccessScreen({ url, code, email, title }: { url: string; code: string; email: string | null; title: string }) {
  const [copied, setCopied] = useState<"url" | "code" | null>(null);
  const copy = (val: string, kind: "url" | "code") => {
    navigator.clipboard.writeText(val);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };
  const mailto = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Dynamic Compass invite: ${title}`)}&body=${encodeURIComponent(`You've been invited to complete an assessment.\n\nOpen: ${url}\nOr enter code: ${code}\n\nThis link expires in 7 days.`)}`
    : `mailto:?subject=${encodeURIComponent(`Dynamic Compass invite: ${title}`)}&body=${encodeURIComponent(`Open: ${url}\nOr enter code: ${code}`)}`;

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="glass-strong rounded-3xl p-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center mb-3"
        >
          <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
        </motion.div>
        <h2 className="text-xl font-display font-semibold">"{title}" is live</h2>
        <p className="text-sm text-muted-foreground mt-1">Share the link or code with your respondent. Expires in 7 days.</p>
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5"><Link2 className="w-3.5 h-3.5" /> Invite URL</div>
          <div className="flex gap-2">
            <input readOnly value={url} className="flex-1 rounded-xl bg-input border border-border px-3 py-2.5 text-xs font-mono truncate" />
            <button onClick={() => copy(url, "url")} className="rounded-xl bg-primary/15 text-primary px-3 text-xs font-medium inline-flex items-center gap-1.5 min-w-[88px] justify-center">
              {copied === "url" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy URL</>}
            </button>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5"><KeyRound className="w-3.5 h-3.5" /> Invite code</div>
          <div className="flex gap-2">
            <input readOnly value={code} className="flex-1 rounded-xl bg-input border border-border px-3 py-2.5 text-sm font-mono tracking-[0.3em] text-center" />
            <button onClick={() => copy(code, "code")} className="rounded-xl bg-primary/15 text-primary px-3 text-xs font-medium inline-flex items-center gap-1.5 min-w-[88px] justify-center">
              {copied === "code" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
            </button>
          </div>
        </div>
      </div>

      <a href={mailto} className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30">
        <Mail className="w-4 h-4" /> Send by email
      </a>
    </motion.div>
  );
}
