import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, HeartHandshake, MessageSquare, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { PairAnalysisPayload, PairInsight } from "@/lib/pair-analysis";

export function PairComparisonView({ analysis }: { analysis: PairAnalysisPayload }) {
  return (
    <section className="report-printable w-full max-w-5xl mx-auto space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="flex flex-row items-center gap-3">
          <HeartHandshake className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-lg">Matched report</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Comparing your assessment with your partner’s completed assessment.
            </p>
          </div>
          <Badge variant="secondary">{analysis.overall.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold">
              {Math.round(analysis.overall.score)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100 alignment</span>
          </div>
          <Progress value={analysis.overall.score} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {analysis.overall.summary}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SideCard label="Your side" title={analysis.owner.title} role={analysis.owner.role} />
            <SideCard label="Partner side" title={analysis.partner.title} role={analysis.partner.role} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard
          icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
          title="Shared strengths"
          items={analysis.shared_strengths}
        />
        <ListCard
          icon={<MessageSquare className="h-4 w-4 text-sky-500" />}
          title="Talk through"
          items={analysis.discussion_points}
        />
        <ListCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          title="Watchouts"
          items={analysis.watchouts}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score differences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Delta label="Safety" value={analysis.score_deltas.safety} />
          <Delta label="Compatibility" value={analysis.score_deltas.compatibility} />
          <Delta label="Green flags" value={analysis.score_deltas.green} />
          <Delta label="Red flags" value={analysis.score_deltas.red} />
          <Delta label="Experience" value={analysis.score_deltas.experience} />
        </CardContent>
      </Card>

      {analysis.question_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Question-level comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.question_insights.map((insight, index) => (
              <InsightCard key={`${insight.title}-${index}`} insight={insight} />
            ))}
          </CardContent>
        </Card>
      )}

      <ListCard title="Next steps" items={analysis.next_steps} />
    </section>
  );
}

function SideCard({ label, title, role }: { label: string; title: string; role: string }) {
  return (
    <div className="rounded-xl border border-border bg-input/30 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{title}</p>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{role}</p>
    </div>
  );
}

function ListCard({
  icon,
  title,
  items,
}: {
  icon?: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Delta({ label, value }: { label: string; value: number }) {
  const tone = value >= 30 ? "text-red-500" : value >= 15 ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="rounded-xl border border-border bg-input/30 p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${tone}`}>{Math.round(value)}</p>
      <p className="text-[10px] text-muted-foreground">point gap</p>
    </div>
  );
}

function InsightCard({ insight }: { insight: PairInsight }) {
  const badge =
    insight.severity === "concern" ? "Concern" : insight.severity === "watch" ? "Discuss" : "Aligned";
  return (
    <div className="rounded-xl border border-border bg-input/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-medium leading-snug">{insight.title}</h3>
        <Badge variant={insight.severity === "concern" ? "destructive" : "secondary"}>{badge}</Badge>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{insight.summary}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <blockquote className="rounded-lg bg-background/40 p-3 text-xs text-muted-foreground">
          <span className="block font-semibold text-foreground">Your answer</span>
          {insight.owner}
        </blockquote>
        <blockquote className="rounded-lg bg-background/40 p-3 text-xs text-muted-foreground">
          <span className="block font-semibold text-foreground">Partner answer</span>
          {insight.partner}
        </blockquote>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{insight.prompt}</p>
    </div>
  );
}
