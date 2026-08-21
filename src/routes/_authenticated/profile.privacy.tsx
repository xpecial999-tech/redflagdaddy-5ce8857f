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
  const runExport = useServerFn(exportMyData);
  const [json, setJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await runExport({});
      setJson(res.json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load your data.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!json) return;
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "redflagdaddy-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

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
          icon={loading ? Loader2 : Download}
          label={loading ? "Loading your data…" : "View / export my data"}
          desc="See every journey, response and result as raw JSON."
          onClick={handleExport}
        />
        {err && <p className="text-xs text-destructive px-1">{err}</p>}
        {json && (
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Your data (JSON)</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(json);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-xl bg-white/5 px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : null}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={download}
                  className="rounded-xl bg-primary/15 text-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto rounded-xl bg-input border border-border p-3 text-[11px] leading-relaxed font-mono whitespace-pre">
              {json}
            </pre>
          </div>
        )}
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
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  destructive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
