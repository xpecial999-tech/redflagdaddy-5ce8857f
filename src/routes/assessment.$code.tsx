import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssessment,
  saveResponse,
  completeAssessment,
} from "@/lib/assessment.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/assessment/$code")({
  component: AssessmentPage,
  errorComponent: ({ error }) => (
    
      <ErrorCard message={error.message} />
    
  ),
  notFoundComponent: () => (
    
      <ErrorCard message="Assessment not found." />
    
  ),
});

type Option = { label: string; value: string; score?: number };
type Question = {
  id: string;
  question: string;
  question_type: string;
  answer_options: Option[] | { min: number; max: number; step?: number }[];
  weight: number;
  order_index: number;
  branch_logic: { if?: { answer: string; goto_order: number }[] } | Record<string, never>;
};

function AssessmentPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getAssessment);
  const saveFn = useServerFn(saveResponse);
  const completeFn = useServerFn(completeAssessment);

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

  // Hydrate answers when data first loads
  useEffect(() => {
    if (!data) return;
    const initial: Record<string, unknown> = {};
    for (const r of data.responses) initial[r.question_id] = r.answer;
    setAnswers(initial);
  }, [data]);

  const questions = useMemo(() => (data?.questions ?? []) as unknown as Question[], [data]);

  // Compute the visible ordered list with conditional branching applied.
  const visible = useMemo(() => {
    if (!questions.length) return [] as Question[];
    const byOrder = [...questions].sort((a, b) => a.order_index - b.order_index);
    const skipOrders = new Set<number>();

    // Walk through and apply branch_logic.if rules
    for (const q of byOrder) {
      const ans = answers[q.id];
      const rules = q.branch_logic?.if ?? [];
      for (const rule of rules) {
        if (ans !== undefined && String(ans) === rule.answer) {
          // This rule says: if answered X, jump to goto_order — skip questions in-between
          for (const candidate of byOrder) {
            if (candidate.order_index > q.order_index && candidate.order_index < rule.goto_order) {
              skipOrders.add(candidate.order_index);
            }
          }
        }
      }
    }
    return byOrder.filter((q) => !skipOrders.has(q.order_index));
  }, [questions, answers]);

  const current = visible[cursor];
  const total = visible.length;
  const answeredCount = visible.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const saveMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: unknown }) =>
      saveFn({ data: { code, questionId, answer } }),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeFn({ data: { code } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assessment", code] });
      navigate({ to: "/results/$id", params: { id: res.journeyId } });
    },
  });

  function recordAnswer(answer: unknown) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
    setSavingId(current.id);
    saveMutation.mutate(
      { questionId: current.id, answer },
      { onSettled: () => setSavingId(null) },
    );
  }

  function goNext() {
    if (cursor < total - 1) setCursor(cursor + 1);
  }
  function goPrev() {
    if (cursor > 0) setCursor(cursor - 1);
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
  const hasAnswer = answers[current.id] !== undefined && answers[current.id] !== "";

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
              disabled={!hasAnswer || completeMutation.isPending}
            >
              {completeMutation.isPending ? "Submitting…" : "Submit"}
              <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!hasAnswer}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

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
  onChange: (v: unknown) => void;
}) {
  const type = question.question_type;
  const opts = (question.answer_options ?? []) as Option[];

  if (type === "single_choice" || type === "boolean" || type === "scenario") {
    return (
      <RadioGroup
        value={typeof value === "string" ? value : ""}
        onValueChange={(v) => onChange(v)}
        className="space-y-2"
      >
        {opts.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition"
          >
            <RadioGroupItem value={o.value} id={`${question.id}-${o.value}`} />
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  if (type === "multi_choice") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        {opts.map((o) => {
          const checked = arr.includes(o.value);
          return (
            <label
              key={o.value}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => {
                  const next = c ? [...arr, o.value] : arr.filter((v) => v !== o.value);
                  onChange(next);
                }}
              />
              <span className="text-sm">{o.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (type === "scale") {
    const v = typeof value === "number" ? value : 5;
    return (
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>Not important</span>
          <span className="text-foreground font-medium text-base">{v}</span>
          <span>Critical</span>
        </div>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[v]}
          onValueChange={(arr) => onChange(arr[0])}
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
    const cfg = ((question.answer_options as unknown) as { min: number; max: number; step?: number }[])[0] ?? {
      min: 0,
      max: 100,
      step: 5,
    };
    const v = typeof value === "number" ? value : Math.round((cfg.min + cfg.max) / 2);
    return (
      <div>
        <div className="text-center text-2xl font-display font-semibold mb-4">{v}</div>
        <Slider
          min={cfg.min}
          max={cfg.max}
          step={cfg.step ?? 1}
          value={[v]}
          onValueChange={(arr) => onChange(arr[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{cfg.min}</span>
          <span>{cfg.max}</span>
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
