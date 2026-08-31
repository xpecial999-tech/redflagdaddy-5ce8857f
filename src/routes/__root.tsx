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
        <img
          src="/favicon.png"
          alt=""
          width={64}
          height={64}
          className="mx-auto h-16 w-16"
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold">This route doesn’t exist.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use the button below to return to RedFlagDaddy.</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
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
            className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >Try again</button>
          <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 py-2 text-sm">Go home</a>
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
      { title: "RedFlagDaddy — Structured conversations for adults" },
      { name: "description", content: "Private, role-aware prompts that help adults discuss consent, compatibility, boundaries and safety. Not identity verification or proof of consent." },
      { name: "theme-color", content: "#08070E" },
      { property: "og:title", content: "RedFlagDaddy — Structured conversations for adults" },
      { property: "og:site_name", content: "RedFlagDaddy" },
      { name: "twitter:title", content: "RedFlagDaddy — Structured conversations for adults" },
      { property: "og:description", content: "Private, role-aware prompts that help adults discuss consent, compatibility, boundaries and safety. Not identity verification or proof of consent." },
      { name: "twitter:description", content: "Private, role-aware prompts that help adults discuss consent, compatibility, boundaries and safety. Not identity verification or proof of consent." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" },
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
