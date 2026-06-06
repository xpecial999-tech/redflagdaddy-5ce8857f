import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Compass,
  ShieldCheck,
  Lock,
  Sparkles,
  ClipboardCheck,
  Brain,
  Users,
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  EyeOff,
  Database,
  Workflow,
  Scale,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Dynamic Compass" },
      {
        name: "description",
        content:
          "How Dynamic Compass works: structured assessments for Dominants, submissives and switches with research-grounded questions, safety scoring and end-to-end privacy.",
      },
      { property: "og:title", content: "About — Dynamic Compass" },
      {
        property: "og:description",
        content:
          "Research-grounded consent, compatibility and safety assessments for D/s dynamics.",
      },
    ],
  }),
  component: About,
});

const stats = [
  { value: "500+", label: "Curated questions" },
  { value: "23", label: "Assessment categories" },
  { value: "3", label: "Role-aware tracks" },
  { value: "5", label: "Scoring dimensions" },
];

const flow = [
  {
    icon: ClipboardCheck,
    title: "Create a journey",
    body:
      "Pick what you're assessing — compatibility, safety, red flags — and who it's for: Dominant, submissive, or switch.",
  },
  {
    icon: Users,
    title: "Invite a respondent",
    body:
      "Share a single-use link. No account required for guests. They answer privately, on their own time.",
  },
  {
    icon: Brain,
    title: "Adaptive questioning",
    body:
      "Questions branch based on role and prior answers, so people only see what's relevant to their dynamic.",
  },
  {
    icon: Sparkles,
    title: "Structured results",
    body:
      "We weight, score and summarise. You get a clear read on safety, alignment and green/red flags — not vibes.",
  },
];

const scoring = [
  { icon: ShieldCheck, label: "Safety", desc: "Risk awareness, aftercare and safe-word practice." },
  { icon: HeartHandshake, label: "Compatibility", desc: "Dynamic preferences and lifestyle alignment." },
  { icon: CheckCircle2, label: "Green flags", desc: "Trust, communication, emotional intelligence." },
  { icon: AlertTriangle, label: "Red flags", desc: "Scenario-based screening for warning signs." },
  { icon: Scale, label: "Experience", desc: "Prior experience and honest self-awareness." },
];

const privacy = [
  { icon: Lock, title: "Encrypted in transit & at rest", body: "All traffic served over TLS; data stored on encrypted infrastructure." },
  { icon: EyeOff, title: "You control visibility", body: "Only you and your invited respondent ever see your results — never indexed, never sold." },
  { icon: KeyRound, title: "Row-level access control", body: "Every record is scoped to its owner at the database layer, not just the UI." },
  { icon: Database, title: "Minimal data, deletable", body: "We collect what's needed to score a journey. You can delete a journey and its responses at any time." },
];

function About() {
  return (
    <div className="space-y-20 pb-10">
      {/* Hero */}
      <section className="text-center space-y-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground"
        >
          <Compass className="w-3.5 h-3.5 text-primary" />
          About Dynamic Compass
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-display font-semibold leading-[1.05]"
        >
          A serious instrument for <span className="text-gradient">serious dynamics</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-xl mx-auto"
        >
          Dynamic Compass replaces guesswork with structure. We help Dominants, submissives and
          switches assess consent, compatibility, safety and red flags — using a research-grounded
          question library and transparent scoring.
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <div className="text-2xl md:text-3xl font-display font-semibold text-gradient">
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="How it works"
          title="Four steps from intent to insight"
        />
        <div className="grid md:grid-cols-2 gap-4">
          {flow.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aurora-1/30 to-aurora-2/30 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Step {i + 1}
                  </div>
                  <h3 className="font-display text-lg mt-0.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mock screen */}
        <div className="glass-strong rounded-3xl p-6 mt-6">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Example question
          </div>
          <div className="rounded-2xl border border-white/10 p-5 bg-background/40 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Consent & Boundaries</span>
              <span>12 / 38</span>
            </div>
            <p className="font-display text-lg">
              When a scene approaches your stated limits, what's your default response?
            </p>
            <div className="space-y-2">
              {[
                "Pause and renegotiate explicitly",
                "Use a safe word immediately",
                "Push through if I trust my partner",
                "Depends entirely on context",
              ].map((opt, i) => (
                <div
                  key={opt}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    i === 0
                      ? "border-primary/40 bg-primary/10"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-[32%] bg-gradient-to-r from-aurora-1 to-aurora-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Scoring system"
          title="Five dimensions. Transparent weighting."
          sub="Every question is tagged with a category, risk level and weight. We aggregate responses into five readable scores — not a single black-box number."
        />
        <div className="grid md:grid-cols-2 gap-3">
          {scoring.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <ScoreBar value={[82, 74, 91, 18, 66][i]} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Privacy & safety"
          title="Built for sensitive conversations"
          sub="This is intimate data. We treat it that way — by default, not as a setting."
        />
        <div className="grid md:grid-cols-2 gap-3">
          {privacy.map((p) => (
            <div key={p.title} className="glass rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-1/20 to-aurora-2/20 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{p.body}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Library brag */}
      <section className="glass-strong rounded-3xl p-8 text-center space-y-4">
        <Workflow className="w-8 h-8 text-primary mx-auto" />
        <h2 className="text-2xl font-display font-semibold">
          500+ questions. 23 categories. Constantly refined.
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Our library is informed by established consent frameworks, BDSM safety literature and
          community-vetted compatibility checklists — then tagged by role so Dominants,
          submissives and switches only see what's relevant.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {[
            "Consent",
            "Aftercare",
            "Power Exchange",
            "Boundaries",
            "Communication",
            "Red Flags",
            "Green Flags",
            "BDSM Safety",
            "Trust",
            "Conflict Resolution",
            "Attachment Style",
            "Accountability",
          ].map((t) => (
            <span
              key={t}
              className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4">
        <h2 className="text-2xl font-display font-semibold">Ready to navigate with clarity?</h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30"
          >
            Start a journey <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/guest"
            className="inline-flex items-center justify-center rounded-xl glass px-5 py-3 text-sm font-medium"
          >
            Try as guest
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center space-y-2 max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="text-2xl md:text-3xl font-display font-semibold">{title}</h2>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="w-16 shrink-0">
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground text-right mt-1">{value}</div>
    </div>
  );
}
