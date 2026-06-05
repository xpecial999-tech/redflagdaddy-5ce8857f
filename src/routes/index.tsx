import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, HeartHandshake, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dynamic Compass — Consent, Compatibility & Safety" },
      { name: "description", content: "Structured assessments for Dominants, submissives and switches. Not a dating app." },
    ],
  }),
  component: Landing,
});

const pillars = [
  { icon: HeartHandshake, title: "Consent", desc: "Structured negotiation tools so nothing important is left unsaid." },
  { icon: ShieldCheck, title: "Safety", desc: "Hard limits, soft limits, aftercare needs — clearly mapped." },
  { icon: AlertTriangle, title: "Red flags", desc: "Spot mismatches and warning patterns before they become harm." },
  { icon: Sparkles, title: "Compatibility", desc: "See where dynamics align across kinks, roles and rhythms." },
];

function Landing() {
  return (
    <div className="space-y-12 pt-4">
      <section className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs text-muted-foreground"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Not a dating app — an assessment platform
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-display font-semibold leading-[1.05]"
        >
          Navigate dynamics with <span className="text-gradient">clarity</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          Dynamic Compass helps Dominants, submissives and switches assess consent,
          compatibility, safety and red flags — with structure, not guesswork.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
        >
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:scale-[1.02] transition"
          >
            Start a journey <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl glass px-5 py-3 text-sm font-medium hover:bg-white/5 transition"
          >
            I have an account
          </Link>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.3 }}
            className="glass rounded-2xl p-5"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-1/30 to-aurora-2/30 flex items-center justify-center mb-3">
              <p.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{p.title}</h3>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="glass-strong rounded-3xl p-6 text-center">
        <h2 className="text-2xl font-display font-semibold mb-2">How it works</h2>
        <p className="text-sm text-muted-foreground mb-6">Three steps, fully consent-first.</p>
        <ol className="space-y-4 text-left">
          {[
            "Create a journey and choose what to assess.",
            "Invite the other person via a private, expiring link.",
            "Review side-by-side compatibility, limits and red flags.",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">{i+1}</span>
              <span className="text-sm pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
