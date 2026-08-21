import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

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
