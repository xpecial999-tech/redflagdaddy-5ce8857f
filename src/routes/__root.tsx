import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";
import { ScrollToTop } from "../components/ScrollToTop";
import { AnalyticsConsent } from "../components/AnalyticsConsent";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-7xl font-display text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off course</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page isn't on the map.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const isChunkLoadError =
    typeof error?.message === "string" &&
    /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError/i.test(
      error.message,
    );
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    if (isChunkLoadError && typeof window !== "undefined") {
      const KEY = "__rfd_chunk_reload__";
      const last = Number(sessionStorage.getItem(KEY) || "0");
      if (Date.now() - last > 30_000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
      }
    }
  }, [error, isChunkLoadError]);
  if (isChunkLoadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold">Updating to the latest version…</h1>
          <p className="mt-2 text-sm text-muted-foreground">One moment.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went off course</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >Try again</button>
          <a href="/" className="rounded-xl border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RedFlagDaddy — Consent & Compatibility Assessment" },
      { name: "description", content: "A consent, compatibility, safety and red-flag assessment platform for Dominants, submissives, switches and the full spectrum of BDSM archetypes." },
      { name: "theme-color", content: "#1a1424" },
      { property: "og:title", content: "RedFlagDaddy — Consent & Compatibility Assessment" },
      { property: "og:site_name", content: "RedFlagDaddy" },
      { property: "og:locale", content: "en_ZA" },
      { name: "twitter:title", content: "RedFlagDaddy — Consent & Compatibility Assessment" },
      { property: "og:description", content: "A consent, compatibility, safety and red-flag assessment platform for Dominants, submissives, switches and the full spectrum of BDSM archetypes." },
      { name: "twitter:description", content: "A consent, compatibility, safety and red-flag assessment platform for Dominants, submissives, switches and the full spectrum of BDSM archetypes." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <Toaster position="top-center" richColors closeButton />
      <AnalyticsConsent />
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  );
}
