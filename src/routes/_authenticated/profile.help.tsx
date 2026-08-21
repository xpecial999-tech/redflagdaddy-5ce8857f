import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, BookOpen, MessageSquare, ShieldCheck, Compass, ExternalLink } from "lucide-react";
import { SubpageHeader } from "@/components/profile-settings";

export const Route = createFileRoute("/_authenticated/profile/help")({
  head: () => ({ meta: [{ title: "Help & consent guides — RedFlagDaddy" }] }),
  component: Help,
});

const guides = [
  {
    icon: ShieldCheck,
    title: "What is enthusiastic consent?",
    desc: "The four pillars: informed, freely given, reversible and specific.",
    read: "4 min read",
  },
  {
    icon: BookOpen,
    title: "Negotiating a scene",
    desc: "A practical checklist for limits, safe words and aftercare planning.",
    read: "7 min read",
  },
  {
    icon: ShieldCheck,
    title: "Spotting red flags early",
    desc: "Behaviour patterns that warrant pause — and how to act on them.",
    read: "6 min read",
  },
  {
    icon: BookOpen,
    title: "Aftercare for every dynamic",
    desc: "What to offer, what to ask for, and how to debrief without drama.",
    read: "5 min read",
  },
];

const faqs = [
  {
    q: "Who sees my answers?",
    a: "Only you and the person you explicitly invited. Results are never shared with third parties and are scoped to your account at the database layer.",
  },
  {
    q: "Can I delete a journey?",
    a: "Yes. Open the journey, tap the menu and choose Delete. Responses and results are permanently removed.",
  },
  {
    q: "How is scoring calculated?",
    a: "Every answer is weighted by category and risk level, then aggregated into five readable scores. Read more on the About page.",
  },
  {
    q: "Is this a replacement for professional support?",
    a: "No. RedFlagDaddy is a structured self-assessment tool. It does not replace therapy, medical advice or emergency services.",
  },
];

function Help() {
  return (
    <div className="space-y-6">
      <SubpageHeader title="Help & consent guides" icon={HelpCircle} />

      <section className="glass-strong rounded-2xl p-5 flex items-start gap-3">
        <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg">New to RedFlagDaddy?</h2>
          <p className="text-sm text-muted-foreground">
            Read the full overview of how the tool works, the question library, and our privacy
            posture.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary"
          >
            Read the about page <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Guides</SectionLabel>
        {guides.map((g) => (
          <button
            key={g.title}
            className="w-full text-left glass rounded-2xl p-4 flex items-start gap-3 hover:bg-white/5 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <g.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{g.title}</div>
              <div className="text-xs text-muted-foreground">{g.desc}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">
                {g.read}
              </div>
            </div>
          </button>
        ))}
      </section>

      <section className="space-y-3">
        <SectionLabel>FAQ</SectionLabel>
        {faqs.map((f) => (
          <div key={f.q} className="glass rounded-2xl p-4">
            <div className="font-medium text-sm">{f.q}</div>
            <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.a}</div>
          </div>
        ))}
      </section>

      <section className="glass-strong rounded-2xl p-5 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg">Still need help?</h2>
          <p className="text-sm text-muted-foreground">
            Our support team responds within 24 hours. Reach us at{" "}
            <a href="mailto:support@redflagdaddy.com" className="text-primary">
              support@redflagdaddy.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
      {children}
    </div>
  );
}
