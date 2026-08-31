import { describe, expect, it } from "vitest";
import { paymentsActivationEnabled, peachPaymentConfig } from "./payment-config.server";

describe("payment activation gate", () => {
  it("is disabled unless Peach is explicitly selected", () => {
    expect(paymentsActivationEnabled({})).toBe(false);
    expect(paymentsActivationEnabled({ PAYMENTS_MODE: "disabled" })).toBe(false);
    expect(paymentsActivationEnabled({ PAYMENTS_MODE: " PEACH " })).toBe(true);
  });

  it("requires complete HTTPS provider configuration", () => {
    expect(() => peachPaymentConfig({ PAYMENTS_MODE: "peach" })).toThrow(
      "Payments are not configured.",
    );
    expect(() =>
      peachPaymentConfig({
        PAYMENTS_MODE: "peach",
        PEACH_BASE_URL: "http://payments.example.test",
        PEACH_ENTITY_ID: "entity",
        PEACH_ACCESS_TOKEN: "secret",
      }),
    ).toThrow("Payments are not configured.");

    expect(
      peachPaymentConfig({
        PAYMENTS_MODE: "peach",
        PEACH_BASE_URL: "https://payments.example.test",
        PEACH_ENTITY_ID: "entity",
        PEACH_ACCESS_TOKEN: "secret",
      }),
    ).toEqual({
      baseUrl: "https://payments.example.test",
      entityId: "entity",
      token: "secret",
    });
  });
});
