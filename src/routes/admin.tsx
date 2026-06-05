import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, FileCheck2, Flag, Activity } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Dynamic Compass" }] }),
  component: Admin,
});

const stats = [
  { icon: Users, label: "Users", value: "1,284" },
  { icon: FileCheck2, label: "Journeys", value: "3,910" },
  { icon: Flag, label: "Open reports", value: "7" },
  { icon: Activity, label: "Active 24h", value: "342" },
];

const reports = [
  { id: "r1", user: "user_8821", reason: "Harassment in invite message", severity: "High" },
  { id: "r2", user: "user_4410", reason: "Possible underage signup", severity: "Critical" },
  { id: "r3", user: "user_1903", reason: "Inappropriate content in journey title", severity: "Medium" },
];

function Admin() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Admin</p>
        <h1 className="text-3xl font-display font-semibold">Trust & safety</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-4">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-display font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-2 px-1">Reports queue</h2>
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-muted-foreground">{r.user}</div>
                  <div className="text-sm mt-1">{r.reason}</div>
                </div>
                <span className={`text-[10px] uppercase font-semibold px-2 py-1 rounded-full ${
                  r.severity === "Critical" ? "bg-rose-500/20 text-rose-300" :
                  r.severity === "High" ? "bg-amber-500/20 text-amber-300" :
                  "bg-white/10 text-muted-foreground"
                }`}>{r.severity}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 rounded-lg bg-primary/15 text-primary text-xs py-2 font-medium">Review</button>
                <button className="flex-1 rounded-lg border border-border text-xs py-2">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
