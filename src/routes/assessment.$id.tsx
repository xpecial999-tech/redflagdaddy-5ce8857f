import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/assessment/$id")({
  component: AssessmentPlaceholder,
  errorComponent: ({ error }) => (
    <AppShell>
      <p className="text-destructive">{error.message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p>Not found.</p>
    </AppShell>
  ),
});

function AssessmentPlaceholder() {
  const { id } = Route.useParams();
  return (
    <AppShell>
      <div className="glass-strong rounded-3xl p-8 max-w-xl mx-auto">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Assessment</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The questionnaire for journey <span className="font-mono">{id}</span> will appear here.
        </p>
      </div>
    </AppShell>
  );
}
