import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Clock, CheckCircle2, AlertTriangle, Compass } from "lucide-react";
import { listJourneys } from "@/lib/journeys.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Dynamic Compass" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fetchJourneys = useServerFn(listJourneys);
  const { data, isLoading } = useQuery({
    queryKey: ["journeys"],
    queryFn: () => fetchJourneys(),
  });

  const journeys = data?.journeys ?? [];
  const active = journeys.filter((j) => j.status === "pending" || j.status === "in_progress").length;
  const complete = journeys.filter((j) => j.status === "completed").length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your compass</p>
          <h1 className="text-3xl font-display font-semibold">Journeys</h1>
        </div>
        <Link to="/create" className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium shadow-lg shadow-primary/30">
          <Plus className="w-4 h-4" /> New
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: active },
          { label: "Complete", value: complete },
          { label: "Total", value: journeys.length },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-2xl font-display font-semibold">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      {isLoading && <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">Loading…</div>}

      {!isLoading && journeys.length === 0 && (
        <div className="glass-strong rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-aurora-1/30 to-aurora-2/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display text-lg">No journeys yet</h3>
          <p className="text-sm text-muted-foreground">Create your first assessment to invite a respondent.</p>
          <Link to="/create" className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Create journey
          </Link>
        </div>
      )}

      <section className="space-y-3">
        {journeys.map((j, i) => (
          <motion.div key={j.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link
              to="/journeys/$id"
              params={{ id: j.id }}
              className="block glass rounded-2xl p-4 hover:bg-white/5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{j.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <StatusIcon status={j.status} />
                    {j.status.replace("_", " ")}
                    <span className="opacity-50">·</span>
                    <span className="font-mono">{j.invite_code}</span>
                  </p>
                </div>
                <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded-full bg-white/5 text-muted-foreground">{j.participant_type}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "expired") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  return <Clock className="w-3.5 h-3.5 text-primary" />;
}
