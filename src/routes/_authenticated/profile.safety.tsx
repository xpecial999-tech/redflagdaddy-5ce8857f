import { createFileRoute } from "@tanstack/react-router";
import { Shield, UserX, Siren, KeyRound, AlertTriangle, Phone } from "lucide-react";
import { useState } from "react";
import { SubpageHeader, Toggle, ActionRow } from "./profile.privacy";

export const Route = createFileRoute("/_authenticated/profile/safety")({
  head: () => ({ meta: [{ title: "Safety center — Dynamic Compass" }] }),
  component: Safety,
});

function Safety() {
  const [panic, setPanic] = useState(false);
  const [stealth, setStealth] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  return (
    <div className="space-y-6">
      <SubpageHeader title="Safety center" icon={Shield} />

      <section className="glass-strong rounded-2xl p-5 space-y-1">
        <h2 className="font-display text-lg">Your safety, by design</h2>
        <p className="text-sm text-muted-foreground">
          Tools to protect your account, exit a conversation fast, and keep distance from people
          who've crossed a line.
        </p>
      </section>

      <section className="space-y-3">
        <SectionLabel>Account protection</SectionLabel>
        <Toggle
          icon={KeyRound}
          label="Two-factor authentication"
          desc="Require a code from your authenticator app on sign-in."
          value={twoFactor}
          onChange={setTwoFactor}
        />
        <Toggle
          icon={Siren}
          label="Panic exit"
          desc="Triple-tap the logo to clear the screen and sign out."
          value={panic}
          onChange={setPanic}
        />
        <Toggle
          icon={Shield}
          label="Stealth mode"
          desc="Hide the app icon name in browser tabs and history."
          value={stealth}
          onChange={setStealth}
        />
      </section>

      <section className="space-y-3">
        <SectionLabel>Boundaries</SectionLabel>
        <ActionRow
          icon={UserX}
          label="Blocked accounts"
          desc="Review and manage everyone you've blocked. (0)"
        />
        <ActionRow
          icon={AlertTriangle}
          label="Report a user"
          desc="Send a confidential report to our safety team."
        />
      </section>

      <section className="glass rounded-2xl p-5 border border-destructive/30">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">In immediate danger?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Dynamic Compass is not an emergency service. Contact local emergency services or a
              trusted crisis line right away.
            </p>
          </div>
        </div>
      </section>
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
