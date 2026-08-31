type PaymentEnvironment = Record<string, string | undefined>;

export type PeachPaymentConfig = {
  baseUrl: string;
  entityId: string;
  token: string;
};

export function paymentsActivationEnabled(env: PaymentEnvironment = process.env): boolean {
  return env.PAYMENTS_MODE?.trim().toLowerCase() === "peach";
}

export function peachPaymentConfig(env: PaymentEnvironment = process.env): PeachPaymentConfig {
  if (!paymentsActivationEnabled(env)) {
    throw new Error("Payments are not enabled.");
  }

  const baseUrl = env.PEACH_BASE_URL?.trim();
  const entityId = env.PEACH_ENTITY_ID?.trim();
  const token = env.PEACH_ACCESS_TOKEN?.trim();
  if (!baseUrl || !entityId || !token) {
    throw new Error("Payments are not configured.");
  }

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("Payments are not configured.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Payments are not configured.");
  }

  return { baseUrl: url.origin, entityId, token };
}
