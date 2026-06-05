import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/assessment/$id")({
  head: () => ({ meta: [{ title: "Assessment — Dynamic Compass" }] }),
  component: Assessment,
});

const questions = [
  { q: "How do you define your role in dynamics?", opts: ["Dominant", "submissive", "switch", "still exploring"] },
  { q: "Comfort with impact play?", opts: ["Hard yes", "Maybe / with limits", "Soft no", "Hard limit"] },
  { q: "Aftercare needs", opts: ["Physical closeness", "Verbal reassurance", "Quiet alone time", "Varies"] },
  { q: "Safewords — preferred system?", opts: ["Traffic light", "Custom word", "Tap-out only", "Other"] },
  { q: "Comfort with public/private dynamic?", opts: ["Strictly private", "Selectively open", "Openly out", "Not sure yet"] },
];

function Assessment() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const q = questions[i];
  const total = questions.length;

  const pick = (a: string) => {
    setAnswers((p) => ({ ...p, [i]: a }));
    setTimeout(() => {
      if (i < total - 1) setI(i + 1);
      else navigate({ to: "/results/$id", params: { id: "1" } });
    }, 200);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Question {i + 1} of {total}</p>
        <h1 className="text-2xl font-display font-semibold mt-1">Assessment</h1>
      </header>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2" animate={{ width: `${((i + 1) / total) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-strong rounded-3xl p-6 space-y-5"
        >
          <h2 className="text-xl font-display font-semibold">{q.q}</h2>
          <div className="space-y-2">
            {q.opts.map((opt) => {
              const on = answers[i] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition ${
                    on ? "border-primary bg-primary/15 text-primary" : "border-border bg-input hover:bg-white/5"
                  }`}
                >{opt}</button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        <button
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="flex-1 rounded-xl glass py-3 text-sm font-medium disabled:opacity-40"
        >Back</button>
      </div>
    </div>
  );
}
