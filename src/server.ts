import "./lib/error-capture";

import process from "node:process";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type RuntimeEnv = {
  CONSTRUCTION_MODE?: string;
  [key: string]: unknown;
};

declare global {
  // Nitro makes Cloudflare bindings available here before it invokes the app entry.
  // The app entry itself is called without the Worker `env` argument.
  // eslint-disable-next-line no-var
  var __env__: RuntimeEnv | undefined;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function constructionWall(): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>RedFlagDaddy — Under construction</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        align-items: center;
        background:
          radial-gradient(circle at 50% 36%, rgba(213, 32, 183, .2), transparent 28rem),
          radial-gradient(circle at 12% 85%, rgba(95, 34, 210, .18), transparent 25rem),
          #040306;
        color: #faf6ff;
        display: flex;
        font-family: Georgia, "Times New Roman", serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 1.5rem;
      }
      main { max-width: 35rem; text-align: center; width: 100%; }
      img {
        border: 1px solid rgba(255, 96, 222, .28);
        border-radius: 1.5rem;
        box-shadow: 0 0 5rem rgba(199, 38, 219, .28);
        display: block;
        height: auto;
        width: 100%;
      }
      h1 { font-size: clamp(2rem, 7vw, 3.8rem); margin: 1.5rem 0 .65rem; }
      p { color: #d9cfe4; font: 500 clamp(1rem, 3vw, 1.2rem)/1.6 system-ui, sans-serif; margin: 0; }
    </style>
  </head>
  <body>
    <main>
      <img src="/under-construction.png" width="1122" height="1402" alt="RedFlagDaddy is under construction" />
      <h1>We’ll be back soon.</h1>
      <p>RedFlagDaddy is currently undergoing improvements.</p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        "cache-control": "no-store, max-age=0",
        "content-security-policy":
          "default-src 'self'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        "content-type": "text/html; charset=utf-8",
        "retry-after": "3600",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    },
  );
}

function isConstructionAsset(pathname: string): boolean {
  return [
    "/under-construction.png",
    "/favicon.ico",
    "/favicon.png",
    "/apple-touch-icon.png",
  ].includes(pathname);
}

function bindWorkerEnvironment(runtime: RuntimeEnv | undefined): void {
  if (!runtime) return;

  // Nitro retains Worker bindings on globalThis but application server functions
  // use Node's process.env. Populate it per request so server-only Supabase
  // clients and configuration checks receive the same Cloudflare bindings.
  for (const [key, value] of Object.entries(runtime)) {
    if (typeof value === "string") process.env[key] = value;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const runtime = (env as RuntimeEnv | undefined) ?? globalThis.__env__;
      bindWorkerEnvironment(runtime);
      const url = new URL(request.url);
      if (runtime?.CONSTRUCTION_MODE === "enabled" && !isConstructionAsset(url.pathname)) {
        return constructionWall();
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
