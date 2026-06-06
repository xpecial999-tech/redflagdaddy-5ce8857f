import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getSharedReport } from "@/lib/analysis.functions";
import { ReportView } from "@/components/ReportView";

export const Route = createFileRoute("/report/$token")({
  head: () => ({ meta: [{ title: "Shared Report — RedFlagDaddy" }] }),
  component: SharedReportPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md glass rounded-2xl p-6 text-center">
        <p className="text-destructive">{error.message}</p>
      </div>
    </div>
  ),
});

function SharedReportPage() {
  const { token } = Route.useParams();
  const fetchShared = useServerFn(getSharedReport);
  const q = useQuery({
    queryKey: ["shared-report", token],
    queryFn: () => fetchShared({ data: { token } }),
  });

  if (q.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-destructive">{(q.error as Error).message}</p>
      </div>
    );
  }

  const { journey, result, analysis } = q.data!;
  const scores = {
    safety: Number(result.safety_score ?? 0),
    compatibility: Number(result.compatibility_score ?? 0),
    red: Number(result.red_flag_score ?? 0),
    green: Number(result.green_flag_score ?? 0),
    experience: Number(result.experience_score ?? 0),
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-4">
      <div className="flex justify-end no-print">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-1.5" /> Download PDF
        </Button>
      </div>
      <ReportView
        title={journey.title}
        participantType={journey.participant_type}
        scores={scores}
        analysis={analysis}
      />
      <p className="text-center text-xs text-muted-foreground pt-6 no-print">
        Shared via RedFlagDaddy
      </p>
    </div>
  );
}
