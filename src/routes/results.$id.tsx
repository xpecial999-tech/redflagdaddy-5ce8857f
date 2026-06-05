import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, HeartHandshake, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/results/$id")({
  head: () => ({ meta: [{ title: "Results — Dynamic Compass" }] }),
  component: Results,
});

const scores = [
  { label: "Consent alignment", value: 92, tone: "good" },
  { label: "Compatibility", value: 76, tone: "good" },
  { label: "Limit overlap", value: 64, tone: "ok" },
  { label: "Communication style", value: 88, tone: "good" },
];

const flags = [
  { type: "warn", text: "Mismatch on aftercare expectations — discuss before next scene." },
  { type: "ok", text: "Both parties aligned on safeword system (traffic light)." },
  { type: "alert", text: "One hard limit conflicts with the other party's strong interest." },
];

function Results() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Journey complete</p>
        <h1 className="text-3xl font-display font-semibold">Results</h1>
        <p className="text-sm text-muted-foreground mt-1">Side-by-side overview of alignment and friction points.</p>
      </header>

      <section className="glass-strong rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              <motion.circle
                cx="50" cy="50" r="42" stroke="url(#g)" strokeWidth="8" fill="none" strokeLinecap="round"
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${0.8 * 264} 264` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.2 350)" />
                  <stop offset="100%" stopColor="oklch(0.65 0.18 285)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-display font-semibold">80</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Overall compatibility</div>
            <div className="text-xl font-semibold">Strong alignment</div>
            <div className="text-xs text-muted-foreground mt-0.5">With a few areas to discuss.</div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {scores.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{s.label}</span>
              <span className="text-muted-foreground">{s.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2" initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ duration: 0.8 }} />
            </div>
          </motion.div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg px-1">Flags & insights</h2>
        {flags.map((f, i) => {
          const Icon = f.type === "alert" ? ShieldAlert : f.type === "warn" ? AlertTriangle : CheckCircle2;
          const color = f.type === "alert" ? "text-rose-400" : f.type === "warn" ? "text-amber-400" : "text-emerald-400";
          return (
            <div key={i} className="glass rounded-2xl p-4 flex gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
              <p className="text-sm">{f.text}</p>
            </div>
          );
        })}
      </section>

      <section className="glass rounded-2xl p-4 flex items-center gap-3">
        <HeartHandshake className="w-5 h-5 text-primary" />
        <p className="text-xs text-muted-foreground">Use these results to start a conversation — not to issue verdicts.</p>
      </section>

      <Link to="/dashboard" className="block text-center rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium">Back to dashboard</Link>
    </div>
  );
}
