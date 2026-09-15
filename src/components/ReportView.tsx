import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Heart,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  HandHeart,
  Gauge,
} from "lucide-react";
import type { AnalysisPayload, AnalysisSection } from "@/lib/analysis.functions";

type Scores = {
  safety: number;
  compatibility: number;
  red: number;
  green: number;
  experience: number;
};

const sectionMeta = {
  safety: { icon: Shield, tone: "text-emerald-500" },
  compatibility: { icon: Heart, tone: "text-pink-500" },
  red_flags: { icon: AlertTriangle, tone: "text-red-500" },
  green_flags: { icon: Sparkles, tone: "text-emerald-500" },
  communication: { icon: MessageSquare, tone: "text-sky-500" },
  consent: { icon: HandHeart, tone: "text-violet-500" },
} as const;

export function ReportView({
  title,
  participantType,
  scores,
  analysis,
}: {
  title: string;
  participantType: string;
  scores: Scores;
  analysis: AnalysisPayload | null;
}) {
  const completeAnalysis =
    analysis?.dynamic_readiness &&
    analysis.safety &&
    analysis.consent &&
    analysis.red_flags &&
    analysis.green_flags &&
    analysis.communication &&
    analysis.compatibility
      ? analysis
      : null;

  return (
    <div className="report-printable w-full max-w-5xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Assessment Report
        </h1>
        <p className="text-sm text-muted-foreground">
          {title} · partner role:{" "}
          <span className="font-medium capitalize">{participantType}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <ScoreTile label="Safety" value={scores.safety} positive />
        <ScoreTile label="Compatibility" value={scores.compatibility} positive />
        <ScoreTile label="Green Flags" value={scores.green} positive />
        <ScoreTile label="Red Flags" value={scores.red} positive={false} />
        <ScoreTile label="Experience" value={scores.experience} positive />
      </div>

      {completeAnalysis ? (
        <>
          <ReadinessCard r={completeAnalysis.dynamic_readiness} />
          <div className="grid md:grid-cols-2 gap-4">
            <SectionCard kind="safety" section={completeAnalysis.safety} />
            <SectionCard kind="consent" section={completeAnalysis.consent} />
            <SectionCard kind="red_flags" section={completeAnalysis.red_flags} />
            <SectionCard kind="green_flags" section={completeAnalysis.green_flags} />
            <SectionCard kind="communication" section={completeAnalysis.communication} />
            <SectionCard kind="compatibility" section={completeAnalysis.compatibility} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall note</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {completeAnalysis.overall_note}
              <p className="mt-4 text-xs italic">
                This analysis is an assessment summary, not a clinical or
                medical evaluation. No diagnosis is made or implied.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <BasicScoreBreakdown scores={scores} />
      )}
    </div>
  );
}

function ScoreTile({
  label,
  value,
  positive,
}: {
  label: string;
  value: number;
  positive: boolean;
}) {
  const tone = positive
    ? value >= 70
      ? "text-emerald-500"
      : value >= 40
        ? "text-amber-500"
        : "text-red-500"
    : value >= 60
      ? "text-red-500"
      : value >= 30
        ? "text-amber-500"
        : "text-emerald-500";
  return (
    <Card className="min-w-0">
      <CardContent className="p-4 text-center min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground break-words">
          {label}
        </p>
        <p className={`text-3xl font-display font-semibold mt-1 ${tone}`}>
          {Math.round(value)}
        </p>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </CardContent>
    </Card>
  );
}

function BasicScoreBreakdown({ scores }: { scores: Scores }) {
  const rows = [
    {
      title: "Safety",
      value: scores.safety,
      body: describePositiveScore(
        scores.safety,
        "Safety responses show stronger care around consent, limits and risk management.",
        "Safety responses suggest this area needs a direct conversation before relying on the result.",
      ),
    },
    {
      title: "Compatibility",
      value: scores.compatibility,
      body: describePositiveScore(
        scores.compatibility,
        "Compatibility signals suggest useful overlap in preferences and expectations.",
        "Compatibility signals are limited or mixed, so compare expectations carefully.",
      ),
    },
    {
      title: "Green flags",
      value: scores.green,
      body: describePositiveScore(
        scores.green,
        "Green-flag responses show constructive habits worth discussing and preserving.",
        "Green-flag signals are not very strong yet, so look for concrete examples in conversation.",
      ),
    },
    {
      title: "Red flags",
      value: scores.red,
      body:
        scores.red >= 60
          ? "Red-flag signals are elevated. Treat this as a prompt to slow down, ask direct questions and set clear boundaries."
          : scores.red >= 30
            ? "Some red-flag signals are present. Talk through them before making assumptions."
            : "Red-flag signals are low from the available answers, but this is not a guarantee of safety.",
    },
    {
      title: "Experience",
      value: scores.experience,
      body: describePositiveScore(
        scores.experience,
        "Experience signals suggest the respondent may have enough context to discuss this dynamic clearly.",
        "Experience signals are limited, so keep expectations explicit and avoid assuming shared vocabulary.",
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The detailed narrative analysis has not been generated for this report yet. The score
          breakdown below is available immediately and can still guide the follow-up conversation.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((row) => (
            <div key={row.title} className="rounded-xl border border-border bg-input/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{row.title}</h3>
                <span className="font-display text-2xl font-semibold">{Math.round(row.value)}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{row.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs italic text-muted-foreground">
          RedFlagDaddy is a structured conversation aid, not identity verification, proof of
          consent, a diagnosis or a guarantee of safety.
        </p>
      </CardContent>
    </Card>
  );
}

function describePositiveScore(value: number, strong: string, weak: string) {
  if (value >= 70) return strong;
  if (value >= 40) return "This area is mixed. Use it as a prompt for a specific conversation.";
  return weak;
}

function ReadinessCard({ r }: { r: AnalysisPayload["dynamic_readiness"] }) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center gap-3">
        <Gauge className="h-5 w-5 text-primary" />
        <CardTitle className="text-base flex-1">Dynamic Readiness</CardTitle>
        <Badge variant="secondary">{r.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-semibold">
            {Math.round(r.score)}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <Progress value={Math.max(0, Math.min(100, r.score))} />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {r.rationale}
        </p>
        <BulletGrid section={r as unknown as AnalysisSection} />
      </CardContent>
    </Card>
  );
}

function SectionCard({
  kind,
  section,
}: {
  kind: keyof typeof sectionMeta;
  section: AnalysisSection;
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
        <p className="text-sm text-muted-foreground leading-relaxed">
          {section.summary}
        </p>
        <BulletGrid section={section} />
      </CardContent>
    </Card>
  );
}

function BulletGrid({ section }: { section: AnalysisSection }) {
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
          <p className={`text-xs font-semibold uppercase tracking-wider ${tone}`}>
            {label}
          </p>
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
