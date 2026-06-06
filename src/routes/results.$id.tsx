import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Shield, Heart, AlertTriangle, Sparkles, MessageSquare, HandHeart, Gauge } from "lucide-react";
import { getResults, runAnalysis, type AnalysisSection, type AnalysisPayload } from "@/lib/analysis.functions";

export const Route = createFileRoute("/results/$id")({
  component: ResultsPage,
  errorComponent: ({ error }) => (
    
      <p className="text-destructive">{error.message}</p>
    
  ),
  notFoundComponent: () => (
    
      <p>Not found.</p>
    
  ),
});

const sectionMeta: Record<keyof Omit<AnalysisPayload, "dynamic_readiness" | "overall_note" | "generated_at">,
  { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  safety: { icon: Shield, tone: "text-emerald-500" },
  compatibility: { icon: Heart, tone: "text-pink-500" },
  red_flags: { icon: AlertTriangle, tone: "text-red-500" },
  green_flags: { icon: Sparkles, tone: "text-emerald-500" },
  communication: { icon: MessageSquare, tone: "text-sky-500" },
  consent: { icon: HandHeart, tone: "text-violet-500" },
};

function ResultsPage() {
  const { id } = Route.useParams();
  const fetchResults = useServerFn(getResults);
  const runAi = useServerFn(runAnalysis);

  const q = useQuery({
    queryKey: ["results", id],
    queryFn: () => fetchResults({ data: { journeyId: id } }),
  });

  const m = useMutation({
    mutationFn: () => runAi({ data: { journeyId: id } }),
    onSuccess: () => q.refetch(),
  });

  if (q.isLoading) {
    return (
      
        <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin" /></div>
      
    );
  }
  if (q.error) {
    return <p className="text-destructive">{(q.error as Error).message}</p>;
  }

  const { result, analysis, journey } = q.data!;
  const scores = {
    safety: Number(result?.safety_score ?? 0),
    compatibility: Number(result?.compatibility_score ?? 0),
    red: Number(result?.red_flag_score ?? 0),
    green: Number(result?.green_flag_score ?? 0),
    experience: Number(result?.experience_score ?? 0),
  };

  return (
    
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Assessment Results</h1>
          <p className="text-sm text-muted-foreground">
            {journey?.title ?? "Journey"} · participant type:{" "}
            <span className="font-medium capitalize">{journey?.participant_type}</span>
          </p>
        </header>

        {/* Score overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ScoreTile label="Safety" value={scores.safety} positive />
          <ScoreTile label="Compatibility" value={scores.compatibility} positive />
          <ScoreTile label="Green Flags" value={scores.green} positive />
          <ScoreTile label="Red Flags" value={scores.red} positive={false} />
          <ScoreTile label="Experience" value={scores.experience} positive />
        </div>

        {!analysis && (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                The AI analysis hasn't been generated yet for this assessment.
              </p>
              <Button onClick={() => m.mutate()} disabled={m.isPending}>
                {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : "Generate AI Analysis"}
              </Button>
              {m.error && <p className="text-xs text-destructive">{(m.error as Error).message}</p>}
            </CardContent>
          </Card>
        )}

        {analysis && (
          <>
            <ReadinessCard r={analysis.dynamic_readiness} />

            <div className="grid md:grid-cols-2 gap-4">
              <SectionCard kind="safety" section={analysis.safety} />
              <SectionCard kind="consent" section={analysis.consent} />
              <SectionCard kind="red_flags" section={analysis.red_flags} />
              <SectionCard kind="green_flags" section={analysis.green_flags} />
              <SectionCard kind="communication" section={analysis.communication} />
              <SectionCard kind="compatibility" section={analysis.compatibility} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Overall note</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {analysis.overall_note}
                <p className="mt-4 text-xs italic">
                  This analysis is an assessment summary, not a clinical or medical evaluation.
                  No diagnosis is made or implied.
                </p>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="outline" size="sm" onClick={() => m.mutate()} disabled={m.isPending}>
                {m.isPending ? "Regenerating…" : "Regenerate analysis"}
              </Button>
            </div>
          </>
        )}
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
          <span className="text-4xl font-display font-semibold">{Math.round(r.score)}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <Progress value={Math.max(0, Math.min(100, r.score))} />
        <p className="text-sm text-muted-foreground leading-relaxed">{r.rationale}</p>
        <BulletGrid section={r as unknown as AnalysisSection} />
      </CardContent>
    </Card>
  );
}

function SectionCard({ kind, section }: { kind: keyof typeof sectionMeta; section: AnalysisSection }) {
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
          <p className={`text-xs font-semibold uppercase tracking-wider ${tone}`}>{label}</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
