import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Heart, AlertTriangle, Sparkles, MessageSquare, HandHeart, Gauge } from "lucide-react";

type AnalysisSection = {
  title: string;
  summary: string;
  strengths: string[];
  risks: string[];
  missing_information: string[];
  concerns: string[];
};

type DynamicReadiness = {
  score: number;
  label: "Not ready" | "Early stage" | "Developing" | "Ready" | "Strongly ready";
  rationale: string;
  strengths: string[];
  risks: string[];
  missing_information: string[];
  concerns: string[];
};

export const Route = createFileRoute("/demo-report")({
  head: () => ({
    meta: [
      { title: "Synthetic demo report — RedFlagDaddy" },
      { name: "description", content: "Explore a synthetic RedFlagDaddy report with example scores, strengths, risks and discussion prompts." },
      { property: "og:title", content: "Synthetic demo report — RedFlagDaddy" },
      { property: "og:description", content: "See how a RedFlagDaddy assessment report is structured using fictional example data." },
      { property: "og:url", content: "https://redflagdaddy.com/demo-report" },
    ],
    links: [{ rel: "canonical", href: "https://redflagdaddy.com/demo-report" }],
  }),
  component: DemoReportPage,
});

const DEMO_ANALYSIS: {
  dynamic_readiness: DynamicReadiness;
  safety: AnalysisSection;
  compatibility: AnalysisSection;
  red_flags: AnalysisSection;
  green_flags: AnalysisSection;
  communication: AnalysisSection;
  consent: AnalysisSection;
  overall_note: string;
  generated_at: string;
} = {
  dynamic_readiness: {
    score: 72,
    label: "Ready" as const,
    rationale:
      "Your partner shows solid safety awareness, clear communication patterns, and strong green-flag indicators. Some experience gaps remain, and one elevated red-flag area needs discussion before deeper engagement.",
    strengths: [
      "Explicitly values aftercare and check-ins",
      "Practices safeword use consistently",
      "Rates communication and honesty very highly",
    ],
    risks: [
      "Limited prior long-term dynamic experience",
      "One boundary item marked as flexible that may need clarification",
    ],
    missing_information: [
      "No specific emergency contact protocol shared",
      "Medical considerations not addressed",
    ],
    concerns: [],
  },
  safety: {
    title: "Safety Practices",
    summary:
      "Safety signals are consistently strong. Your partner prioritizes physical and emotional safety, reports clear safeword habits, and values aftercare. This is the strongest dimension of the assessment.",
    strengths: [
      "Aftercare rated as very important",
      "Safeword use is habitual",
      "Strong preference for graduated intensity",
    ],
    risks: [
      "Some safety tools (e.g. emergency signals) not yet habit",
    ],
    missing_information: [
      "Does not specify a regular health-check rhythm",
    ],
    concerns: [],
  },
  compatibility: {
    title: "Compatibility",
    summary:
      "Compatibility scores are moderate-to-high. Shared values around trust and honesty are strong. Some divergence in preferred relationship structure and intensity pacing should be discussed.",
    strengths: [
      "Trust and honesty rated top priority",
      "Open to negotiated structure",
    ],
    risks: [
      "Preferred intensity pace differs from typical partner profile",
    ],
    missing_information: [
      "Long-term goals not articulated",
    ],
    concerns: [],
  },
  red_flags: {
    title: "Red Flags",
    summary:
      "One area registers above the comfort threshold: a pattern of dismissing partner discomfort in past dynamics was reported. While your partner reports improvement, this warrants a direct conversation.",
    strengths: [
      "Self-aware about past behavior",
      "Rates accountability highly",
    ],
    risks: [
      "Historical pattern of minimizing partner feedback",
    ],
    missing_information: [
      "No detail on how the pattern was addressed",
    ],
    concerns: [
      "Prioritize a candid conversation before escalating intensity",
    ],
  },
  green_flags: {
    title: "Green Flags",
    summary:
      "Green-flag signals are strong and consistent. Your partner demonstrates empathy, explicit consent practices, and a collaborative mindset toward dynamic negotiation.",
    strengths: [
      "Empathy and aftercare orientation",
      "Proactive consent-check habits",
      "Values partner autonomy",
    ],
    risks: [],
    missing_information: [
      "Would benefit from seeing concrete examples of green-flag behavior in prior dynamics",
    ],
    concerns: [],
  },
  communication: {
    title: "Communication",
    summary:
      "Communication is a clear strength. Your partner prefers direct discussion, values honesty over impression management, and reports comfort raising concerns.",
    strengths: [
      "Direct communication style",
      "Comfortable raising concerns early",
    ],
    risks: [
      "May be less comfortable receiving critical feedback",
    ],
    missing_information: [
      "Conflict-resolution style not detailed",
    ],
    concerns: [],
  },
  consent: {
    title: "Consent & Boundaries",
    summary:
      "Consent awareness is high. Your partner treats consent as ongoing, distinguishes between hard and soft limits clearly, and values enthusiastic agreement.",
    strengths: [
      "Explicit hard/soft limit distinction",
      "Ongoing-consent mindset",
    ],
    risks: [
      "One soft-limit item may shift under pressure—monitor",
    ],
    missing_information: [
      "No record of written negotiation preferences",
    ],
    concerns: [],
  },
  overall_note:
    "Overall, this assessment paints a picture of a partner who is safety-minded, communicative, and largely aligned with healthy dynamic practices. The elevated red-flag item should be addressed directly but does not automatically disqualify engagement. The strongest recommendation is to have an explicit conversation about the historical feedback-dismissal pattern, set clear mutual check-in expectations, and proceed with graduated trust-building.",
  generated_at: new Date().toISOString(),
};

const SCORES = {
  safety: 87,
  compatibility: 64,
  red: 42,
  green: 91,
  experience: 55,
};

const sectionMeta = {
  safety: { icon: Shield, tone: "text-emerald-500" },
  compatibility: { icon: Heart, tone: "text-pink-500" },
  red_flags: { icon: AlertTriangle, tone: "text-red-500" },
  green_flags: { icon: Sparkles, tone: "text-emerald-500" },
  communication: { icon: MessageSquare, tone: "text-sky-500" },
  consent: { icon: HandHeart, tone: "text-violet-500" },
};

function DemoReportPage() {
  const a = DEMO_ANALYSIS;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm">
        <span className="font-medium">Synthetic example:</span>{" "}
        every name, answer, score and narrative on this page is fictional and exists only to
        demonstrate the report format.
      </div>
      <header className="text-center space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Assessment Results</h1>
        <p className="text-sm text-muted-foreground">
          Demo Journey: Summer 2024 Compatibility Check · partner role:{" "}
          <span className="font-medium capitalize">submissive</span>
        </p>
      </header>

      {/* Score overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ScoreTile label="Safety" value={SCORES.safety} positive />
        <ScoreTile label="Compatibility" value={SCORES.compatibility} positive />
        <ScoreTile label="Green Flags" value={SCORES.green} positive />
        <ScoreTile label="Red Flags" value={SCORES.red} positive={false} />
        <ScoreTile label="Experience" value={SCORES.experience} positive />
      </div>

      <ReadinessCard r={a.dynamic_readiness} />

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard kind="safety" section={a.safety} />
        <SectionCard kind="consent" section={a.consent} />
        <SectionCard kind="red_flags" section={a.red_flags} />
        <SectionCard kind="green_flags" section={a.green_flags} />
        <SectionCard kind="communication" section={a.communication} />
        <SectionCard kind="compatibility" section={a.compatibility} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall note</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          {a.overall_note}
          <p className="mt-4 text-xs italic">
            This summary is a conversation prompt, not a clinical, medical, legal or safety
            evaluation. It cannot verify identity, diagnose a person or predict their behaviour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreTile({ label, value, positive }: { label: string; value: number; positive: boolean }) {
  const tone = positive
    ? value >= 70 ? "text-emerald-500" : value >= 40 ? "text-amber-500" : "text-red-500"
    : value >= 60 ? "text-red-500" : value >= 30 ? "text-amber-500" : "text-emerald-500";
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-3xl font-display font-semibold mt-1 ${tone}`}>{Math.round(value)}</p>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </CardContent>
    </Card>
  );
}

function ReadinessCard({ r }: { r: typeof DEMO_ANALYSIS.dynamic_readiness }) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center gap-3">
        <Gauge className="h-5 w-5 text-primary" />
        <CardTitle className="text-base flex-1">Dynamic Readiness</CardTitle>
        <Badge variant="secondary">{r.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-semibold">{Math.round(r.score)}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <Progress value={Math.max(0, Math.min(100, r.score))} />
        <p className="text-sm text-muted-foreground leading-relaxed">{r.rationale}</p>
        <BulletGrid
          section={r as unknown as { strengths: string[]; risks: string[]; missing_information: string[]; concerns: string[] }}
        />
      </CardContent>
    </Card>
  );
}

function SectionCard({
  kind,
  section,
}: {
  kind: keyof typeof sectionMeta;
  section: (typeof DEMO_ANALYSIS)["safety"];
}) {
  const Meta = sectionMeta[kind];
  const Icon = Meta.icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Icon className={`h-5 w-5 ${Meta.tone}`} />
        <CardTitle className="text-base">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{section.summary}</p>
        <BulletGrid section={section} />
      </CardContent>
    </Card>
  );
}

function BulletGrid({
  section,
}: {
  section: { strengths: string[]; risks: string[]; missing_information: string[]; concerns: string[] };
}) {
  const blocks: Array<[string, string[], string]> = [
    ["Strengths", section.strengths ?? [], "text-emerald-600"],
    ["Risks", section.risks ?? [], "text-amber-600"],
    ["Missing information", section.missing_information ?? [], "text-sky-600"],
    ["Concerns", section.concerns ?? [], "text-red-600"],
  ];
  const nonEmpty = blocks.filter(([, items]) => items.length > 0);
  if (nonEmpty.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
      {nonEmpty.map(([label, items, tone]) => (
        <div key={label}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${tone}`}>{label}</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
            {items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
