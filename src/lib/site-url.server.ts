export function normalizePublicSiteOrigin(
  configured: string | undefined,
  legacyConfigured?: string | undefined,
): string {
  const candidate = configured?.trim() || legacyConfigured?.trim();
  if (!candidate) {
    throw new Error("Public site URL is not configured.");
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Public site URL is not configured correctly.");
  }

  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error("Public site URL must use HTTPS.");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Public site URL must contain only an origin.");
  }
  return url.origin;
}

export function publicSiteOrigin(): string {
  return normalizePublicSiteOrigin(process.env["PUBLIC_SITE_URL"], process.env["PUBLIC_APP_URL"]);
}

export function publicInviteUrl(inviteCode: string): string {
  return `${publicSiteOrigin()}/j/${encodeURIComponent(inviteCode)}`;
}
