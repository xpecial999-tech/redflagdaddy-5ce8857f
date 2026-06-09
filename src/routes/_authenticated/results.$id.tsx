import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, Link2, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  getResults,
  runAnalysis,
  toggleShareReport,
} from "@/lib/analysis.functions";
import { getEntitlement } from "@/lib/entitlement.functions";
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
  const toggleShare = useServerFn(toggleShareReport);
  const entFn = useServerFn(getEntitlement);
  const [copied, setCopied] = useState(false);

  const q = useQuery({
    queryKey: ["results", id],
    queryFn: () => fetchResults({ data: { journeyId: id } }),
  });
  const ent = useQuery({ queryKey: ["entitlement"], queryFn: () => entFn() });

  const m = useMutation({
    mutationFn: () => runAi({ data: { journeyId: id } }),
    onSuccess: () => q.refetch(),
  });

  const shareMut = useMutation({
    mutationFn: (enabled: boolean) =>
      toggleShare({ data: { journeyId: id, enabled } }),
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

  const { result, analysis, journey, share } = q.data!;
  const scores = {
    safety: Number(result?.safety_score ?? 0),
    compatibility: Number(result?.compatibility_score ?? 0),
    red: Number(result?.red_flag_score ?? 0),
    green: Number(result?.green_flag_score ?? 0),
    experience: Number(result?.experience_score ?? 0),
  };

  const shareUrl =
    share?.enabled && share.token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/report/${share.token}`
      : null;

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end no-print">
        {analysis && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-1.5" /> Download PDF
          </Button>
        )}
        {analysis && (
          <Button
            variant={share?.enabled ? "secondary" : "outline"}
            size="sm"
            onClick={() => shareMut.mutate(!share?.enabled)}
            disabled={shareMut.isPending}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            {share?.enabled ? "Sharing on" : "Enable share link"}
          </Button>
        )}
        {shareUrl && (
          <Button variant="outline" size="sm" onClick={copyShare}>
            {copied ? (
              <Check className="h-4 w-4 mr-1.5" />
            ) : (
              <Link2 className="h-4 w-4 mr-1.5" />
            )}
            Copy link
          </Button>
        )}
      </div>

      {shareUrl && (
        <div className="glass rounded-xl p-3 text-xs text-muted-foreground break-all no-print">
          Public link: <span className="font-mono text-foreground">{shareUrl}</span>
        </div>
      )}

      {!analysis && (
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

      <ReportView
        title={journey?.title ?? "Journey"}
        participantType={journey?.participant_type ?? ""}
        scores={scores}
        analysis={analysis}
      />

      {analysis && (
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
