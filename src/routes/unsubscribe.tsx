import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Unsubscribe — RedFlagDaddy" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { name: "description", content: "Stop receiving notification emails from RedFlagDaddy." },
      { property: "og:title", content: "Unsubscribe — RedFlagDaddy" },
      { property: "og:description", content: "Manage your RedFlagDaddy email preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unsubscribe,
});

type State = "loading" | "valid" | "invalid" | "used" | "done" | "error";

function Unsubscribe() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) return setState("invalid");
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok || body?.valid === false) {
          setState(
            body?.reason === "already_unsubscribed" || body?.used ? "used" : "invalid",
          );
          return;
        }
        setState("valid");
      })
      .catch(() => setState("error"));
  }, []);

  const confirm = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto pt-16">
      <div className="glass-strong rounded-3xl p-6 text-center space-y-3">
        <h1 className="text-2xl font-display font-semibold">Email preferences</h1>
        {state === "loading" && <p className="text-sm text-muted-foreground">Checking your link…</p>}
        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground">
              Unsubscribe from RedFlagDaddy notification emails?
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium disabled:opacity-60"
            >
              {busy ? "Updating…" : "Confirm unsubscribe"}
            </button>
          </>
        )}
        {state === "done" && (
          <p className="text-sm text-muted-foreground">
            You're unsubscribed. You'll still receive essential account emails.
          </p>
        )}
        {state === "used" && (
          <p className="text-sm text-muted-foreground">This link has already been used.</p>
        )}
        {state === "invalid" && (
          <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>
        )}
        {state === "error" && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}
      </div>
    </div>
  );
}
