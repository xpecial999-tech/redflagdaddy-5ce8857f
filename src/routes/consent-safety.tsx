import { createFileRoute, Link } from "@tanstack/react-router";
import { AnalyticsPreference } from "@/components/AnalyticsConsent";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Lock, HeartPulse, Users, MessageCircle, Scale, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/consent-safety")({
  head: () => ({
    meta: [
      { title: "Consent & Safety Guidelines — RedFlagDaddy" },
      { name: "description", content: "RedFlagDaddy's consent-first safety guidelines for adults exploring dynamics." },
      { property: "og:title", content: "Consent & Safety Guidelines — RedFlagDaddy" },
      { property: "og:description", content: "Read our consent-first safety guidelines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConsentSafety,
});

const sections = [
  {
    icon: Shield,
    title: "Adults only",
    body: "RedFlagDaddy is strictly for people aged 18 and older. If you are under 18, please leave the site and do not create an account.",
  },
  {
    icon: Scale,
    title: "Informed, enthusiastic consent",
    body: "Every activity requires clear, informed and ongoing consent from everyone involved. Silence, hesitation or intoxication are not consent. Consent can be withdrawn at any time, for any reason, without explanation.",
  },
  {
    icon: HeartPulse,
    title: "Know your limits",
    body: "Understand your own boundaries, triggers and health considerations before sharing them. Be honest about experience levels, limits and aftercare needs. Never misrepresent yourself to gain access or trust.",
  },
  {
    icon: MessageCircle,
    title: "Communicate clearly",
    body: "Talk openly about desires, limits, safewords and signals before any dynamic or scene. Check in regularly. Aftercare is part of the agreement, not an afterthought.",
  },
  {
    icon: AlertTriangle,
    title: "Watch for red flags",
    body: "Pressure, guilt-tripping, ignoring limits, secrecy demands, moving too fast, financial exploitation, or refusing to negotiate are serious warning signs. Trust your instincts and disengage if something feels off.",
  },
  {
    icon: Lock,
    title: "Privacy and discretion",
    body: "Keep personal information private until trust is earned. Do not share another person's identity, results, messages or screenshots without explicit permission. Use the tools here to share only what you choose.",
  },
  {
    icon: Users,
    title: "Community accountability",
    body: "Report abusive, coercive or unsafe behaviour when it is safe to do so. Look out for one another. No one should feel trapped, shamed or unsafe for setting a boundary.",
  },
];

function ConsentSafety() {
  return (
    <div className="max-w-2xl mx-auto pt-4 pb-12 space-y-8">
      <Link to="/register" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to registration
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h1 className="text-3xl md:text-4xl font-display font-semibold">Consent & Safety Guidelines</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          RedFlagDaddy is built around informed, enthusiastic consent. Please read these guidelines carefully before using the platform.
        </p>
      </motion.div>

      <div className="space-y-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass-strong rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold mb-1">{section.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <section className="glass-strong rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="font-semibold">Anonymous analytics preference</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Change your device-level choice at any time. Opting out clears this tab's campaign
            attribution and analytics session immediately.
          </p>
        </div>
        <AnalyticsPreference />
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass rounded-2xl p-5 text-center space-y-4"
      >
        <p className="text-sm text-muted-foreground">
          By creating an account you confirm that you are 18+, you understand these guidelines, and you agree to act responsibly and respectfully.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30"
        >
          Return to sign up
        </Link>
      </motion.div>
    </div>
  );
}
