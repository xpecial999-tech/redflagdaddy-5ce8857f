import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssessment,
  saveResponse,
  completeAssessment,
} from "@/lib/assessment.functions";
import {
  hasAssessmentAnswer,
  visibleAssessmentQuestions,
  type AnswerOption as Option,
  type AssessmentQuestion as Question,
} from "@/lib/assessment-questions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { EmailOtpForm } from "@/components/EmailOtpForm";
import { claimAnonymousJourney } from "@/lib/guest.functions";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/assessment/$code")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow,noarchive" }] }),
  component: AssessmentPage,
  errorComponent: ({ error }) => (
    
      <ErrorCard message={error.message} />
    
  ),
  notFoundComponent: () => (
    
      <ErrorCard message="Assessment not found." />
    
  ),
});

function AssessmentPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getAssessment);
  const saveFn = useServerFn(saveResponse);
  const completeFn = useServerFn(completeAssessment);
  const claimFn = useServerFn(claimAnonymousJourney);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assessment", code],
    queryFn: () => getFn({ data: { code } }),
    retry: false,
    staleTime: 30_000,
  });

  // Answers map by question id
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [cursor, setCursor] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const saveSequence = useRef(0);

  // Hydrate answers when data first loads
  useEffect(() => {
    if (!data) return;
    const initial: Record<string, unknown> = {};
    for (const r of data.responses) initial[r.question_id] = r.answer;
    setAnswers(initial);
    if (!hydrated.current) {
      hydrated.current = true;
      const ordered = [...(data.questions ?? [])].sort(
        (a, b) => (a as { order_index: number }).order_index - (b as { order_index: number }).order_index,
      ) as unknown as Question[];
      const firstUnanswered = ordered.findIndex(
        (q) => initial[q.id] === undefined || initial[q.id] === "",
      );
      if (firstUnanswered > 0) setCursor(firstUnanswered);
      else if (firstUnanswered === -1 && ordered.length) setCursor(ordered.length - 1);
    }
  }, [data]);


  const questions = useMemo(() => (data?.questions ?? []) as unknown as Question[], [data]);

  const visible = useMemo(
    () => visibleAssessmentQuestions(questions, answers),
    [questions, answers],
  );

  const current = visible[cursor];
  const total = visible.length;
  const answeredCount = visible.filter((q) =>
    hasAssessmentAnswer(answers[q.id]),
  ).length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const saveMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: unknown }) =>
      saveFn({ data: { code, questionId, answer } }),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeFn({ data: { code } }),
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ["assessment", code] });
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) navigate({ to: "/results/$id", params: { id: res.journeyId } });
      else setSubmitted(true);
    },
  });


  function recordAnswer(answer: unknown, options?: { autoAdvance?: boolean }) {
    if (!current) return;
    const questionId = current.id;
    const questionIndex = cursor;
    const sequence = saveSequence.current + 1;
    saveSequence.current = sequence;

    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setSavingId(questionId);

    saveMutation
      .mutateAsync({ questionId, answer })
      .then(() => {
        if (options?.autoAdvance && sequence === saveSequence.current && questionIndex < total - 1) {
          setCursor((prev) => (prev === questionIndex ? Math.min(prev + 1, total - 1) : prev));
        }
      })
      .catch(() => {
        // Keep the user on the current question so they can retry the answer.
      })
      .finally(() => {
        if (sequence === saveSequence.current) setSavingId(null);
      });
  }

  function goNext() {
    if (cursor < total - 1) setCursor(cursor + 1);
  }
  function goPrev() {
    if (cursor > 0) setCursor(cursor - 1);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="glass-strong rounded-3xl p-8 sm:p-10 max-w-xl mx-auto text-center space-y-4 overflow-hidden relative"
      >
        <motion.div
          aria-hidden="true"
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1.12, 1], opacity: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-aurora-1 to-aurora-2 shadow-[0_0_48px_rgba(236,72,153,0.45)]"
        >
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
        </motion.div>
        <motion.div
          aria-hidden="true"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1.35, opacity: [0, 0.35, 0] }}
          transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
          className="absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full border border-primary/40"
        />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          className="text-3xl sm:text-4xl font-display font-semibold tracking-tight"
        >
          Assessment complete
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.38 }}
          className="text-sm sm:text-base text-muted-foreground leading-relaxed"
        >
          Thank you. Your answers are saved and the report is being generated — it will be shared with
          the person who invited you.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.55 }}
          className="text-xs text-muted-foreground"
        >
          You can safely close this page.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.68 }}
          className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left space-y-4"
        >
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold tracking-tight text-center sm:text-left">
              Save this journey
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground text-center sm:text-left">
              Create a profile to keep this report in your dashboard, see the journey you were
              invited to, and create your own journeys later.
            </p>
          </div>
          <EmailOtpForm
            mode="register"
            emailAutoComplete="off"
            onAuthenticated={async () => {
              try {
                const result = await claimFn({ data: { ownerCode: code } });
                navigate({ to: "/journeys/$id", params: { id: result.journeyId } });
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
          <p className="text-[11px] leading-relaxed text-muted-foreground/80">
            We only use your email for account access and journey notifications; no personal profile
            details are required.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      
        <div className="glass rounded-2xl p-8 max-w-xl mx-auto text-center text-sm text-muted-foreground">
          Loading your assessment…
        </div>
      
    );
  }
  if (error) {
    return (
      
        <ErrorCard message={error.message} />
      
    );
  }
  if (!current) {
    return (
      
        <ErrorCard message="No questions available." />
      
    );
  }

  const isLast = cursor === total - 1;
  const hasAnswer = hasAssessmentAnswer(answers[current.id]);

  return (
    
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              Question {cursor + 1} of {total}
            </span>
            <span className="flex items-center gap-1">
              {savingId === current.id ? (
                <>
                  <Save className="w-3 h-3 animate-pulse" /> Saving…
                </>
              ) : (
                <>{progress}% complete</>
              )}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass-strong rounded-3xl p-6 sm:p-8"
          >
            <div className="text-xs uppercase tracking-wider text-aurora-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {prettyType(current.question_type)}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight mt-2">
              {current.question}
            </h2>

            <div className="mt-6">
              <QuestionInput
                question={current}
                value={answers[current.id]}
                onChange={recordAnswer}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between gap-3 mt-6">
          <Button variant="ghost" onClick={goPrev} disabled={cursor === 0}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <Link
            to="/journey/$code"
            params={{ code }}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            Save & exit
          </Link>

          {isLast ? (
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={
                !hasAnswer ||
                saveMutation.isPending ||
                completeMutation.isPending
              }
            >
              {saveMutation.isPending
                ? "Saving…"
                : completeMutation.isPending
                  ? "Submitting…"
                  : "Submit"}
              <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!hasAnswer || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Next"}{" "}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {saveMutation.error && (
          <p className="text-sm text-destructive mt-3 text-center">
            {(saveMutation.error as Error).message}
          </p>
        )}

        {completeMutation.error && (
          <p className="text-sm text-destructive mt-3 text-center">
            {(completeMutation.error as Error).message}
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Your progress is saved automatically. You can close this page and return via your invite link.
        </p>
      </div>
    
  );
}

function prettyType(t: string) {
  return (
    {
      single_choice: "Single choice",
      multi_choice: "Multi-select",
      boolean: "Yes / No",
      scale: "Scale 1–10",
      slider: "Slider",
      text: "Open response",
      scenario: "Scenario",
    } as Record<string, string>
  )[t] ?? t;
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown, options?: { autoAdvance?: boolean }) => void;
}) {
  const type = question.question_type;
  const opts = (question.answer_options ?? []) as Option[];

  if (type === "single_choice" || type === "boolean" || type === "scenario") {
    return (
      <RadioGroup
        value={typeof value === "string" ? value : ""}
        onValueChange={(v) => onChange(v, { autoAdvance: true })}
        className="space-y-2"
      >
        {opts.map((o, i) => (
          <motion.label
            key={o.value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
          >
            <RadioGroupItem value={o.value} id={`${question.id}-${o.value}`} />
            <span className="text-sm">{o.label}</span>
          </motion.label>
        ))}
      </RadioGroup>
    );
  }

  if (type === "multi_choice") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        {opts.map((o, i) => {
          const checked = arr.includes(o.value);
          return (
            <motion.label
              key={o.value}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => {
                  const next = c ? [...arr, o.value] : arr.filter((v) => v !== o.value);
                  onChange(next);
                }}
              />
              <span className="text-sm">{o.label}</span>
            </motion.label>
          );
        })}
      </div>
    );
  }

  if (type === "scale") {
    const v = typeof value === "number" && Number.isFinite(value) ? value : 5;
    return (
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>Not important</span>
          <motion.span
            key={v}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-foreground font-medium text-base"
          >
            {v}
          </motion.span>
          <span>Critical</span>
        </div>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[v]}
          onValueChange={(arr) => {
            const n = Number(arr[0]);
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "slider") {
    const rawCfg = Array.isArray(question.answer_options)
      ? (question.answer_options[0] as { min?: unknown; max?: unknown; step?: unknown } | undefined)
      : (question.answer_options as unknown as { min?: unknown; max?: unknown; step?: unknown } | undefined);
    const toNum = (x: unknown, fallback: number) => {
      const n = typeof x === "number" ? x : typeof x === "string" ? parseFloat(x) : NaN;
      return Number.isFinite(n) ? n : fallback;
    };
    const min = toNum(rawCfg?.min, 0);
    const max = toNum(rawCfg?.max, 100);
    const step = toNum(rawCfg?.step, 1);
    const mid = Math.round((min + max) / 2);
    const v =
      typeof value === "number" && Number.isFinite(value)
        ? value
        : typeof value === "string" && Number.isFinite(parseFloat(value))
          ? parseFloat(value)
          : mid;
    return (
      <div>
        <motion.div
          key={v}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="text-center text-2xl font-display font-semibold mb-4"
        >
          {v}
        </motion.div>
        <Slider
          min={min}
          max={max}
          step={step}
          value={[v]}
          onValueChange={(arr) => {
            const n = Number(arr[0]);
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  // text / open
  return (
    <div>
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your response…"
        rows={5}
        className="resize-none"
      />
      <Label className="text-xs text-muted-foreground mt-2 block">
        Be as honest and specific as you're comfortable with.
      </Label>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="glass-strong rounded-3xl p-8 max-w-md mx-auto text-center">
      <div className="w-12 h-12 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h1 className="font-display text-xl font-semibold tracking-tight mt-4">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
      <Link to="/join" className="text-sm text-aurora-1 hover:underline mt-4 inline-block">
        Enter a different code
      </Link>
    </div>
  );
}
