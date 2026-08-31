const PRIVATE_EXACT_PATHS = new Set([
  "/admin",
  "/create",
  "/dashboard",
  "/guest",
  "/join",
  "/login",
  "/profile",
  "/register",
  "/upgrade",
]);

const PRIVATE_PATH_PREFIXES = [
  "/admin/",
  "/api/",
  "/assessment/",
  "/auth/",
  "/create/",
  "/dashboard/",
  "/email/",
  "/j/",
  "/journey/",
  "/lovable/",
  "/profile/",
  "/report/",
  "/results/",
  "/upgrade/",
];

export function isPrivateApplicationPath(pathname: string): boolean {
  return (
    PRIVATE_EXACT_PATHS.has(pathname) ||
    PRIVATE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function withSecurityHeaders(
  response: Response,
  options: { pathname: string; serverFunction?: boolean },
): Response {
  const secured = new Response(response.body, response);
  secured.headers.set("x-content-type-options", "nosniff");
  secured.headers.set("x-frame-options", "DENY");
  secured.headers.set("referrer-policy", "no-referrer");
  secured.headers.set(
    "permissions-policy",
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  );
  secured.headers.set(
    "content-security-policy",
    "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
  );

  if (options.serverFunction || isPrivateApplicationPath(options.pathname)) {
    secured.headers.set("cache-control", "no-store");
    secured.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  }

  return secured;
}
