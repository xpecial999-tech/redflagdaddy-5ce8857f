import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Link2,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { getJourneyStatus, deleteJourney, sendJourneyInvite } from "@/lib/journeys.functions";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/journeys/$id")({
  head: () => ({ meta: [{ title: "Journey — RedFlagDaddy" }] }),
  component: JourneyTracker,
});

function JourneyTracker() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getJourneyStatus);
  const removeFn = useServerFn(deleteJourney);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["journey", id],
    queryFn: () => fetchStatus({ data: { id } }),
    refetchInterval: (q) => {
      const s = q.state.data?.journey?.status;
      return s === "completed" || s === "expired" ? false : 15000;
    },
  });

  const remove = useMutation({
    mutationFn: () => removeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journeys"] });
      navigate({ to: "/dashboard", replace: true });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass-strong rounded-3xl p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h2 className="font-display text-lg">We couldn't load that journey</h2>
        <p className="text-sm text-muted-foreground">It may have been deleted or you don't have access.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-primary mt-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const { journey, invite, progress, isExpired } = data;
  const effectiveStatus = isExpired && journey.status !== "completed" ? "expired" : journey.status;
  const url = journey.invite_url ?? "";

  const steps = buildSteps({
    createdAt: journey.created_at,
    sentAt: null,
    startedAt: progress.answered > 0 ? journey.updated_at : null,
    completedAt: invite?.completed_at ?? null,
    status: effectiveStatus,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {journey.participant_type} · journey
            </p>
            <h1 className="text-2xl font-display font-semibold break-words">{journey.title}</h1>
          </div>
          <StatusPill status={effectiveStatus} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Respondent progress</span>
            <span>
              {progress.answered} / {progress.total} answered
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.section>

      {/* Timeline */}
      <section className="space-y-3">
        <SectionLabel>Status timeline</SectionLabel>
        <div className="glass rounded-2xl p-4 space-y-0">
          {steps.map((s, i) => (
            <TimelineRow key={s.label} step={s} last={i === steps.length - 1} />
          ))}
        </div>
      </section>

      {/* Share & send */}
      <section className="space-y-3">
        <SectionLabel>Send to respondent</SectionLabel>
        <ShareCard journeyId={journey.id} url={url} />
      </section>

      {/* View results / continue actions */}
      <section className="space-y-2">
        {effectiveStatus === "completed" && (
          <Link
            to="/results/$id"
            params={{ id: journey.id }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30"
          >
            <Sparkles className="w-4 h-4" /> View results
          </Link>
        )}
        <button
          onClick={() => {
            if (confirm("Delete this journey and all responses? This cannot be undone.")) {
              remove.mutate();
            }
          }}
          disabled={remove.isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 text-destructive py-3 text-sm font-medium hover:bg-destructive/10 transition disabled:opacity-50"
        >
          {remove.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="w-4 h-4" /> Delete journey
            </>
          )}
        </button>
      </section>
    </div>
  );
}

type StepState = "done" | "active" | "pending" | "blocked";
type Step = { label: string; desc: string; state: StepState; at?: string | null };

function buildSteps(p: {
  createdAt: string;
  sentAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
}): Step[] {
  const expired = p.status === "expired";
  return [
    { label: "Journey created", desc: "You set the title, role and details.", state: "done", at: p.createdAt },
    {
      label: "Invite sent",
      desc: p.sentAt ? "Invite link delivered." : "Share the link or text it below.",
      state: p.sentAt ? "done" : "active",
      at: p.sentAt,
    },
    {
      label: "Respondent started",
      desc: p.startedAt ? "They opened the assessment." : "Waiting for them to begin.",
      state: p.startedAt ? "done" : expired ? "blocked" : "pending",
      at: p.startedAt,
    },
    {
      label: "Responses complete",
      desc: p.completedAt
        ? "All questions answered."
        : expired
          ? "Invite expired before completion."
          : "In progress.",
      state: p.completedAt ? "done" : expired ? "blocked" : "pending",
      at: p.completedAt,
    },
    {
      label: "Results ready",
      desc: p.status === "completed" ? "Scores and summary available." : "Will appear after completion.",
      state: p.status === "completed" ? "done" : expired ? "blocked" : "pending",
    },
  ];
}

function TimelineRow({ step, last }: { step: Step; last: boolean }) {
  const colors = {
    done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    active: "bg-primary/20 text-primary border-primary/40 animate-pulse",
    pending: "bg-white/5 text-muted-foreground border-white/10",
    blocked: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  }[step.state];
  const Icon = step.state === "done" ? Check : step.state === "blocked" ? AlertTriangle : Clock;

  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${colors}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!last && <div className="w-px flex-1 bg-white/10 mt-1" />}
      </div>
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-medium text-sm">{step.label}</div>
          {step.at && (
            <div className="text-[10px] text-muted-foreground shrink-0">{formatDate(step.at)}</div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>
      </div>
    </div>
  );
}

function ShareCard({ journeyId, url }: { journeyId: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<"sms" | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const sendFn = useServerFn(sendJourneyInvite);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openModal = (kind: "sms") => {
    setContact("");
    setRecipientName("");
    setNote("");
    setModal(kind);
  };

  const submit = async () => {
    setSending(true);
    try {
      const res = await sendFn({
        data: {
          id: journeyId,
          channel: "sms" as const,
          recipientPhone: contact,
          recipientName: recipientName || undefined,
          notes: note || undefined,
        },

      });
      if (res.ok) {
        toast.success("Invite sent by SMS");
        setModal(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
          <Link2 className="w-3.5 h-3.5" /> Invite URL
        </div>
        <p className="text-xs text-muted-foreground/80 mb-1.5">
          This link is unique to this journey — simply share it directly with your respondent.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-xl bg-input border border-border px-3 py-2.5 text-xs font-mono truncate"
          />
          <button
            onClick={copy}
            className="rounded-xl bg-primary/15 text-primary px-3 text-xs font-medium inline-flex items-center gap-1.5 min-w-[88px] justify-center"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => openModal("sms")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-aurora-1/15 text-aurora-1 py-3 text-sm font-medium hover:bg-aurora-1/25 transition"
        >
          <Send className="w-4 h-4" /> Send by SMS
        </button>
      </div>

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send invite by SMS
            </DialogTitle>
            <DialogDescription>
              Enter the recipient's mobile number to text them the invite link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rname">Recipient name (optional)</Label>
              <Input
                id="rname"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Natasha"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rcontact">
                Recipient mobile number
              </Label>
              <Input
                id="rcontact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+27123456789"
                inputMode="tel"
                type="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rnote">Personal note (optional)</Label>
              <Input
                id="rnote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a line of context for them"
                maxLength={500}
              />
            </div>

          </div>
          <DialogFooter>
            <button
              onClick={submit}
              disabled={sending || !contact.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send SMS
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    pending: { label: "Awaiting respondent", cls: "bg-primary/15 text-primary border-primary/30", Icon: Clock },
    in_progress: {
      label: "In progress",
      cls: "bg-aurora-1/20 text-aurora-1 border-aurora-1/40",
      Icon: PlayCircle,
    },
    completed: {
      label: "Completed",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
      Icon: CheckCircle2,
    },
    expired: { label: "Expired", cls: "bg-amber-500/15 text-amber-400 border-amber-500/40", Icon: AlertTriangle },
    draft: { label: "Draft", cls: "bg-white/5 text-muted-foreground border-white/10", Icon: Clock },
  };
  const v = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${v.cls}`}
    >
      <v.Icon className="w-3 h-3" /> {v.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">{children}</div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
