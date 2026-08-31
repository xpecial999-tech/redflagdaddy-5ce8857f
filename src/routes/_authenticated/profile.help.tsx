import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { SubpageHeader } from "@/components/profile-settings";

export const Route = createFileRoute("/_authenticated/profile/help")({
  head: () => ({ meta: [{ title: "Help & consent guides — RedFlagDaddy" }] }),
  component: Help,
});

const resources = [
  {
    icon: Compass,
    title: "How RedFlagDaddy works",
    desc: "Learn about journeys, private invites, results and account controls.",
    to: "/about" as const,
  },
  {
    icon: ShieldCheck,
    title: "Consent and safety guidelines",
    desc: "Review consent, boundaries, communication, privacy and warning signs.",
    to: "/consent-safety" as const,
  },
];

const faqs = [
  {
    q: "Who can see journey answers?",
    a: "The signed-in journey owner can access answers submitted through their invite. Anyone with an active private invite or shared-report link may be able to open that link, so share it only with the intended person.",
  },
  {
    q: "Can I delete a journey?",
    a: "Yes. Open the journey and choose Delete journey. Its responses and results are permanently removed.",
  },
  {
    q: "Can I delete or download my account data?",
    a: "Yes. Open Privacy & data from your profile to download a JSON copy or permanently delete your account and its data.",
  },
  {
    q: "Is this a replacement for professional support?",
    a: "No. RedFlagDaddy is a structured reflection tool. It does not replace therapy, medical or legal advice, crisis support or emergency services.",
  },
];

function Help() {
  return (
    <div className="space-y-6">
      <SubpageHeader title="Help & consent guides" icon={HelpCircle} />

      <section className="glass-strong rounded-2xl p-5 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg">Published resources</h2>
          <p className="text-sm text-muted-foreground">
            These links open guidance that is available now.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Resources</SectionLabel>
        {resources.map((resource) => (
          <Link
            key={resource.title}
            to={resource.to}
            className="w-full text-left glass rounded-2xl p-4 flex items-start gap-3 hover:bg-white/5 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <resource.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-1.5">
                {resource.title} <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-muted-foreground">{resource.desc}</div>
            </div>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <SectionLabel>FAQ</SectionLabel>
        {faqs.map((faq) => (
          <div key={faq.q} className="glass rounded-2xl p-4">
            <div className="font-medium text-sm">{faq.q}</div>
            <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{faq.a}</div>
          </div>
        ))}
      </section>

      <section className="glass-strong rounded-2xl p-5 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg">Need product support?</h2>
          <p className="text-sm text-muted-foreground">
            Use the private support form for product, account, privacy or accessibility help. Do not
            use RedFlagDaddy for emergencies or crisis support.
          </p>
          <Link
            to="/support"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
          >
            Open support form
          </Link>
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
