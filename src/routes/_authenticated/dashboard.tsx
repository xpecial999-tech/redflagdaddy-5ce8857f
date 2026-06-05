import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Dynamic Compass" }] }),
  component: Dashboard,
});

const journeys = [
  { id: "1", title: "Negotiation with Alex", status: "Awaiting respondent", progress: 40, flag: "pending" },
  { id: "2", title: "Compatibility — Sam", status: "Complete", progress: 100, flag: "ok" },
  { id: "3", title: "Hard-limits check — Jamie", status: "2 red flags", progress: 100, flag: "warn" },
];

function Dashboard() {
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
          { label: "Active", value: 2 },
          { label: "Complete", value: 5 },
          { label: "Flags", value: 1 },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-2xl font-display font-semibold">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        {journeys.map((j, i) => (
          <motion.div
            key={j.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to="/results/$id" params={{ id: j.id }} className="block glass rounded-2xl p-4 hover:bg-white/5 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{j.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    {j.flag === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {j.flag === "warn" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    {j.flag === "pending" && <Clock className="w-3.5 h-3.5 text-primary" />}
                    {j.status}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-aurora-1 to-aurora-2"
                  style={{ width: `${j.progress}%` }}
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
