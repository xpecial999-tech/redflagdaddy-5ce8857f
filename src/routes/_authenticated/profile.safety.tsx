import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, KeyRound, Link2, Loader2, LogOut, Phone, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SubpageHeader } from "@/components/profile-settings";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile/safety")({
  head: () => ({ meta: [{ title: "Safety center — RedFlagDaddy" }] }),
  component: Safety,
});

function Safety() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("We couldn't sign you out. Please try again.");
      setSigningOut(false);
      return;
    }

    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="space-y-6">
      <SubpageHeader title="Safety center" icon={Shield} />

      <section className="glass-strong rounded-2xl p-5 space-y-1">
        <h2 className="font-display text-lg">Controls available today</h2>
        <p className="text-sm text-muted-foreground">
          Review how account access and private links work. RedFlagDaddy does not currently offer
          blocking, in-app reporting, stealth mode or an emergency-exit feature.
        </p>
      </section>

      <section className="space-y-3">
        <SectionLabel>Account access</SectionLabel>
        <SafetyCard icon={KeyRound} title="One-time SMS codes">
          Sign-in uses a code sent to your registered phone number. Never share a sign-in code with
          anyone, including someone claiming to represent RedFlagDaddy.
        </SafetyCard>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            {signingOut ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium text-sm">Sign out</div>
            <div className="text-xs text-muted-foreground">
              End your current RedFlagDaddy session.
            </div>
          </div>
        </button>
      </section>

      <section className="space-y-3">
        <SectionLabel>Privacy and consent</SectionLabel>
        <SafetyCard icon={Link2} title="Treat private links like passwords">
          Anyone with an active invite or shared-report link may be able to open it. Send links only
          to the intended person and avoid posting them publicly.
        </SafetyCard>
        <Link
          to="/consent-safety"
          className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">Read the consent and safety guidelines</div>
            <div className="text-xs text-muted-foreground">
              Review boundaries, communication, privacy and warning signs.
            </div>
          </div>
        </Link>
      </section>

      <section className="glass rounded-2xl p-5 border border-destructive/30">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> In immediate danger?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              RedFlagDaddy is not an emergency service and cannot monitor or intervene in a crisis.
              Contact local emergency services or a trusted crisis service right away.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SafetyCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
      {children}
    </div>
  );
}
