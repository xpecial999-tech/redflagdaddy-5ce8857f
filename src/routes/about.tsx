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
  Activity,
  Settings,
  Smartphone,
  Link2,
  Timer,
  Monitor,
  Bell,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — RedFlagDaddy" },
      {
        name: "description",
        content:
          "How RedFlagDaddy works: structured, role-aware assessments for Dominants, submissives, switches and the full spectrum of BDSM archetypes, with research-grounded questions, safety scoring, real-time journey tracking and end-to-end privacy.",
      },
      { property: "og:title", content: "About — RedFlagDaddy" },
      {
        property: "og:description",
        content:
          "Research-grounded consent, compatibility and safety assessments for D/s dynamics with real-time tracking and authenticated results.",
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
      "A guided 3-step wizard: name your assessment, pick the respondent's role (Dominant, submissive or switch), and add optional recipient details.",
  },
  {
    icon: Users,
    title: "Invite a respondent",
    body:
      "Share a secure, single-use link or invite code. No account required for guests. They answer privately, on their own time.",
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
      "We weight, score and summarise across five dimensions. You get a clear read on safety, alignment and green/red flags — not vibes.",
  },
];

const tracking = [
  {
    icon: Activity,
    title: "Real-time status",
    body: "Your dashboard shows every journey's status at a glance: active, completed or expired. Click through for live detail.",
  },
  {
    icon: Timer,
    title: "Step-by-step progress",
    body: "The journey tracker visualises exactly where a respondent is: invited, started or finished — with timestamps for every stage.",
  },
  {
    icon: Monitor,
    title: "Polls while active",
    body: "The tracker automatically refreshes while a journey is open, so you see completions as they happen without reloading.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticated results",
    body: "Results live inside your authenticated account. Only the journey owner can view or regenerate an analysis.",
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

const security = [
  { icon: Smartphone, title: "Verified mobile accounts only", body: "Mobile verification via SMS OTP is required before sign-in. No anonymous sign-ups that bypass accountability." },
  { icon: Link2, title: "Secure shareable reports", body: "Report share links are authenticated and scoped to their owner. Only intended recipients can access completed results." },
  { icon: KeyRound, title: "Service-to-service auth", body: "Analysis and result endpoints verify the caller's identity on every request, not just at login." },
  { icon: Lock, title: "No public result leaks", body: "Result pages require authentication. Share links are for respondents to answer, not for anyone to browse outcomes." },
];

const controls = [
  { icon: Settings, title: "Privacy & data", body: "Control what's stored, manage notification preferences, and review your active journeys from one place." },
  { icon: ShieldCheck, title: "Safety center", body: "Access consent guides, safety resources and block-list features from your profile." },
  { icon: Bell, title: "Notification settings", body: "Choose how and when you hear about journey updates." },
  { icon: Activity, title: "Secure sign-out", body: "Sign out from your account at any time. Your session is cleared immediately." },
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
          About RedFlagDaddy
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
          RedFlagDaddy replaces guesswork with structure. We help Dominants, submissives and
          switches assess consent, compatibility, safety and red flags — using a research-grounded
          question library, transparent scoring, and real-time journey tracking.
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

      {/* Journey tracking */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Journey tracking"
          title="See progress as it happens"
          sub="You don't send a link and hope. You track every stage with clarity."
        />
        <div className="grid md:grid-cols-2 gap-4">
          {tracking.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aurora-1/30 to-aurora-2/30 flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg">{t.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mock tracker */}
        <div className="glass-strong rounded-3xl p-6 mt-6">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
            Example journey tracker
          </div>
          <div className="space-y-4">
            {[
              { label: "Journey created", done: true, time: "2 hours ago" },
              { label: "Invite sent", done: true, time: "2 hours ago" },
              { label: "Respondent started", done: true, time: "1 hour ago" },
              { label: "Assessment completed", done: false, time: "Waiting…" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${step.done ? "" : "text-muted-foreground"}`}>{step.label}</div>
                </div>
                <div className="text-xs text-muted-foreground">{step.time}</div>
              </div>
            ))}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-[75%] bg-gradient-to-r from-aurora-1 to-aurora-2" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>3 of 4 complete</span>
              <span className="text-primary">In progress</span>
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

      {/* Security architecture */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Security architecture"
          title="Engineered for accountability"
          sub="We don't just claim security — we enforce it at every layer of the stack."
        />
        <div className="grid md:grid-cols-2 gap-3">
          {security.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-1/20 to-aurora-2/20 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.body}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Your control center */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Your account"
          title="Everything under your control"
          sub="A dashboard and profile system that puts you in charge of your data and your safety."
        />
        <div className="grid md:grid-cols-2 gap-3">
          {controls.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-1/20 to-aurora-2/20 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{c.body}</div>
                </div>
              </div>
            </motion.div>
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
          submissives and switches only see what's relevant. Admins can refine tagging with
          AI-assisted suggestions to keep the library sharp.
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
