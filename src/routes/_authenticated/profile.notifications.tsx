import { createFileRoute } from "@tanstack/react-router";
import { Bell, Mail, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { SubpageHeader, Toggle } from "./profile.privacy";

export const Route = createFileRoute("/_authenticated/profile/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Dynamic Compass" }] }),
  component: Notifications,
});

function Notifications() {
  const [emailInvite, setEmailInvite] = useState(true);
  const [emailComplete, setEmailComplete] = useState(true);
  const [emailRedFlag, setEmailRedFlag] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [inAppMessages, setInAppMessages] = useState(true);
  const [inAppMentions, setInAppMentions] = useState(true);

  return (
    <div className="space-y-6">
      <SubpageHeader title="Notifications" icon={Bell} />

      <section className="glass-strong rounded-2xl p-5 space-y-1">
        <h2 className="font-display text-lg">Stay in the loop</h2>
        <p className="text-sm text-muted-foreground">
          Choose how Dynamic Compass reaches you when something needs attention.
        </p>
      </section>

      <section className="space-y-3">
        <SectionLabel>Email</SectionLabel>
        <Toggle
          icon={Mail}
          label="Invite accepted"
          desc="When a respondent opens your journey link."
          value={emailInvite}
          onChange={setEmailInvite}
        />
        <Toggle
          icon={CheckCircle2}
          label="Journey complete"
          desc="When results are ready to review."
          value={emailComplete}
          onChange={setEmailComplete}
        />
        <Toggle
          icon={AlertCircle}
          label="Red flag detected"
          desc="Immediate notice when a high-risk answer is recorded."
          value={emailRedFlag}
          onChange={setEmailRedFlag}
        />
        <Toggle
          icon={Mail}
          label="Weekly digest"
          desc="Summary of activity every Monday morning."
          value={emailDigest}
          onChange={setEmailDigest}
        />
      </section>

      <section className="space-y-3">
        <SectionLabel>In-app</SectionLabel>
        <Toggle
          icon={MessageCircle}
          label="Direct messages"
          desc="Push notifications for chat threads."
          value={inAppMessages}
          onChange={setInAppMessages}
        />
        <Toggle
          icon={Bell}
          label="Mentions"
          desc="Anyone tagging you in a shared journey."
          value={inAppMentions}
          onChange={setInAppMentions}
        />
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
