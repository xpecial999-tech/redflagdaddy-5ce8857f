type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
  }
}

const PRIVATE_ROUTE_PATTERNS: Array<[RegExp, string]> = [
  [/^\/j\/[^/]+(?:\/.*)?$/, "/j/[redacted]"],
  [/^\/journey\/[^/]+(?:\/.*)?$/, "/journey/[redacted]"],
  [/^\/assessment\/[^/]+(?:\/.*)?$/, "/assessment/[redacted]"],
  [/^\/report\/[^/]+(?:\/.*)?$/, "/report/[redacted]"],
  [/^\/results\/[^/]+(?:\/.*)?$/, "/results/[redacted]"],
  [/^\/journeys\/[^/]+(?:\/.*)?$/, "/journeys/[redacted]"],
];

export function redactPrivatePathname(pathname: string): string {
  for (const [pattern, replacement] of PRIVATE_ROUTE_PATTERNS) {
    if (pattern.test(pathname)) return replacement;
  }
  return pathname;
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      ...context,
      // Dynamic route segments can be invite codes, report bearer tokens, or
      // user-scoped identifiers. Never send them to external error tooling.
      route: redactPrivatePathname(window.location.pathname),
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
