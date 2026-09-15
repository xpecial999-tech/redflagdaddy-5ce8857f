import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Lock } from "lucide-react";
import {
  getResults,
  runAnalysis,
} from "@/lib/analysis.functions";
import { getEntitlement } from "@/lib/entitlement.functions";
import { PairComparisonView } from "@/components/PairComparisonView";
import { ReportView } from "@/components/ReportView";

export const Route = createFileRoute("/_authenticated/results/$id")({
  component: ResultsPage,
  errorComponent: ({ error }) => (
    <div className="max-w-md mx-auto glass rounded-2xl p-6 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="max-w-md mx-auto glass rounded-2xl p-6 text-center">
      <p>Not found.</p>
    </div>
  ),
});

function ResultsPage() {
  const { id } = Route.useParams();
  const fetchResults = useServerFn(getResults);
  const runAi = useServerFn(runAnalysis);
  const entFn = useServerFn(getEntitlement);

  const q = useQuery({
    queryKey: ["results", id],
    queryFn: () => fetchResults({ data: { journeyId: id } }),
  });
  const ent = useQuery({ queryKey: ["entitlement"], queryFn: () => entFn() });

  const m = useMutation({
    mutationFn: () => runAi({ data: { journeyId: id } }),
    onSuccess: () => q.refetch(),
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (q.error) {
    return <p className="text-destructive">{(q.error as Error).message}</p>;
  }

  const { result, analysis, analysisAvailable, journey, pairAnalysis } = q.data!;
  const scores = {
    safety: Number(result?.safety_score ?? 0),
    compatibility: Number(result?.compatibility_score ?? 0),
    red: Number(result?.red_flag_score ?? 0),
    green: Number(result?.green_flag_score ?? 0),
    experience: Number(result?.experience_score ?? 0),
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end no-print">
        {analysis && ent.data?.canDownloadReport && (
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-1.5" />
            Save / print PDF
          </Button>
        )}
        {analysis && ent.data && !ent.data.canDownloadReport && (
          <Link to="/upgrade" className="inline-flex items-center text-xs rounded-md bg-primary/15 text-primary px-3 py-1.5 font-medium">
            <Lock className="h-3.5 w-3.5 mr-1.5" /> Upgrade to download PDF
          </Link>
        )}
      </div>

      {!analysis && analysisAvailable && (
        <Card className="no-print">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              The AI analysis hasn't been generated yet for this assessment.
            </p>
            <Button onClick={() => m.mutate()} disabled={m.isPending}>
              {m.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                "Generate AI Analysis"
              )}
            </Button>
            {m.error && (
              <p className="text-xs text-destructive">
                {(m.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!analysis && !analysisAvailable && (
        <Card className="no-print">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Detailed analysis is not available yet. Your score summary remains
              available below.
            </p>
          </CardContent>
        </Card>
      )}

      {pairAnalysis && <PairComparisonView analysis={pairAnalysis} />}

      <ReportView
        title={journey?.title ?? "Journey"}
        participantType={journey?.participant_type ?? ""}
        scores={scores}
        analysis={analysis}
      />

      {analysis && analysisAvailable && (
        <div className="text-center no-print">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => m.mutate()}
            disabled={m.isPending}
          >
            {m.isPending ? "Regenerating…" : "Regenerate analysis"}
          </Button>
        </div>
      )}
    </div>
  );
}
