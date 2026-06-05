import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/results/$id")({
  component: ResultsPlaceholder,
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

function ResultsPlaceholder() {
  const { id } = Route.useParams();
  return (
    <AppShell>
      <div className="glass-strong rounded-3xl p-8 max-w-xl mx-auto text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Assessment complete</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Thank you. Results for journey <span className="font-mono">{id}</span> are being prepared.
        </p>
      </div>
    </AppShell>
  );
}
