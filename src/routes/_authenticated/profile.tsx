import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, Shield, Bell, Lock, HelpCircle, Loader2, ChevronRight } from "lucide-react";
import { useMe } from "@/hooks/use-me";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/phone";
import { Link } from "@tanstack/react-router";


export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — RedFlagDaddy" }] }),
  component: Profile,
});

const settings = [
  {
    to: "/profile/privacy" as const,
    icon: Lock,
    label: "Privacy & data",
    desc: "Manage what's stored and shared.",
  },
  {
    to: "/profile/notifications" as const,
    icon: Bell,
    label: "Notifications",
    desc: "Email & in-app preferences.",
  },
  {
    to: "/profile/safety" as const,
    icon: Shield,
    label: "Safety center",
    desc: "Block lists, panic features.",
  },
  {
    to: "/profile/help" as const,
    icon: HelpCircle,
    label: "Help & consent guides",
    desc: "Education resources.",
  },
];

function Profile() {
  const { me, loading } = useMe();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  if (loading || !me) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const displayName = me.name || formatPhone(me.phone) || me.email?.split("@")[0] || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const role = me.role || "member";

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-aurora-1 to-aurora-2 mx-auto flex items-center justify-center text-2xl font-display font-semibold text-primary-foreground">
          {initial}
        </div>
        <h1 className="mt-3 text-xl font-display font-semibold">{displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {role}
          {me.isAdmin ? " · admin" : ""}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{formatPhone(me.phone) || me.email}</p>
      </motion.section>

      <ContactEmailCard userId={me.id} initialEmail={me.email} />


      <section className="space-y-2">
        {settings.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </section>

      <button
        onClick={signOut}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}

function ContactEmailCard({ userId, initialEmail }: { userId: string; initialEmail: string | null }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    const value = email.trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return setError("Enter a valid email address.");
    }
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ email: value || null })
      .eq("id", userId);
    setSaving(false);
    if (error) return setError(error.message);
    setStatus(value ? "Saved. Reports and invites will be emailed here." : "Email removed.");
  };

  return (
    <section className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">Contact email (optional)</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        You sign in with your mobile number. Add an email if you'd also like reports and invite updates by email.
      </p>
      <form className="flex gap-2" onSubmit={save}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 min-w-0 rounded-xl bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={saving}
          className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      {status && <p className="text-xs text-muted-foreground mt-2">{status}</p>}
    </section>
  );
}

