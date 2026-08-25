import { createFileRoute, Link } from "@tanstack/react-router";
import { useConstructionMode } from "@/hooks/use-construction-mode";
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
  Smartphone,
  Link2,
  Timer,
  Monitor,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — RedFlagDaddy" },
      {
        name: "description",
        content:
          "How RedFlagDaddy works: structured, role-aware assessment journeys for adults, with private invite links, five score dimensions and owner-controlled report sharing.",
      },
      { property: "og:title", content: "About — RedFlagDaddy" },
      {
        property: "og:description",
        content:
          "Structured consent, compatibility and red-flag conversation prompts for adults exploring D/s dynamics.",
      },
      { property: "og:url", content: "https://redflagdaddy.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://redflagdaddy.com/about" }],
  }),
  component: About,
});

const flow = [
  {
    icon: ClipboardCheck,
    title: "Create a journey",
    body:
      "A guided wizard: name your assessment, choose your partner's role (Dominant, submissive, switch, Master, brat, little, primal and more), and add optional partner details.",
  },
  {
    icon: Users,
    title: "Invite your partner",
    body:
      "Share a private, single-use invite link or code. No account is required to respond, and the invite stops working after completion or expiry.",
  },
  {
    icon: Brain,
    title: "Role-aware questions",
    body:
      "The question set is filtered by the selected role and assessment mode, with optional category-focused journeys.",
  },
  {
    icon: Sparkles,
    title: "Structured results",
    body:
      "Responses are weighted across five dimensions and summarised as conversation prompts—not a diagnosis, safety guarantee or decision about another person.",
  },
];

const tracking = [
  {
    icon: Activity,
    title: "Real-time status",
    body: "Your dashboard shows whether each journey is pending, in progress, completed or expired.",
  },
  {
    icon: Timer,
    title: "Step-by-step progress",
    body: "The journey tracker shows answered-question progress and the available created, started and completed timestamps.",
  },
  {
    icon: Monitor,
    title: "Polls while active",
    body: "The tracker refreshes periodically while a journey is open, so progress updates without a manual page reload.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticated results",
    body: "Account journey results require an owner session. Optional report sharing is a separate, explicit action.",
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
  { icon: Lock, title: "Owner access checks", body: "Account journeys and results are checked against the signed-in owner on the server and at the database layer." },
  { icon: KeyRound, title: "Private links act like keys", body: "Anyone who receives an active invite or shared-report link may be able to open it. Share private links only with the intended person." },
  { icon: EyeOff, title: "Sensitive pages are not for search", body: "Account, invite, assessment and shared-report routes are marked to prevent normal search indexing." },
  { icon: Database, title: "Export and deletion controls", body: "Account holders can download their stored account data, delete journeys, or permanently delete their account." },
];

const security = [
  { icon: Smartphone, title: "One-time-code account access", body: "Signed-in accounts use an SMS one-time code. This verifies control of a phone number, not a person's identity or trustworthiness." },
  { icon: Link2, title: "Expiring, single-use invites", body: "Invite codes stop accepting answers after they expire or the assessment is completed." },
  { icon: KeyRound, title: "Server-side authorization", body: "Owner-only journey, analysis and result actions verify the signed-in user on the server." },
  { icon: Lock, title: "Token-gated report sharing", body: "Anonymous database reads are disabled. An enabled shared report is returned only when its full bearer token matches." },
];

const controls = [
  { icon: Database, title: "Download your data", body: "Export a JSON copy of your profile, preferences, journeys, responses, results and payment history without active bearer tokens or raw provider payloads." },
  { icon: ClipboardCheck, title: "Delete journeys", body: "Remove a journey and its associated responses and results from the journey tracker." },
  { icon: EyeOff, title: "Consent-led analytics", body: "Anonymous funnel analytics are off by default and can be allowed or refused on this device." },
  { icon: Activity, title: "Secure sign-out", body: "Sign out from your account at any time. Your session is cleared immediately." },
];

function About() {
  const construction = useConstructionMode();
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
          A structured conversation tool for <span className="text-gradient">serious dynamics</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-xl mx-auto"
        >
          RedFlagDaddy replaces guesswork with structure. We help Dominants, submissives,
          switches and the full spectrum of BDSM archetypes assess consent, compatibility,
          safety practices and potential red flags through role-aware questions, weighted scores
          and journey tracking.
        </motion.p>
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
              { label: "Partner started", done: true, time: "1 hour ago" },
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
          title="Clear access boundaries"
          sub="Account sessions protect owner actions; private invite and report links must be treated like passwords."
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
          sub="Practical controls for access, stored data and anonymous analytics."
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

      {/* Question library */}
      <section className="glass-strong rounded-3xl p-8 text-center space-y-4">
        <Workflow className="w-8 h-8 text-primary mx-auto" />
        <h2 className="text-2xl font-display font-semibold">
          A role-aware question library
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Questions are tagged by category, risk level, weight and applicable roles. The selected
          assessment mode determines whether a journey uses a broad, shorter or category-focused
          question set.
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
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          RedFlagDaddy cannot verify another person's identity, diagnose them or guarantee your
          safety. In an emergency, contact local emergency services or a trusted crisis resource.
        </p>
        {construction.enabled ? (
          <p className="text-sm text-primary">New journeys are temporarily paused while we make improvements.</p>
        ) : (
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
        )}
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
