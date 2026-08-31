import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarInviteDialog } from "@/components/CalendarInviteDialog";
import { SelectiveReportExportDialog } from "@/components/SelectiveReportExportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Download, Share2, Link2, Check, Lock, FileText, MessageSquare, FileJson, ChevronDown, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import {
  getResults,
  runAnalysis,
  toggleShareReport,
} from "@/lib/analysis.functions";
import { getEntitlement } from "@/lib/entitlement.functions";
import { ReportView } from "@/components/ReportView";
import { buildConversationPlanMarkdown, buildConversationTopicsMarkdown, buildFullReportMarkdown, buildPrivateReportJson, downloadJson, downloadMarkdown, safeExportFilename, safeReportFilename } from "@/lib/report-export";

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
  const [selectiveExportOpen, setSelectiveExportOpen] = useState(false);

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

  const { result, analysis, analysisAvailable, journey, share } = q.data!;
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

  const exportInput = analysis ? {
    title: journey?.title ?? "Journey",
    participantType: journey?.participant_type ?? "",
    scores,
    analysis,
  } : null;

  const exportMarkdown = (mode: "full" | "topics") => {
    if (!exportInput) return;
    const topicsOnly = mode === "topics";
    downloadMarkdown(
      topicsOnly
        ? "conversation-topics.md"
        : safeReportFilename(exportInput.title, "private-report"),
      topicsOnly ? buildConversationTopicsMarkdown(exportInput) : buildFullReportMarkdown(exportInput),
    );
    toast.success(
      topicsOnly ? "Conversation topics saved to this device" : "Private report saved to this device",
      { description: "RedFlagDaddy does not upload or retain this export." },
    );
  };

  const exportJson = () => {
    if (!exportInput) return;
    downloadJson(
      safeExportFilename(exportInput.title, "private-report", "json"),
      buildPrivateReportJson(exportInput),
    );
    toast.success("Private JSON report saved to this device", {
      description: "RedFlagDaddy does not upload or retain this export.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end no-print">
        {analysis && ent.data?.canDownloadReport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" /> Export
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Private exports</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.print()}>
                <Download /> Save or print PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportMarkdown("full")}>
                <FileText /> Complete Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportMarkdown("topics")}>
                <MessageSquare /> Topics-only Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (!exportInput) return;
                  downloadMarkdown(
                    "conversation-plan.md",
                    buildConversationPlanMarkdown(exportInput),
                  );
                  toast.success("Private conversation plan saved", {
                    description: "This is a preparation aid, not an agreement or proof of consent.",
                  });
                }}
              >
                <ClipboardCheck /> Conversation plan
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportJson}>
                <FileJson /> Versioned JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSelectiveExportOpen(true)}>
                <FileText /> Choose dimensions…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {exportInput && (
          <SelectiveReportExportDialog
            input={exportInput}
            open={selectiveExportOpen}
            onOpenChange={setSelectiveExportOpen}
          />
        )}
        {analysis && ent.data?.canDownloadReport && <CalendarInviteDialog analysis={analysis} />}
        {analysis && ent.data?.canDownloadReport && (
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
        {analysis && ent.data && !ent.data.canDownloadReport && (
          <Link to="/upgrade" className="inline-flex items-center text-xs rounded-md bg-primary/15 text-primary px-3 py-1.5 font-medium">
            <Lock className="h-3.5 w-3.5 mr-1.5" /> Upgrade to download / share
          </Link>
        )}
        {shareUrl && ent.data?.canDownloadReport && (
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
