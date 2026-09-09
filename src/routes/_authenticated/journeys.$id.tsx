import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  KeyRound,
  Link2,
  Mail,
  MessageCircle,
  MessageSquare,
  Pencil,
  Share2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Sparkles,
  PlayCircle,
  UserCircle2,
} from "lucide-react";
import { getJourneyStatus, deleteJourney, renameJourney } from "@/lib/journeys.functions";

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
  const renameFn = useServerFn(renameJourney);

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

  const rename = useMutation({
    mutationFn: (title: string) => renameFn({ data: { id, title } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journeys"] });
      qc.invalidateQueries({ queryKey: ["journey", id] });
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
        <p className="text-sm text-muted-foreground">
          It may have been deleted or you don't have access.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-primary mt-2"
        >
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this journey and all responses? This cannot be undone.")) {
                remove.mutate();
              }
            }}
            disabled={remove.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
          >
            {remove.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">All set</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-display font-semibold">Journey ready</h1>
          <button
            type="button"
            onClick={() => {
              const next = prompt("Rename this journey", journey.title);
              const title = next?.trim();
              if (title && title !== journey.title) rename.mutate(title);
            }}
            disabled={rename.isPending}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-input px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-60"
          >
            {rename.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
            Rename
          </button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 space-y-4 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-aurora-1 to-aurora-2">
          <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold break-words">
            "{journey.title}" is live
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share the link with your partner, then complete your own side while they answer theirs.
          </p>
        </div>
        <div className="flex justify-center">
          <StatusPill status={effectiveStatus} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Partner progress</span>
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

      <SelfAssessmentCard journey={journey} />

      {/* Share & send */}
      <section className="space-y-3">
        <details className="group glass rounded-2xl p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
            <span>Need the partner link again?</span>
            <span className="text-xs text-muted-foreground transition group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="mt-4">
            <ShareCard url={url} code={journey.invite_code} />
          </div>
        </details>
      </section>

      {/* Timeline */}
      <section className="space-y-3">
        <SectionLabel>Status timeline</SectionLabel>
        <div className="glass rounded-2xl p-4 space-y-0">
          {steps.map((s, i) => (
            <TimelineRow key={s.label} step={s} last={i === steps.length - 1} />
          ))}
        </div>
      </section>

      {/* View results */}
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
    {
      label: "Journey created",
      desc: "You set the title, role and details.",
      state: "done",
      at: p.createdAt,
    },
    {
      label: "Invite sent",
      desc: p.sentAt ? "Invite link delivered." : "Share the private link below.",
      state: p.sentAt ? "done" : "active",
      at: p.sentAt,
    },
    {
      label: "Partner started",
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
      desc:
        p.status === "completed"
          ? "Scores and summary available."
          : "Will appear after completion.",
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
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${colors}`}
        >
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

function ShareCard({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = useState<"url" | "code" | null>(null);

  const shareMessage = `Hey — I'd like us to take a private compatibility & consent assessment together on RedFlagDaddy. Open this link to answer your side: ${url}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(
    "RedFlagDaddy private assessment",
  )}&body=${encodeURIComponent(shareMessage)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(shareMessage)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied("url");
    setTimeout(() => setCopied(null), 1500);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied("code");
    setTimeout(() => setCopied(null), 1500);
  };

  const nativeShare = async () => {
    if (typeof navigator === "undefined" || !("share" in navigator)) return;
    try {
      await navigator.share({
        title: "RedFlagDaddy private assessment",
        text: shareMessage,
        url,
      });
    } catch {
      /* User cancelled or the device blocked sharing. */
    }
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
          <Link2 className="w-3.5 h-3.5" /> Invite URL
        </div>
        <p className="text-xs text-muted-foreground/80 mb-1.5">
          This link is unique to this journey — simply share it directly with your partner.
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
            {copied === "url" ? (
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

      <div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
          <KeyRound className="w-3.5 h-3.5" /> Invite code
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm font-mono tracking-[0.3em] text-center hover:border-primary/50 transition"
        >
          {copied === "code" ? "COPIED" : code}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-input px-4 text-xs font-medium transition hover:border-primary/50 hover:bg-white/5"
        >
          <Share2 className="w-4 h-4 text-primary" /> Share
        </button>
        <a
          href={emailHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-input px-4 text-xs font-medium transition hover:border-primary/50 hover:bg-white/5"
        >
          <Mail className="w-4 h-4 text-primary" /> Email
        </a>
        <a
          href={smsHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-input px-4 text-xs font-medium transition hover:border-primary/50 hover:bg-white/5"
        >
          <MessageSquare className="w-4 h-4 text-primary" /> SMS
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-input px-4 text-xs font-medium transition hover:border-primary/50 hover:bg-white/5"
        >
          <MessageCircle className="w-4 h-4 text-primary" /> WhatsApp
        </a>
      </div>
    </div>
  );
}

function SelfAssessmentCard({
  journey,
}: {
  journey: {
    title: string;
    invite_code: string;
  };
}) {
  const navigate = useNavigate();

  return (
    <section className="glass-strong rounded-3xl p-6 text-center space-y-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-aurora-1 to-aurora-2">
        <UserCircle2 className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">Start the assessment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer your side now while your partner has the link. You can come back here to track
          progress.
        </p>
      </div>
      <button
        onClick={() => navigate({ to: "/assessment/$code", params: { code: journey.invite_code } })}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
      >
        Start assessment <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    pending: {
      label: "Awaiting partner",
      cls: "bg-primary/15 text-primary border-primary/30",
      Icon: Clock,
    },
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
    expired: {
      label: "Expired",
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/40",
      Icon: AlertTriangle,
    },
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
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
      {children}
    </div>
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
