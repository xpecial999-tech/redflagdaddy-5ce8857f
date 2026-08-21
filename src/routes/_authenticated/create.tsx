import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Copy, Mail, Sparkles, ArrowRight, Link2, KeyRound, Loader2, UserCircle2, Lock, Layers, Zap, MessageSquare } from "lucide-react";
import { createJourney } from "@/lib/journeys.functions";
import { getEntitlement, listPublicCategories } from "@/lib/entitlement.functions";
import { toE164, isValidE164, formatPhone } from "@/lib/phone";
import { TOP_ROLES, BOTTOM_ROLES, SWITCH_ROLES, type Role, oppositeRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({ meta: [{ title: "Create journey — RedFlagDaddy" }] }),
  component: Create,
});

type Step = 1 | 2 | 3 | 4 | 5;

function Create() {
  const createFn = useServerFn(createJourney);
  const entFn = useServerFn(getEntitlement);
  const catsFn = useServerFn(listPublicCategories);

  const ent = useQuery({ queryKey: ["entitlement"], queryFn: () => entFn() });
  const cats = useQuery({ queryKey: ["public-categories"], queryFn: () => catsFn() });

  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [participantType, setParticipantType] = useState<Role>("submissive");
  const [mode, setMode] = useState<"full" | "quick" | "deep">("full");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: title.trim(),
          participantType,
          recipientName: recipientName.trim() || null,
          recipientEmail: recipientEmail.trim() || null,
          recipientPhone: recipientPhone.trim() ? toE164(recipientPhone.trim()) : null,
          notes: notes.trim() || null,
          categoryIds: mode === "deep" && categoryIds.length > 0 ? categoryIds : null,
          questionLimit: mode === "quick" ? 50 : null,
        },
      }),
    onSuccess: () => setStep(5),
  });

  const canDeepDive = ent.data?.canDeepDive ?? true;
  const canCreate = ent.data?.canCreateJourney ?? true;
  const qLimit = ent.data?.questionLimit ?? 100;

  const canContinue =
    (step === 1 && title.trim().length > 0) ||
    (step === 2 && !!participantType) ||
    (step === 3 && (mode !== "deep" || categoryIds.length > 0)) ||
    (step === 4 && (!recipientPhone.trim() || isValidE164(toE164(recipientPhone.trim()))));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {step < 5 ? `Step ${step} of 4` : "All set"}
        </p>
        <h1 className="text-3xl font-display font-semibold">
          {step < 5 ? "Create journey" : "Journey ready"}
        </h1>
        {ent.data?.paidModeEnabled && !ent.data.isPaid && (
          <div className="mt-3 glass rounded-xl p-3 text-xs flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              Free plan · {qLimit} questions · {ent.data.activeJourneys}/{ent.data.freeJourneyCap} journeys used
            </span>
            <Link to="/upgrade" className="text-primary font-medium">Upgrade</Link>
          </div>
        )}
        {!canCreate && (
          <div className="mt-3 glass rounded-xl p-3 text-sm text-destructive">
            You've hit the free-plan journey limit. <Link to="/upgrade" className="underline">Upgrade</Link> for unlimited.
          </div>
        )}
      </header>

      {step < 5 && (
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2" animate={{ width: `${(step / 4) * 100}%` }} />
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
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <RoleGroup label="Top / leading" roles={TOP_ROLES} selected={participantType} onSelect={setParticipantType} />
              <RoleGroup label="Bottom / receiving" roles={BOTTOM_ROLES} selected={participantType} onSelect={setParticipantType} />
              <RoleGroup label="Switch / fluid" roles={SWITCH_ROLES} selected={participantType} onSelect={setParticipantType} />
            </div>
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap key="3">
            <h2 className="font-semibold mb-3">Question set</h2>
            <div className="space-y-2">
              <button
                onClick={() => setMode("full")}
                className={`w-full text-left rounded-2xl p-4 border transition ${mode === "full" ? "border-primary/60 bg-primary/10" : "border-border bg-input"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-aurora-2" /> Full assessment</div>
                    <div className="text-xs text-muted-foreground mt-0.5">≈{qLimit} questions across all categories.</div>
                  </div>
                  {mode === "full" && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
              <button
                onClick={() => setMode("quick")}
                className={`w-full text-left rounded-2xl p-4 border transition ${mode === "quick" ? "border-primary/60 bg-primary/10" : "border-border bg-input"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-aurora-1" /> Quick assessment</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ≈{Math.min(50, qLimit)} questions — a fair spread across all categories.
                    </div>
                  </div>
                  {mode === "quick" && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
              <button
                onClick={() => canDeepDive && setMode("deep")}
                disabled={!canDeepDive}
                className={`w-full text-left rounded-2xl p-4 border transition ${mode === "deep" ? "border-primary/60 bg-primary/10" : "border-border bg-input"} ${!canDeepDive ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {canDeepDive ? <Layers className="w-4 h-4 text-aurora-1" /> : <Lock className="w-4 h-4" />} Category deep-dive
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {canDeepDive ? "Pick categories — get every question in them." : "Upgrade to unlock."}
                    </div>
                  </div>
                  {mode === "deep" && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
            </div>

            {mode === "deep" && canDeepDive && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Choose at least one category</p>
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {(cats.data?.categories ?? []).map((c) => {
                    const on = categoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setCategoryIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                          )
                        }
                        className={`text-left rounded-xl border px-3 py-2 text-xs transition ${on ? "border-primary bg-primary/15 text-primary" : "border-border bg-input text-muted-foreground hover:text-foreground"}`}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[10px] opacity-70">{c.count} questions</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </StepWrap>
        )}

        {step === 4 && (
          <StepWrap key="4">
            <h2 className="font-semibold mb-3">Respondent details</h2>
            <Field label="Participant name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Optional" />
            <Field label="Participant email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Optional, for invite" />
            <Field
              label="Participant mobile (SMS invite)"
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Optional, e.g. 082 123 4567"
            />
            {recipientPhone.trim() && !isValidE164(toE164(recipientPhone)) && (
              <p className="text-xs text-destructive -mt-2">Enter a valid mobile number.</p>
            )}
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

        {step === 5 && mutation.data && (
          <SuccessScreen
            key="5"
            url={mutation.data.journey.invite_url ?? ""}
            code={mutation.data.journey.invite_code}
            email={mutation.data.journey.recipient_email}
            title={mutation.data.journey.title}
            partnerType={mutation.data.journey.participant_type as Role}
            smsSent={mutation.data.smsSent}
            phone={recipientPhone.trim() ? toE164(recipientPhone.trim()) : null}
          />
        )}
      </AnimatePresence>

      {step < 5 && (
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep((step - 1) as Step)} className="flex-1 rounded-xl glass py-3 text-sm font-medium">
              Back
            </button>
          )}
          <button
            disabled={!canContinue || mutation.isPending || !canCreate}
            onClick={() => {
              if (step < 4) setStep((step + 1) as Step);
              else mutation.mutate();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> :
              step < 4 ? <>Continue <ArrowRight className="w-4 h-4" /></> :
              <>Create journey <Sparkles className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {step === 5 && mutation.data && (
        <div className="flex gap-3">
          <button onClick={() => { setStep(1); setTitle(""); setNotes(""); setRecipientEmail(""); setRecipientName(""); setMode("full"); setCategoryIds([]); mutation.reset(); }} className="flex-1 rounded-xl glass py-3 text-sm font-medium">
            Create another
          </button>
          <Link
            to="/journeys/$id"
            params={{ id: mutation.data.journey.id }}
            className="flex-1 text-center rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 inline-flex items-center justify-center gap-1.5"
          >
            Track journey <ArrowRight className="w-4 h-4" />
          </Link>
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

function SuccessScreen({ url, code, email, title, partnerType, smsSent, phone }: { url: string; code: string; email: string | null; title: string; partnerType: Role; smsSent?: boolean; phone?: string | null }) {
  const [copied, setCopied] = useState<"url" | "code" | null>(null);
  const navigate = useNavigate();
  const createFn = useServerFn(createJourney);
  const opposite: Role | "" = partnerType ? oppositeRole(partnerType) : "";
  const [selfType, setSelfType] = useState<Role | "">(opposite);

  const selfMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: "My self-assessment",
          participantType: selfType as Role,
          recipientName: null,
          recipientEmail: null,
          notes: null,
          categoryIds: null,
        },
      }),
    onSuccess: (res) => {
      navigate({ to: "/assessment/$code", params: { code: res.journey.invite_code } });
    },
  });

  const copy = (val: string, kind: "url" | "code") => {
    navigator.clipboard.writeText(val);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };
  const mailto = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`RedFlagDaddy invite: ${title}`)}&body=${encodeURIComponent(`You've been invited to complete an assessment.\n\nOpen: ${url}\nOr enter code: ${code}\n\nThis link expires in 7 days.`)}`
    : `mailto:?subject=${encodeURIComponent(`RedFlagDaddy invite: ${title}`)}&body=${encodeURIComponent(`Open: ${url}\nOr enter code: ${code}`)}`;

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
        {phone && (
          <p className={`text-xs mt-2 ${smsSent ? "text-primary" : "text-destructive"}`}>
            {smsSent ? `Invite SMS sent to ${formatPhone(phone)}.` : "We couldn't send the SMS — share the link below instead."}
          </p>
        )}
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
          <input readOnly value={code} className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm font-mono tracking-[0.3em] text-center" />
        </div>
      </div>

      <a href={mailto} className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30">
        <Mail className="w-4 h-4" /> Send by email
      </a>

      <a
        href={`sms:${phone ?? ""}${/(iPhone|iPad|Mac)/.test(typeof navigator !== "undefined" ? navigator.userAgent : "") ? "&" : "?"}body=${encodeURIComponent(`You've been invited to a RedFlagDaddy assessment: "${title}". Start here: ${url}`)}`}
        className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-input border border-border py-3 text-sm font-medium"
      >
        <MessageSquare className="w-4 h-4" /> Send by SMS
      </a>

      <div className="glass-strong rounded-3xl p-6 text-center space-y-4">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-1 to-aurora-2 items-center justify-center mx-auto">
          <UserCircle2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">Take your own assessment too</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add your perspective — we'll compare both sides in the final report.
          </p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">I am a…</span>
          <div className="mt-2 max-h-56 overflow-y-auto pr-1 space-y-3">
            <RoleGroup label="Top / leading" roles={TOP_ROLES} selected={selfType} onSelect={setSelfType} />
            <RoleGroup label="Bottom / receiving" roles={BOTTOM_ROLES} selected={selfType} onSelect={setSelfType} />
            <RoleGroup label="Switch / fluid" roles={SWITCH_ROLES} selected={selfType} onSelect={setSelfType} />
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
          {selfMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</> : <>Start my assessment <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </motion.div>
  );
}

function RoleGroup({ label, roles, selected, onSelect }: { label: string; roles: readonly Role[]; selected: Role | ""; onSelect: (r: Role) => void }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {roles.map((r) => {
          const on = selected === r;
          return (
            <button
              type="button"
              key={r}
              onClick={() => onSelect(r)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition text-left ${on ? "border-primary bg-primary/15 text-primary" : "border-border bg-input text-muted-foreground hover:border-primary/50"}`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
