import { useEffect, useState } from "react";
import {
  analyticsConfigured,
  captureMarketingEvent,
  getAnalyticsConsent,
  initializeMarketingAttribution,
  isMarketingLandingPath,
  setAnalyticsConsent,
} from "@/lib/marketing-attribution";

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [ready, setReady] = useState(false);
  const [marketingPage, setMarketingPage] = useState(false);

  useEffect(() => {
    const isMarketingPage = isMarketingLandingPath(window.location.pathname);
    setMarketingPage(isMarketingPage && window.location.pathname !== "/consent-safety");
    const current = getAnalyticsConsent();
    if (current !== "denied") initializeMarketingAttribution();
    setConsent(current);
    setReady(true);
    if (current === "granted" && isMarketingPage) {
      void captureMarketingEvent("landing_viewed", "landing", { once: true });
    }
  }, []);

  if (!ready || !marketingPage || !analyticsConfigured() || consent !== null) return null;

  const choose = (value: "granted" | "denied") => {
    setAnalyticsConsent(value);
    setConsent(value);
    if (value === "granted") {
      initializeMarketingAttribution();
      void captureMarketingEvent("landing_viewed", "landing", { once: true });
    }
  };

  return (
    <aside
      aria-label="Anonymous analytics choice"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur"
    >
      <p className="text-sm font-medium">Help improve RedFlagDaddy?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Allow anonymous funnel analytics. We never include assessment answers, messages, phone
        numbers, profile details, or private links.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          No thanks
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
        >
          Allow anonymous analytics
        </button>
      </div>
    </aside>
  );
}

export function AnalyticsPreference() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => setConsent(getAnalyticsConsent()), []);

  if (!analyticsConfigured()) {
    return <p className="text-xs text-muted-foreground">Anonymous analytics are disabled.</p>;
  }

  const choose = (value: "granted" | "denied") => {
    setAnalyticsConsent(value);
    setConsent(value);
    if (value === "granted") {
      initializeMarketingAttribution();
      if (isMarketingLandingPath(window.location.pathname)) {
        void captureMarketingEvent("landing_viewed", "landing", { once: true });
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2" aria-label="Anonymous analytics preference">
      <button
        type="button"
        aria-pressed={consent === "granted"}
        onClick={() => choose("granted")}
        className={`rounded-lg border px-3 py-2 text-xs ${consent === "granted" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
      >
        Allow anonymous analytics
      </button>
      <button
        type="button"
        aria-pressed={consent === "denied"}
        onClick={() => choose("denied")}
        className={`rounded-lg border px-3 py-2 text-xs ${consent === "denied" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
      >
        Do not allow
      </button>
    </div>
  );
}
