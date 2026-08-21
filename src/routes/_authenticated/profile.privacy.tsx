import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Download, Trash2, Eye, ShieldCheck, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportMyData } from "@/lib/data-export.functions";

export const Route = createFileRoute("/_authenticated/profile/privacy")({
  head: () => ({ meta: [{ title: "Privacy & data — RedFlagDaddy" }] }),
  component: Privacy,
});

function Privacy() {
  const [share, setShare] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);

  return (
    <div className="space-y-6">
      <SubpageHeader title="Privacy & data" icon={Lock} />

      <section className="glass-strong rounded-2xl p-5 space-y-1">
        <h2 className="font-display text-lg">Your data, your call</h2>
        <p className="text-sm text-muted-foreground">
          Journeys, responses and results are scoped to your account at the database layer. Nothing
          is shared without an explicit invite link.
        </p>
      </section>

      <section className="space-y-2">
        <Toggle
          icon={Eye}
          label="Share results with respondents"
          desc="Let invited partners see the same summary you do."
          value={share}
          onChange={setShare}
        />
        <Toggle
          icon={ShieldCheck}
          label="Anonymous usage analytics"
          desc="Help improve scoring with aggregate, de-identified data."
          value={analytics}
          onChange={setAnalytics}
        />
        <Toggle
          icon={Eye}
          label="Discoverable profile"
          desc="Allow other verified members to find your handle."
          value={discoverable}
          onChange={setDiscoverable}
        />
      </section>

      <section className="space-y-2">
        <ActionRow
          icon={Download}
          label="Export my data"
          desc="Download every journey, response and result as JSON."
        />
        <ActionRow
          icon={Trash2}
          label="Delete account"
          desc="Permanently remove your account and all journeys."
          destructive
        />
      </section>
    </div>
  );
}

export function SubpageHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/profile"
        className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-display font-semibold">{title}</h1>
      </div>
    </div>
  );
}

export function Toggle({
  icon: Icon,
  label,
  desc,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div
        className={`relative w-10 h-6 rounded-full transition ${
          value ? "bg-primary" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

export function ActionRow({
  icon: Icon,
  label,
  desc,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  destructive?: boolean;
}) {
  return (
    <button
      className={`w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition ${
        destructive ? "border border-destructive/30" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          destructive ? "bg-destructive/10" : "bg-white/5"
        }`}
      >
        <Icon className={`w-5 h-5 ${destructive ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${destructive ? "text-destructive" : ""}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
