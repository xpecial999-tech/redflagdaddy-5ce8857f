import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create journey — Dynamic Compass" }] }),
  component: Create,
});

const modules = [
  { id: "consent", label: "Consent & negotiation", desc: "Explicit yeses, soft and hard limits." },
  { id: "compat", label: "Compatibility", desc: "Dynamic style, intensity, rhythm." },
  { id: "safety", label: "Safety & aftercare", desc: "Triggers, allergies, safewords." },
  { id: "redflag", label: "Red-flag screening", desc: "Pattern recognition for warning signs." },
  { id: "kinks", label: "Kink inventory", desc: "Detailed yes / maybe / no inventory." },
];

function Create() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(["consent", "safety"]);
  const [title, setTitle] = useState("");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Step {step} of 3</p>
        <h1 className="text-3xl font-display font-semibold">Create journey</h1>
      </header>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2"
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Name your journey</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Negotiation with Alex"
            className="w-full rounded-xl bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Only you and your respondent will see this name.</p>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
          <h2 className="font-semibold px-1">Choose assessment modules</h2>
          {modules.map((m) => {
            const on = selected.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`w-full text-left glass rounded-2xl p-4 border transition ${on ? "border-primary/60 bg-primary/10" : "border-transparent"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{m.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${on ? "bg-primary border-primary" : "border-border"}`}>
                    {on && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Invite respondent</h2>
          <p className="text-xs text-muted-foreground">Share this private link. It expires in 7 days.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value="https://dyncompass.app/r/abc123"
              className="flex-1 rounded-xl bg-input border border-border px-4 py-3 text-sm font-mono"
            />
            <button className="rounded-xl glass px-3"><Copy className="w-4 h-4" /></button>
          </div>
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium">
            <Send className="w-4 h-4" /> Send by email
          </button>
        </motion.div>
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="flex-1 rounded-xl glass py-3 text-sm font-medium">Back</button>
        )}
        <button
          onClick={() => (step < 3 ? setStep(step + 1) : navigate({ to: "/dashboard" }))}
          className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30"
        >
          {step < 3 ? "Continue" : "Done"}
        </button>
      </div>
    </div>
  );
}
