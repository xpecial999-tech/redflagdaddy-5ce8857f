export const MARKETING_EVENT_NAMES = [
  "landing_viewed",
  "signup_started",
  "signup_completed",
  "core_action_completed",
] as const;

export const MARKETING_FLOWS = ["landing", "account", "guest"] as const;

export type MarketingEventName = (typeof MARKETING_EVENT_NAMES)[number];
export type MarketingFlow = (typeof MARKETING_FLOWS)[number];
export type AnalyticsMode = "staging" | "production";

export type MarketingAttribution = {
  source: "tiktok" | "instagram" | "threads" | "youtube" | null;
  medium: "organic_social" | null;
  campaign: string | null;
  content: string | null;
};

const ATTRIBUTION_KEY = "rfd_marketing_attribution_v1";
const SESSION_KEY = "rfd_marketing_session_v1";
const CONSENT_KEY = "rfd_anonymous_analytics_consent_v1";
const EVENT_PREFIX = "rfd_marketing_event_v1:";
const ALLOWED_SOURCES = new Set(["tiktok", "instagram", "threads", "youtube"]);
const MARKETING_LANDING_PATHS = new Set([
  "/",
  "/about",
  "/register",
  "/guest",
  "/demo-report",
  "/consent-safety",
]);
const SAFE_VALUE = /^[a-z0-9][a-z0-9_-]{0,79}$/;

function safeValue(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return SAFE_VALUE.test(normalized) ? normalized : null;
}

export function parseMarketingAttribution(search: string): MarketingAttribution | null {
  const params = new URLSearchParams(search);
  const source = safeValue(params.get("utm_source"));
  const medium = safeValue(params.get("utm_medium"));
  const campaign = safeValue(params.get("utm_campaign"));
  const content = safeValue(params.get("utm_content"));

  if (!source && !medium && !campaign && !content) return null;
  if (!source || !ALLOWED_SOURCES.has(source)) return null;
  if (medium !== "organic_social") return null;

  return {
    source: source as MarketingAttribution["source"],
    medium,
    campaign,
    content,
  };
}

export function isMarketingLandingPath(pathname: string): boolean {
  return MARKETING_LANDING_PATHS.has(pathname);
}

export function initializeMarketingAttribution(
  search = window.location.search,
): MarketingAttribution | null {
  const existing = readMarketingAttribution();
  if (existing) return existing;
  const parsed = parseMarketingAttribution(search);
  if (parsed) {
    try {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(parsed));
    } catch {
      return null;
    }
  }
  return parsed;
}

export function readMarketingAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketingAttribution;
    const canonical = parseMarketingAttribution(
      `?utm_source=${parsed.source ?? ""}&utm_medium=${parsed.medium ?? ""}&utm_campaign=${parsed.campaign ?? ""}&utm_content=${parsed.content ?? ""}`,
    );
    return canonical;
  } catch {
    try {
      sessionStorage.removeItem(ATTRIBUTION_KEY);
    } catch {
      // Storage can be unavailable in hardened browser modes.
    }
    return null;
  }
}

export function analyticsMode(mode = import.meta.env.VITE_ANALYTICS_MODE): AnalyticsMode | null {
  return mode === "staging" || mode === "production" ? mode : null;
}

export function analyticsConfigured(mode = import.meta.env.VITE_ANALYTICS_MODE): boolean {
  return analyticsMode(mode) !== null;
}

export function getAnalyticsConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(value: "granted" | "denied"): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // The in-memory UI state can still reflect the user's choice.
  }
  if (value === "denied") clearMarketingSession();
}

export function clearMarketingSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ATTRIBUTION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(EVENT_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
}

function getMarketingSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export async function captureMarketingEvent(
  eventName: MarketingEventName,
  flow: MarketingFlow,
  options: { once?: boolean } = {},
): Promise<void> {
  const environment = analyticsMode();
  if (typeof window === "undefined" || !environment || getAnalyticsConsent() !== "granted") return;
  const onceKey = `${EVENT_PREFIX}${eventName}:${flow}`;
  if (options.once && sessionStorage.getItem(onceKey)) return;

  try {
    const { recordMarketingEvent } = await import("./marketing-analytics.functions");
    await recordMarketingEvent({
      data: {
        eventName,
        environment,
        flow,
        sessionId: getMarketingSessionId(),
        attribution: readMarketingAttribution(),
      },
    });
    if (options.once) sessionStorage.setItem(onceKey, "1");
  } catch {
    // Analytics must never interrupt the product flow.
  }
}
